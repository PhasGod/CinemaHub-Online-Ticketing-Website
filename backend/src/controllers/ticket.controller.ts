import { Request, Response } from "express"
import { prisma } from "../config/db.js"
import { AuthRequest } from "../middleware/auth.js"
import { sendBookingConfirmationEmail } from "../services/mail.service.js"

// GET /api/tickets/my-tickets (Yêu cầu đăng nhập)
export async function getMyTickets(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập" })
    }

    const tickets = await prisma.ticket.findMany({
      where: {
        booking: {
          userId: req.user.id,
        },
      },
      include: {
        booking: {
          select: {
            id: true,
            bookingCode: true,
            bookingDate: true,
            status: true,
          },
        },
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return res.json({ tickets })
  } catch (error) {
    console.error("Get my tickets error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải vé của bạn" })
  }
}

// GET /api/tickets/:ticketCode (Public hoặc Auth)
export async function getTicketByCode(req: Request, res: Response) {
  try {
    const ticketCode = req.params["ticketCode"] as string

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        booking: {
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
          },
        },
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
    })

    if (!ticket) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy vé hợp lệ với mã này" })
    }

    return res.json({ ticket })
  } catch (error) {
    console.error("Get ticket by code error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi kiểm tra vé" })
  }
}

// POST /api/tickets/check-in & POST /api/staff/tickets/check-in (Chỉ Nhân viên / Quản trị viên)
export async function checkInTicket(req: AuthRequest, res: Response) {
  try {
    const rawCode = (req.body.ticketCode || "").trim()
    if (!rawCode) {
      return res
        .status(400)
        .json({ success: false, error: "Vui lòng cung cấp mã vé (ticketCode)" })
    }

    // 1. Tìm vé theo ticketCode (hoặc mã đơn đặt vé bookingCode)
    let ticket = await prisma.ticket.findUnique({
      where: { ticketCode: rawCode },
      include: {
        booking: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                phone: true,
              },
            },
            tickets: {
              include: {
                seat: true,
              },
            },
          },
        },
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
    })

    // Nếu không thấy theo ticketCode, thử tìm theo bookingCode
    if (!ticket) {
      const booking = await prisma.booking.findUnique({
        where: { bookingCode: rawCode },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              phone: true,
            },
          },
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

      if (booking && booking.tickets.length > 0) {
        // Chọn vé chưa soát hoặc vé đầu tiên trong đơn
        const chosenTicket =
          booking.tickets.find((t) => t.status !== "USED") || booking.tickets[0]
        ticket = {
          ...chosenTicket,
          booking: {
            ...booking,
            tickets: booking.tickets,
          },
        } as any
      }
    }

    // Nếu vẫn không thấy, trả về 404: "Vé không tồn tại"
    if (!ticket) {
      return res.status(404).json({ success: false, error: "Vé không tồn tại" })
    }

    // 2. Kiểm tra trạng thái đơn đặt vé: Bắt buộc phải là 'PAID' / 'SUCCESS' (trong DB là COMPLETED)
    if (ticket.booking.status !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        error: "Đơn hàng chưa thanh toán",
      })
    }

    // 3. Kiểm tra chống quét trùng (Double Check-in)
    if (ticket.status === "USED" || ticket.checkedInAt) {
      const checkedInTimeStr = ticket.checkedInAt
        ? new Date(ticket.checkedInAt).toLocaleString("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
          })
        : "trước đó"
      const staffName = req.user?.fullName || "Nhân viên trực ca"

      return res.status(409).json({
        success: false,
        error: `Vé này đã được soát vào lúc ${checkedInTimeStr} bởi nhân viên ${staffName}`,
        checkedInAt: ticket.checkedInAt,
        staffName,
      })
    }

    // Kiểm tra vé bị hủy
    if (ticket.status === "CANCELLED") {
      return res.status(400).json({
        success: false,
        error: "Vé này đã bị hủy, không thể sử dụng",
      })
    }

    // 4. Kiểm tra thời gian: Xác thực ngày chiếu và giờ chiếu có hợp lệ trong ngày hôm nay hay không
    const showtimeStart = new Date(ticket.showtime.startTime)
    const now = new Date()

    const toVnDateStr = (d: Date) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d)

    const showDateStr = toVnDateStr(showtimeStart)
    const todayStr = toVnDateStr(now)

    // Suất chiếu khác ngày hôm nay
    if (showDateStr !== todayStr) {
      const formattedShowDate = new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(showtimeStart)

      return res.status(400).json({
        success: false,
        error: `Suất chiếu diễn ra vào ngày ${formattedShowDate}, không hợp lệ để soát vé hôm nay.`,
      })
    }

    // 5. Cập nhật dữ liệu: Đánh dấu status = 'USED', lưu thời điểm checkedInAt = new Date()
    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "USED",
        checkedInAt: now,
      },
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
    })

    // 6. Data Masking (Bảo mật dữ liệu): Tuyệt đối không trả về toàn bộ dữ liệu người dùng hay lịch sử đơn khác
    const allSeats =
      ticket.booking.tickets
        ?.map((t) => `${t.seat?.row || ""}${t.seat?.number || ""}`)
        .filter(Boolean) || [
        `${ticket.seat?.row || ""}${ticket.seat?.number || ""}`,
      ]

    const formattedTime = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(showtimeStart)

    const formattedDate = new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(showtimeStart)

    const maskedData = {
      movieTitle: ticket.showtime.movie.title,
      roomName: ticket.showtime.room.name,
      showTime: formattedTime,
      showDate: formattedDate,
      seats:
        allSeats.length > 0
          ? allSeats
          : [`${ticket.seat.row}${ticket.seat.number}`],
      format: ticket.showtime.movie.format || "2D",
      customerName: ticket.booking.user?.fullName || "Khách hàng",
    }

    return res.json({
      success: true,
      message: "Soát vé thành công",
      data: maskedData,
      ticket: updated,
    })
  } catch (error) {
    console.error("Check-in ticket error:", error)
    return res.status(500).json({ success: false, error: "Lỗi hệ thống khi soát vé" })
  }
}

