import { Response } from "express"
import { z } from "zod"
import QRCode from "qrcode"
import { prisma } from "../config/db.js"
import { AuthRequest } from "../middleware/auth.js"
import {
  sendBookingConfirmationEmail,
  sendBookingTicketEmail,
} from "../services/mail.service.js"

const holdSeatsSchema = z.object({
  showtimeId: z.string().min(1, "Vui lòng chọn suất chiếu"),
  seatIds: z
    .array(z.union([z.string(), z.number()]))
    .min(1, "Vui lòng chọn ít nhất 1 ghế")
    .max(10, "Bạn chỉ có thể giữ tối đa 10 ghế trong một lần đặt"),
})

const payBookingSchema = z.object({
  bookingId: z.string().optional(),
  showtimeId: z.string().optional(),
  seatIds: z.array(z.union([z.string(), z.number()])).optional(),
  method: z.string().optional().default("MOCK"),
  amount: z.union([z.number(), z.string()]).optional(),
  totalAmount: z.union([z.number(), z.string()]).optional(),
  discountAmount: z.union([z.number(), z.string()]).optional(),
  voucherCode: z.string().optional(),
  result: z.string().optional(),
})

// POST /api/bookings/hold (Yêu cầu đăng nhập)
export async function holdSeats(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Vui lòng đăng nhập để thực hiện giữ ghế" })
    }

    const parseResult = holdSeatsSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Dữ liệu chọn ghế không hợp lệ",
        details: parseResult.error.format(),
      })
    }

    const { showtimeId, seatIds } = parseResult.data

    const result = await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra suất chiếu
      const showtime = await tx.showtime.findUnique({
        where: { id: showtimeId },
        include: { movie: true, room: true },
      })

      if (!showtime || showtime.status !== "ACTIVE") {
        throw Object.assign(
          new Error("Suất chiếu không tồn tại hoặc đã bị hủy"),
          { status: 404 },
        )
      }

      if (new Date(showtime.startTime) <= new Date()) {
        throw Object.assign(
          new Error("Không thể đặt vé cho suất chiếu đã bắt đầu hoặc kết thúc"),
          { status: 400 },
        )
      }

      // 2. Query các ghế trong seatIds của suất chiếu showtimeId
      const stringIds = seatIds.map(String)
      const numberIds = seatIds.map(Number).filter((n) => !isNaN(n))

      const seatsToHold = await tx.showtimeSeat.findMany({
        where: {
          showtimeId,
          OR: [
            { id: { in: stringIds } },
            { seatId: { in: stringIds } },
            ...(numberIds.length > 0
              ? [{ seat: { number: { in: numberIds } } }]
              : []),
          ],
        },
        include: {
          seat: true,
        },
      })

      if (seatsToHold.length === 0 || seatsToHold.length !== seatIds.length) {
        throw Object.assign(
          new Error("Một số ghế bạn chọn không tồn tại trong suất chiếu này"),
          { status: 400 },
        )
      }

      // 3. Kiểm tra điều kiện giữ ghế:
      // Hoặc AVAILABLE
      // Hoặc HELD nhưng đã quá hạn (holdExpiresAt < NOW())
      // Hoặc HELD bởi chính user hiện tại (heldByUserId == req.user.id)
      const now = new Date()
      for (const stSeat of seatsToHold) {
        const isAvailable = stSeat.status === "AVAILABLE"
        const isExpiredHold =
          stSeat.status === "HELD" &&
          stSeat.holdExpiresAt !== null &&
          stSeat.holdExpiresAt < now
        const isHeldBySelf =
          stSeat.status === "HELD" && stSeat.heldByUserId === req.user!.id

        if (!isAvailable && !isExpiredHold && !isHeldBySelf) {
          throw Object.assign(
            new Error(
              "Một số ghế bạn chọn vừa được người khác đặt hoặc giữ chỗ.",
            ),
            { status: 409 },
          )
        }
      }

      // 4. Cập nhật các ghế này: status = 'HELD', heldByUserId = req.user.id, holdExpiresAt = 5 phút
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000)
      const targetIds = seatsToHold.map((s) => s.id)

      await tx.showtimeSeat.updateMany({
        where: { id: { in: targetIds } },
        data: {
          status: "HELD",
          heldByUserId: req.user!.id,
          holdExpiresAt: expiresAt,
        },
      })

      // 5. Tính tổng tiền vé
      const basePrice = Number(showtime.price)
      let totalAmount = 0
      for (const stSeat of seatsToHold) {
        const seatPrice =
          stSeat.seat.type === "vip"
            ? Math.round((basePrice * 1.2) / 1000) * 1000
            : basePrice
        totalAmount += seatPrice
      }

      // 6. Tạo bản ghi Booking tạm thời (status: PENDING)
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 7)
        .toUpperCase()
      const bookingCode = `BK${Date.now()}${randomPart}`

      const booking = await tx.booking.create({
        data: {
          userId: req.user!.id,
          bookingCode,
          totalAmount,
          status: "PENDING",
        },
      })

      return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        showtimeId,
        heldSeats: seatIds,
        expiresAt,
        expiresInSeconds: 300,
        totalAmount,
      }
    })

    return res.status(200).json(result)
  } catch (error: any) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message })
    }
    console.error("Hold seats error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi giữ ghế" })
  }
}

