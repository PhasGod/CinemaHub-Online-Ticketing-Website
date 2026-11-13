import React, { useState, useEffect, useCallback, useMemo } from "react"
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react"
import {
  getShowtimes,
  adminCreateShowtime,
  adminCancelShowtime,
  adminBatchCancelShowtimes,
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

// Helper: Format Date to YYYY-MM-DD
function formatToDateInput(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

// 24-Hour scale (00 -> 23) và các mốc phút (bước 5 phút)
const HOURS_24 = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"))
const MINUTES_5 = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0"))

// Khung giờ chiếu rạp nhanh phổ biến theo chuẩn 24H
const QUICK_SLOTS_24H = [
  { label: "09:30", h: "09", m: "30" },
  { label: "11:15", h: "11", m: "15" },
  { label: "13:30", h: "13", m: "30" },
  { label: "15:45", h: "15", m: "45" },
  { label: "18:00", h: "18", m: "00" },
  { label: "19:30", h: "19", m: "30" },
  { label: "21:15", h: "21", m: "15" },
  { label: "22:45", h: "22", m: "45" },
]

// Helper tính giờ kết thúc tự động từ ngày + giờ bắt đầu + thời lượng phim (+15p dọn rạp)
function computeEndFromStart(
  showDate: string,
  startHour: string,
  startMinute: string,
  durationMinutes: number
): { endDate: string; endHour: string; endMinute: string } {
  const s = new Date(`${showDate}T${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}:00`)
  if (isNaN(s.getTime())) {
    return { endDate: showDate, endHour: "16", endMinute: "15" }
  }
  const e = new Date(s.getTime() + (durationMinutes + 15) * 60 * 1000)
  return {
    endDate: formatToDateInput(e),
    endHour: String(e.getHours()).padStart(2, "0"),
    endMinute: String(e.getMinutes()).padStart(2, "0"),
  }
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
    id: "bien-hoa",
    name: "5TOP CINEMA Biên Hòa",
    location: "Biên Hòa",
    address: "1096 Phạm Văn Thuận, P. Tân Mai, TP. Biên Hòa, Đồng Nai",
  },
  {
    id: "long-thanh",
    name: "5TOP Cinema Long Thành",
    location: "Đồng Nai",
    address: "Tầng 3 TTTM Vincom Plaza Long Thành, Đồng Nai",
  },
  {
    id: "thu-duc",
    name: "5TOP Cinema Thủ Đức",
    location: "TP. Hồ Chí Minh",
    address: "216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP. HCM",
  },
  {
    id: "quan-7",
    name: "5TOP Cinema Quận 7 (Crescent Mall)",
    location: "TP. Hồ Chí Minh",
    address: "Tầng 5 Crescent Mall, 101 Tôn Dật Tiên, Tân Phú, Quận 7, TP. HCM",
  },
  {
    id: "quan-1",
    name: "5TOP Cinema Quận 1 (Đồng Khởi)",
    location: "TP. Hồ Chí Minh",
    address: "Tầng 4 Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, Bến Nghé, Quận 1, TP. HCM",
  },
  {
    id: "go-vap",
    name: "5TOP Cinema Gò Vấp",
    location: "TP. Hồ Chí Minh",
    address: "Phan Văn Trị, Phường 7, Quận Gò Vấp, TP. HCM",
  },
  {
    id: "binh-duong",
    name: "5TOP Cinema Dĩ An",
    location: "Bình Dương",
    address: "Số 01 Đại lộ Bình Dương, Dĩ An, Bình Dương",
  },
  {
    id: "thu-dau-mot",
    name: "5TOP Cinema Thủ Dầu Một",
    location: "Bình Dương",
    address: "230 Đại lộ Bình Dương, P. Phú Hòa, TP. Thủ Dầu Một, Bình Dương",
  },
  {
    id: "ba-dinh",
    name: "5TOP Cinema Ba Đình (Liễu Giai)",
    location: "Hà Nội",
    address: "29 Liễu Giai, P. Ngọc Khánh, Ba Đình, Hà Nội",
  },
  {
    id: "ha-dong",
    name: "5TOP Cinema Hà Đông",
    location: "Hà Nội",
    address: "Tầng 4 TTTM Aeon Mall Hà Đông, P. Dương Nội, Hà Đông, Hà Nội",
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

  // Đảm bảo selectedCinemaId luôn hợp lệ khi availableCinemas thay đổi
  useEffect(() => {
    if (
      availableCinemas.length > 0 &&
      (!selectedCinemaId || !availableCinemas.some((c) => c.id === selectedCinemaId))
    ) {
      setSelectedCinemaId(availableCinemas[0].id)
    }
  }, [availableCinemas, selectedCinemaId])

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

  // Khởi tạo ngày chiếu mặc định: Ngày mai lúc 14:00 (chuẩn 24 giờ)
  const [showDate, setShowDate] = useState(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return formatToDateInput(tomorrow)
  })
  const [startHour, setStartHour] = useState("14")
  const [startMinute, setStartMinute] = useState("00")

  // Tự động tính Giờ kết thúc ban đầu (thời lượng phim + 15 phút)
  const initialMovie = movies.find((m) => m.id === movies[0]?.id)
  const initialDuration = getMovieDuration(initialMovie)
  const initialComputedEnd = computeEndFromStart(showDate, "14", "00", initialDuration)

  const [endDate, setEndDate] = useState(initialComputedEnd.endDate)
  const [endHour, setEndHour] = useState(initialComputedEnd.endHour)
  const [endMinute, setEndMinute] = useState(initialComputedEnd.endMinute)

  const [price, setPrice] = useState("90000")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const selectedMovie = movies.find((m) => m.id === movieId)
  const currentDuration = getMovieDuration(selectedMovie)

  // Cập nhật khi đổi Giờ bắt đầu hoặc Ngày chiếu
  const updateStartTime = (newDate: string, newH: string, newM: string) => {
    setShowDate(newDate)
    setStartHour(newH)
    setStartMinute(newM)
    const computed = computeEndFromStart(newDate, newH, newM, currentDuration)
    setEndDate(computed.endDate)
    setEndHour(computed.endHour)
    setEndMinute(computed.endMinute)
  }

  // Tự động cập nhật endTime khi thay đổi Phim
  const handleMovieChange = (mId: string) => {
    setMovieId(mId)
    const selected = movies.find((m) => m.id === mId)
    const dur = getMovieDuration(selected)
    const computed = computeEndFromStart(showDate, startHour, startMinute, dur)
    setEndDate(computed.endDate)
    setEndHour(computed.endHour)
    setEndMinute(computed.endMinute)
  }

  // Chọn nhanh khung giờ chiếu rạp (24H)
  const handleQuickSlot = (h: string, m: string) => {
    updateStartTime(showDate, h, m)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!roomId) {
      setError("Vui lòng chọn phòng chiếu hợp lệ")
      return
    }

    const sDate = new Date(`${showDate}T${startHour.padStart(2, "0")}:${startMinute.padStart(2, "0")}:00`)
    const eDate = new Date(`${endDate}T${endHour.padStart(2, "0")}:${endMinute.padStart(2, "0")}:00`)
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
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col my-auto overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 md:px-8 py-5 border-b border-slate-100 sticky top-0 bg-white z-10 shrink-0">
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

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden text-slate-700">
          <div className="overflow-y-auto px-6 md:px-8 py-5 space-y-4 flex-1">
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

          {/* 3. Lựa chọn Thời gian chiếu chuẩn 24H (00:00 - 23:59) */}
          <div className="space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <CalendarDays size={15} className="text-blue-600" /> Ngày chiếu *
              </label>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                Khung giờ 24H (00:00 - 23:59)
              </span>
            </div>

            <input
              type="date"
              value={showDate}
              onChange={(e) => updateStartTime(e.target.value, startHour, startMinute)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800"
              required
            />

            {/* Khung giờ chiếu rạp nhanh phổ biến */}
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Khung giờ chiếu nhanh:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SLOTS_24H.map((slot) => {
                  const isActive = startHour === slot.h && startMinute === slot.m
                  return (
                    <button
                      key={slot.label}
                      type="button"
                      onClick={() => handleQuickSlot(slot.h, slot.m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        isActive
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {slot.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Giờ bắt đầu & Giờ kết thúc theo chuẩn 24 Giờ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Giờ bắt đầu */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1">
                  <Clock size={13} className="text-blue-600" /> Giờ bắt đầu (24H) *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <select
                      value={startHour}
                      onChange={(e) => updateStartTime(showDate, e.target.value, startMinute)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 cursor-pointer"
                    >
                      {HOURS_24.map((h) => (
                        <option key={h} value={h}>
                          {h}:00 {Number(h) >= 12 ? (Number(h) >= 18 ? "(Tối)" : "(Chiều)") : "(Sáng)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={startMinute}
                      onChange={(e) => updateStartTime(showDate, startHour, e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 cursor-pointer"
                    >
                      {MINUTES_5.map((m) => (
                        <option key={m} value={m}>
                          {m} phút
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Giờ kết thúc */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                    <Clock size={13} className="text-blue-600" /> Giờ kết thúc (24H) *
                  </label>
                  {endDate !== showDate && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                      +1 ngày ({endDate})
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <select
                      value={endHour}
                      onChange={(e) => setEndHour(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 cursor-pointer"
                    >
                      {HOURS_24.map((h) => (
                        <option key={h} value={h}>
                          {h}:00 {Number(h) >= 12 ? (Number(h) >= 18 ? "(Tối)" : "(Chiều)") : "(Sáng)"}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={endMinute}
                      onChange={(e) => setEndMinute(e.target.value)}
                      className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-sm font-bold bg-white focus:ring-2 focus:ring-blue-500 outline-none text-slate-800 cursor-pointer"
                    >
                      {MINUTES_5.map((m) => (
                        <option key={m} value={m}>
                          {m} phút
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
              <span>
                Tự động tính theo thời lượng phim (<b>{currentDuration} phút</b>) + 15 phút dọn rạp/quảng cáo. Có thể điều chỉnh tùy ý.
              </span>
            </div>
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

          </div>

          <div className="flex justify-end gap-3 px-6 md:px-8 py-4 border-t border-slate-100 sticky bottom-0 bg-white z-10 shrink-0">
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

export type ShowtimeSortOption =
  | "time-asc"
  | "time-desc"
  | "price-asc"
  | "price-desc"
  | "status"

export type DynamicShowtimeStatus = "PLAYING" | "UPCOMING" | "ENDED"

export function getDynamicShowtimeStatus(
  st: ShowtimeItem,
  now: Date
): {
  status: DynamicShowtimeStatus
  isEnded: boolean
  isPlaying: boolean
  isUpcoming: boolean
} {
  const start = new Date(st.startTime).getTime()
  const end = new Date(st.endTime).getTime()
  const nowMs = now.getTime()

  if (nowMs > end) {
    return { status: "ENDED", isEnded: true, isPlaying: false, isUpcoming: false }
  }
  if (nowMs >= start && nowMs <= end) {
    return { status: "PLAYING", isEnded: false, isPlaying: true, isUpcoming: false }
  }
  return { status: "UPCOMING", isEnded: false, isPlaying: false, isUpcoming: true }
}

export default function AdminShowtimesPage() {
  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([])
  const [movies, setMovies] = useState<MovieOption[]>([])
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [filterCinemaId, setFilterCinemaId] = useState<string>("all")
  const [sortBy, setSortBy] = useState<ShowtimeSortOption>("time-asc")
  const [currentTime, setCurrentTime] = useState<Date>(() => new Date())
  const [isLoading, setIsLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [toast, setToast] = useState<{
    msg: string
    type: "success" | "error"
  } | null>(null)

  // Cập nhật mốc thời gian thực mỗi 30 giây để tự động phản ánh trạng thái suất chiếu
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000)
    return () => clearInterval(timer)
  }, [])

  // Quản lý Trạng thái Thao tác Hàng loạt (Bulk Action)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [confirmBatchModalOpen, setConfirmBatchModalOpen] = useState(false)
  const [isBatchCancelling, setIsBatchCancelling] = useState(false)

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

  const filteredShowtimes = useMemo(() => {
    if (filterCinemaId === "all") return showtimes
    return showtimes.filter((st) => st.cinemaId === filterCinemaId)
  }, [showtimes, filterCinemaId])

  // Danh sách suất chiếu sau khi áp dụng bộ lọc Cụm rạp & Tiêu chí Sắp xếp (Sort)
  const sortedShowtimes = useMemo(() => {
    const list = [...filteredShowtimes]

    const getStatusPriority = (st: ShowtimeItem): number => {
      if (st.status === "CANCELLED") return 4
      const { status } = getDynamicShowtimeStatus(st, currentTime)
      if (status === "PLAYING") return 1
      if (status === "UPCOMING") return 2
      return 3 // ENDED
    }

    list.sort((a, b) => {
      if (sortBy === "time-asc") {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      }
      if (sortBy === "time-desc") {
        return new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      }
      if (sortBy === "price-asc") {
        const diff = a.price - b.price
        if (diff !== 0) return diff
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      }
      if (sortBy === "price-desc") {
        const diff = b.price - a.price
        if (diff !== 0) return diff
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      }
      if (sortBy === "status") {
        const prioA = getStatusPriority(a)
        const prioB = getStatusPriority(b)
        if (prioA !== prioB) return prioA - prioB
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      }
      return 0
    })

    return list
  }, [filteredShowtimes, sortBy, currentTime])

  // Danh sách các suất chiếu có thể hủy trong danh sách hiển thị hiện tại (chưa Hủy và chưa Kết thúc)
  const cancellableFilteredShowtimes = useMemo(() => {
    return sortedShowtimes.filter((st) => {
      if (st.status === "CANCELLED") return false
      const { isEnded } = getDynamicShowtimeStatus(st, currentTime)
      return !isEnded
    })
  }, [sortedShowtimes, currentTime])

  // Trạng thái đã chọn tất cả các suất có thể hủy chưa
  const isAllSelected =
    cancellableFilteredShowtimes.length > 0 &&
    cancellableFilteredShowtimes.every((st) => selectedIds.has(st.id))

  const isIndeterminate =
    cancellableFilteredShowtimes.some((st) => selectedIds.has(st.id)) && !isAllSelected

  // Xử lý Chọn tất cả / Bỏ chọn tất cả các suất có thể hủy
  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds)
    if (isAllSelected) {
      cancellableFilteredShowtimes.forEach((st) => next.delete(st.id))
    } else {
      cancellableFilteredShowtimes.forEach((st) => next.add(st.id))
    }
    setSelectedIds(next)
  }

  // Xử lý Chọn / Bỏ chọn một hàng
  const handleToggleSelectOne = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) {
      next.delete(id)
    } else {
      next.add(id)
    }
    setSelectedIds(next)
  }

  // Bỏ chọn tất cả
  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  // Thực hiện Hủy hàng loạt
  const handleExecuteBatchCancel = async () => {
    if (selectedIds.size === 0) return

    setIsBatchCancelling(true)
    try {
      const res = await adminBatchCancelShowtimes(Array.from(selectedIds))
      setToast({
        msg: res.message || `Đã hủy thành công ${res.successCount} suất chiếu!`,
        type: "success",
      })
      setSelectedIds(new Set())
      setConfirmBatchModalOpen(false)
      loadData()
    } catch (err: any) {
      setToast({
        msg: err.message || "Không thể hủy hàng loạt suất chiếu đã chọn",
        type: "error",
      })
    } finally {
      setIsBatchCancelling(false)
    }
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

      {/* Modal Xác nhận Hủy Hàng Loạt (Bulk Action Confirmation Modal) */}
      {confirmBatchModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
          onClick={() => !isBatchCancelling && setConfirmBatchModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle size={26} />
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Xác nhận hủy hàng loạt suất chiếu
            </h3>

            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Bạn có chắc chắn muốn hủy <b>{selectedIds.size}</b> suất chiếu đã chọn không?
              Sau khi hủy, trạng thái sẽ chuyển thành <span className="font-semibold text-rose-600">"Đã hủy"</span> và ngừng mở bán vé.
            </p>

            {/* Danh sách tóm tắt các suất chiếu được chọn */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 mb-6 max-h-48 overflow-y-auto divide-y divide-slate-200/70">
              {showtimes
                .filter((st) => selectedIds.has(st.id))
                .map((st) => (
                  <div key={st.id} className="py-2 first:pt-0 last:pb-0 text-xs flex items-center justify-between">
                    <span className="font-semibold text-slate-800 truncate max-w-[210px]">
                      {st.movieTitle}
                    </span>
                    <span className="text-slate-500 shrink-0 ml-2">
                      {new Date(st.startTime).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      - {st.roomName}
                    </span>
                  </div>
                ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                disabled={isBatchCancelling}
                onClick={() => setConfirmBatchModalOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold hover:bg-slate-50 transition text-slate-700 disabled:opacity-50 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isBatchCancelling}
                onClick={handleExecuteBatchCancel}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md shadow-rose-600/30 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
              >
                {isBatchCancelling ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang hủy...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    Xác nhận hủy ({selectedIds.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
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

      {/* Filter & Batch Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2.5">
            <Building2 size={18} className="text-blue-600 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Cụm rạp:
            </span>
            <select
              value={filterCinemaId}
              onChange={(e) => {
                setFilterCinemaId(e.target.value)
                setSelectedIds(new Set())
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer text-slate-800"
            >
              <option value="all">Tất cả cụm rạp ({showtimes.length} suất)</option>
              {cinemas.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.location ? `(${c.location})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2.5">
            <ArrowUpDown size={18} className="text-blue-600 shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as ShowtimeSortOption)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-slate-50 hover:bg-slate-100 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition cursor-pointer text-slate-800"
            >
              <option value="time-asc">Thời gian: Gần nhất → Xa nhất (Mặc định)</option>
              <option value="time-desc">Thời gian: Xa nhất → Gần nhất</option>
              <option value="price-asc">Giá vé: Thấp đến cao</option>
              <option value="price-desc">Giá vé: Cao đến thấp</option>
              <option value="status">Trạng thái: Đang chiếu → Sắp chiếu → Kết thúc</option>
            </select>
          </div>
        </div>

        {/* Nút Hủy các mục đã chọn (Bulk Action Button) */}
        <div className="flex items-center gap-3">
          {selectedIds.size > 0 ? (
            <div className="flex items-center gap-2.5 animate-fade-in">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
                Đã chọn: <b className="text-rose-600 font-extrabold">{selectedIds.size}</b> mục
              </span>
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 px-2.5 py-1.5 transition cursor-pointer hover:bg-slate-100 rounded-lg"
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                onClick={() => setConfirmBatchModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-rose-600/30 transition cursor-pointer"
              >
                <Trash2 size={15} />
                Hủy ({selectedIds.size})
              </button>
            </div>
          ) : (
            <div className="text-xs text-slate-500 font-medium">
              Đang hiển thị <b>{sortedShowtimes.length}</b> / <b>{showtimes.length}</b> suất chiếu
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="text-sm">Đang tải dữ liệu suất chiếu...</p>
          </div>
        ) : sortedShowtimes.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CalendarDays size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="font-semibold">
              {filterCinemaId !== "all"
                ? "Không có suất chiếu nào tại cụm rạp đã chọn."
                : "Chưa có suất chiếu nào được tạo."}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Nhấp vào nút "Thêm suất chiếu" ở góc trên để tạo suất chiếu mới cho rạp này.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase font-bold text-slate-500">
                <tr>
                  {/* Cột Checkbox Chọn tất cả (Select All) */}
                  <th className="w-12 px-4 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate
                      }}
                      disabled={cancellableFilteredShowtimes.length === 0}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer accent-rose-600 disabled:opacity-40 disabled:cursor-not-allowed"
                      title={
                        cancellableFilteredShowtimes.length === 0
                          ? "Không có suất chiếu nào có thể hủy"
                          : isAllSelected
                          ? "Bỏ chọn tất cả"
                          : "Chọn tất cả các suất chiếu có thể hủy"
                      }
                    />
                  </th>
                  <th className="px-6 py-4">Phim</th>
                  <th className="px-6 py-4">Rạp & Phòng</th>
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setSortBy(sortBy === "time-asc" ? "time-desc" : "time-asc")
                      }
                      className="inline-flex items-center gap-1.5 uppercase font-bold hover:text-slate-800 transition cursor-pointer group"
                      title="Sắp xếp theo thời gian chiếu (Gần nhất / Xa nhất)"
                    >
                      <span>Thời gian chiếu</span>
                      {sortBy === "time-asc" ? (
                        <ArrowUp size={14} className="text-blue-600 shrink-0" />
                      ) : sortBy === "time-desc" ? (
                        <ArrowDown size={14} className="text-blue-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0 transition" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() =>
                        setSortBy(sortBy === "price-asc" ? "price-desc" : "price-asc")
                      }
                      className="inline-flex items-center gap-1.5 uppercase font-bold hover:text-slate-800 transition cursor-pointer group"
                      title="Sắp xếp theo giá vé (Thấp đến cao / Cao đến thấp)"
                    >
                      <span>Giá vé</span>
                      {sortBy === "price-asc" ? (
                        <ArrowUp size={14} className="text-blue-600 shrink-0" />
                      ) : sortBy === "price-desc" ? (
                        <ArrowDown size={14} className="text-blue-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0 transition" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4">Ghế trống</th>
                  <th className="px-6 py-4">
                    <button
                      type="button"
                      onClick={() => setSortBy("status")}
                      className="inline-flex items-center gap-1.5 uppercase font-bold hover:text-slate-800 transition cursor-pointer group"
                      title="Sắp xếp theo trạng thái (Đang chiếu → Sắp chiếu → Kết thúc)"
                    >
                      <span>Trạng thái</span>
                      {sortBy === "status" ? (
                        <ArrowDown size={14} className="text-blue-600 shrink-0" />
                      ) : (
                        <ArrowUpDown size={14} className="text-slate-400 group-hover:text-slate-600 shrink-0 transition" />
                      )}
                    </button>
                  </th>
                  <th className="px-6 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedShowtimes.map((st) => {
                  const s = new Date(st.startTime)
                  const e = new Date(st.endTime)
                  const isCancelled = st.status === "CANCELLED"
                  const { status: dynamicStatus, isEnded, isPlaying, isUpcoming } =
                    getDynamicShowtimeStatus(st, currentTime)
                  const isSelected = selectedIds.has(st.id)

                  return (
                    <tr
                      key={st.id}
                      className={`transition ${
                        isSelected
                          ? "bg-rose-50/70 hover:bg-rose-50/90"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* Cột Checkbox hàng dữ liệu */}
                      <td className="w-12 px-4 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isCancelled || isEnded}
                          onChange={() => handleToggleSelectOne(st.id)}
                          className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300 cursor-pointer accent-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                          title={
                            isCancelled
                              ? "Suất chiếu này đã hủy"
                              : isEnded
                              ? "Suất chiếu đã kết thúc, không thể chọn để hủy"
                              : `Chọn suất chiếu ${st.movieTitle}`
                          }
                        />
                      </td>

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
                        {isCancelled ? (
                          <span className="inline-block px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                            Đã hủy
                          </span>
                        ) : isPlaying ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200/60 shadow-2xs">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Đang chiếu
                          </span>
                        ) : isUpcoming ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-700 border border-sky-200/60">
                            Sắp chiếu
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-200/60">
                            Kết thúc
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        {isCancelled ? (
                          <span className="text-xs font-semibold text-slate-400 italic">
                            Đã hủy
                          </span>
                        ) : isEnded ? (
                          <button
                            type="button"
                            disabled
                            title="Suất chiếu đã kết thúc, không thể hủy để bảo toàn lịch sử dữ liệu"
                            className="p-2 text-slate-300 cursor-not-allowed rounded-xl inline-flex items-center gap-1 text-xs font-bold select-none"
                          >
                            <Trash2 size={16} /> Hủy
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleCancelShowtime(st)}
                            title="Hủy suất chiếu"
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition inline-flex items-center gap-1 text-xs font-bold cursor-pointer"
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
