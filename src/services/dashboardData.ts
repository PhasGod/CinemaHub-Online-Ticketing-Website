import {
  DashboardFilterState,
  DashboardData,
  CinemaOption,
  DashboardKpi,
  RevenueChartDataPoint,
  TopMovieDataPoint,
  LiveShowtimeItem,
  RecentTransactionItem,
} from "../types/dashboard"

export const CINEMA_OPTIONS: CinemaOption[] = [
  { id: "ALL", name: "Tất cả các rạp (Toàn hệ thống)", city: "Toàn quốc" },
  { id: "cinema-bien-hoa", name: "5TOP CINEMA Biên Hòa", city: "Đồng Nai" },
  { id: "cinema-thu-duc", name: "5TOP CINEMA Thủ Đức", city: "TP.HCM" },
  { id: "cinema-binh-duong", name: "5TOP CINEMA Dĩ An", city: "Bình Dương" },
  { id: "cinema-ha-noi", name: "5TOP CINEMA Cầu Giấy", city: "Hà Nội" },
]

/**
 * Lấy dữ liệu phân tích Dashboard theo bộ lọc thời gian và rạp chiếu
 */
export function getExecutiveDashboardData(filter: DashboardFilterState): DashboardData {
  const isAllCinemas = filter.cinemaId === "ALL"
  const scale = isAllCinemas ? 1 : 0.38 // Chi nhánh lẻ đạt ~38% so với toàn quốc

  // 1. Dữ liệu KPI tương ứng với khoảng thời gian
  let kpi: DashboardKpi
  let revenueChart: RevenueChartDataPoint[]

  if (filter.timeRange === "today") {
    kpi = {
      totalRevenue: Math.round(52840000 * scale),
      previousRevenue: Math.round(46400000 * scale),
      revenueGrowthPercent: 13.9,
      ticketsSold: Math.round(624 * scale),
      previousTicketsSold: Math.round(560 * scale),
      ticketsGrowthPercent: 11.4,
      averageOccupancyRate: 74.2,
      totalShowtimes: Math.round(36 * (isAllCinemas ? 1 : 0.4)),
      showtimesPlaying: Math.max(1, Math.round(5 * (isAllCinemas ? 1 : 0.4))),
      showtimesUpcoming: Math.max(2, Math.round(19 * (isAllCinemas ? 1 : 0.4))),
      showtimesFinished: Math.max(1, Math.round(12 * (isAllCinemas ? 1 : 0.4))),
      fnbRevenue: Math.round(16820000 * scale),
      fnbSharePercent: 31.8,
    }

    revenueChart = [
      { label: "08:00", revenue: Math.round(1800000 * scale), tickets: Math.round(24 * scale), fnbRevenue: Math.round(540000 * scale) },
      { label: "10:00", revenue: Math.round(4200000 * scale), tickets: Math.round(52 * scale), fnbRevenue: Math.round(1350000 * scale) },
      { label: "12:00", revenue: Math.round(5600000 * scale), tickets: Math.round(68 * scale), fnbRevenue: Math.round(1850000 * scale) },
      { label: "14:00", revenue: Math.round(6800000 * scale), tickets: Math.round(82 * scale), fnbRevenue: Math.round(2100000 * scale) },
      { label: "16:00", revenue: Math.round(7900000 * scale), tickets: Math.round(94 * scale), fnbRevenue: Math.round(2450000 * scale) },
      { label: "18:00", revenue: Math.round(11200000 * scale), tickets: Math.round(132 * scale), fnbRevenue: Math.round(3650000 * scale) },
      { label: "20:00", revenue: Math.round(12400000 * scale), tickets: Math.round(145 * scale), fnbRevenue: Math.round(3980000 * scale) },
      { label: "22:00", revenue: Math.round(2940000 * scale), tickets: Math.round(27 * scale), fnbRevenue: Math.round(900000 * scale) },
    ]
  } else if (filter.timeRange === "last7days") {
    kpi = {
      totalRevenue: Math.round(428500000 * scale),
      previousRevenue: Math.round(372600000 * scale),
      revenueGrowthPercent: 15.0,
      ticketsSold: Math.round(4920 * scale),
      previousTicketsSold: Math.round(4350 * scale),
      ticketsGrowthPercent: 13.1,
      averageOccupancyRate: 78.6,
      totalShowtimes: Math.round(252 * (isAllCinemas ? 1 : 0.4)),
      showtimesPlaying: Math.max(1, Math.round(6 * (isAllCinemas ? 1 : 0.4))),
      showtimesUpcoming: Math.max(3, Math.round(28 * (isAllCinemas ? 1 : 0.4))),
      showtimesFinished: Math.max(10, Math.round(218 * (isAllCinemas ? 1 : 0.4))),
      fnbRevenue: Math.round(132800000 * scale),
      fnbSharePercent: 31.0,
    }

    revenueChart = [
      { label: "T2 (19/10)", revenue: Math.round(42000000 * scale), tickets: Math.round(490 * scale), fnbRevenue: Math.round(12800000 * scale) },
      { label: "T3 (20/10)", revenue: Math.round(68500000 * scale), tickets: Math.round(810 * scale), fnbRevenue: Math.round(21500000 * scale) },
      { label: "T4 (21/10)", revenue: Math.round(45200000 * scale), tickets: Math.round(520 * scale), fnbRevenue: Math.round(14100000 * scale) },
      { label: "T5 (22/10)", revenue: Math.round(49800000 * scale), tickets: Math.round(570 * scale), fnbRevenue: Math.round(15600000 * scale) },
      { label: "T6 (23/10)", revenue: Math.round(66000000 * scale), tickets: Math.round(760 * scale), fnbRevenue: Math.round(20400000 * scale) },
      { label: "T7 (24/10)", revenue: Math.round(81000000 * scale), tickets: Math.round(920 * scale), fnbRevenue: Math.round(25600000 * scale) },
      { label: "CN (25/10)", revenue: Math.round(76000000 * scale), tickets: Math.round(850 * scale), fnbRevenue: Math.round(22800000 * scale) },
    ]
  } else {
    // thisMonth / custom
    kpi = {
      totalRevenue: Math.round(1860000000 * scale),
      previousRevenue: Math.round(1590000000 * scale),
      revenueGrowthPercent: 17.0,
      ticketsSold: Math.round(21500 * scale),
      previousTicketsSold: Math.round(18700 * scale),
      ticketsGrowthPercent: 15.0,
      averageOccupancyRate: 81.3,
      totalShowtimes: Math.round(1080 * (isAllCinemas ? 1 : 0.4)),
      showtimesPlaying: Math.max(1, Math.round(6 * (isAllCinemas ? 1 : 0.4))),
      showtimesUpcoming: Math.max(3, Math.round(26 * (isAllCinemas ? 1 : 0.4))),
      showtimesFinished: Math.max(20, Math.round(1048 * (isAllCinemas ? 1 : 0.4))),
      fnbRevenue: Math.round(576000000 * scale),
      fnbSharePercent: 30.9,
    }

    revenueChart = [
      { label: "Tuần 1", revenue: Math.round(410000000 * scale), tickets: Math.round(4750 * scale), fnbRevenue: Math.round(125000000 * scale) },
      { label: "Tuần 2", revenue: Math.round(465000000 * scale), tickets: Math.round(5400 * scale), fnbRevenue: Math.round(144000000 * scale) },
      { label: "Tuần 3", revenue: Math.round(510000000 * scale), tickets: Math.round(5900 * scale), fnbRevenue: Math.round(158000000 * scale) },
      { label: "Tuần 4", revenue: Math.round(475000000 * scale), tickets: Math.round(5450 * scale), fnbRevenue: Math.round(149000000 * scale) },
    ]
  }

  // 2. Top 5 phim doanh thu cao nhất
  const topMovies: TopMovieDataPoint[] = [
    {
      id: "mv-1",
      title: "Mai",
      poster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80",
      genre: "Tâm lý, Tình cảm",
      releaseDate: "Tết 2026",
      revenue: Math.round(kpi.totalRevenue * 0.36),
      ticketsSold: Math.round(kpi.ticketsSold * 0.35),
      occupancyRate: 89.2,
      sharePercent: 36.0,
    },
    {
      id: "mv-2",
      title: "Dune: Hành Tinh Cát 2",
      poster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
      genre: "Khoa học viễn tưởng, Phiêu lưu",
      releaseDate: "01/03/2026",
      revenue: Math.round(kpi.totalRevenue * 0.24),
      ticketsSold: Math.round(kpi.ticketsSold * 0.23),
      occupancyRate: 83.5,
      sharePercent: 24.0,
    },
    {
      id: "mv-3",
      title: "Exhuma: Quật Mộ Trùng Ma",
      poster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
      genre: "Kinh dị, Bí ẩn",
      releaseDate: "15/03/2026",
      revenue: Math.round(kpi.totalRevenue * 0.18),
      ticketsSold: Math.round(kpi.ticketsSold * 0.19),
      occupancyRate: 77.0,
      sharePercent: 18.0,
    },
    {
      id: "mv-4",
      title: "Godzilla x Kong: Đế Chế Mới",
      poster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
      genre: "Hành động, Quái thú",
      releaseDate: "29/03/2026",
      revenue: Math.round(kpi.totalRevenue * 0.13),
      ticketsSold: Math.round(kpi.ticketsSold * 0.14),
      occupancyRate: 72.8,
      sharePercent: 13.0,
    },
    {
      id: "mv-5",
      title: "Kung Fu Panda 4",
      poster: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80",
      genre: "Hoạt hình, Hài hước",
      releaseDate: "08/03/2026",
      revenue: Math.round(kpi.totalRevenue * 0.09),
      ticketsSold: Math.round(kpi.ticketsSold * 0.09),
      occupancyRate: 68.4,
      sharePercent: 9.0,
    },
  ]

  // 3. Suất chiếu trực tiếp trong ngày (Live Hot Showtimes)
  const cinemaLabel = CINEMA_OPTIONS.find((c) => c.id === filter.cinemaId)?.name || "5TOP CINEMA"
  const liveShowtimes: LiveShowtimeItem[] = [
    {
      id: "st-live-1",
      movieTitle: "Mai",
      moviePoster: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&auto=format&fit=crop&q=80",
      roomName: "Phòng VIP 01",
      roomFormat: "IMAX Laser",
      cinemaName: isAllCinemas ? "5TOP CINEMA Biên Hòa" : cinemaLabel,
      startTime: "18:30",
      endTime: "20:45",
      status: "PLAYING",
      bookedSeats: 118,
      totalSeats: 120,
      occupancyPercent: 98,
      estimatedRevenue: 14160000,
    },
    {
      id: "st-live-2",
      movieTitle: "Dune: Hành Tinh Cát 2",
      moviePoster: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
      roomName: "Phòng 02 Standard",
      roomFormat: "2D Digital",
      cinemaName: isAllCinemas ? "5TOP CINEMA Thủ Đức" : cinemaLabel,
      startTime: "19:15",
      endTime: "22:00",
      status: "PLAYING",
      bookedSeats: 88,
      totalSeats: 96,
      occupancyPercent: 92,
      estimatedRevenue: 7920000,
    },
    {
      id: "st-live-3",
      movieTitle: "Exhuma: Quật Mộ Trùng Ma",
      moviePoster: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
      roomName: "Phòng 03 Gold Class",
      roomFormat: "3D Atmos",
      cinemaName: isAllCinemas ? "5TOP CINEMA Biên Hòa" : cinemaLabel,
      startTime: "20:30",
      endTime: "22:45",
      status: "UPCOMING",
      bookedSeats: 64,
      totalSeats: 72,
      occupancyPercent: 89,
      estimatedRevenue: 7680000,
    },
    {
      id: "st-live-4",
      movieTitle: "Godzilla x Kong: Đế Chế Mới",
      moviePoster: "https://images.unsplash.com/photo-1534447677768-be436bb09401?w=400&auto=format&fit=crop&q=80",
      roomName: "Phòng 04",
      roomFormat: "2D Digital",
      cinemaName: isAllCinemas ? "5TOP CINEMA Dĩ An" : cinemaLabel,
      startTime: "21:00",
      endTime: "23:05",
      status: "UPCOMING",
      bookedSeats: 58,
      totalSeats: 80,
      occupancyPercent: 73,
      estimatedRevenue: 5220000,
    },
    {
      id: "st-live-5",
      movieTitle: "Kung Fu Panda 4",
      moviePoster: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=400&auto=format&fit=crop&q=80",
      roomName: "Phòng 01",
      roomFormat: "2D Digital",
      cinemaName: isAllCinemas ? "5TOP CINEMA Cầu Giấy" : cinemaLabel,
      startTime: "16:00",
      endTime: "17:45",
      status: "FINISHED",
      bookedSeats: 74,
      totalSeats: 90,
      occupancyPercent: 82,
      estimatedRevenue: 6660000,
    },
  ]

  // 4. Giao dịch đặt vé mới nhất (Recent Transactions)
  const recentTransactions: RecentTransactionItem[] = [
    {
      id: "tx-1",
      bookingCode: "BK-8942",
      customerName: "Nguyễn Văn Tuấn",
      customerEmail: "tuan.nguyen@gmail.com",
      customerPhone: "0912 345 678",
      movieTitle: "Mai",
      roomName: "Phòng VIP 01",
      showtime: "18:30 (Hôm nay)",
      ticketCount: 2,
      amount: 240000,
      paymentMethod: "MOMO",
      paymentStatus: "COMPLETED",
      createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
      timeAgo: "2 phút trước",
    },
    {
      id: "tx-2",
      bookingCode: "BK-8941",
      customerName: "Trần Thị Mai Lan",
      customerEmail: "mailan.tran@yahoo.com",
      customerPhone: "0988 776 554",
      movieTitle: "Dune: Hành Tinh Cát 2",
      roomName: "Phòng 02 Standard",
      showtime: "19:15 (Hôm nay)",
      ticketCount: 4,
      amount: 450000,
      paymentMethod: "VIETQR",
      paymentStatus: "COMPLETED",
      createdAt: new Date(Date.now() - 7 * 60 * 1000).toISOString(),
      timeAgo: "7 phút trước",
    },
    {
      id: "tx-3",
      bookingCode: "BK-8940",
      customerName: "Lê Hoàng Quân",
      customerEmail: "quan.le90@outlook.com",
      customerPhone: "0903 112 233",
      movieTitle: "Exhuma: Quật Mộ Trùng Ma",
      roomName: "Phòng 03 Gold Class",
      showtime: "20:30 (Hôm nay)",
      ticketCount: 2,
      amount: 260000,
      paymentMethod: "ZALOPAY",
      paymentStatus: "COMPLETED",
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      timeAgo: "15 phút trước",
    },
    {
      id: "tx-4",
      bookingCode: "BK-8939",
      customerName: "Phạm Thùy Dương",
      customerEmail: "duongpham@gmail.com",
      customerPhone: "0934 998 811",
      movieTitle: "Godzilla x Kong",
      roomName: "Phòng 04",
      showtime: "21:00 (Hôm nay)",
      ticketCount: 3,
      amount: 270000,
      paymentMethod: "VNPAY",
      paymentStatus: "COMPLETED",
      createdAt: new Date(Date.now() - 24 * 60 * 1000).toISOString(),
      timeAgo: "24 phút trước",
    },
    {
      id: "tx-5",
      bookingCode: "BK-8938",
      customerName: "Đặng Hữu Phúc",
      customerEmail: "phuc.dang@fpt.edu.vn",
      customerPhone: "0971 665 443",
      movieTitle: "Mai",
      roomName: "Phòng VIP 01",
      showtime: "18:30 (Hôm nay)",
      ticketCount: 2,
      amount: 240000,
      paymentMethod: "VISA",
      paymentStatus: "HOLDING",
      createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      timeAgo: "32 phút trước",
    },
    {
      id: "tx-6",
      bookingCode: "BK-8937",
      customerName: "Vũ Hải Nam",
      customerEmail: "namvu.dev@gmail.com",
      customerPhone: "0965 223 344",
      movieTitle: "Kung Fu Panda 4",
      roomName: "Phòng 01",
      showtime: "16:00 (Hôm nay)",
      ticketCount: 1,
      amount: 90000,
      paymentMethod: "MOMO",
      paymentStatus: "CANCELLED",
      createdAt: new Date(Date.now() - 58 * 60 * 1000).toISOString(),
      timeAgo: "58 phút trước",
    },
  ]

  return {
    kpi,
    revenueChart,
    topMovies,
    liveShowtimes,
    recentTransactions,
    cinemas: CINEMA_OPTIONS,
  }
}

