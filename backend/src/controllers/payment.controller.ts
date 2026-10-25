import { Response } from "express"
import { z } from "zod"
import { prisma } from "../config/db.js"
import { AuthRequest } from "../middleware/auth.js"
import {
  createMomoPayment,
  verifyMomoIpnSignature,
  queryMomoTransactionStatus,
  isMomoConfigured,
  MomoIpnBody,
} from "../services/momo.service.js"
import { fulfillSuccessfulBookingPayment } from "../services/booking-fulfillment.service.js"

const createPaymentSchema = z.object({
  bookingId: z.string().min(1, "Vui lòng cung cấp mã đơn đặt vé (bookingId)"),
  orderInfo: z.string().optional(),
  amount: z.union([z.number(), z.string()]).optional(),
})

/**
 * POST /api/payments/momo/create
 * Khởi tạo giao dịch thanh toán qua MoMo Sandbox
 */
export async function createMomoPaymentController(
  req: AuthRequest,
  res: Response,
) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Vui lòng đăng nhập để thanh toán" })
    }

    const bookingId = (req.body.bookingId || req.params["bookingId"]) as string
    if (!bookingId) {
      return res
        .status(400)
        .json({ error: "Vui lòng cung cấp mã đơn đặt vé (bookingId)" })
    }

    // 1. Tìm đơn đặt vé và kiểm tra quyền sở hữu
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        payment: true,
        user: true,
      },
    })

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn đặt vé" })
    }

    if (booking.userId !== req.user.id && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền thanh toán đơn đặt vé này" })
    }

    if (booking.status === "COMPLETED") {
      return res
        .status(400)
        .json({ error: "Đơn đặt vé này đã được thanh toán hoàn tất" })
    }

    if (booking.status === "CANCELLED" || booking.status === "FAILED") {
      return res
        .status(400)
        .json({ error: "Đơn đặt vé này đã bị hủy hoặc không hợp lệ" })
    }

    // 2. Kiểm tra ghế đang giữ xem có còn hạn không
    const now = new Date()
    const heldSeats = await prisma.showtimeSeat.findMany({
      where: {
        heldByUserId: req.user.id,
        status: "HELD",
        holdExpiresAt: { gte: now },
      },
    })

    if (heldSeats.length === 0) {
      return res.status(400).json({
        error:
          "Thời gian giữ ghế đã hết hạn hoặc không tìm thấy ghế được giữ. Vui lòng đặt lại vé.",
      })
    }

    const parsedAmount = req.body.amount && !isNaN(Number(req.body.amount)) ? Number(req.body.amount) : null
    const finalAmount = parsedAmount !== null ? parsedAmount : Number(booking.totalAmount)

    if (parsedAmount !== null && parsedAmount !== Number(booking.totalAmount)) {
      await prisma.booking.update({
        where: { id: booking.id },
        data: { totalAmount: finalAmount },
      })
    }

    // 3. Khởi tạo thanh toán với dịch vụ MoMo
    const momoResult = await createMomoPayment({
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      amount: finalAmount,
      orderInfo: req.body.orderInfo,
    })

    // 4. Lưu / cập nhật Payment ở trạng thái PENDING
    await prisma.payment.upsert({
      where: { bookingId: booking.id },
      create: {
        bookingId: booking.id,
        transactionCode: momoResult.orderId,
        amount: finalAmount,
        method: "MOMO",
        status: "PENDING",
      },
      update: {
        transactionCode: momoResult.orderId,
        amount: finalAmount,
        method: "MOMO",
        status: "PENDING",
      },
    })

    return res.status(200).json({
      message: "Khởi tạo thanh toán MoMo Sandbox thành công",
      bookingId: booking.id,
      bookingCode: booking.bookingCode,
      amount: momoResult.amount,
      orderId: momoResult.orderId,
      requestId: momoResult.requestId,
      payUrl: momoResult.payUrl,
      deeplink: momoResult.deeplink,
      qrCodeUrl: momoResult.qrCodeUrl,
      isSimulation: momoResult.isSimulation,
    })
  } catch (error: any) {
    console.error("[MOMO-CONTROLLER] Lỗi khởi tạo thanh toán:", error.message || error)
    return res.status(500).json({
      error: error.message || "Lỗi hệ thống khi khởi tạo thanh toán MoMo",
    })
  }
}

/**
 * POST /api/payments/momo/ipn
 * Nhận Webhook / IPN callback từ MoMo khi giao dịch hoàn tất
 */
