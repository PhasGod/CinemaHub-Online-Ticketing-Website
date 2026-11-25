export interface ShowtimeItem {
  id: string
  movieId: string
  movieTitle: string
  movieSlug: string
  moviePoster: string | null
  format: string
  runtime: number
  rating: number
  genres: string[]
  roomId: string
  roomName: string
  roomFormat: string
  cinemaId: string
  cinemaName: string
  cinemaLocation: string
  startTime: string
  endTime: string
  price: number
  status: "ACTIVE" | "CANCELLED"
  availableSeats?: number
  createdAt?: string
}

export interface ShowtimeSeatItem {
  id: string
  seatId: string
  row: string
  number: number
  type: "standard" | "vip"
  status: "AVAILABLE" | "HELD" | "BOOKED"
  price: number
  holdExpiresAt?: string | null
  isHeldByMe?: boolean
}

export interface ShowtimeDetail {
  id: string
  movieId: string
  movieTitle: string
  moviePoster: string | null
  format: string
  roomId: string
  roomName: string
  cinemaId: string
  cinemaName: string
  startTime: string
  endTime: string
  price: number
  status: string
}

export interface ShowtimeSeatsResponse {
  showtime: ShowtimeDetail
  totalSeats: number
  availableSeats: number
  seats: ShowtimeSeatItem[]
}

export interface HoldSeatsPayload {
  showtimeId: string | number
  seatIds: (string | number)[]
}

export interface HoldSeatsResult {
  bookingId: string
  bookingCode: string
  showtimeId: string
  heldSeats: (string | number)[]
  expiresAt: string
  expiresInSeconds: number
  totalAmount: number
}

export interface PayBookingPayload {
  method?: "MOCK" | "MOMO" | "SANDBOX" | string
  result?: "SUCCESS" | "FAILED"
  showtimeId?: string
  seatIds?: (string | number)[]
  amount?: number
  totalAmount?: number
  discountAmount?: number
  voucherCode?: string
}

export interface TicketItem {
  id: string
  bookingId: string
  ticketCode: string
  qrCode: string
  price: number
  status: "VALID" | "USED" | "CANCELLED"
  checkedInAt?: string | null
  createdAt: string
  seat: {
    id: string
    row: string
    number: number
    type: "standard" | "vip"
  }
  showtime: {
    id: string
    startTime: string
    endTime: string
    price: number
    movie: {
      id: string
      title: string
      poster: string | null
      format: string
      runtime: number
    }
    room: {
      id: string
      name: string
      format: string
      cinema: {
        id: string
        name: string
        location: string
      }
    }
  }
  booking?: {
    id: string
    bookingCode: string
    bookingDate: string
    status: string
    user?: {
      id: string
      fullName: string
      email: string
      phone?: string | null
    }
    payment?: {
      id: string
      transactionCode: string
      amount: number
      method: string
      status: string
      paidAt?: string | null
    } | null
  }
}

export interface BookingDetail {
  id: string
  userId: string
  bookingCode: string
  bookingDate: string
  totalAmount: number
  status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED"
  createdAt: string
}
