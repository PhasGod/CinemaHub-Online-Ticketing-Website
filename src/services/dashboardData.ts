import {
  DashboardData,
  CinemaOption,
} from "../types/dashboard"

export const CINEMA_OPTIONS: CinemaOption[] = [
  { id: "ALL", name: "Tất cả các rạp (Toàn hệ thống)", city: "Toàn quốc" },
]

export function createEmptyDashboardData(): DashboardData {
  return {
    kpi: {
      totalRevenue: 0,
      previousRevenue: 0,
      revenueGrowthPercent: 0,
      ticketsSold: 0,
      previousTicketsSold: 0,
      ticketsGrowthPercent: 0,
      averageOccupancyRate: 0,
      totalShowtimes: 0,
      showtimesPlaying: 0,
      showtimesUpcoming: 0,
      showtimesFinished: 0,
      fnbRevenue: 0,
      fnbSharePercent: 0,
    },
    revenueChart: [],
    topMovies: [],
    liveShowtimes: [],
    recentTransactions: [],
    cinemas: CINEMA_OPTIONS,
  }
}

/**
 * Fallback empty dashboard data (không mock data)
 */
export function getExecutiveDashboardData(): DashboardData {
  return createEmptyDashboardData()
}

/**
 * Định dạng tiền tệ VNĐ chuẩn
 */
export function formatVND(value: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value || 0)
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
