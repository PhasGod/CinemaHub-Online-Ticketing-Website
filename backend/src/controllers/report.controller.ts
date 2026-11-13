import { Response } from "express"
import { prisma } from "../config/db.js"
import { AuthRequest } from "../middleware/auth.js"

export interface DashboardKpi {
  totalRevenue: number
  previousRevenue: number
  revenueGrowthPercent: number
  ticketsSold: number
  previousTicketsSold: number
  ticketsGrowthPercent: number
  averageOccupancyRate: number
  totalShowtimes: number
  showtimesPlaying: number
  showtimesUpcoming: number
  showtimesFinished: number
  fnbRevenue: number
  fnbSharePercent: number
}

export interface RevenueChartDataPoint {
  label: string
  revenue: number
  tickets: number
  fnbRevenue: number
}

export interface TopMovieDataPoint {
  id: string
  title: string
  poster: string
  genre: string
  releaseDate: string
  revenue: number
  ticketsSold: number
  occupancyRate: number
  sharePercent: number
}

export interface LiveShowtimeItem {
  id: string
  movieTitle: string
  moviePoster: string
  roomName: string
  roomFormat: string
  cinemaName: string
  startTime: string
  endTime: string
  status: "PLAYING" | "UPCOMING" | "FINISHED"
  bookedSeats: number
  totalSeats: number
  occupancyPercent: number
  estimatedRevenue: number
}

export interface RecentTransactionItem {
  id: string
  bookingCode: string
  customerName: string
  customerEmail: string
  customerPhone: string
  movieTitle: string
  roomName: string
  showtime: string
  ticketCount: number
  amount: number
  paymentMethod: "MOMO" | "ZALOPAY" | "VIETQR" | "VNPAY" | "VISA"
  paymentStatus: "COMPLETED" | "HOLDING" | "CANCELLED"
  createdAt: string
  timeAgo: string
}

export interface CinemaOption {
  id: string
  name: string
  city: string
}

export interface DashboardData {
  kpi: DashboardKpi
  revenueChart: RevenueChartDataPoint[]
  topMovies: TopMovieDataPoint[]
  liveShowtimes: LiveShowtimeItem[]
  recentTransactions: RecentTransactionItem[]
  cinemas: CinemaOption[]
}

function parsePeriod(
  timeRange: string,
  startDateStr?: string,
  endDateStr?: string
): {
  periodStart: Date
  periodEnd: Date
  prevPeriodStart: Date
  prevPeriodEnd: Date
} {
  const now = new Date()

  let periodStart: Date
  let periodEnd: Date
  let prevPeriodStart: Date
  let prevPeriodEnd: Date

  if (timeRange === "last7days") {
    periodEnd = new Date(now)
    periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    periodStart.setHours(0, 0, 0, 0)

    prevPeriodEnd = new Date(periodStart.getTime() - 1)
    prevPeriodStart = new Date(prevPeriodEnd.getTime() - 7 * 24 * 60 * 60 * 1000)
    prevPeriodStart.setHours(0, 0, 0, 0)
  } else if (timeRange === "thisMonth") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
    periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    prevPeriodStart = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0)
    prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
  } else if (timeRange === "custom" && startDateStr && endDateStr) {
    const s = new Date(startDateStr)
    s.setHours(0, 0, 0, 0)
    const e = new Date(endDateStr)
    e.setHours(23, 59, 59, 999)
    periodStart = s
    periodEnd = e

    const diffMs = Math.max(1, periodEnd.getTime() - periodStart.getTime())
    prevPeriodEnd = new Date(periodStart.getTime() - 1)
    prevPeriodStart = new Date(prevPeriodEnd.getTime() - diffMs)
  } else {
    // Default: "today"
    periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    prevPeriodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0)
    prevPeriodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
  }

  return { periodStart, periodEnd, prevPeriodStart, prevPeriodEnd }
}

