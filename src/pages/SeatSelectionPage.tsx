import React, { useState, useEffect } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import {
  Armchair,
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  ShieldAlert,
  Loader2,
  Check,
  AlertCircle,
  Sparkles,
} from "lucide-react"
import { getShowtimeSeats, holdSeats } from "../services/bookingApi"
import { ShowtimeSeatsResponse, ShowtimeSeatItem } from "../types/booking"
import { useAuth } from "../context/AuthContext"
import { AuthModal } from "../components/AuthModal"

export default function SeatSelectionPage() {
  const { showtimeId } = useParams<{ showtimeId: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [data, setData] = useState<ShowtimeSeatsResponse | null>(null)
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isHolding, setIsHolding] = useState(false)
  const [error, setError] = useState("")
  const [authModalOpen, setAuthModalOpen] = useState(false)

  const loadSeats = async () => {
    if (!showtimeId) return
    setIsLoading(true)
    setError("")
    try {
      const res = await getShowtimeSeats(showtimeId)
      setData(res)
    } catch (err: any) {
      setError(err.message || "Không thể tải sơ đồ ghế của suất chiếu này")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadSeats()
  }, [showtimeId])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white pt-28 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-rose-500" size={40} />
          <p className="text-sm">Đang tải sơ đồ ghế...</p>
        </div>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-950 text-white pt-28 pb-16">
        <div className="container max-w-xl mx-auto px-4 text-center">
          <div className="bg-rose-500/10 border border-rose-500/30 rounded-3xl p-8">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold mb-2">Đã xảy ra lỗi</h2>
            <p className="text-sm text-rose-300 mb-6">
              {error || "Không tìm thấy dữ liệu suất chiếu"}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={loadSeats}
                className="px-5 py-2.5 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition"
              >
                Thử lại
              </button>
              <Link
                to="/showtimes"
                className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-sm font-semibold hover:bg-slate-700 transition"
              >
                Chọn suất khác
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const { showtime, seats } = data

  // Nhóm ghế theo hàng (row)
  const rows = Array.from(new Set(seats.map((s) => s.row))).sort()

  const seatsByRow = rows.reduce<Record<string, ShowtimeSeatItem[]>>(
    (acc, row) => {
      acc[row] = seats
        .filter((s) => s.row === row)
        .sort((a, b) => a.number - b.number)
      return acc
    },
    {},
  )

  const handleSeatClick = (seat: ShowtimeSeatItem) => {
    if (seat.status === "BOOKED") return
    if (seat.status === "HELD" && !seat.isHeldByMe) return

    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id)
      } else {
        if (prev.length >= 8) {
          window.alert("Bạn chỉ có thể chọn tối đa 8 ghế trong một lần đặt.")
          return prev
        }
        return [...prev, seat.id]
      }
    })
  }

  const selectedSeatsInfo = seats.filter((s) => selectedSeatIds.includes(s.id))
  const totalPrice = selectedSeatsInfo.reduce((sum, s) => sum + s.price, 0)

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val)
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const handleProceedHold = async () => {
    if (selectedSeatIds.length === 0) return

    if (!user) {
      setAuthModalOpen(true)
      return
    }

    setIsHolding(true)
    setError("")

    try {
      const result = await holdSeats(showtime.id, selectedSeatIds)
      navigate(`/booking/checkout/${result.bookingId}`, {
        state: {
          showtime,
          heldSeats: selectedSeatsInfo,
          holdResult: result,
        },
      })
    } catch (err: any) {
      setError(err.message || "Không thể giữ ghế. Vui lòng thử lại.")
      // Reload lại danh sách ghế để cập nhật trạng thái mới nhất
      await loadSeats()
    } finally {
      setIsHolding(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-24 pb-16">
      {/* Auth Modal if guest clicks book */}
      {authModalOpen && (
        <AuthModal
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={() => {
            setAuthModalOpen(false)
            handleProceedHold()
          }}
          message="Vui lòng đăng nhập để hoàn tất giữ chỗ và đặt vé xem phim"
        />
      )}

      <div className="container max-w-7xl mx-auto px-4">
        {/* Back Link & Showtime Brief */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-850 text-slate-300 transition"
              aria-label="Quay lại"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2 text-rose-500 text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} /> {showtime.cinemaName} ·{" "}
                {showtime.roomName}
              </div>
              <h1 className="text-xl md:text-2xl font-extrabold text-white">
                {showtime.movieTitle}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-6 text-sm text-slate-300 bg-slate-900/80 px-4 py-2.5 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2">
              <Calendar size={15} className="text-rose-500" />
              <span>{formatDate(showtime.startTime)}</span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-rose-500" />
              <span>
                {formatTime(showtime.startTime)} -{" "}
                {formatTime(showtime.endTime)}
              </span>
            </div>
            <div className="w-px h-4 bg-slate-700" />
            <span className="font-bold text-rose-400">{showtime.format}</span>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError("")}
              className="text-xs font-semibold underline hover:text-white"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Main Grid: Screen + Layout vs Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Seat Map (8 cols) */}
          <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800/80 rounded-3xl p-6 md:p-8 flex flex-col items-center">
            {/* Screen Banner */}
            <div className="w-full max-w-2xl mb-12 text-center">
              <div className="h-2 w-full bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full shadow-[0_0_25px_rgba(244,63,94,0.6)]" />
              <p className="text-xs uppercase tracking-[0.3em] font-bold text-slate-400 mt-3">
                Màn hình chiếu (Screen)
              </p>
            </div>

            {/* Seat Grid */}
            <div className="w-full overflow-x-auto pb-6 scrollbar-none flex flex-col items-center">
              <div className="min-w-max space-y-3">
                {rows.map((rowName) => (
                  <div key={rowName} className="flex items-center gap-3">
                    {/* Row Label Left */}
                    <span className="w-6 text-center text-xs font-bold text-slate-500">
                      {rowName}
                    </span>

                    {/* Seats in Row */}
                    <div className="flex gap-2.5">
                      {seatsByRow[rowName].map((seat) => {
                        const isSelected = selectedSeatIds.includes(seat.id)
                        const isBooked = seat.status === "BOOKED"
                        const isHeld =
                          seat.status === "HELD" && !seat.isHeldByMe
                        const isVip = seat.type === "vip"

                        let buttonClasses =
                          "relative flex items-center justify-center w-8 h-8 md:w-9 md:h-9 rounded-lg text-xs font-bold transition-all "

                        if (isSelected) {
                          buttonClasses +=
                            "bg-rose-600 text-white shadow-lg shadow-rose-900/60 ring-2 ring-rose-400 scale-110 z-10"
                        } else if (isBooked) {
                          buttonClasses +=
                            "bg-red-950/40 border border-red-900/50 text-red-500/40 cursor-not-allowed"
                        } else if (isHeld) {
                          buttonClasses +=
                            "bg-slate-800 border border-slate-700 text-slate-600 cursor-not-allowed"
                        } else if (isVip) {
                          buttonClasses +=
                            "bg-amber-500/20 border border-amber-500/50 text-amber-300 hover:bg-amber-500/40 hover:scale-105"
                        } else {
                          buttonClasses +=
                            "bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 hover:border-slate-500 hover:scale-105"
                        }

                        return (
                          <button
                            key={seat.id}
                            disabled={isBooked || isHeld}
                            onClick={() => handleSeatClick(seat)}
                            title={`Ghế ${seat.row}${seat.number} (${
                              isVip ? "VIP" : "Thường"
                            }) - ${formatPrice(seat.price)}`}
                            className={buttonClasses}
                          >
                            {isSelected ? <Check size={14} /> : seat.number}
                          </button>
                        )
                      })}
                    </div>

                    {/* Row Label Right */}
                    <span className="w-6 text-center text-xs font-bold text-slate-500">
                      {rowName}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="w-full pt-8 mt-6 border-t border-slate-800 flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700" />
                <span>Ghế thường</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/50" />
                <span>Ghế VIP</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-rose-600 ring-2 ring-rose-400" />
                <span className="text-white font-medium">Đang chọn</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-red-950/40 border border-red-900/50" />
                <span>Đã bán</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-slate-800 border border-slate-700 opacity-50" />
                <span>Đang giữ chỗ</span>
              </div>
            </div>
          </div>

          {/* Booking Summary Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Armchair size={18} className="text-rose-500" /> Thông tin đặt
                vé
              </h2>

              <div className="space-y-4 text-sm pb-6 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-500 block">Phim</span>
                  <span className="font-semibold text-white">
                    {showtime.movieTitle}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    Rạp & Phòng chiếu
                  </span>
                  <span className="text-slate-300 font-medium">
                    {showtime.cinemaName} — {showtime.roomName} (
                    {showtime.format})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">
                    Suất chiếu
                  </span>
                  <span className="text-slate-300 font-medium">
                    {formatTime(showtime.startTime)} ·{" "}
                    {formatDate(showtime.startTime)}
                  </span>
                </div>
              </div>

              {/* Selected Seats List */}
              <div className="py-5 border-b border-slate-800">
                <span className="text-xs text-slate-500 block mb-2">
                  Ghế đang chọn
                </span>
                {selectedSeatsInfo.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">
                    Vui lòng nhấp chọn ghế trên sơ đồ
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSeatsInfo.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      >
                        {s.row}
                        {s.number}
                        <span className="text-[10px] font-normal opacity-80">
                          ({s.type === "vip" ? "VIP" : "Thường"})
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Price Calculation */}
              <div className="py-5 space-y-2">
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Số lượng vé</span>
                  <span className="font-semibold text-white">
                    {selectedSeatsInfo.length} vé
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-sm font-semibold text-slate-300">
                    Tổng tạm tính
                  </span>
                  <span className="text-2xl font-extrabold text-rose-500">
                    {formatPrice(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4">
              <button
                disabled={selectedSeatIds.length === 0 || isHolding}
                onClick={handleProceedHold}
                className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-white text-base shadow-xl shadow-rose-900/40 transition-all flex items-center justify-center gap-2"
              >
                {isHolding ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang giữ chỗ...
                  </>
                ) : (
                  <>Tiến hành giữ chỗ & Đặt vé</>
                )}
              </button>
              <p className="text-[11px] text-center text-slate-500 mt-2">
                Hệ thống sẽ giữ chỗ cho bạn trong vòng 05:00 phút để thanh toán
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
