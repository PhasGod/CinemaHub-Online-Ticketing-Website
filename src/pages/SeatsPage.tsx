import React, { useState, useEffect, useMemo } from "react"
import {
  ArrowRight,
  Check,
  Clock3,
  MapPin,
  MonitorPlay,
  Loader2,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Plus,
  Minus,
  Film,
  Ticket,
} from "lucide-react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { getShowtimeSeats, holdSeats, getShowtimes } from "../services/bookingApi"
import { ShowtimeDetail, ShowtimeSeatItem } from "../types/booking"
import { useAuth } from "../context/AuthContext"
import { AuthModal } from "../components/AuthModal"
import { BookingHeaderStepper } from "../components/BookingHeaderStepper"
import { POPULAR_COMBOS, ComboItem, SelectedComboItem } from "../data/comboData"

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShowtimeSelection = {
  movie: string
  cinema: string
  date: string
  time: string
  format: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cn = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(" ")

const MOVIE_THUMBNAIL = "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg"

// ─── Legacy BookingSteps (giữ lại hỗ trợ tương thích nếu cần) ─────────────────

export function BookingSteps({ current }: { current: number }) {
  const steps = [
    "Cụm rạp",
    "Phim",
    "Suất chiếu",
    "Ghế & Bắp nước",
    "Thanh toán",
  ]
  return (
    <div className="booking-steps">
      {steps.map((step, index) => (
        <div
          key={step}
          className={cn(
            index + 1 <= current && "complete",
            index + 1 === current && "current",
          )}
        >
          <span>{index + 1 < current ? <Check size={14} /> : index + 1}</span>
          <b>{step}</b>
          {index < steps.length - 1 && <i />}
        </div>
      ))}
    </div>
  )
}

// ─── BookingSummary (Sidebar tóm tắt đơn hàng) ────────────────────────────────

function BookingSummary({
  selectedSeats,
  selectedCombos,
  ticketTotal,
  comboTotal,
  grandTotal,
  onContinue,
  showtime,
  isHolding,
  holdCountdown,
  holdError,
}: {
  selectedSeats: ShowtimeSeatItem[]
  selectedCombos: SelectedComboItem[]
  ticketTotal: number
  comboTotal: number
  grandTotal: number
  onContinue: () => void
  showtime: ShowtimeDetail | null
  isHolding: boolean
  holdCountdown?: number
  holdError?: string | null
}) {
  const formatTime = (iso?: string) => {
    if (!iso) return "--:--"
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (iso?: string) => {
    if (!iso) return "--/--"
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  return (
    <aside className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sticky top-24">
      {/* Movie info banner */}
      <div className="flex gap-3.5 p-4 bg-slate-900 text-white">
        <img
          src={showtime?.moviePoster || MOVIE_THUMBNAIL}
          alt={showtime?.movieTitle || "Phim"}
          className="w-16 h-24 rounded-xl object-cover shrink-0 shadow-md border border-white/10"
        />
        <div className="min-w-0 flex flex-col justify-center">
          <span className="text-[11px] font-bold text-rose-400 uppercase tracking-wider">
            {showtime?.format || "2D Digital"}
          </span>
          <h3 className="text-sm font-bold text-white line-clamp-2 mt-0.5 leading-snug">
            {showtime?.movieTitle || "Đang tải tên phim..."}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-white/15 text-[10px] font-bold text-white">
              T16
            </span>
            <span>Tiêu chuẩn rạp chiếu</span>
          </p>
        </div>
      </div>

      {/* Showtime Details */}
      <div className="p-4 space-y-2.5 text-xs border-b border-slate-100">
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-400">Rạp chiếu</span>
          <b className="text-slate-800 font-semibold text-right">
            {showtime?.cinemaName || "5TOP CINEMA"}
          </b>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-400">Phòng chiếu</span>
          <b className="text-slate-800 font-semibold">{showtime?.roomName || "Phòng chiếu"}</b>
        </div>
        <div className="flex justify-between items-center text-slate-600">
          <span className="text-slate-400">Suất chiếu</span>
          <b className="text-slate-800 font-semibold">
            {formatTime(showtime?.startTime)} · {formatDate(showtime?.startTime)}
          </b>
        </div>
      </div>

      {/* Chi tiết Ghế đã chọn */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Ticket size={14} className="text-rose-500" />
            Ghế đã chọn ({selectedSeats.length})
          </span>
          <span className="text-xs font-bold text-rose-600">
            {ticketTotal.toLocaleString("vi-VN")}đ
          </span>
        </div>

        {selectedSeats.length === 0 ? (
          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-[11px] leading-relaxed">
            Vui lòng chọn ít nhất 1 ghế trên sơ đồ để tiếp tục đặt vé.
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {selectedSeats.map((seat) => (
              <span
                key={seat.id}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold ${
                  seat.type === "vip"
                    ? "bg-amber-100 border border-amber-300 text-amber-900"
                    : "bg-slate-100 border border-slate-200 text-slate-800"
                }`}
              >
                <span>{seat.row}{seat.number}</span>
                <span className="text-[10px] opacity-70">
                  ({seat.type === "vip" ? "VIP" : "Thường"})
                </span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Chi tiết Combo bắp nước đã chọn */}
      <div className="p-4 border-b border-slate-100">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <ShoppingBag size={14} className="text-rose-500" />
            Bắp nước đã chọn ({selectedCombos.reduce((s, c) => s + c.quantity, 0)})
          </span>
          <span className="text-xs font-bold text-rose-600">
            {comboTotal.toLocaleString("vi-VN")}đ
          </span>
        </div>

        {selectedCombos.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            Chưa chọn bắp nước (bạn có thể chọn thêm combo bên dưới).
          </p>
        ) : (
          <div className="space-y-1.5 max-h-28 overflow-y-auto text-xs">
            {selectedCombos.map((combo) => (
              <div
                key={combo.id}
                className="flex items-center justify-between text-slate-700 bg-slate-50 px-2 py-1.5 rounded-lg"
              >
                <span className="truncate pr-2 font-medium">
                  {combo.name} <strong className="text-rose-600">x{combo.quantity}</strong>
                </span>
                <span className="font-semibold shrink-0">
                  {(combo.price * combo.quantity).toLocaleString("vi-VN")}đ
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tạm tính & Tổng cộng */}
      <div className="p-4 bg-slate-50/80 space-y-2 border-b border-slate-200">
        <div className="flex justify-between items-center text-xs text-slate-600">
          <span>Tiền vé xem phim:</span>
          <span className="font-semibold text-slate-800">
            {ticketTotal.toLocaleString("vi-VN")}đ
          </span>
        </div>
        <div className="flex justify-between items-center text-xs text-slate-600">
          <span>Tiền combo bắp nước:</span>
          <span className="font-semibold text-slate-800">
            {comboTotal.toLocaleString("vi-VN")}đ
          </span>
        </div>
        <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 text-slate-900">
          <div>
            <span className="text-xs font-bold block text-slate-900 uppercase tracking-wide">
              Tổng cộng
            </span>
            <span className="text-[10px] text-slate-500">Đã bao gồm thuế GTGT</span>
          </div>
          <span className="text-xl font-extrabold text-rose-600">
            {grandTotal.toLocaleString("vi-VN")}đ
          </span>
        </div>
      </div>

      {/* Nút tiếp tục & Ghi chú */}
      <div className="p-4 space-y-3">
        {holdError && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2 shadow-2xs">
            <AlertCircle size={15} className="shrink-0 text-rose-500 mt-0.5" />
            <span className="leading-snug">{holdError}</span>
          </div>
        )}

        <button
          type="button"
          disabled={!selectedSeats.length || isHolding}
          onClick={onContinue}
          className="w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isHolding ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              <span>Đang giữ ghế...</span>
            </>
          ) : selectedSeats.length ? (
            <>
              <span>Tiếp tục sang Thanh toán</span>
              <ArrowRight size={18} />
            </>
          ) : (
            <span>Vui lòng chọn ghế</span>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <Clock3 size={13} className="text-slate-400" />
          {holdCountdown !== undefined && holdCountdown > 0
            ? `Thời gian giữ ghế còn: ${formatCountdown(holdCountdown)}`
            : "Ghế được giữ chỗ trong 05:00 phút sau khi bấm tiếp tục"}
        </p>
      </div>
    </aside>
  )
}

// ─── SeatLegend (Bảng chú giải các loại ghế) ──────────────────────────────────

function SeatLegend() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-6 pt-5 border-t border-slate-200 text-xs text-slate-600">
      <span className="flex items-center gap-2">
        <i className="seat inline-block" /> Ghế thường
      </span>
      <span className="flex items-center gap-2">
        <i className="seat vip inline-block" /> Ghế VIP
      </span>
      <span className="flex items-center gap-2">
        <i className="seat couple inline-block" /> Ghế Đôi / Couple
      </span>
      <span className="flex items-center gap-2">
        <i className="seat selected inline-block" /> Đang chọn
      </span>
      <span className="flex items-center gap-2">
        <i className="seat booked inline-block" /> Đã đặt / Đang giữ
      </span>
    </div>
  )
}

// ─── SeatMap (Sơ đồ phòng chiếu và ghế ngồi) ──────────────────────────────────

function SeatMap({
  rows,
  seatsByRow,
  selectedSeatIds,
  onToggle,
}: {
  rows: string[]
  seatsByRow: Record<string, ShowtimeSeatItem[]>
  selectedSeatIds: string[]
  onToggle: (seat: ShowtimeSeatItem) => void
}) {
  return (
    <div className="seat-panel">
      {/* Màn hình cong giả lập */}
      <div className="screen">
        <span>MÀN HÌNH CHIẾU PHIM</span>
        <div />
      </div>

      {/* Ma trận các hàng ghế */}
      <div className="seat-map">
        {rows.map((row) => (
          <div className="seat-row" key={row}>
            <span className="row-label font-bold text-slate-400">{row}</span>
            {seatsByRow[row]?.map((seat) => {
              const isSelected = selectedSeatIds.includes(seat.id)
              const isBooked = seat.status === "BOOKED"
              const isHeld = seat.status === "HELD" && !seat.isHeldByMe
              const isVip = seat.type === "vip"
              const isCouple =
                seat.type === ("couple" as any) ||
                (rows.length >= 4 && row === rows[rows.length - 1] && !isVip)

              const seatTypeLabel = isCouple ? "Đôi/Couple" : isVip ? "VIP" : "Thường"

              return (
                <button
                  key={seat.id}
                  disabled={isBooked || isHeld}
                  aria-label={`Ghế ${seat.row}${seat.number} (${seatTypeLabel})`}
                  onClick={() => onToggle(seat)}
                  className={cn(
                    "seat",
                    isVip && "vip",
                    isCouple && "couple",
                    (isBooked || isHeld) && "booked",
                    isSelected && "selected",
                  )}
                  title={`Ghế ${seat.row}${seat.number} (${seatTypeLabel}) - ${seat.price.toLocaleString("vi-VN")}đ`}
                >
                  {seat.number}
                </button>
              )
            })}
            <span className="row-label font-bold text-slate-400">{row}</span>
          </div>
        ))}
      </div>

      {/* Bảng chú giải */}
      <SeatLegend />
    </div>
  )
}

// ─── ComboSelectionSection (Phần chọn Bắp Nước / F&B Combo) ───────────────────

function ComboSelectionSection({
  combos,
  comboQuantities,
  onUpdateQuantity,
  comboTotal,
}: {
  combos: ComboItem[]
  comboQuantities: Record<string, number>
  onUpdateQuantity: (comboId: string, delta: number) => void
  comboTotal: number
}) {
  const totalCount = Object.values(comboQuantities).reduce((sum, q) => sum + q, 0)

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={15} /> Combo Bắp Nước Ưu Đãi
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Chọn Bắp Nước / Combo Kèm Theo
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Tiết kiệm tới 20.000đ khi đặt combo bắp nước online, nhận trực tiếp tại quầy Fast & Food trước giờ chiếu.
          </p>
        </div>

        {totalCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold self-start sm:self-center">
            <span>Đã chọn {totalCount} món</span>
            <span className="text-rose-300">|</span>
            <span className="text-rose-600 font-extrabold">
              {comboTotal.toLocaleString("vi-VN")}đ
            </span>
          </div>
        )}
      </div>

      {/* Grid danh sách các combo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {combos.map((combo) => {
          const qty = comboQuantities[combo.id] || 0
          const isSelected = qty > 0

          return (
            <div
              key={combo.id}
              className={`flex flex-col sm:flex-row gap-4 p-4 rounded-2xl border transition-all h-full justify-between shadow-sm ${
                isSelected
                  ? "bg-rose-50/40 border-rose-400 ring-2 ring-rose-100 shadow-xs"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs"
              }`}
            >
              {/* Hình ảnh combo: Cố định kích thước & tỷ lệ vuông, object-cover */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 min-w-[6rem] sm:min-w-[7rem] aspect-square rounded-xl overflow-hidden bg-slate-100 shrink-0 self-start sm:self-center">
                <img
                  src={combo.image}
                  alt={combo.name}
                  className="w-full h-full object-cover object-center"
                />
                {combo.tag && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-rose-600 text-white shadow-xs">
                    {combo.tag}
                  </span>
                )}
              </div>

              {/* Thông tin combo & Nút tăng giảm */}
              <div className="flex flex-col justify-between flex-1 min-w-0 h-full">
                <div className="flex-1 flex flex-col mb-2">
                  <h3
                    className="font-bold text-sm text-slate-900 leading-tight mb-1 truncate"
                    title={combo.name}
                  >
                    {combo.name}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed flex-1">
                    {combo.description}
                  </p>
                </div>

                {/* Cụm Giá tiền & Nút tăng giảm luôn căn thẳng đáy */}
                <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-sm font-extrabold text-rose-600">
                        {combo.price.toLocaleString("vi-VN")}đ
                      </span>
                      {combo.originalPrice > combo.price && (
                        <span className="text-[11px] text-slate-400 line-through">
                          {combo.originalPrice.toLocaleString("vi-VN")}đ
                        </span>
                      )}
                    </div>
                    {combo.originalPrice > combo.price && (
                      <span className="text-[10px] text-emerald-600 font-semibold block leading-tight">
                        Tiết kiệm {(combo.originalPrice - combo.price).toLocaleString("vi-VN")}đ
                      </span>
                    )}
                  </div>

                  {/* Bộ điều khiển số lượng */}
                  <div className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0">
                    <button
                      type="button"
                      disabled={qty === 0}
                      onClick={() => onUpdateQuantity(combo.id, -1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-white hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                      aria-label={`Giảm số lượng ${combo.name}`}
                    >
                      <Minus size={13} strokeWidth={2.5} />
                    </button>
                    <span className="w-6 text-center text-xs font-bold text-slate-900 select-none">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQuantity(combo.id, 1)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-2xs transition cursor-pointer"
                      aria-label={`Tăng số lượng ${combo.name}`}
                    >
                      <Plus size={13} strokeWidth={2.5} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── SeatsPage (default export) ───────────────────────────────────────────────

export default function SeatsPage({ showtime: initialShowtime }: { showtime?: ShowtimeSelection }) {
  const navigate = useNavigate()
  const { showtimeId: routeShowtimeId } = useParams<{ showtimeId: string }>()
  const { user } = useAuth()

  const [activeShowtimeId, setActiveShowtimeId] = useState<string | null>(routeShowtimeId || null)
  const [showtimeDetail, setShowtimeDetail] = useState<ShowtimeDetail | null>(null)
  const [seats, setSeats] = useState<ShowtimeSeatItem[]>([])
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isHolding, setIsHolding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [holdError, setHoldError] = useState<string | null>(null)
  const [isConflictError, setIsConflictError] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Hold Countdown timer if seats are currently held
  const [holdCountdown, setHoldCountdown] = useState<number | undefined>(undefined)

  // F&B Combo state
  const [comboQuantities, setComboQuantities] = useState<Record<string, number>>({})

  const handleUpdateComboQuantity = (comboId: string, delta: number) => {
    setComboQuantities((prev) => {
      const current = prev[comboId] || 0
      const next = Math.max(0, Math.min(10, current + delta))
      if (next === 0) {
        const copy = { ...prev }
        delete copy[comboId]
        return copy
      }
      return { ...prev, [comboId]: next }
    })
  }

  // Nếu truy cập /seats không có showtimeId, tự động tìm suất chiếu đầu tiên khả dụng
  useEffect(() => {
    if (routeShowtimeId === "success") {
      navigate("/booking/success", { replace: true })
      return
    }

    if (!routeShowtimeId) {
      getShowtimes()
        .then((res) => {
          if (res.showtimes && res.showtimes.length > 0) {
            setActiveShowtimeId(res.showtimes[0].id)
          } else {
            setError("Hiện chưa có suất chiếu nào mở bán vé.")
            setIsLoading(false)
          }
        })
        .catch((err) => {
          setError(err.message || "Không thể tải danh sách suất chiếu")
          setIsLoading(false)
        })
    } else {
      setActiveShowtimeId(routeShowtimeId)
    }
  }, [routeShowtimeId, navigate])

  // Fetch hoặc làm mới sơ đồ ghế từ API GET /api/showtimes/:id/seats
  const fetchSeatMap = async (id?: string, showInitialLoader = false) => {
    const targetId = id || activeShowtimeId
    if (!targetId) return null

    if (showInitialLoader) {
      setIsLoading(true)
      setError(null)
    } else {
      setIsRefreshing(true)
    }

    try {
      const res = await getShowtimeSeats(targetId)
      const latestSeats = res.seats || []
      setShowtimeDetail(res.showtime || null)
      setSeats(latestSeats)

      // Tự động kiểm tra và loại bỏ các ghế không còn khả dụng khỏi danh sách đang chọn
      setSelectedSeatIds((prevSelected) => {
        if (!prevSelected.length) return prevSelected
        const stillAvailable = prevSelected.filter((seatId) => {
          const seat = latestSeats.find((s) => s.id === seatId)
          return seat && (seat.status === "AVAILABLE" || seat.isHeldByMe)
        })
        return stillAvailable
      })

      return latestSeats
    } catch (err: any) {
      console.error("Fetch seats error:", err)
      if (showInitialLoader) {
        setError(err.message || "Không thể tải sơ đồ ghế của suất chiếu này")
      }
      return null
    } finally {
      if (showInitialLoader) {
        setIsLoading(false)
      } else {
        setIsRefreshing(false)
      }
    }
  }

  useEffect(() => {
    if (activeShowtimeId) {
      fetchSeatMap(activeShowtimeId, true)
    }
  }, [activeShowtimeId])

  // Countdown timer effect
  useEffect(() => {
    if (holdCountdown === undefined || holdCountdown <= 0) return

    const timer = setInterval(() => {
      setHoldCountdown((prev) => {
        if (prev === undefined || prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [holdCountdown])

  const toggle = (seat: ShowtimeSeatItem) => {
    if (seat.status === "BOOKED" || (seat.status === "HELD" && !seat.isHeldByMe)) {
      return
    }

    // Tự động xóa thông báo lỗi khi người dùng bắt đầu chọn lại ghế
    if (holdError) {
      setHoldError(null)
      setIsConflictError(false)
    }

    setSelectedSeatIds((prev) => {
      if (prev.includes(seat.id)) {
        return prev.filter((id) => id !== seat.id)
      } else {
        if (prev.length >= 8) {
          alert("Bạn chỉ có thể chọn tối đa 8 ghế trong một lần đặt.")
          return prev
        }
        return [...prev, seat.id]
      }
    })
  }

  const selectedSeats = seats.filter((s) => selectedSeatIds.includes(s.id))

  // Tính toán F&B Combos đã chọn
  const selectedCombos = useMemo<SelectedComboItem[]>(() => {
    return POPULAR_COMBOS.filter((c) => (comboQuantities[c.id] || 0) > 0).map((c) => ({
      ...c,
      quantity: comboQuantities[c.id],
    }))
  }, [comboQuantities])

  // Tính tiền vé & tiền combo
  const ticketTotal = useMemo(() => {
    return selectedSeats.reduce((sum, s) => sum + s.price, 0)
  }, [selectedSeats])

  const comboTotal = useMemo(() => {
    return selectedCombos.reduce((sum, c) => sum + c.price * c.quantity, 0)
  }, [selectedCombos])

  const grandTotal = ticketTotal + comboTotal

  const handleContinue = async () => {
    if (!selectedSeatIds.length || !activeShowtimeId) return

    if (!user) {
      setAuthModalOpen(true)
      return
    }

    setIsHolding(true)
    setHoldError(null)
    setIsConflictError(false)

    try {
      const result = await holdSeats(activeShowtimeId, selectedSeatIds)
      setHoldCountdown(result.expiresInSeconds || 300)

      // Chuyển sang Bước 5: Thanh toán (/booking/checkout/:bookingId) kèm toàn bộ dữ liệu ghế & combo
      navigate(`/booking/checkout/${result.bookingId}`, {
        state: {
          showtime: showtimeDetail,
          heldSeats: selectedSeats,
          holdResult: result,
          selectedCombos,
          ticketTotal,
          comboTotal,
          grandTotal,
        },
      })
    } catch (err: any) {
      console.error("Hold seats error:", err)

      const isConflict =
        err.status === 409 ||
        err.data?.error?.includes("người khác") ||
        err.message?.includes("người khác") ||
        err.message?.includes("tranh chấp")

      setIsConflictError(isConflict)

      // Tự động làm mới sơ đồ ghế để cập nhật trạng thái mới nhất
      if (activeShowtimeId) {
        await fetchSeatMap(activeShowtimeId, false)
      }

      let friendlyMessage = err.message || "Không thể giữ ghế. Vui lòng thử lại."
      if (isConflict) {
        friendlyMessage =
          "Một số ghế bạn vừa chọn đã có người khác giữ chỗ hoặc đặt mua. Sơ đồ ghế đã được tự động làm mới, vui lòng chọn lại ghế trống."
      } else if (err.status === 400) {
        friendlyMessage = `Dữ liệu chọn ghế không hợp lệ: ${err.message}`
      }

      setHoldError(friendlyMessage)
    } finally {
      setIsHolding(false)
    }
  }

  // Group seats by row
  const rows = Array.from(new Set(seats.map((s) => s.row))).sort()
  const seatsByRow = rows.reduce<Record<string, ShowtimeSeatItem[]>>((acc, row) => {
    acc[row] = seats.filter((s) => s.row === row).sort((a, b) => a.number - b.number)
    return acc
  }, {})

  const formatDisplayTime = (iso?: string) => {
    if (!iso) return initialShowtime?.time || "19:30"
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatDisplayDate = (iso?: string) => {
    if (!iso) return initialShowtime?.date || "28/09"
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 pt-24 pb-20">
        <section className="container max-w-7xl mx-auto px-4 py-24 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-rose-600 mx-auto mb-4" />
          <p className="text-sm font-semibold text-slate-500">
            Đang tải sơ đồ ghế và thông tin suất chiếu...
          </p>
        </section>
      </main>
    )
  }

  if (error && !showtimeDetail) {
    return (
      <main className="min-h-screen bg-slate-50 text-slate-800 pt-24 pb-20">
        <section className="container max-w-lg mx-auto px-4 py-20 text-center">
          <div className="bg-white border border-rose-200 rounded-3xl p-8 shadow-sm">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Đã xảy ra lỗi</h2>
            <p className="text-sm text-slate-600 mb-6">{error}</p>
            <div className="flex justify-center gap-3">
              <Link
                to="/showtimes"
                className="py-2.5 px-5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition"
              >
                Chọn suất chiếu khác
              </Link>
            </div>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 pt-24 pb-20">
      <div className="container max-w-7xl mx-auto px-4">
        {/* 1. THANH STEPPER 5 BƯỚC CHUẨN HÓA (Đang ở BƯỚC 4) */}
        <BookingHeaderStepper
          currentStep={4}
          selectedCinemaName={showtimeDetail?.cinemaName}
          selectedMovieTitle={showtimeDetail?.movieTitle}
          selectedShowtimeInfo={
            showtimeDetail?.startTime
              ? `${formatDisplayTime(showtimeDetail.startTime)} · ${formatDisplayDate(showtimeDetail.startTime)}`
              : undefined
          }
          selectedSeatsSummary={
            selectedSeats.length > 0
              ? `${selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")} (${selectedSeats.length} ghế)`
              : undefined
          }
          onStepClick={(step) => {
            if (step <= 3) {
              navigate(
                `/showtimes?cinemaId=${showtimeDetail?.cinemaId || ""}&movieId=${showtimeDetail?.movieId || ""}`,
              )
            }
          }}
        />

        {/* 2. Tiêu đề trang & Nút làm mới */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
              BƯỚC 4 / 5: CHỌN GHẾ NGỒI & BẮP NƯỚC
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Chọn Ghế Ngồi & Bắp Nước Ưu Đãi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 flex flex-wrap items-center gap-2">
              <span className="font-semibold text-slate-700">
                {showtimeDetail?.cinemaName || initialShowtime?.cinema || "5TOP CINEMA"}
              </span>
              <span>·</span>
              <span>{showtimeDetail?.roomName || "Phòng chiếu"}</span>
              <span>·</span>
              <span className="font-semibold text-rose-600">
                {showtimeDetail?.format || initialShowtime?.format || "2D Digital"}
              </span>
              <span>·</span>
              <span>
                {formatDisplayDate(showtimeDetail?.startTime)} lúc {formatDisplayTime(showtimeDetail?.startTime)}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchSeatMap(activeShowtimeId || undefined, false)}
            disabled={isRefreshing || !activeShowtimeId}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-all disabled:opacity-60 cursor-pointer self-start sm:self-auto"
            title="Làm mới sơ đồ ghế để xem tình trạng mới nhất"
          >
            <RefreshCw
              size={13}
              className={cn("text-rose-600 transition-transform", isRefreshing && "animate-spin")}
            />
            <span>{isRefreshing ? "Đang cập nhật..." : "Làm mới sơ đồ ghế"}</span>
          </button>
        </div>

        {/* Thông báo lỗi tranh chấp giữ ghế nếu có */}
        {holdError && (
          <div
            className={cn(
              "mb-6 p-4 rounded-2xl border flex items-start justify-between gap-3 shadow-xs transition-all",
              isConflictError
                ? "bg-amber-50 border-amber-300 text-amber-950"
                : "bg-rose-50 border-rose-300 text-rose-950",
            )}
            role="alert"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "p-2 rounded-xl shrink-0 mt-0.5",
                  isConflictError ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700",
                )}
              >
                {isConflictError ? <AlertTriangle size={20} /> : <AlertCircle size={20} />}
              </div>
              <div>
                <h4 className="font-bold text-sm mb-1">
                  {isConflictError
                    ? "Ghế vừa có người khác giữ chỗ (409 Conflict)"
                    : "Không thể giữ ghế"}
                </h4>
                <p className="text-xs leading-relaxed opacity-90">{holdError}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => fetchSeatMap(activeShowtimeId || undefined, false)}
                disabled={isRefreshing}
                className={cn(
                  "text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors cursor-pointer",
                  isConflictError
                    ? "border-amber-300 hover:bg-amber-100/70 text-amber-900 bg-white"
                    : "border-rose-300 hover:bg-rose-100/70 text-rose-900 bg-white",
                )}
                title="Làm mới lại sơ đồ ghế"
              >
                <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
                Làm mới
              </button>
              <button
                type="button"
                onClick={() => setHoldError(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                aria-label="Đóng thông báo"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* 3. BỐ CỤC CHÍNH BƯỚC 4: 2 CỘT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* CỘT TRÁI (8/12 cols): Sơ đồ chọn ghế + Chọn Bắp Nước Combo */}
          <div className="lg:col-span-8 space-y-6">
            {/* PHẦN 1: Sơ đồ chọn ghế ngồi */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Sơ đồ ghế phòng chiếu {showtimeDetail?.roomName || ""}
                  </h2>
                </div>
                <span className="text-xs font-semibold text-slate-500">
                  Tối đa 8 ghế / lần đặt
                </span>
              </div>

              <SeatMap
                rows={rows}
                seatsByRow={seatsByRow}
                selectedSeatIds={selectedSeatIds}
                onToggle={toggle}
              />

              {/* Dải thông báo ghế đang chọn thời gian thực */}
              {selectedSeats.length > 0 && (
                <div className="mt-5 p-3.5 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-rose-950">Ghế bạn đang chọn:</span>
                    {selectedSeats.map((s) => (
                      <span
                        key={s.id}
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] shadow-2xs ${
                          s.type === "vip"
                            ? "bg-amber-500 text-white"
                            : "bg-rose-600 text-white"
                        }`}
                      >
                        {s.row}{s.number} ({s.type === "vip" ? "VIP" : "Thường"})
                      </span>
                    ))}
                  </div>
                  <div className="font-bold text-slate-800">
                    Tạm tính tiền vé:{" "}
                    <span className="text-rose-600 font-extrabold text-sm">
                      {ticketTotal.toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* PHẦN 2: Khu vực Chọn Bắp Nước / Combo */}
            <ComboSelectionSection
              combos={POPULAR_COMBOS}
              comboQuantities={comboQuantities}
              onUpdateQuantity={handleUpdateComboQuantity}
              comboTotal={comboTotal}
            />
          </div>

          {/* CỘT PHẢI (4/12 cols): Booking Summary / Tóm tắt đơn hàng */}
          <div className="lg:col-span-4">
            <BookingSummary
              selectedSeats={selectedSeats}
              selectedCombos={selectedCombos}
              ticketTotal={ticketTotal}
              comboTotal={comboTotal}
              grandTotal={grandTotal}
              onContinue={handleContinue}
              showtime={showtimeDetail}
              isHolding={isHolding}
              holdCountdown={holdCountdown}
              holdError={holdError}
            />
          </div>
        </div>
      </div>

      {authModalOpen && (
        <AuthModal
          message="Vui lòng đăng nhập để tiếp tục giữ ghế và chuyển sang bước thanh toán."
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={() => {
            setAuthModalOpen(false)
            handleContinue()
          }}
        />
      )}
    </main>
  )
}