/**
 * Định dạng tiền tệ VNĐ chuẩn
 */
export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value)
}

/**
 * Xuất dữ liệu thống kê ra file CSV
 */
export function exportDashboardToCsv(data: DashboardData, fileName = "CinemaHub-Executive-Report.csv"): void {
  const rows = [
    ["=== BÁO CÁO PHÂN TÍCH DOANH THU & VẬN HÀNH CINEMAHUB ==="],
    ["Thời gian xuất:", new Date().toLocaleString("vi-VN")],
    [],
    ["1. CHỈ SỐ KPI CHÍNH"],
    ["Tổng doanh thu vé (VNĐ)", data.kpi.totalRevenue],
    ["Tăng trưởng doanh thu (%)", `${data.kpi.revenueGrowthPercent}%`],
    ["Tổng vé đã bán", data.kpi.ticketsSold],
    ["Tỷ lệ lấp đầy ghế trung bình (%)", `${data.kpi.averageOccupancyRate}%`],
    ["Doanh thu F&B (VNĐ)", data.kpi.fnbRevenue],
    ["Tỷ trọng F&B (%)", `${data.kpi.fnbSharePercent}%`],
    ["Tổng suất chiếu", data.kpi.totalShowtimes],
    [],
    ["2. BIỂU ĐỒ DOANH THU THEO KHOẢNG THỜI GIAN"],
    ["Mốc thời gian", "Doanh thu vé (VNĐ)", "Số vé bán", "Doanh thu F&B (VNĐ)"],
    ...data.revenueChart.map((p) => [p.label, p.revenue, p.tickets, p.fnbRevenue]),
    [],
    ["3. TOP PHIM DOANH THU CAO NHẤT"],
    ["Tên phim", "Thể loại", "Doanh thu (VNĐ)", "Vé bán ra", "Tỷ lệ lấp đầy (%)"],
    ...data.topMovies.map((m) => [m.title, m.genre, m.revenue, m.ticketsSold, `${m.occupancyRate}%`]),
    [],
    ["4. GIAO DỊCH GẦN NHẤT"],
    ["Mã đơn", "Khách hàng", "SĐT", "Bộ phim", "Số tiền (VNĐ)", "Phương thức", "Trạng thái"],
    ...data.recentTransactions.map((t) => [
      t.bookingCode,
      t.customerName,
      t.customerPhone,
      t.movieTitle,
      t.amount,
      t.paymentMethod,
      t.paymentStatus,
    ]),
  ]

  const csvContent =
    "\uFEFF" +
    rows
      .map((row) =>
        row
          .map((cell) => {
            const str = String(cell ?? "").replace(/"/g, '""')
            return `"${str}"`
          })
          .join(",")
      )
      .join("\r\n")

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", fileName)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
