import React, { useState, useEffect, useCallback } from "react"
import {
  CalendarDays,
  Plus,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Film,
  Building2,
  Armchair,
  AlertTriangle,
} from "lucide-react"
import {
  getShowtimes,
  adminCreateShowtime,
  adminCancelShowtime,
} from "../../services/bookingApi"
import { adminGetCinemas, adminGetRooms, Cinema, Room } from "../../services/admin.service"
import { apiFetch } from "../../services/api"
import { ShowtimeItem } from "../../types/booking"

interface MovieOption {
  id: string
  title: string
  runtime?: number
  duration?: number
}

function Toast({
  msg,
  type,
  onClose,
}: {
  msg: string
  type: "success" | "error"
  onClose: () => void
}) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000)
    return () => clearTimeout(t)
  }, [onClose])

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold ${
        type === "success"
          ? "bg-emerald-50 border-emerald-300 text-emerald-800"
          : "bg-rose-50 border-rose-300 text-rose-800"
      }`}
    >
      {type === "success" ? (
        <CheckCircle2 size={18} />
      ) : (
        <AlertCircle size={18} />
      )}
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">
        <X size={15} />
      </button>
    </div>
  )
}

// Helper: định dạng Date sang chuỗi "YYYY-MM-DDTHH:mm" cho input datetime-local theo giờ địa phương
function formatToLocalDateTimeInput(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = date.getDate()
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Helper: Lấy thời lượng phim (duration hoặc runtime, mặc định 120 phút)
function getMovieDuration(movie?: MovieOption): number {
  if (!movie) return 120
  if (typeof movie.duration === "number" && !isNaN(movie.duration) && movie.duration > 0) {
    return movie.duration
  }
  if (typeof movie.runtime === "number" && !isNaN(movie.runtime) && movie.runtime > 0) {
    return movie.runtime
  }
  if (typeof movie.duration === "string") {
    const parsed = parseInt(movie.duration, 10)
    if (!isNaN(parsed) && parsed > 0) return parsed
  }
  return 120
}

// Helper: Tự động tính Giờ kết thúc theo công thức:
// endTime = startTime + movie.duration (phút) + 15 phút (thời gian dọn rạp/quảng cáo)
function calculateEndTime(startStr: string, durationMinutes: number): string {
  if (!startStr) return ""
  const startDate = new Date(startStr)
  if (isNaN(startDate.getTime())) return ""
  const endDate = new Date(startDate.getTime() + (durationMinutes + 15) * 60 * 1000)
  return formatToLocalDateTimeInput(endDate)
}

// Danh sách cụm rạp mặc định dự phòng nếu chưa có từ API
const DEFAULT_CINEMAS: Cinema[] = [
  {
    id: "e8eb6397-07e6-4f8d-91f3-5f7904242b6a",
    name: "5TOP CINEMA Biên Hòa",
    location: "Biên Hòa",
    address: "123 Đường Phạm Văn Thuận, P. Tân Tiến, Biên Hòa",
  },
  {
    id: "61f3a185-ee92-4647-bb65-6ed079acbbae",
    name: "5TOP CINEMA TP.HCM (Thủ Đức)",
    location: "TP.HCM",
    address: "216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM",
  },
]

function CreateShowtimeModal({
  movies,
  cinemas,
  rooms,
  onClose,
  onCreated,
}: {
  movies: MovieOption[]
  cinemas: Cinema[]
  rooms: Room[]
  onClose: () => void
  onCreated: () => void
}) {
  // 1. Danh sách cụm rạp: Ưu tiên từ API + phòng chiếu hiện có, dự phòng cụm rạp hệ thống
  const availableCinemas = React.useMemo(() => {
    const cinemaMap = new Map<string, Cinema>()
    // Từ API
    cinemas.forEach((c) => {
      if (c?.id) cinemaMap.set(c.id, c)
    })
    // Từ dữ liệu phòng chiếu
    rooms.forEach((r) => {
      if (r.cinemaId && !cinemaMap.has(r.cinemaId)) {
        cinemaMap.set(r.cinemaId, {
          id: r.cinemaId,
          name: r.cinemaName || "Rạp chiếu",
          location: "",
          address: null,
        })
      }
    })
    // Nếu rỗng, fallback sang hệ thống
    if (cinemaMap.size === 0) {
      DEFAULT_CINEMAS.forEach((c) => cinemaMap.set(c.id, c))
    }
    return Array.from(cinemaMap.values())
  }, [cinemas, rooms])

  // Chọn phim
  const [movieId, setMovieId] = useState(movies[0]?.id || "")

  // 2. Chọn Cụm Rạp (Cinema)
  const [selectedCinemaId, setSelectedCinemaId] = useState<string>(() => {
    const firstRoomCinemaId = rooms[0]?.cinemaId
    if (firstRoomCinemaId && availableCinemas.some((c) => c.id === firstRoomCinemaId)) {
      return firstRoomCinemaId
    }
    return availableCinemas[0]?.id || ""
  })

  // 3. Danh sách phòng chiếu trực thuộc cụm rạp đã chọn
  const filteredRooms = React.useMemo(() => {
    if (!selectedCinemaId) return rooms
    return rooms.filter((r) => r.cinemaId === selectedCinemaId)
  }, [rooms, selectedCinemaId])

  // Chọn Phòng Chiếu (Room)
  const [roomId, setRoomId] = useState<string>(() => {
    const initialCinemaId =
      rooms[0]?.cinemaId || availableCinemas[0]?.id || ""
    const initialMatchingRooms = rooms.filter((r) => r.cinemaId === initialCinemaId)
    return initialMatchingRooms[0]?.id || rooms[0]?.id || ""
  })

  // Đồng bộ roomId khi đổi rạp hoặc danh sách phòng thay đổi
  useEffect(() => {
    if (filteredRooms.length > 0) {
      if (!filteredRooms.some((r) => r.id === roomId)) {
        setRoomId(filteredRooms[0].id)
      }
    } else {
      setRoomId("")
    }
  }, [filteredRooms, roomId])

  // Xử lý khi người dùng đổi cụm rạp
  const handleCinemaChange = (newCinemaId: string) => {
    setSelectedCinemaId(newCinemaId)
    const matchingRooms = rooms.filter((r) => r.cinemaId === newCinemaId)
    setRoomId(matchingRooms[0]?.id || "")
  }

  // Khởi tạo ngày mai lúc 14:00 (giờ địa phương)
  const [startTime, setStartTime] = useState(() => {
    const defaultStart = new Date()
    defaultStart.setDate(defaultStart.getDate() + 1)
    defaultStart.setHours(14, 0, 0, 0)
    return formatToLocalDateTimeInput(defaultStart)
  })

  // Tự động tính endTime ban đầu: startTime + movie.duration (phút) + 15 phút
  const [endTime, setEndTime] = useState(() => {
    const defaultStart = new Date()
    defaultStart.setDate(defaultStart.getDate() + 1)
    defaultStart.setHours(14, 0, 0, 0)
    const startStr = formatToLocalDateTimeInput(defaultStart)
    const initialMovie = movies.find((m) => m.id === movies[0]?.id)
    const duration = getMovieDuration(initialMovie)
    return calculateEndTime(startStr, duration)
  })

  const [price, setPrice] = useState("90000")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  // Tự động cập nhật endTime khi thay đổi Phim
  const handleMovieChange = (mId: string) => {
    setMovieId(mId)
    const selected = movies.find((m) => m.id === mId)
    if (startTime) {
      const duration = getMovieDuration(selected)
      const calculatedEnd = calculateEndTime(startTime, duration)
      if (calculatedEnd) {
        setEndTime(calculatedEnd)
      }
    }
  }

  // Tự động cập nhật endTime khi thay đổi Giờ bắt đầu (startTime)
  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime)
    const selected = movies.find((m) => m.id === movieId)
    if (newStartTime) {
      const duration = getMovieDuration(selected)
      const calculatedEnd = calculateEndTime(newStartTime, duration)
      if (calculatedEnd) {
        setEndTime(calculatedEnd)
      }
    }
  }

  const selectedMovie = movies.find((m) => m.id === movieId)
  const currentDuration = getMovieDuration(selectedMovie)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!roomId) {
      setError("Vui lòng chọn phòng chiếu hợp lệ")
      return
    }

    const sDate = new Date(startTime)
    const eDate = new Date(endTime)
    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      setError("Thời gian bắt đầu hoặc kết thúc không hợp lệ")
      return
    }

    if (eDate.getTime() <= sDate.getTime()) {
      setError("Giờ kết thúc phải sau giờ bắt đầu")
      return
    }

    const numPrice = Number(price)
    if (isNaN(numPrice) || numPrice <= 0) {
      setError("Giá vé phải là số dương")
      return
    }

    setIsLoading(true)

    try {
      await adminCreateShowtime({
        movieId,
        roomId,
        startTime: sDate.toISOString(),
        endTime: eDate.toISOString(),
        price: numPrice,
      })

      onCreated()
    } catch (err: any) {
      // Bắt lỗi 409 Conflict hoặc lỗi khác
      setError(err.message || "Không thể tạo suất chiếu.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 md:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Tạo suất chiếu mới
            </h3>
            <p className="text-xs text-slate-500">
              Tự động khởi tạo sơ đồ ghế trống cho phòng chiếu
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mb-5 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-start gap-2.5">
            <AlertTriangle
              size={18}
              className="shrink-0 text-rose-600 mt-0.5"
            />
            <div>
              <p className="font-bold text-rose-900">
                Không thể tạo suất chiếu
              </p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-slate-700">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
              <Film size={14} className="text-blue-600" /> Chọn Phim *
            </label>
            <select
              value={movieId}
              onChange={(e) => handleMovieChange(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
              required
            >
              {movies.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} ({getMovieDuration(m)} phút)
                </option>
              ))}
            </select>
          </div>

          {/* Tách 2 dropdown phụ thuộc: Cụm Rạp & Phòng Chiếu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Chọn Cụm Rạp (Cinema) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Building2 size={14} className="text-blue-600" /> Chọn Cụm Rạp *
              </label>
              <select
                value={selectedCinemaId}
                onChange={(e) => handleCinemaChange(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                required
              >
                {availableCinemas.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.location ? `(${c.location})` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Chọn Phòng Chiếu (Room) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Armchair size={14} className="text-blue-600" /> Chọn Phòng chiếu *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={filteredRooms.length === 0}
                className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                required
              >
                {filteredRooms.length === 0 ? (
                  <option value="" disabled>
                    -- Chưa có phòng chiếu nào tại rạp này --
                  </option>
                ) : (
                  filteredRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.format})
                    </option>
                  ))
                )}
              </select>
              {filteredRooms.length === 0 && (
                <p className="text-[11px] text-amber-600 mt-1">
                  Chưa có phòng chiếu cho rạp này.
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-blue-600" /> Giờ bắt đầu *
              </label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Clock size={14} className="text-blue-600" /> Giờ kết thúc *
              </label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 -mt-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
            <span>
              Tự động tính: Thời lượng phim ({currentDuration} phút) + 15 phút dọn rạp/quảng cáo. Có thể điều chỉnh thủ công.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Giá vé tiêu chuẩn (VNĐ) *
            </label>
            <input
              type="number"
              min="10000"
              step="5000"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="VD: 90000"
              className="w-full px-4 py-3 rounded-2xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
              required
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Ghế VIP sẽ tự động phụ thu 20%
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-50 transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isLoading || !roomId}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/30 flex items-center gap-2 transition disabled:opacity-50"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              Tạo suất chiếu
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([])
  const [movies, setMovies] = useState<MovieOption[]>([])
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<{
    msg: string
    type: "success" | "error"
  } | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [stRes, roomsRes, moviesRes, cinemasRes] = await Promise.all([
        getShowtimes(),
        adminGetRooms(),
        apiFetch<{ movies: MovieOption[] }>("/movies?limit=100"),
        adminGetCinemas().catch(() => ({ cinemas: [] })),
      ])
      setShowtimes(stRes.showtimes)
      setRooms(roomsRes.rooms)
      setMovies(moviesRes.movies)
      setCinemas(cinemasRes.cinemas || [])
    } catch (err: any) {
      setToast({
        msg: err.message || "Không thể tải danh sách suất chiếu",
        type: "error",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleCancelShowtime = async (st: ShowtimeItem) => {
    if (
      !window.confirm(
        `Bạn có chắc chắn muốn hủy suất chiếu phim "${st.movieTitle}" vào lúc ${new Date(
          st.startTime,
        ).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })}?`,
      )
    ) {
      return
    }

    try {
      await adminCancelShowtime(st.id)
      setToast({ msg: "Hủy suất chiếu thành công", type: "success" })
      loadData()
    } catch (err: any) {
      setToast({ msg: err.message || "Hủy suất chiếu thất bại", type: "error" })
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {modalOpen && (
        <CreateShowtimeModal
          movies={movies}
          cinemas={cinemas}
          rooms={rooms}
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false)
            setToast({
              msg: "Tạo suất chiếu và khởi tạo sơ đồ ghế thành công!",
              type: "success",
            })
            loadData()
          }}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays size={24} className="text-blue-600" /> Quản lý Suất
            chiếu
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Lên lịch chiếu, quản lý phòng chiếu và sơ đồ ghế tự động
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition self-start"
        >
          <Plus size={18} /> Thêm suất chiếu
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-sm">Đang tải dữ liệu suất chiếu...</p>
          </div>
        ) : showtimes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarDays size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-semibold">Chưa có suất chiếu nào được tạo.</p>
            <p className="text-xs text-slate-400 mt-1">
              Nhấp vào nút "Thêm suất chiếu" ở góc trên để tạo suất chiếu mới.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-4">Phim</th>
                  <th className="px-6 py-4">Rạp & Phòng</th>
                  <th className="px-6 py-4">Thời gian chiếu</th>
                  <th className="px-6 py-4">Giá vé</th>
                  <th className="px-6 py-4">Ghế trống</th>
                  <th className="px-6 py-4">Trạng thái</th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {showtimes.map((st) => {
                  const s = new Date(st.startTime)
                  const e = new Date(st.endTime)
                  const isCancelled = st.status === "CANCELLED"

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              st.moviePoster ||
                              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&q=80"
                            }
                            alt=""
                            className="w-10 h-14 object-cover rounded-lg shadow-sm border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">
                              {st.movieTitle}
                            </span>
                            <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                              {st.format}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 block">
                          {st.roomName}
                        </span>
                        <span className="text-xs text-slate-400">
                          {st.cinemaName}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">
                          {s.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {e.toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {s.toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                          })}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-rose-600">
                        {formatPrice(st.price)}
                      </td>

                      <td className="px-6 py-4 font-semibold text-slate-700">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold">
                          <Armchair size={14} /> {st.availableSeats ?? "?"} ghế
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold ${
                            isCancelled
                              ? "bg-rose-100 text-rose-700"
                              : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {isCancelled ? "Đã hủy" : "Hoạt động"}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        {!isCancelled && (
                          <button
                            onClick={() => handleCancelShowtime(st)}
                            title="Hủy suất chiếu"
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition inline-flex items-center gap-1 text-xs font-bold"
                          >
                            <Trash2 size={16} /> Hủy
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
