import QRCode from "qrcode"
import { prisma } from "../config/db.js"
import { sendBookingConfirmationEmail } from "./mail.service.js"

export interface FulfillBookingParams {
  bookingId: string
  transactionCode: string
  method: string
  paidAmount?: number
  showtimeId?: string
  seatIds?: Array<string | number>
}

export interface FulfillBookingResult {
  alreadyCompleted: boolean
  booking: any
  payment: any
  tickets: any[]
}

/**
 * Xử lý hoàn tất đơn hàng và phát hành vé điện tử sau khi thanh toán thành công
 * Đảm bảo tính Idempotency: Không phát hành trùng vé nếu được gọi nhiều lần.
 */
export async function fulfillSuccessfulBookingPayment(
  params: FulfillBookingParams,
): Promise<FulfillBookingResult> {
  const { bookingId, transactionCode, method, showtimeId, seatIds } = params

  const result = await prisma.$transaction(async (tx) => {
    // 1. Kiểm tra đơn đặt vé
    const booking = await tx.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: true,
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

    if (!booking) {
      throw Object.assign(new Error("Không tìm thấy đơn đặt vé"), {
        status: 404,
      })
    }

    // IDEMPOTENCY: Nếu đơn hàng đã hoàn tất trước đó, trả về vé đã có
    if (booking.status === "COMPLETED") {
      return {
        alreadyCompleted: true,
        booking,
        payment: booking.payment,
        tickets: booking.tickets,
      }
    }

    // 2. Tìm các ghế được giữ cho đơn hàng này
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
    } else {
      // Tìm theo heldByUserId
      seatsToBook = await tx.showtimeSeat.findMany({
        where: {
          heldByUserId: booking.userId,
          status: "HELD",
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

    // 3. Cập nhật các ShowtimeSeat thành BOOKED
    if (seatsToBook.length > 0) {
      await tx.showtimeSeat.updateMany({
        where: { id: { in: seatsToBook.map((s) => s.id) } },
        data: {
          status: "BOOKED",
          heldByUserId: null,
          holdExpiresAt: null,
        },
      })
    }

    // 4. Tạo hoặc cập nhật Payment
    const existingPayment = await tx.payment.findUnique({
      where: { bookingId: booking.id },
    })

    let paymentRecord: any
    if (existingPayment) {
      paymentRecord = await tx.payment.update({
        where: { id: existingPayment.id },
        data: {
          transactionCode,
          method,
          status: "SUCCESS",
          paidAt: new Date(),
          amount: booking.totalAmount,
        },
      })
    } else {
      paymentRecord = await tx.payment.create({
        data: {
          bookingId: booking.id,
          transactionCode,
          amount: booking.totalAmount,
          method,
          status: "SUCCESS",
          paidAt: new Date(),
        },
      })
    }

    // 5. Phát hành vé điện tử (Ticket) với mã QR Check-in
    const createdTickets = []
    for (const stSeat of seatsToBook) {
      const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
      const ticketCode = `TK${Date.now()}${rand}`

      // Sinh mã QR dạng Data URL (MÃ CHECK-IN VÀO RẠP)
      const qrCodeDataUrl = await QRCode.toDataURL(ticketCode, {
        errorCorrectionLevel: "M",
        width: 250,
        margin: 2,
      })

      const basePrice = Number(stSeat.showtime.price)
      const seatPrice =
        stSeat.seat.type === "vip"
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

    // 6. Cập nhật trạng thái Booking sang COMPLETED
    const updatedBooking = await tx.booking.update({
      where: { id: booking.id },
      data: { status: "COMPLETED" },
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
      alreadyCompleted: false,
      booking: updatedBooking,
      payment: paymentRecord,
      tickets: createdTickets,
    }
  })

  // Nếu mới hoàn tất lần đầu -> Gửi email vé điện tử cho khách hàng
  if (!result.alreadyCompleted) {
    const targetEmail = result.booking.user?.email
    if (targetEmail && result.tickets && result.tickets.length > 0) {
      sendBookingConfirmationEmail({
        userEmail: targetEmail,
        userName: result.booking.user?.fullName,
        booking: {
          id: result.booking.id,
          bookingCode: result.booking.bookingCode,
          totalAmount: result.booking.totalAmount,
        },
        payment: {
          transactionCode: result.payment.transactionCode,
          method: result.payment.method,
          paidAt: result.payment.paidAt,
        },
        tickets: result.tickets,
      }).catch((emailErr) => {
        console.error("[BOOKING-FULFILLMENT] Lỗi gửi email vé:", emailErr)
      })
    }
  }

  return result
}
