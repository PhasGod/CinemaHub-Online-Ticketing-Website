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

// POST /api/tickets/check-in (Chỉ Nhân viên / Quản trị viên)
export async function checkInTicket(req: AuthRequest, res: Response) {
  try {
    const { ticketCode } = req.body
    if (!ticketCode) {
      return res
        .status(400)
        .json({ error: "Vui lòng cung cấp mã vé (ticketCode)" })
    }

    const ticket = await prisma.ticket.findUnique({
      where: { ticketCode },
      include: {
        booking: {
          include: {
            user: {
              select: {
                fullName: true,
                phone: true,
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
      return res.status(404).json({ error: "Không tìm thấy vé trong hệ thống" })
    }

    if (ticket.status === "USED") {
      return res.status(400).json({
        error: `Vé này đã được soát lúc ${ticket.checkedInAt?.toLocaleString("vi-VN")}`,
        ticket,
      })
    }

    if (ticket.status === "CANCELLED") {
      return res.status(400).json({
        error: "Vé này đã bị hủy, không thể sử dụng",
        ticket,
      })
    }

    const updated = await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        status: "USED",
        checkedInAt: new Date(),
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

    return res.json({
      message: "Soát vé thành công. Chúc quý khách xem phim vui vẻ!",
      ticket: updated,
    })
  } catch (error) {
    console.error("Check-in ticket error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi soát vé" })
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