// GET /api/tickets/staff/stats (Chỉ Nhân viên / Quản trị viên)
export async function getStaffStats(_req: AuthRequest, res: Response) {
  try {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    // Suất chiếu hôm nay
    const todayShowtimes = await prisma.showtime.findMany({
      where: {
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: "ACTIVE",
      },
      include: {
        movie: true,
        room: { include: { cinema: true } },
        _count: {
          select: {
            tickets: true,
            showtimeSeats: { where: { status: "AVAILABLE" } },
          },
        },
      },
      orderBy: { startTime: "asc" },
    })

    const todayShowtimeIds = todayShowtimes.map((st) => st.id)

    // Vé bán ra trong ngày hôm nay
    const ticketsToday = await prisma.ticket.findMany({
      where: {
        OR: [
          { showtimeId: { in: todayShowtimeIds } },
          { createdAt: { gte: startOfDay, lte: endOfDay } },
        ],
        status: { in: ["VALID", "USED"] },
      },
      select: {
        id: true,
        status: true,
        checkedInAt: true,
      },
    })

    const totalSold = ticketsToday.length
    const totalCheckedIn = ticketsToday.filter((t) => t.status === "USED").length
    const checkInRate = totalSold > 0 ? Math.round((totalCheckedIn / totalSold) * 100) : 0

    // Suất chiếu sắp diễn ra trong 2 giờ tới
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000)
    const upcomingShowtimes = todayShowtimes.filter((st) => {
      const stStart = new Date(st.startTime)
      const stEnd = new Date(st.endTime)
      return stEnd >= now && stStart <= twoHoursLater
    })

    return res.json({
      stats: {
        todayShowtimesCount: todayShowtimes.length,
        ticketsSoldToday: totalSold,
        ticketsCheckedInToday: totalCheckedIn,
        checkInRate,
      },
      todayShowtimes,
      upcomingShowtimes: upcomingShowtimes.length > 0 ? upcomingShowtimes : todayShowtimes.filter((st) => new Date(st.endTime) >= now),
    })
  } catch (error) {
    console.error("Get staff stats error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải thống kê ca làm việc" })
  }
}

// GET /api/tickets/staff/search (Chỉ Nhân viên / Quản trị viên)
export async function searchStaffTickets(req: AuthRequest, res: Response) {
  try {
    const q = ((req.query["q"] as string) || "").trim()

    const whereClause: any = {}
    if (q) {
      whereClause.OR = [
        { ticketCode: { contains: q } },
        { booking: { bookingCode: { contains: q } } },
        { booking: { user: { email: { contains: q } } } },
        { booking: { user: { phone: { contains: q } } } },
        { booking: { user: { fullName: { contains: q } } } },
      ]
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        booking: {
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
          },
        },
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
      orderBy: {
        createdAt: "desc",
      },
      take: 50,
    })

    return res.json({ tickets })
  } catch (error) {
    console.error("Search staff tickets error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tra cứu vé" })
  }
}

