export type TimeRangeFilter = "today" | "last7days" | "thisMonth" | "custom"

export interface DashboardFilterState {
  timeRange: TimeRangeFilter
  startDate: string
  endDate: string
  cinemaId: string // "ALL" or cinema id
}

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