// POST /api/bookings/:id/pay hoặc POST /api/bookings/pay (Yêu cầu đăng nhập)
export async function payBooking(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Vui lòng đăng nhập để thanh toán",
        message: "Vui lòng đăng nhập để thanh toán",
      })
    }

    const bookingId = (req.params["id"] || req.body.bookingId) as string
    if (!bookingId) {
      return res.status(400).json({
        success: false,
        error: "Vui lòng cung cấp mã đơn đặt vé (bookingId)",
        message: "Vui lòng cung cấp mã đơn đặt vé (bookingId)",
      })
    }

    const parseResult = payBookingSchema.safeParse(req.body)
    if (parseResult.success && parseResult.data.method === "MOMO") {
      return res.status(400).json({
        success: false,
        error:
          "Thanh toán MoMo phải được xác thực qua cổng MoMo Sandbox. Vui lòng sử dụng API /api/payments/momo/create.",
        message:
          "Thanh toán MoMo phải được xác thực qua cổng MoMo Sandbox. Vui lòng sử dụng API /api/payments/momo/create.",
      })
    }

    const {
      method = "MOCK",
      showtimeId,
      seatIds,
      amount,
    } = parseResult.success
      ? parseResult.data
      : { method: "MOCK", showtimeId: undefined, seatIds: undefined, amount: undefined }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Kiểm tra đơn đặt vé
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          user: true,
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
          payment: true,
        },
      })

      if (!booking) {
        throw Object.assign(new Error("Không tìm thấy đơn đặt vé"), {
          status: 404,
        })
      }

      if (booking.userId !== req.user!.id && req.user!.role !== "admin") {
        throw Object.assign(
          new Error("Bạn không có quyền thanh toán đơn đặt vé này"),
          { status: 403 },
        )
      }

      // Xử lý đơn đã thanh toán trước đó (idempotency an toàn)
      if (booking.status === "COMPLETED") {
        return {
          booking,
          payment: booking.payment,
          tickets: booking.tickets,
        }
      }

      if (booking.status === "CANCELLED" || booking.status === "FAILED") {
        throw Object.assign(
          new Error("Đơn đặt vé này đã bị hủy hoặc không hợp lệ"),
          { status: 400 },
        )
      }

      // 2. Xác định các ghế cần xác nhận thanh toán
      let seatsToBook: any[] = []
      const now = new Date()

      if (seatIds && seatIds.length > 0 && showtimeId) {
        const stringIds = seatIds.map(String)
        const numberIds = seatIds.map(Number).filter((n) => !isNaN(n))

        seatsToBook = await tx.showtimeSeat.findMany({
          where: {
            showtimeId,
            OR: [
              { id: { in: stringIds } },
              { seatId: { in: stringIds } },
              ...(numberIds.length > 0
                ? [{ seat: { number: { in: numberIds } } }]
                : []),
            ],
          },
          include: {
            seat: true,
            showtime: {
              include: {
                movie: true,
                room: { include: { cinema: true } },
              },
            },
          },
        })
      }

      if (seatsToBook.length === 0) {
        // Tìm các ghế đang được user này giữ và còn hạn
        seatsToBook = await tx.showtimeSeat.findMany({
          where: {
            heldByUserId: req.user!.id,
            status: "HELD",
            holdExpiresAt: { gte: now },
          },
          include: {
            seat: true,
            showtime: {
              include: {
                movie: true,
                room: { include: { cinema: true } },
              },
            },
          },
        })
      }

      // Fallback: Tìm ghế do user giữ nhưng vừa quá hạn giữ chỗ trong vòng 30 phút mà chưa bị ai khác đặt
      if (seatsToBook.length === 0) {
        const gracePeriod = new Date(Date.now() - 30 * 60 * 1000)
        seatsToBook = await tx.showtimeSeat.findMany({
          where: {
            heldByUserId: req.user!.id,
            status: { in: ["HELD", "AVAILABLE"] },
            updatedAt: { gte: gracePeriod },
          },
          include: {
            seat: true,
            showtime: {
              include: {
                movie: true,
                room: { include: { cinema: true } },
              },
            },
          },
        })
      }

      if (seatsToBook.length === 0) {
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "FAILED" },
        })
        throw Object.assign(
          new Error(
            "Phiên giữ ghế đã hết hạn hoặc không tìm thấy ghế được giữ. Vui lòng đặt lại vé.",
          ),
          { status: 400 },
        )
      }

      // Kiểm tra tất cả các ghế không bị người khác BOOKED
      for (const stSeat of seatsToBook) {
        if (stSeat.status === "BOOKED") {
          const alreadyOwned = booking.tickets?.some((t: any) => t.seatId === stSeat.seatId)
          if (!alreadyOwned) {
            throw Object.assign(
              new Error("Một số ghế bạn chọn đã được người khác đặt trước đó."),
              { status: 409 },
            )
          }
        }
      }

      // 3. Cập nhật các ShowtimeSeat thành BOOKED
      await tx.showtimeSeat.updateMany({
        where: { id: { in: seatsToBook.map((s) => s.id) } },
        data: {
          status: "BOOKED",
          heldByUserId: null,
          holdExpiresAt: null,
        },
      })

      // 4. Tạo hoặc cập nhật bản ghi Payment (UPSERT tránh crash duplicate key)
      const transactionCode = `MOCK_TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`
      const finalPayAmount = amount !== undefined && !isNaN(Number(amount))
        ? Number(amount)
        : Number(booking.totalAmount)

      const payment = await tx.payment.upsert({
        where: { bookingId: booking.id },
        update: {
          transactionCode,
          amount: finalPayAmount,
          method: method || "MOCK",
          status: "SUCCESS",
          paidAt: new Date(),
        },
        create: {
          bookingId: booking.id,
          transactionCode,
          amount: finalPayAmount,
          method: method || "MOCK",
          status: "SUCCESS",
          paidAt: new Date(),
        },
      })

      // 5. Tạo vé (Ticket) và sinh mã QR Code an toàn
      const createdTickets = []
      for (let i = 0; i < seatsToBook.length; i++) {
        const stSeat = seatsToBook[i]

        // Kiểm tra xem vé này đã tạo trước đó chưa
        const existingTicket = booking.tickets?.find((t: any) => t.seatId === stSeat.seatId)
        if (existingTicket) {
          createdTickets.push(existingTicket)
          continue
        }

        const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
        const ticketCode = `TK${Date.now()}${i}${rand}`

        // Sinh QR Code dạng Data URL (base64 image), fallback an toàn nếu lỗi
        let qrCodeDataUrl = ""
        try {
          qrCodeDataUrl = await QRCode.toDataURL(ticketCode, {
            errorCorrectionLevel: "M",
            width: 250,
            margin: 2,
          })
        } catch {
          qrCodeDataUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(ticketCode)}`
        }

        const basePrice = Number(stSeat.showtime?.price || 90000)
        const seatType = stSeat.seat?.type || "standard"
        const seatPrice =
          seatType === "vip"
            ? Math.round((basePrice * 1.2) / 1000) * 1000
            : basePrice

        const ticket = await tx.ticket.create({
          data: {
            bookingId: booking.id,
            showtimeId: stSeat.showtimeId,
            seatId: stSeat.seatId,
            ticketCode,
            qrCode: qrCodeDataUrl,
            price: seatPrice,
            status: "VALID",
          },
          include: {
            seat: true,
            showtime: {
              include: {
                movie: true,
                room: { include: { cinema: true } },
              },
            },
          },
        })

        createdTickets.push(ticket)
      }

      // 6. Cập nhật trạng thái Booking thành COMPLETED
      const updatedBooking = await tx.booking.update({
        where: { id: booking.id },
        data: {
          status: "COMPLETED",
          totalAmount: finalPayAmount,
        },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
        },
      })

      return {
        booking: updatedBooking,
        payment,
        tickets: createdTickets,
      }
    })

    // Gửi email vé điện tử đến tài khoản khách hàng (không để lỗi mail làm gián đoạn response)
    try {
      const targetEmail = result.booking.user?.email || req.user?.email
      if (targetEmail && result.tickets && result.tickets.length > 0) {
        sendBookingTicketEmail({
          userEmail: targetEmail,
          userName: result.booking.user?.fullName || req.user?.fullName,
          booking: {
            id: result.booking.id,
            bookingCode: result.booking.bookingCode,
            totalAmount: result.booking.totalAmount,
          },
          payment: {
            transactionCode: result.payment?.transactionCode || "N/A",
            method: result.payment?.method || "MOCK",
            paidAt: result.payment?.paidAt || new Date(),
          },
          tickets: result.tickets,
        }).catch((emailErr) => {
          console.error("[PAY_BOOKING] Lỗi khi gửi email vé:", emailErr)
        })
      }
    } catch (mailSyncErr) {
      console.error("[PAY_BOOKING] Lỗi khởi tạo gửi email vé:", mailSyncErr)
    }

    return res.status(200).json({
      success: true,
      message: "Thanh toán vé thành công",
      ...result,
    })
  } catch (error: any) {
    console.error("[PAY_BOOKING] Lỗi thanh toán vé:", error)
    const statusCode =
      typeof error.status === "number" && error.status >= 400 && error.status < 600
        ? error.status
        : error.code === "P2002" || error.code === "P2025"
        ? 400
        : 500

    const errorMessage = error.message || "Lỗi hệ thống khi thanh toán vé"

    return res.status(statusCode).json({
      success: false,
      error: errorMessage,
      message: errorMessage,
      code: error.code || undefined,
    })
  }
}

// POST /api/bookings/release hoặc POST /api/bookings/:id/cancel
export async function releaseSeats(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập" })
    }

    const { showtimeId, seatIds, bookingId } = req.body

    // Giải phóng các ghế đang giữ
    if (showtimeId && seatIds && Array.isArray(seatIds)) {
      const stringIds = seatIds.map(String)
      const numberIds = seatIds.map(Number).filter((n) => !isNaN(n))

      await prisma.showtimeSeat.updateMany({
        where: {
          showtimeId,
          heldByUserId: req.user.id,
          status: "HELD",
          OR: [
            { id: { in: stringIds } },
            { seatId: { in: stringIds } },
            ...(numberIds.length > 0
              ? [{ seat: { number: { in: numberIds } } }]
              : []),
          ],
        },
        data: {
          status: "AVAILABLE",
          heldByUserId: null,
          holdExpiresAt: null,
        },
      })
    } else {
      // Giải phóng toàn bộ ghế user đang giữ
      await prisma.showtimeSeat.updateMany({
        where: {
          heldByUserId: req.user.id,
          status: "HELD",
        },
        data: {
          status: "AVAILABLE",
          heldByUserId: null,
          holdExpiresAt: null,
        },
      })
    }

    if (bookingId) {
      await prisma.booking.updateMany({
        where: {
          id: bookingId,
          userId: req.user.id,
          status: "PENDING",
        },
        data: {
          status: "CANCELLED",
        },
      })
    }

    return res.json({ message: "Đã hủy giữ ghế thành công" })
  } catch (error) {
    console.error("Release seats error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi hủy giữ ghế" })
  }
}

// GET /api/bookings/my-bookings (Yêu cầu đăng nhập)
export async function getMyBookings(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập" })
    }

    const bookings = await prisma.booking.findMany({
      where: {
        userId: req.user.id,
      },
      include: {
        payment: true,
        tickets: {
          include: {
            seat: true,
            showtime: {
              include: {
                movie: true,
                room: {
                  include: {
                    cinema: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return res.json({ bookings })
  } catch (error) {
    console.error("Get my bookings error:", error)
    return res
      .status(500)
      .json({ error: "Lỗi hệ thống khi tải lịch sử đặt vé" })
  }
}

// GET /api/bookings/:id (Yêu cầu đăng nhập)
export async function getBookingById(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập" })
    }

    const id = req.params["id"] as string

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        payment: true,
        tickets: {
          include: {
            seat: true,
            showtime: {
              include: {
                movie: true,
                room: {
                  include: {
                    cinema: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn đặt vé" })
    }

    if (
      booking.userId !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "staff"
    ) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền xem đơn đặt vé này" })
    }

    return res.json({ booking })
  } catch (error) {
    console.error("Get booking by id error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải đơn đặt vé" })
  }
}

// POST /api/bookings/:id/send-email (Gửi lại email vé điện tử)
export async function resendBookingEmail(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập" })
    }

    const bookingId = req.params["id"] as string
    const customEmail = req.body?.email as string | undefined

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
          },
        },
        payment: true,
        tickets: {
          include: {
            seat: true,
            showtime: {
              include: {
                movie: true,
                room: {
                  include: {
                    cinema: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!booking) {
      return res.status(404).json({ error: "Không tìm thấy đơn đặt vé" })
    }

    if (
      booking.userId !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "staff"
    ) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền thao tác trên đơn đặt vé này" })
    }

    if (booking.status !== "COMPLETED") {
      return res.status(400).json({
        error: "Chỉ có thể gửi email xác nhận cho đơn đặt vé đã thanh toán thành công",
      })
    }

    if (!booking.tickets || booking.tickets.length === 0) {
      return res
        .status(400)
        .json({ error: "Không tìm thấy thông tin vé trong đơn hàng" })
    }

    const targetEmail = customEmail || booking.user?.email || req.user.email
    if (!targetEmail) {
      return res.status(400).json({ error: "Không tìm thấy địa chỉ email người nhận" })
    }

    const result = await sendBookingConfirmationEmail({
      userEmail: targetEmail,
      userName: booking.user?.fullName || req.user.fullName,
      booking: {
        id: booking.id,
        bookingCode: booking.bookingCode,
        totalAmount: booking.totalAmount,
      },
      payment: booking.payment
        ? {
            transactionCode: booking.payment.transactionCode,
            method: booking.payment.method,
            paidAt: booking.payment.paidAt,
          }
        : undefined,
      tickets: booking.tickets,
    })

    if (!result.success) {
      return res.status(500).json({
        error: `Không thể gửi email: ${result.error || "Lỗi dịch vụ mail"}`,
      })
    }

    return res.json({
      message: `Đã gửi vé điện tử thành công tới ${targetEmail}`,
      email: targetEmail,
      mocked: result.mocked,
    })
  } catch (error) {
    console.error("Resend booking email error:", error)
    return res
      .status(500)
      .json({ error: "Lỗi hệ thống khi gửi lại email xác nhận đặt vé" })
  }
}
