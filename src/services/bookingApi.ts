import { apiFetch } from "./api"
import {
  ShowtimeItem,
  ShowtimeSeatsResponse,
  HoldSeatsResult,
  PayBookingPayload,
  TicketItem,
  BookingDetail,
} from "../types/booking"

export interface GetShowtimesParams {
  movieId?: number | string
  date?: string
  cinemaId?: number | string
}

export interface ReleaseSeatsExtra {
  showtimeId?: string | number
  seatIds?: (string | number)[]
}

export interface PayBookingResult {
  message: string
  booking: BookingDetail
  tickets: TicketItem[]
}

export interface CreateShowtimeInput {
  movieId: string
  roomId: string
  startTime: string
  endTime: string
  price: number
}

export interface CreateShowtimeResult {
  message: string
  showtime: any
  seatsCreated: number
}

export async function getShowtimes(params: GetShowtimesParams = {}): Promise<{ showtimes: ShowtimeItem[] }> {
  const query = new URLSearchParams()
  if (params.movieId) query.append("movieId", String(params.movieId))
  if (params.date) query.append("date", params.date)
  if (params.cinemaId) query.append("cinemaId", String(params.cinemaId))

  const queryString = query.toString() ? `?${query.toString()}` : ""
  return apiFetch<{ showtimes: ShowtimeItem[] }>(`/showtimes${queryString}`)
}

export async function getShowtimeById(showtimeId: string | number): Promise<{ showtime: ShowtimeItem }> {
  return apiFetch<{ showtime: ShowtimeItem }>(`/showtimes/${showtimeId}`)
}

export async function getShowtimeSeats(showtimeId: number | string): Promise<ShowtimeSeatsResponse> {
  return apiFetch<ShowtimeSeatsResponse>(`/showtimes/${showtimeId}/seats`)
}

export async function holdSeats(
  showtimeId: number | string,
  seatIds: (number | string)[]
): Promise<HoldSeatsResult> {
  return apiFetch<HoldSeatsResult>("/bookings/hold", {
    method: "POST",
    body: JSON.stringify({
      showtimeId: String(showtimeId),
      seatIds,
    }),
  })
}

export async function releaseSeats(
  bookingId?: number | string,
  extra?: ReleaseSeatsExtra
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/bookings/release", {
    method: "POST",
    body: JSON.stringify({
      bookingId: bookingId ? String(bookingId) : undefined,
      showtimeId: extra?.showtimeId ? String(extra.showtimeId) : undefined,
      seatIds: extra?.seatIds,
    }),
  })
}

export async function payBooking(
  bookingId: number | string,
  payload: PayBookingPayload = { method: "MOCK", result: "SUCCESS" }
): Promise<PayBookingResult> {
  if (payload.result === "FAILED") {
    // Nếu chọn giả lập thất bại / hủy bỏ -> giải phóng ghế
    await releaseSeats(bookingId, { showtimeId: payload.showtimeId, seatIds: payload.seatIds })
    throw new Error("Đơn đặt vé đã bị hủy bỏ theo yêu cầu của bạn.")
  }

  return apiFetch<PayBookingResult>(`/bookings/${bookingId}/pay`, {
    method: "POST",
    body: JSON.stringify({
      method: payload.method || "MOCK",
      showtimeId: payload.showtimeId,
      seatIds: payload.seatIds,
    }),
  })
}

export async function getMyTickets(): Promise<{ tickets: TicketItem[] }> {
  return apiFetch<{ tickets: TicketItem[] }>("/tickets/my-tickets")
}

export async function getBookingById(bookingId: string | number): Promise<{ booking: BookingDetail }> {
  return apiFetch<{ booking: BookingDetail }>(`/bookings/${bookingId}`)
}

// Admin / Staff APIs
export async function adminCreateShowtime(data: CreateShowtimeInput): Promise<CreateShowtimeResult> {
  return apiFetch<CreateShowtimeResult>("/showtimes", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function adminCancelShowtime(showtimeId: string | number): Promise<{ message: string }> {
  return apiFetch<{ message: string }>(`/showtimes/${showtimeId}/cancel`, {
    method: "PATCH",
  })
}

// Staff Portal APIs
export interface StaffStatsResponse {
  stats: {
    todayShowtimesCount: number
    ticketsSoldToday: number
    ticketsCheckedInToday: number
    checkInRate: number
  }
  todayShowtimes: ShowtimeItem[]
  upcomingShowtimes: ShowtimeItem[]
}

export async function staffCheckInTicket(ticketCode: string): Promise<{ message: string; ticket: TicketItem }> {
  return apiFetch<{ message: string; ticket: TicketItem }>("/tickets/check-in", {
    method: "POST",
    body: JSON.stringify({ ticketCode }),
  })
}

export async function staffGetTicketByCode(ticketCode: string): Promise<{ ticket: TicketItem }> {
  return apiFetch<{ ticket: TicketItem }>(`/tickets/${encodeURIComponent(ticketCode)}`)
}

export async function staffSearchTickets(query: string): Promise<{ tickets: TicketItem[] }> {
  const q = encodeURIComponent(query)
  return apiFetch<{ tickets: TicketItem[] }>(`/tickets/staff/search?q=${q}`)
}

export async function staffGetStats(): Promise<StaffStatsResponse> {
  return apiFetch<StaffStatsResponse>("/tickets/staff/stats")
}
