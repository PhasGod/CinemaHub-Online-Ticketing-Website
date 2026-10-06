import { apiFetch } from "./api"

// ======== Users (US.04) ========
export interface AdminUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: "customer" | "staff" | "admin"
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Pagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

export async function adminGetUsers(params?: {
  q?: string
  role?: string
  page?: number
  limit?: number
}): Promise<{ users: AdminUser[]; pagination: Pagination }> {
  const qs = new URLSearchParams()
  if (params?.q) qs.set("q", params.q)
  if (params?.role) qs.set("role", params.role)
  if (params?.page) qs.set("page", String(params.page))
  if (params?.limit) qs.set("limit", String(params.limit))
  return apiFetch(`/users?${qs}`)
}

export async function adminCreateStaff(data: {
  email: string
  password: string
  fullName: string
  phone?: string
  role: "staff" | "admin"
}): Promise<{ message: string; user: AdminUser }> {
  return apiFetch("/users", { method: "POST", body: JSON.stringify(data) })
}

export async function adminUpdateUser(
  id: string,
  data: { fullName: string; phone?: string; role?: string }
): Promise<{ message: string; user: AdminUser }> {
  return apiFetch(`/users/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function adminToggleUserStatus(id: string): Promise<{ message: string; user: AdminUser }> {
  return apiFetch(`/users/${id}/status`, { method: "PATCH" })
}

// ======== Genres (US.05) ========
export interface Genre {
  id: string
  name: string
  slug: string
  movieCount?: number
  createdAt: string
  updatedAt: string
}

export async function adminGetGenres(): Promise<{ genres: Genre[] }> {
  return apiFetch("/genres")
}

export async function adminCreateGenre(data: { name: string; slug?: string }): Promise<{ message: string; genre: Genre }> {
  return apiFetch("/genres", { method: "POST", body: JSON.stringify(data) })
}

export async function adminUpdateGenre(
  id: string,
  data: { name: string; slug?: string }
): Promise<{ message: string; genre: Genre }> {
  return apiFetch(`/genres/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function adminDeleteGenre(id: string): Promise<{ message: string }> {
  return apiFetch(`/genres/${id}`, { method: "DELETE" })
}

// ======== Movies (US.06) ========
export interface Movie {
  id: string
  title: string
  slug: string
  description: string | null
  poster: string | null
  format: string
  runtime: number
  rating: number
  status: "coming_soon" | "showing" | "ended"
  releaseDate: string | null
  createdAt: string
  updatedAt: string
  genres: Genre[]
}

export async function adminGetMovies(params?: {
  q?: string
  status?: string
  page?: number
  limit?: number
}): Promise<{ movies: Movie[]; pagination: Pagination }> {
  const qs = new URLSearchParams()
  if (params?.q) qs.set("q", params.q)
  if (params?.status) qs.set("status", params.status)
  if (params?.page) qs.set("page", String(params.page))
  if (params?.limit) qs.set("limit", String(params.limit))
  return apiFetch(`/movies?${qs}`)
}

export async function adminGetMovie(idOrSlug: string): Promise<{ movie: Movie }> {
  return apiFetch(`/movies/${idOrSlug}`)
}

export async function adminCreateMovie(data: {
  title: string
  description?: string
  poster?: string
  format: string
  runtime: number
  rating: number
  status: string
  releaseDate?: string
  genreIds: string[]
}): Promise<{ message: string; movie: Movie }> {
  return apiFetch("/movies", { method: "POST", body: JSON.stringify(data) })
}

export async function adminUpdateMovie(
  id: string,
  data: {
    title: string
    description?: string
    poster?: string
    format: string
    runtime: number
    rating: number
    status: string
    releaseDate?: string
    genreIds: string[]
  }
): Promise<{ message: string; movie: Movie }> {
  return apiFetch(`/movies/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function adminDeleteMovie(id: string): Promise<{ message: string }> {
  return apiFetch(`/movies/${id}`, { method: "DELETE" })
}

// ======== Cinemas & Rooms (US.07) ========
export interface Cinema {
  id: string
  name: string
  location: string
  address: string | null
}

export interface Room {
  id: string
  cinemaId: string
  cinemaName: string
  name: string
  format: string
  capacity: number
  createdAt: string
  updatedAt: string
}

export async function adminGetCinemas(): Promise<{ cinemas: Cinema[] }> {
  return apiFetch("/cinema/cinemas")
}

export async function adminGetRooms(cinemaId?: string): Promise<{ rooms: Room[] }> {
  const qs = cinemaId ? `?cinemaId=${cinemaId}` : ""
  return apiFetch(`/cinema/rooms${qs}`)
}

export async function adminGetRoom(id: string): Promise<{ room: Room & { seats: Seat[] } }> {
  return apiFetch(`/cinema/rooms/${id}`)
}

export async function adminCreateRoom(data: {
  cinemaId: string
  name: string
  format: string
}): Promise<{ message: string; room: Room }> {
  return apiFetch("/cinema/rooms", { method: "POST", body: JSON.stringify(data) })
}

export async function adminUpdateRoom(
  id: string,
  data: { name: string; format: string }
): Promise<{ message: string; room: Room }> {
  return apiFetch(`/cinema/rooms/${id}`, { method: "PUT", body: JSON.stringify(data) })
}

export async function adminDeleteRoom(id: string): Promise<{ message: string }> {
  return apiFetch(`/cinema/rooms/${id}`, { method: "DELETE" })
}

// ======== Seats (US.08) ========
export interface Seat {
  id: string
  roomId: string
  row: string
  number: number
  type: "standard" | "vip"
  isActive: boolean
}

export async function adminGetSeats(roomId: string): Promise<{ roomId: string; roomName: string; seats: Seat[] }> {
  return apiFetch(`/cinema/rooms/${roomId}/seats`)
}

export async function adminGenerateSeats(
  roomId: string,
  data: { rowCount: number; seatsPerRow: number; vipRows: string[]; overwrite?: boolean }
): Promise<{ message: string; seats: Seat[]; activeCapacity: number }> {
  return apiFetch(`/cinema/rooms/${roomId}/seats/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function adminUpdateSeat(
  roomId: string,
  seatId: string,
  data: { type?: string; isActive?: boolean }
): Promise<{ message: string; seat: Seat; newRoomCapacity: number }> {
  return apiFetch(`/cinema/rooms/${roomId}/seats/${seatId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  })
}

export async function adminBatchUpdateSeats(
  roomId: string,
  data: { seatIds: string[]; type?: string; isActive?: boolean }
): Promise<{ message: string; newRoomCapacity: number }> {
  return apiFetch(`/cinema/rooms/${roomId}/seats/batch`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function adminClearSeats(roomId: string): Promise<{ message: string }> {
  return apiFetch(`/cinema/rooms/${roomId}/seats`, { method: "DELETE" })
}

// ======== Stats ========
export interface AdminStats {
  totalUsers: number
  totalStaff: number
  totalMovies: number
  totalGenres: number
  totalCinemas: number
  totalRooms: number
  totalSeats: number
}

export async function adminGetStats(): Promise<{ stats: AdminStats; revenueNote: string }> {
  return apiFetch("/stats")
}