// POST /api/tickets/:ticketCode/send-email (Gửi lại vé điện tử qua email)
export async function resendTicketEmail(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập" })
    }

    const ticketCode = (req.params["ticketCode"] || req.body?.ticketCode) as string
    if (!ticketCode) {
      return res
        .status(400)
        .json({ error: "Vui lòng cung cấp mã vé (ticketCode)" })
    }

    const customEmail = req.body?.email as string | undefined

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        booking: {
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
        },
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
    })

    if (!ticket) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy vé hợp lệ với mã này" })
    }

    const booking = ticket.booking
    if (!booking) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy thông tin đơn đặt vé của vé này" })
    }

    if (
      booking.userId !== req.user.id &&
      req.user.role !== "admin" &&
      req.user.role !== "staff"
    ) {
      return res
        .status(403)
        .json({ error: "Bạn không có quyền thực hiện thao tác này" })
    }

    const targetEmail = customEmail || booking.user?.email || req.user.email
    if (!targetEmail) {
      return res
        .status(400)
        .json({ error: "Không tìm thấy địa chỉ email người nhận" })
    }

    const ticketsToSend =
      booking.tickets && booking.tickets.length > 0
        ? booking.tickets
        : [ticket]

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
      tickets: ticketsToSend,
    })

    if (!result.success) {
      return res.status(500).json({
        error: `Không thể gửi email: ${result.error || "Lỗi dịch vụ mail"}`,
      })
    }

    return res.json({
      message: `Đã gửi vé điện tử tới ${targetEmail} thành công`,
      email: targetEmail,
      ticketCode: ticket.ticketCode,
      mocked: result.mocked,
    })
  } catch (error) {
    console.error("Resend ticket email error:", error)
    return res
      .status(500)
      .json({ error: "Lỗi hệ thống khi gửi lại vé qua email" })
  }
}

