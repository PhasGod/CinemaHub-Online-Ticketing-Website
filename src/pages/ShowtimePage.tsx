import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import {
  Calendar,
  Clock,
  Film,
  MapPin,
  ChevronRight,
  Loader2,
  Armchair,
  Sparkles,
} from "lucide-react"
import { getShowtimes } from "../services/bookingApi"
import { ShowtimeItem } from "../types/booking"

export default function ShowtimePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMovieId = searchParams.get("movieId") || ""

  // Tạo danh sách 7 ngày tới
  const dateOptions = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, "0")
    const dd = String(d.getDate()).padStart(2, "0")
    const dateStr = `${yyyy}-${mm}-${dd}`

    const dayName =
      i === 0
        ? "Hôm nay"
        : i === 1
          ? "Ngày mai"
          : `Thứ ${d.getDay() === 0 ? "CN" : d.getDay() + 1}`

    const displayDate = `${dd}/${mm}`

    return { dateStr, dayName, displayDate }
  })

  const [selectedDate, setSelectedDate] = useState<string>(
    dateOptions[0].dateStr,
  )
  const [selectedMovieId, setSelectedMovieId] = useState<string>(initialMovieId)
  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    setIsLoading(true)
    setError("")

    getShowtimes({
      date: selectedDate,
      movieId: selectedMovieId || undefined,
    })
      .then((data) => {
        if (active) {
          setShowtimes(data.showtimes)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Không thể tải danh sách suất chiếu")
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [selectedDate, selectedMovieId])

  // Nhóm suất chiếu theo Phim -> rồi theo Rạp
  const groupedByMovie = showtimes.reduce<Record<string, {
    movie: any
    showtimes: ShowtimeItem[]
  }>>((acc, st) => {
    if (!acc[st.movieId]) {
      acc[st.movieId] = {
        movie: {
          id: st.movieId,
          title: st.movieTitle,
          slug: st.movieSlug,
          poster: st.moviePoster,
          format: st.format,
          runtime: st.runtime,
          rating: st.rating,
          genres: st.genres,
        },
        showtimes: [],
      }
    }
    acc[st.movieId].showtimes.push(st)
    return acc
  }, {})

  const formatTime = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val)
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white pt-24 pb-16">
      <div className="container max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-rose-500 font-semibold text-sm mb-1 uppercase tracking-wider">
            <Sparkles size={16} /> Lịch chiếu phim
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Chọn suất chiếu phù hợp
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Đặt vé online giữ chỗ đẹp, quét mã QR vào rạp không cần xếp hàng
          </p>
        </div>

        {/* Date Selector */}
        <div className="mb-8 overflow-x-auto pb-2 scrollbar-none">
          <div className="flex gap-3 min-w-max">
            {dateOptions.map(({ dateStr, dayName, displayDate }) => {
              const isSelected = selectedDate === dateStr
              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center justify-center w-24 py-3 px-2 rounded-2xl border transition-all ${
                    isSelected
                      ? "bg-rose-600 border-rose-500 text-white shadow-lg shadow-rose-900/50 scale-105"
                      : "bg-slate-800/80 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <span className="text-xs font-medium">{dayName}</span>
                  <span className="text-lg font-bold mt-0.5">
                    {displayDate}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="animate-spin text-rose-500" size={36} />
            <p className="text-sm">Đang tải danh sách suất chiếu...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-6 text-center text-rose-300">
            <p className="font-semibold">{error}</p>
            <button
              onClick={() => setSelectedDate(selectedDate)}
              className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition"
            >
              Thử lại
            </button>
          </div>
        ) : Object.keys(groupedByMovie).length === 0 ? (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-3xl p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-700/60 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Calendar size={32} />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              Chưa có suất chiếu trong ngày này
            </h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto">
              Rạp chưa lên lịch chiếu hoặc đã hết suất. Vui lòng chọn ngày khác
              hoặc quay lại sau.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.values(groupedByMovie).map(
              ({ movie, showtimes: movieShowtimes }) => (
                <div
                  key={movie.id}
                  className="bg-slate-800/70 border border-slate-700/80 rounded-3xl p-6 hover:border-slate-600 transition shadow-xl"
                >
                  <div className="flex flex-col md:flex-row gap-6">
                    {/* Poster & Movie Info */}
                    <div className="flex gap-4 md:w-80 shrink-0">
                      <img
                        src={
                          movie.poster ||
                          "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=300&q=80"
                        }
                        alt={movie.title}
                        className="w-24 h-36 object-cover rounded-xl shadow-md border border-slate-700 shrink-0"
                      />
                      <div className="flex flex-col justify-between">
                        <div>
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 mb-1">
                            {movie.format || "2D"}
                          </span>
                          <h2 className="text-lg font-bold text-white line-clamp-2 hover:text-rose-400 transition">
                            <Link to={`/movies/${movie.id}`}>
                              {movie.title}
                            </Link>
                          </h2>
                          <p className="text-xs text-slate-400 mt-1">
                            {movie.genres?.join(", ") || "Hành động, Phiêu lưu"}
                          </p>
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-2">
                          <Clock size={13} className="text-rose-400" />
                          <span>{movie.runtime || 120} phút</span>
                        </div>
                      </div>
                    </div>

                    {/* Showtimes Grid */}
                    <div className="flex-1 border-t md:border-t-0 md:border-l border-slate-700/80 pt-4 md:pt-0 md:pl-6">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                        <MapPin size={14} className="text-rose-500" /> Danh sách
                        suất chiếu theo phòng
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {movieShowtimes.map((st) => (
                          <button
                            key={st.id}
                            onClick={() => navigate(`/booking/${st.id}`)}
                            className="group relative flex flex-col p-3 rounded-2xl bg-slate-900/90 border border-slate-700 hover:border-rose-500 hover:bg-slate-900 text-left transition-all hover:scale-[1.02] shadow"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-bold text-white group-hover:text-rose-400 transition">
                                {formatTime(st.startTime)}
                              </span>
                              <span className="text-[10px] text-slate-400">
                                ~ {formatTime(st.endTime)}
                              </span>
                            </div>

                            <div className="text-[11px] font-medium text-slate-300 truncate">
                              {st.roomName} · {st.cinemaName}
                            </div>

                            <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                              <span className="text-rose-400 font-semibold">
                                {formatPrice(st.price)}
                              </span>
                              <span className="text-slate-400 flex items-center gap-1">
                                <Armchair size={11} />{" "}
                                {st.availableSeats ?? "?"}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ),
            )}
          </div>
        )}
      </div>
    </main>
  )
}