export async function momoIpnController(req: any, res: Response) {
  try {
    const body = req.body as MomoIpnBody
    console.log("[MOMO-IPN] Nhận callback IPN từ MoMo:", {
      orderId: body?.orderId,
      transId: body?.transId,
      resultCode: body?.resultCode,
      amount: body?.amount,
      message: body?.message,
    })

    if (!body || !body.orderId) {
      return res.status(400).json({ message: "Dữ liệu callback không hợp lệ" })
    }

    // 1. Xác thực chữ ký nếu cấu hình Secret Key đã có
    if (isMomoConfigured()) {
      const isValid = verifyMomoIpnSignature(body)
      if (!isValid) {
        console.error("[MOMO-IPN] Chữ ký IPN không hợp lệ!", body)
        return res.status(400).json({ message: "Invalid signature" })
      }
    }

    // 2. Tìm bookingId từ extraData hoặc tra cứu qua transactionCode (orderId)
    let bookingId = ""
    try {
      if (body.extraData) {
        const decoded = JSON.parse(
          Buffer.from(body.extraData, "base64").toString("utf-8"),
        )
        bookingId = decoded.bookingId
      }
    } catch {
      // Bỏ qua lỗi parse extraData
    }

    if (!bookingId) {
      const payment = await prisma.payment.findFirst({
        where: { transactionCode: body.orderId },
      })
      bookingId = payment?.bookingId || ""
    }

    if (!bookingId) {
      console.error("[MOMO-IPN] Không tìm thấy đơn hàng cho orderId:", body.orderId)
      return res.status(404).json({ message: "Booking not found" })
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    })

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" })
    }

    // 3. Kiểm tra số tiền giao dịch
    const paidAmount = Number(body.amount)
    if (paidAmount !== Number(booking.totalAmount)) {
      console.error("[MOMO-IPN] Số tiền không khớp:", {
        expected: Number(booking.totalAmount),
        received: paidAmount,
      })
      return res.status(400).json({ message: "Amount mismatch" })
    }

    // 4. Xử lý kết quả giao dịch
    const resultCodeNum = Number(body.resultCode)

    if (resultCodeNum === 0) {
      // GIAO DỊCH THÀNH CÔNG -> Hoàn tất đơn đặt vé, xuất vé và gửi email
      console.log(`[MOMO-IPN] Giao dịch thành công cho đơn: ${booking.bookingCode}`)
      await fulfillSuccessfulBookingPayment({
        bookingId: booking.id,
        transactionCode: String(body.transId || body.orderId),
        method: "MOMO",
        paidAmount,
      })
    } else {
      // GIAO DỊCH THẤT BẠI HOẶC BỊ HỦY
      console.warn(`[MOMO-IPN] Giao dịch thất bại (mã ${resultCodeNum}): ${body.message}`)
      await prisma.payment.updateMany({
        where: { bookingId: booking.id },
        data: {
          status: "FAILED",
        },
      })
    }

    // MoMo yêu cầu phản hồi HTTP 204 No Content hoặc JSON resultCode: 0
    return res.status(200).json({ resultCode: 0, message: "Received" })
  } catch (error: any) {
    console.error("[MOMO-IPN] Lỗi xử lý callback IPN:", error.message || error)
    return res.status(500).json({ message: "Internal server error" })
  }
}

/**
 * GET /api/payments/momo/status/:orderId
 * Frontend polling để kiểm tra trạng thái thanh toán
 */
export async function getMomoPaymentStatusController(
  req: any,
  res: Response,
) {
  try {
    const orderId = req.params.orderId as string
    const bookingId = req.query.bookingId as string | undefined

    let booking: any = null

    if (bookingId) {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: {
          payment: true,
          tickets: {
            include: {
              seat: true,
              showtime: {
                include: {
                  movie: true,
                  room: { include: { cinema: true } },
                },
              },
            },
          },
        },
      })
    }

    if (!booking && orderId) {
      const payment = await prisma.payment.findFirst({
        where: { transactionCode: orderId },
        include: {
          booking: {
            include: {
              payment: true,
              tickets: {
                include: {
                  seat: true,
                  showtime: {
                    include: {
                      movie: true,
                      room: { include: { cinema: true } },
                    },
                  },
                },
              },
            },
          },
        },
      })
      booking = payment?.booking || null
    }

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy thông tin đơn đặt vé" })
    }

    // 1. Nếu đơn hàng đã hoàn tất thành công trong hệ thống:
    if (booking.status === "COMPLETED" && booking.payment?.status === "SUCCESS") {
      return res.json({
        status: "SUCCESS",
        bookingStatus: "COMPLETED",
        message: "Thanh toán thành công",
        booking,
        payment: booking.payment,
        tickets: booking.tickets,
      })
    }

    // 2. Nếu payment thất bại:
    if (booking.payment?.status === "FAILED") {
      return res.json({
        status: "FAILED",
        bookingStatus: booking.status,
        message: "Giao dịch thanh toán đã thất bại hoặc bị hủy",
      })
    }

    // 3. Nếu vẫn đang PENDING và MoMo đã được cấu hình:
    // Tra cứu trực tiếp trạng thái từ MoMo Query API để tự động cập nhật ngay lập tức nếu IPN bị trễ
    if (isMomoConfigured() && orderId) {
      const requestId = `QUERY_${orderId}`
      const queryRes = await queryMomoTransactionStatus({ orderId, requestId })

      if (queryRes && queryRes.resultCode === 0) {
        console.log(`[MOMO-POLLING] MoMo Query xác nhận thành công đơn: ${booking.bookingCode}`)
        const fulfilled = await fulfillSuccessfulBookingPayment({
          bookingId: booking.id,
          transactionCode: String(queryRes.transId || orderId),
          method: "MOMO",
          paidAmount: Number(queryRes.amount),
        })

        return res.json({
          status: "SUCCESS",
          bookingStatus: "COMPLETED",
          message: "Thanh toán thành công",
          booking: fulfilled.booking,
          payment: fulfilled.payment,
          tickets: fulfilled.tickets,
        })
      }
    }

    // Vẫn đang chờ người dùng quét mã / xác nhận thanh toán
    return res.json({
      status: "PENDING",
      bookingStatus: booking.status,
      message: "Đang chờ thanh toán qua MoMo",
    })
  } catch (error: any) {
    console.error("[MOMO-STATUS] Lỗi kiểm tra trạng thái thanh toán:", error.message || error)
    return res.status(500).json({ error: "Lỗi kiểm tra trạng thái thanh toán" })
  }
}