// POST /api/tickets/:id/cancel (Yêu cầu đăng nhập)
export async function cancelTicket(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Yêu cầu đăng nhập" })
    }

    const ticketIdentifier = req.params["id"] as string
    if (!ticketIdentifier) {
      return res.status(400).json({ success: false, error: "Thiếu mã định danh vé" })
    }

    // 1. Tìm vé theo id hoặc ticketCode
    let ticket = await prisma.ticket.findFirst({
      where: {
        OR: [
          { id: ticketIdentifier },
          { ticketCode: ticketIdentifier },
        ],
      },
      include: {
        booking: {
          include: {
            payment: true,
            tickets: true,
          },
        },
        seat: true,
        showtime: true,
      },
    })

    // Nếu không tìm thấy vé, kiểm tra xem có phải truyền bookingId hoặc bookingCode không
    if (!ticket) {
      const booking = await prisma.booking.findFirst({
        where: {
          OR: [
            { id: ticketIdentifier },
            { bookingCode: ticketIdentifier },
          ],
        },
        include: {
          payment: true,
          tickets: {
            include: {
              seat: true,
              showtime: true,
            },
          },
        },
      })

      if (!booking) {
        return res.status(404).json({ success: false, error: "Không tìm thấy vé hoặc đơn đặt vé hợp lệ" })
      }

      // Kiểm tra quyền đối với booking
      const isBookingOwner = booking.userId === req.user.id
      const isStaffOrAdmin = req.user.role === "admin" || req.user.role === "staff"
      if (!isBookingOwner && !isStaffOrAdmin) {
        return res.status(403).json({ success: false, error: "Bạn không có quyền hủy vé này" })
      }

      // Kiểm tra trạng thái vé trong booking
      const hasUsedTicket = booking.tickets.some((t) => t.status === "USED")
      if (hasUsedTicket) {
        return res.status(400).json({ success: false, error: "Vé đã qua cửa, không thể hủy" })
      }

      if (booking.status === "CANCELLED" || (booking.tickets.length > 0 && booking.tickets.every((t) => t.status === "CANCELLED"))) {
        return res.status(400).json({ success: false, error: "Vé này đã bị hủy trước đó" })
      }

      // Kiểm tra giờ chiếu cho các vé: Suất chiếu (Showtime.startTime) phải cách thời điểm hiện tại ít nhất 60 phút
      const now = new Date()
      for (const t of booking.tickets) {
        const startTime = new Date(t.showtime.startTime)
        const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60)
        if (diffMinutes < 60) {
          return res.status(400).json({
            success: false,
            error: "Chỉ được hủy vé trước giờ chiếu ít nhất 60 phút",
          })
        }
      }

      // Thực thi trong prisma.$transaction
      await prisma.$transaction(async (tx) => {
        // Cập nhật tất cả vé sang CANCELLED
        await tx.ticket.updateMany({
          where: { bookingId: booking.id },
          data: { status: "CANCELLED" },
        })

        // Cập nhật booking sang CANCELLED
        await tx.booking.update({
          where: { id: booking.id },
          data: { status: "CANCELLED" },
        })

        // Giải phóng ghế: tìm ShowtimeSeat ứng với showtimeId và seatId
        for (const t of booking.tickets) {
          await tx.showtimeSeat.updateMany({
            where: {
              showtimeId: t.showtimeId,
              seatId: t.seatId,
            },
            data: {
              status: "AVAILABLE",
              heldByUserId: null,
              holdExpiresAt: null,
            },
          })
        }

        // Cập nhật Payment nếu có -> Đánh dấu hoàn tiền (status: FAILED)
        if (booking.payment) {
          await tx.payment.update({
            where: { id: booking.payment.id },
            data: { status: "FAILED" },
          })
        }
      })

      return res.status(200).json({
        success: true,
        message: "Hủy vé thành công",
      })
    }

    // Trường hợp tìm thấy vé theo id hoặc ticketCode:
    // Kiểm tra quyền
    const isOwner = ticket.booking.userId === req.user.id
    const isStaffOrAdmin = req.user.role === "admin" || req.user.role === "staff"
    if (!isOwner && !isStaffOrAdmin) {
      return res.status(403).json({ success: false, error: "Bạn không có quyền hủy vé này" })
    }

    // Kiểm tra trạng thái vé
    if (ticket.status === "USED") {
      return res.status(400).json({ success: false, error: "Vé đã qua cửa, không thể hủy" })
    }

    if (ticket.status === "CANCELLED") {
      return res.status(400).json({ success: false, error: "Vé này đã bị hủy trước đó" })
    }

    // Kiểm tra giờ chiếu: Suất chiếu (Showtime.startTime) phải cách thời điểm hiện tại ít nhất 60 phút
    const now = new Date()
    const startTime = new Date(ticket.showtime.startTime)
    const diffMinutes = (startTime.getTime() - now.getTime()) / (1000 * 60)
    if (diffMinutes < 60) {
      return res.status(400).json({
        success: false,
        error: "Chỉ được hủy vé trước giờ chiếu ít nhất 60 phút",
      })
    }

    // Thực thi trong prisma.$transaction
    await prisma.$transaction(async (tx) => {
      // 1. Cập nhật Ticket.status = 'CANCELLED'
      await tx.ticket.update({
        where: { id: ticket.id },
        data: { status: "CANCELLED" },
      })

      // 2. Cập nhật Booking.status = 'CANCELLED' nếu không còn vé nào chưa bị hủy
      const remainingActiveTickets = await tx.ticket.count({
        where: {
          bookingId: ticket.bookingId,
          id: { not: ticket.id },
          status: { not: "CANCELLED" },
        },
      })

      if (remainingActiveTickets === 0) {
        await tx.booking.update({
          where: { id: ticket.bookingId },
          data: { status: "CANCELLED" },
        })

        // Cập nhật Payment (nếu có): Đánh dấu trạng thái hoàn tiền (FAILED)
        if (ticket.booking.payment) {
          await tx.payment.update({
            where: { id: ticket.booking.payment.id },
            data: { status: "FAILED" },
          })
        }
      }

      // 3. Giải phóng ghế: Tìm bản ghi ShowtimeSeat ứng với showtimeId và seatId, cập nhật status = 'AVAILABLE', xóa heldByUserId và holdExpiresAt
      await tx.showtimeSeat.updateMany({
        where: {
          showtimeId: ticket.showtimeId,
          seatId: ticket.seatId,
        },
        data: {
          status: "AVAILABLE",
          heldByUserId: null,
          holdExpiresAt: null,
        },
      })
    })

    return res.status(200).json({
      success: true,
      message: "Hủy vé thành công",
    })
  } catch (error) {
    console.error("Cancel ticket error:", error)
    return res.status(500).json({ success: false, error: "Lỗi hệ thống khi hủy vé" })
  }
}

