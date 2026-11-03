import React, { useState, useEffect } from "react"
import { useNavigate, Link } from "react-router-dom"
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Armchair,
  Ticket,
  ChevronRight,
  Loader2,
  AlertCircle,
  Film,
} from "lucide-react"
import { getShowtimes } from "../services/bookingApi"
import { ShowtimeItem } from "../types/booking"
import { MovieCardData } from "./MovieCard"
import { useCinemaLocation } from "../context/CinemaLocationContext"

interface ShowtimeBookingModalProps {
  movie: MovieCardData | null
  onClose: () => void
}

export function ShowtimeBookingModal({ movie, onClose }: ShowtimeBookingModalProps) {
  const navigate = useNavigate()
  const { selectedCinema } = useCinemaLocation()

  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Generate 7 days starting from today
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const dateStr = `${yyyy}-${mm}-${dd}`
    const label =
      i === 0
        ? "Hôm nay"
        : i === 1
        ? "Ngày mai"
        : d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })
    return { dateStr, label, fullDisplay: `${dd}/${mm}` }
  })

  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].dateStr)

  useEffect(() => {
    if (!movie) return

    setLoading(true)
    setError(null)

    getShowtimes({ movieId: movie.id })
      .then((res) => {
        const activeSt = (res.showtimes || []).filter(
          (st) => new Date(st.endTime) >= new Date(),
        )
        setShowtimes(activeSt)

        // Tự động chuyển tab ngày tới ngày gần nhất có suất chiếu nếu hôm nay không có
        if (activeSt.length > 0) {
          const todayHasSt = activeSt.some((st) =>
            st.startTime.startsWith(dateOptions[0].dateStr),
          )
          if (!todayHasSt) {
            const firstStDate = activeSt[0].startTime.split("T")[0]
            if (firstStDate) {
              setSelectedDate(firstStDate)
            }
          }
        }
      })
      .catch((err: any) => {
        console.error("Error fetching showtimes for movie:", err)
        setError(err.message || "Không thể tải lịch chiếu của phim")
      })
      .finally(() => {
        setLoading(false)
      })
  }, [movie])

  if (!movie) return null

  // Suất chiếu theo ngày được chọn
  const dayShowtimes = showtimes.filter((st) => st.startTime.startsWith(selectedDate))

  // Danh sách các ngày có suất chiếu
  const availableDatesSet = new Set(
    showtimes.map((st) => st.startTime.split("T")[0]),
  )

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleSelectShowtime = (showtimeId: string) => {
    onClose()
    navigate(`/booking/${showtimeId}`)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 md:p-6 border-b border-slate-100 bg-slate-50/70">
          <div className="flex gap-4 pr-6">
            {movie.posterUrl && (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-16 h-24 object-cover rounded-xl shadow-sm border border-slate-200 shrink-0"
              />
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200">
                  {movie.badgeType || "2D"}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {movie.ageRating}
                </span>
              </div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight line-clamp-1">
                {movie.title}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {movie.duration} · {movie.genres}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                Rạp: <span className="text-slate-800 font-bold">{selectedCinema?.name || "5TOP CINEMA Biên Hòa"}</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition cursor-pointer shrink-0"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>
        </div>

        {/* Date Tabs */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-100">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
            {dateOptions.map(({ dateStr, label, fullDisplay }) => {
              const isSelected = selectedDate === dateStr
              const hasShowtimes = availableDatesSet.has(dateStr)

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => setSelectedDate(dateStr)}
                  className={`px-3.5 py-2 rounded-xl font-bold whitespace-nowrap transition flex flex-col items-center gap-0.5 cursor-pointer ${
                    isSelected
                      ? "bg-rose-600 text-white shadow-sm"
                      : "bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <span className="text-[11px]">{label}</span>
                  <span className={`text-[10px] font-normal ${isSelected ? "text-rose-100" : "text-slate-400"}`}>
                    {fullDisplay}
                  </span>
                  {hasShowtimes && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5"></span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Content / Showtimes list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-rose-500" />
              <p className="text-xs font-semibold text-slate-500">Đang nạp các suất chiếu khả dụng...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-rose-600 text-xs space-y-2">
              <AlertCircle size={28} className="mx-auto" />
              <p>{error}</p>
            </div>
          ) : dayShowtimes.length > 0 ? (
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock size={13} className="text-rose-500" /> Chọn khung giờ chiếu phù hợp:
              </p>

              {dayShowtimes.map((st) => (
                <div
                  key={st.id}
                  className="bg-slate-50/80 hover:bg-rose-50/60 border border-slate-200 hover:border-rose-400 rounded-2xl p-4 flex items-center justify-between gap-4 transition shadow-2xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {formatTime(st.startTime)}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        ~ {formatTime(st.endTime)}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {st.roomFormat || "2D"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      <span>{st.roomName}</span>
                      <span>•</span>
                      <span className="font-bold text-rose-600">
                        {Number(st.price).toLocaleString("vi-VN")} ₫
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectShowtime(st.id)}
                    className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Armchair size={15} />
                    <span>Chọn ghế</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 text-center text-slate-500 space-y-3">
              <Film size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-700">
                Chưa có suất chiếu nào trong ngày {selectedDate.split("-").reverse().join("/")}
              </p>
              {availableDatesSet.size > 0 ? (
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Phim có suất chiếu vào các ngày khác (có chấm xanh phía trên). Hãy bấm vào ngày đó để chọn suất.
                </p>
              ) : (
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Phim này hiện đang được sắp xếp lịch chiếu mới hoặc chưa mở bán online.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
          <Link
            to={`/showtimes?movieId=${movie.id}`}
            onClick={onClose}
            className="text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 transition"
          >
            <span>Xem toàn bộ lịch chiếu phim</span>
            <ChevronRight size={14} />
          </Link>

          <Link
            to={movie.detailPath || `/movies/${movie.id}`}
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 font-medium transition"
          >
            Chi tiết phim
          </Link>
        </div>
      </div>
    </div>
  )
}