const getTimeAgo = (date: Date): string => {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
  if (seconds < 60) return "vừa xong"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

// GET /api/admin/dashboard/stats
export async function getDashboardStats(req: AuthRequest, res: Response) {
  try {
    const now = new Date()
    const timeRange = (req.query["timeRange"] as string) || "today"
    const startDateStr = req.query["startDate"] as string | undefined
    const endDateStr = req.query["endDate"] as string | undefined
    const cinemaId = (req.query["cinemaId"] as string) || "ALL"
    const cinemaFilter = cinemaId !== "ALL" ? cinemaId : undefined

    const { periodStart, periodEnd, prevPeriodStart, prevPeriodEnd } = parsePeriod(
      timeRange,
      startDateStr,
      endDateStr
    )

    // 1. Doanh thu vé từ Booking (status: COMPLETED)
    const bookingWhere: any = {
      status: "COMPLETED",
      createdAt: { gte: periodStart, lte: periodEnd },
    }
    if (cinemaFilter) {
      bookingWhere.tickets = {
        some: {
          showtime: {
            room: {
              cinemaId: cinemaFilter,
            },
          },
        },
      }
    }

    const prevBookingWhere: any = {
      status: "COMPLETED",
      createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
    }
    if (cinemaFilter) {
      prevBookingWhere.tickets = {
        some: {
          showtime: {
            room: {
              cinemaId: cinemaFilter,
            },
          },
        },
      }
    }

    const [currentBookings, prevBookings] = await Promise.all([
      prisma.booking.findMany({
        where: bookingWhere,
        select: {
          id: true,
          totalAmount: true,
          createdAt: true,
          tickets: {
            select: {
              id: true,
              price: true,
              showtimeId: true,
              showtime: {
                select: {
                  movieId: true,
                },
              },
            },
          },
        },
      }),
      prisma.booking.findMany({
        where: prevBookingWhere,
        select: { totalAmount: true },
      }),
    ])

    const totalRevenue = currentBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
    const previousRevenue = prevBookings.reduce((sum, b) => sum + Number(b.totalAmount), 0)
    const revenueGrowthPercent = previousRevenue > 0
      ? Math.round(((totalRevenue - previousRevenue) / previousRevenue) * 1000) / 10
      : 0

    // 2. Số lượng vé bán & tỷ lệ lấp đầy
    const ticketWhere: any = {
      status: { in: ["VALID", "USED"] },
      createdAt: { gte: periodStart, lte: periodEnd },
    }
    if (cinemaFilter) {
      ticketWhere.showtime = { room: { cinemaId: cinemaFilter } }
    }

    const prevTicketWhere: any = {
      status: { in: ["VALID", "USED"] },
      createdAt: { gte: prevPeriodStart, lte: prevPeriodEnd },
    }
    if (cinemaFilter) {
      prevTicketWhere.showtime = { room: { cinemaId: cinemaFilter } }
    }

    const [ticketsSold, previousTicketsSold] = await Promise.all([
      prisma.ticket.count({ where: ticketWhere }),
      prisma.ticket.count({ where: prevTicketWhere }),
    ])

    const ticketsGrowthPercent = previousTicketsSold > 0
      ? Math.round(((ticketsSold - previousTicketsSold) / previousTicketsSold) * 1000) / 10
      : 0

    // Suất chiếu trong kỳ để tính tỷ lệ lấp đầy
    const periodShowtimesWhere: any = {
      status: "ACTIVE",
      startTime: { gte: periodStart, lte: periodEnd },
    }
    if (cinemaFilter) {
      periodShowtimesWhere.room = { cinemaId: cinemaFilter }
    }

    const periodShowtimes = await prisma.showtime.findMany({
      where: periodShowtimesWhere,
      select: {
        id: true,
        room: { select: { capacity: true } },
        _count: {
          select: {
            showtimeSeats: true,
            tickets: { where: { status: { in: ["VALID", "USED"] } } },
          },
        },
      },
    })

    let totalAvailableSeats = 0
    let totalBookedSeats = 0
    for (const st of periodShowtimes) {
      const seatsCount = (st._count?.showtimeSeats ?? 0) > 0 ? st._count.showtimeSeats : (st.room?.capacity ?? 0)
      totalAvailableSeats += seatsCount
      totalBookedSeats += (st._count?.tickets ?? 0)
    }

    const averageOccupancyRate = totalAvailableSeats > 0
      ? Math.round((totalBookedSeats / totalAvailableSeats) * 1000) / 10
      : 0

    // 3. Suất chiếu vận hành trong ngày hôm nay
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

    const todayShowtimesWhere: any = {
      status: "ACTIVE",
      startTime: { gte: todayStart, lte: todayEnd },
    }
    if (cinemaFilter) {
      todayShowtimesWhere.room = { cinemaId: cinemaFilter }
    }

    const todayShowtimes = await prisma.showtime.findMany({
      where: todayShowtimesWhere,
      select: {
        id: true,
        startTime: true,
        endTime: true,
      },
    })

    const totalShowtimes = todayShowtimes.length
    let showtimesPlaying = 0
    let showtimesUpcoming = 0
    let showtimesFinished = 0

    for (const st of todayShowtimes) {
      if (now < st.startTime) {
        showtimesUpcoming++
      } else if (now <= st.endTime) {
        showtimesPlaying++
      } else {
        showtimesFinished++
      }
    }

    const kpi: DashboardKpi = {
      totalRevenue,
      previousRevenue,
      revenueGrowthPercent,
      ticketsSold,
      previousTicketsSold,
      ticketsGrowthPercent,
      averageOccupancyRate,
      totalShowtimes,
      showtimesPlaying,
      showtimesUpcoming,
      showtimesFinished,
      fnbRevenue: 0,
      fnbSharePercent: 0,
    }

    // 4. Xu hướng doanh thu & lượng vé
    let revenueChart: RevenueChartDataPoint[] = []

    if (timeRange === "today") {
      const hourLabels = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"]
      revenueChart = hourLabels.map((label) => ({
        label,
        revenue: 0,
        tickets: 0,
        fnbRevenue: 0,
      }))

      for (const b of currentBookings) {
        const vnDate = new Date(b.createdAt.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }))
        const hour = vnDate.getHours()
        let bucketIdx = 0
        if (hour < 9) bucketIdx = 0
        else if (hour < 11) bucketIdx = 1
        else if (hour < 13) bucketIdx = 2
        else if (hour < 15) bucketIdx = 3
        else if (hour < 17) bucketIdx = 4
        else if (hour < 19) bucketIdx = 5
        else if (hour < 21) bucketIdx = 6
        else bucketIdx = 7

        revenueChart[bucketIdx].revenue += Number(b.totalAmount)
        revenueChart[bucketIdx].tickets += b.tickets.length
      }
    } else if (timeRange === "last7days") {
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dayLabel = new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        }).format(d)

        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

        let dayRev = 0
        let dayTickets = 0
        for (const b of currentBookings) {
          if (b.createdAt >= dayStart && b.createdAt <= dayEnd) {
            dayRev += Number(b.totalAmount)
            dayTickets += b.tickets.length
          }
        }
        revenueChart.push({
          label: dayLabel,
          revenue: dayRev,
          tickets: dayTickets,
          fnbRevenue: 0,
        })
      }
    } else {
      // thisMonth or custom: split into 6 date checkpoints
      const pointsCount = 6
      const stepMs = Math.max(1, Math.floor((periodEnd.getTime() - periodStart.getTime()) / pointsCount))
      for (let i = 0; i < pointsCount; i++) {
        const segStart = new Date(periodStart.getTime() + i * stepMs)
        const segEnd = new Date(i === pointsCount - 1 ? periodEnd.getTime() : segStart.getTime() + stepMs - 1)
        const segLabel = new Intl.DateTimeFormat("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
          day: "2-digit",
          month: "2-digit",
        }).format(segStart)

        let segRev = 0
        let segTickets = 0
        for (const b of currentBookings) {
          if (b.createdAt >= segStart && b.createdAt <= segEnd) {
            segRev += Number(b.totalAmount)
            segTickets += b.tickets.length
          }
        }
        revenueChart.push({
          label: segLabel,
          revenue: segRev,
          tickets: segTickets,
          fnbRevenue: 0,
        })
      }
    }

    // 5. Top phim doanh thu cao nhất
    const movieRevMap = new Map<string, { revenue: number; ticketsSold: number }>()

    for (const b of currentBookings) {
      for (const t of b.tickets) {
        const mId = t.showtime?.movieId
        if (!mId) continue
        const curr = movieRevMap.get(mId) || { revenue: 0, ticketsSold: 0 }
        curr.revenue += Number(t.price)
        curr.ticketsSold += 1
        movieRevMap.set(mId, curr)
      }
    }

    let topMovies: TopMovieDataPoint[] = []

    if (movieRevMap.size > 0) {
      const movieIds = Array.from(movieRevMap.keys())
      const dbMovies = await prisma.movie.findMany({
        where: { id: { in: movieIds } },
        include: {
          genres: { include: { genre: true } },
        },
      })

      topMovies = dbMovies
        .map((m) => {
          const stats = movieRevMap.get(m.id) || { revenue: 0, ticketsSold: 0 }
          const sharePercent = totalRevenue > 0
            ? Math.round((stats.revenue / totalRevenue) * 1000) / 10
            : 0

          return {
            id: m.id,
            title: m.title,
            poster: m.poster || "",
            genre: m.genres.map((g) => g.genre.name).join(", ") || "Điện ảnh",
            releaseDate: m.releaseDate
              ? new Date(m.releaseDate).toLocaleDateString("vi-VN")
              : "Đang chiếu",
            revenue: stats.revenue,
            ticketsSold: stats.ticketsSold,
            occupancyRate: 0,
            sharePercent,
          }
        })
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    }

    // 6. Live Showtimes hôm nay (Top 10)
    const liveShowtimesRaw = await prisma.showtime.findMany({
      where: todayShowtimesWhere,
      include: {
        movie: true,
        room: {
          include: {
            cinema: true,
          },
        },
        showtimeSeats: true,
        tickets: {
          where: {
            status: { in: ["VALID", "USED"] },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
      take: 10,
    })

    const formatHourMin = (date: Date) =>
      new Intl.DateTimeFormat("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(date)

    const liveShowtimes: LiveShowtimeItem[] = liveShowtimesRaw.map((st) => {
      const bookedSeats = st.tickets ? st.tickets.length : ((st as any)._count?.tickets ?? 0)
      const totalSeats =
        st.showtimeSeats && st.showtimeSeats.length > 0
          ? st.showtimeSeats.length
          : (st.room?.capacity ?? 0)
      const occupancyPercent = totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0
      const estimatedRevenue = bookedSeats * Number(st.price || 0)

      const status: "PLAYING" | "UPCOMING" | "FINISHED" =
        now < st.startTime ? "UPCOMING" : now <= st.endTime ? "PLAYING" : "FINISHED"

      return {
        id: st.id,
        movieTitle: st.movie?.title || "Phim",
        moviePoster: st.movie?.poster || (st.movie as any)?.posterUrl || "",
        roomName: st.room?.name || "Rạp",
        roomFormat: st.room?.format || "2D",
        cinemaName: st.room?.cinema?.name || "",
        startTime: formatHourMin(st.startTime),
        endTime: formatHourMin(st.endTime),
        status,
        bookedSeats,
        totalSeats,
        occupancyPercent,
        estimatedRevenue,
      }
    })

    // 7. Giao dịch gần nhất (Recent Transactions)
    const recentBookingsRaw = await prisma.booking.findMany({
      where: {
        status: { in: ["COMPLETED", "PENDING", "CANCELLED"] },
        ...(cinemaFilter
          ? { tickets: { some: { showtime: { room: { cinemaId: cinemaFilter } } } } }
          : {}),
      },
      include: {
        user: true,
        payment: true,
        tickets: {
          include: {
            showtime: {
              include: {
                movie: true,
                room: true,
              },
            },
          },
          take: 1,
        },
        _count: {
          select: { tickets: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    })

    const recentTransactions: RecentTransactionItem[] = recentBookingsRaw.map((b) => {
      const firstTicket = b.tickets[0]
      const showtimeDate = firstTicket?.showtime?.startTime
        ? new Intl.DateTimeFormat("vi-VN", {
            timeZone: "Asia/Ho_Chi_Minh",
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          }).format(new Date(firstTicket.showtime.startTime))
        : "—"

      const rawMethod = (b.payment?.method || "VIETQR").toUpperCase()
      const paymentMethod: RecentTransactionItem["paymentMethod"] =
        rawMethod.includes("MOMO") ? "MOMO" :
        rawMethod.includes("ZALO") ? "ZALOPAY" :
        rawMethod.includes("VNPAY") ? "VNPAY" :
        rawMethod.includes("VISA") ? "VISA" : "VIETQR"

      const paymentStatus: RecentTransactionItem["paymentStatus"] =
        b.status === "COMPLETED" ? "COMPLETED" :
        b.status === "CANCELLED" ? "CANCELLED" : "HOLDING"

      return {
        id: b.id,
        bookingCode: b.bookingCode,
        customerName: b.user?.fullName || "Khách lẻ",
        customerEmail: b.user?.email || "—",
        customerPhone: b.user?.phone || "—",
        movieTitle: firstTicket?.showtime?.movie?.title || "Vé xem phim",
        roomName: firstTicket?.showtime?.room?.name || "Rạp",
        showtime: showtimeDate,
        ticketCount: b._count.tickets,
        amount: Number(b.totalAmount),
        paymentMethod,
        paymentStatus,
        createdAt: b.createdAt.toISOString(),
        timeAgo: getTimeAgo(b.createdAt),
      }
    })

    // 8. Danh sách cụm rạp thực tế từ DB
    const dbCinemas = await prisma.cinema.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, location: true },
    })

    const cinemas: CinemaOption[] = [
      { id: "ALL", name: "Tất cả các rạp (Toàn hệ thống)", city: "Toàn quốc" },
      ...dbCinemas.map((c) => ({
        id: c.id,
        name: c.name,
        city: c.location || "Việt Nam",
      })),
    ]

    const data: DashboardData = {
      kpi,
      revenueChart,
      topMovies,
      liveShowtimes,
      recentTransactions,
      cinemas,
    }

    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("Get admin dashboard stats error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải dữ liệu thống kê quản trị" })
  }
}
