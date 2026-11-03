import React, { useState, useEffect, useMemo } from "react"
import {
  ArrowLeft,
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
  CircleUserRound,
  Phone,
  Mail,
  Tag,
  ChevronRight,
  RotateCcw,
  Building2,
  Calendar,
  ShieldAlert,
} from "lucide-react"
import { useNavigate, useParams, Link } from "react-router-dom"
import { getShowtimeSeats, holdSeats, getShowtimes } from "../services/bookingApi"
import { ShowtimeDetail, ShowtimeSeatItem, HoldSeatsResult } from "../types/booking"
import { useAuth } from "../context/AuthContext"
import { AuthModal } from "../components/AuthModal"
import { BookingHeaderStepper } from "../components/BookingHeaderStepper"
import { POPULAR_COMBOS, ComboItem, SelectedComboItem } from "../data/comboData"
import { verifyVoucher } from "../services/promotion.service"
import { VoucherApplyResult } from "../types/promotion"

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

const formatCountdown = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
}

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

// ─── ComboSelectionSection (Phần chọn Bắp Nước / F&B Combo theo phong cách chuẩn) ───

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
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 uppercase tracking-wide">
              Combo Ưu Đãi
            </h2>
            <p className="text-xs text-slate-500">
              Nhận trực tiếp tại quầy Fast & Food trước giờ chiếu.
            </p>
          </div>
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

      {/* Header bảng (cho desktop) */}
      <div className="hidden sm:grid sm:grid-cols-12 gap-4 pb-2.5 mb-2 border-b border-slate-100 text-xs font-bold text-slate-600 uppercase tracking-wider">
        <div className="sm:col-span-5">Tên Combo</div>
        <div className="sm:col-span-4">Mô tả</div>
        <div className="sm:col-span-3 text-center">Số lượng</div>
      </div>

      {/* Danh sách các Combo */}
      <div className="divide-y divide-slate-100">
        {combos.map((combo) => {
          const qty = comboQuantities[combo.id] || 0
          const isSelected = qty > 0

          return (
            <div
              key={combo.id}
              className={`py-4 flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-center transition-colors ${
                isSelected ? "bg-rose-50/20" : ""
              }`}
            >
              {/* Cột 1: Tên Combo & Hình ảnh tròn */}
              <div className="sm:col-span-5 flex items-center gap-3.5 w-full">
                <div className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-xs ring-2 ring-rose-100">
                  <img
                    src={combo.image}
                    alt={combo.name}
                    className="w-full h-full object-cover object-center"
                  />
                  {combo.tag && (
                    <span className="absolute bottom-0 inset-x-0 bg-rose-600 text-white text-[9px] font-extrabold text-center py-0.5 leading-none">
                      {combo.tag}
                    </span>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm text-slate-900 leading-tight">
                    {combo.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-sm font-extrabold text-rose-600">
                      {combo.price.toLocaleString("vi-VN")}đ
                    </span>
                    {combo.originalPrice > combo.price && (
                      <span className="text-[11px] text-slate-400 line-through">
                        {combo.originalPrice.toLocaleString("vi-VN")}đ
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Cột 2: Mô tả chi tiết */}
              <div className="sm:col-span-4 w-full">
                <p className="text-xs text-slate-600 leading-relaxed">
                  {combo.description}
                </p>
                {combo.originalPrice > combo.price && (
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                    Tiết kiệm {(combo.originalPrice - combo.price).toLocaleString("vi-VN")}đ
                  </span>
                )}
              </div>

              {/* Cột 3: Bộ điều khiển số lượng */}
              <div className="sm:col-span-3 flex justify-between sm:justify-center items-center w-full">
                <span className="sm:hidden text-xs font-semibold text-slate-500">
                  Số lượng:
                </span>
                <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1 shrink-0 shadow-2xs">
                  <button
                    type="button"
                    disabled={qty === 0}
                    onClick={() => onUpdateQuantity(combo.id, -1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-slate-600 hover:bg-white hover:text-rose-600 disabled:opacity-30 disabled:hover:bg-transparent transition cursor-pointer"
                    aria-label={`Giảm số lượng ${combo.name}`}
                  >
                    <Minus size={14} strokeWidth={2.5} />
                  </button>
                  <span className="w-7 text-center text-sm font-bold text-slate-900 select-none">
                    {qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQuantity(combo.id, 1)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white bg-[#005baa] hover:bg-[#004785] active:bg-[#003d73] shadow-xs transition cursor-pointer"
                    aria-label={`Tăng số lượng ${combo.name}`}
                  >
                    <Plus size={14} strokeWidth={2.5} />
                  </button>
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

  // Sub-step trong Bước 4:
  // 1 = Chọn Ghế Ngồi (Ẩn bắp nước)
  // 2 = Chọn Combo Bắp Nước, Voucher & Thông tin thanh toán (Ảnh 2)
  const [subStep, setSubStep] = useState<1 | 2>(1)

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

  // Lưu thông tin giữ ghế
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null)
  const [holdResult, setHoldResult] = useState<HoldSeatsResult | null>(null)

  // Hold Countdown timer if seats are currently held
  const [holdCountdown, setHoldCountdown] = useState<number | undefined>(undefined)

  // F&B Combo state
  const [comboQuantities, setComboQuantities] = useState<Record<string, number>>({})

  // Thông tin thanh toán / người nhận vé (lấy tự động từ tài khoản đăng nhập)
  const [customerName, setCustomerName] = useState(user?.fullName || "")
  const [customerPhone, setCustomerPhone] = useState(user?.phone || "")
  const [customerEmail, setCustomerEmail] = useState(user?.email || "")
  const [isEditingCustomer, setIsEditingCustomer] = useState(false)

  // Tự động đồng bộ thông tin tài khoản đăng nhập
  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.fullName || "")
      setCustomerPhone((prev) => prev || user.phone || "")
      setCustomerEmail((prev) => prev || user.email || "")
    }
  }, [user])

  // Voucher / Khuyến mãi state
  const [voucherCodeInput, setVoucherCodeInput] = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherApplyResult | null>(null)
  const [voucherMessage, setVoucherMessage] = useState<{
    type: "success" | "error" | "info"
    text: string
  } | null>(null)

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

  // Phân loại ghế thường và ghế VIP để hiển thị chi tiết ở Bước 4.2
  const standardSeats = selectedSeats.filter((s) => s.type === "standard")
  const vipSeats = selectedSeats.filter((s) => s.type === "vip")

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

  const rawTotalAmount = ticketTotal + comboTotal
  const discountAmount = appliedVoucher?.valid ? appliedVoucher.discountAmount : 0
  const grandTotal = Math.max(0, rawTotalAmount - discountAmount)

  // Áp dụng mã Voucher khuyến mãi
  const handleApplyVoucher = (codeToApply?: string) => {
    const code = (codeToApply || voucherCodeInput).trim()
    if (!code) {
      setVoucherMessage({ type: "error", text: "Vui lòng nhập mã khuyến mãi." })
      return
    }

    const res = verifyVoucher(code, rawTotalAmount)
    if (res.valid) {
      setAppliedVoucher(res)
      setVoucherMessage({
        type: "success",
        text: `Áp dụng thành công mã "${code}"! Tiết kiệm ${res.discountAmount.toLocaleString("vi-VN")}đ`,
      })
    } else {
      setVoucherMessage({ type: "error", text: res.message })
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCodeInput("")
    setVoucherMessage(null)
  }

  // Bước 4.1 -> Bước 4.2: Người dùng bắt buộc phải chọn xong ghế rồi bấm 'Tiếp tục' mới mở ra tab chọn Combo bắp nước & voucher
  const handleContinueToSubstep2 = async () => {
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
      setActiveBookingId(result.bookingId)
      setHoldResult(result)
      setHoldCountdown(result.expiresInSeconds || 300)
      setSubStep(2)
      window.scrollTo({ top: 120, behavior: "smooth" })
    } catch (err: any) {
      console.error("Hold seats error:", err)

      const isConflict =
        err.status === 409 ||
        err.data?.error?.includes("người khác") ||
        err.message?.includes("người khác") ||
        err.message?.includes("tranh chấp")

      setIsConflictError(isConflict)

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

  // Bước 4.2 -> Bước 5: Chuyển sang Bước 5 Thanh toán
  const handleProceedToCheckout = async () => {
    if (!selectedSeatIds.length) return

    if (!user) {
      setAuthModalOpen(true)
      return
    }

    let targetBookingId = activeBookingId
    let targetHoldResult = holdResult

    // Nếu chưa có bookingId, giữ ghế ngay bây giờ
    if (!targetBookingId && activeShowtimeId) {
      setIsHolding(true)
      try {
        const res = await holdSeats(activeShowtimeId, selectedSeatIds)
        targetBookingId = res.bookingId
        targetHoldResult = res
        setActiveBookingId(res.bookingId)
        setHoldResult(res)
      } catch (err: any) {
        setHoldError(err.message || "Không thể giữ ghế để thanh toán. Vui lòng thử lại.")
        setIsHolding(false)
        return
      }
      setIsHolding(false)
    }

    if (!targetBookingId) return

    navigate(`/booking/checkout/${targetBookingId}`, {
      state: {
        showtime: showtimeDetail,
        heldSeats: selectedSeats,
        holdResult: targetHoldResult,
        selectedCombos,
        ticketTotal,
        comboTotal,
        grandTotal,
        appliedVoucher,
        customerInfo: {
          fullName: customerName || user?.fullName || "Khách hàng",
          phone: customerPhone || user?.phone || "",
          email: customerEmail || user?.email || "",
        },
      },
    })
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
    <main className="min-h-screen bg-slate-50 text-slate-800 pt-24 pb-20 font-sans">
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

        {/* Thanh điều hướng 2 bước con (Sub-steps) trong Bước 4 */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 my-6 p-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xs max-w-lg mx-auto">
          <button
            type="button"
            onClick={() => setSubStep(1)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              subStep === 1
                ? "bg-[#005baa] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                subStep === 1 ? "bg-white text-[#005baa] font-black" : "bg-slate-200 text-slate-700"
              }`}
            >
              1
            </span>
            <span>Chọn Ghế Ngồi</span>
            {selectedSeats.length > 0 && (
              <span className="text-[11px] opacity-90 font-medium">({selectedSeats.length})</span>
            )}
          </button>

          <ChevronRight size={16} className="text-slate-300 shrink-0" />

          <button
            type="button"
            disabled={selectedSeats.length === 0}
            onClick={() => {
              if (selectedSeats.length > 0) {
                handleContinueToSubstep2()
              }
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              subStep === 2
                ? "bg-[#005baa] text-white shadow-xs"
                : selectedSeats.length === 0
                ? "text-slate-300 cursor-not-allowed"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
            }`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                subStep === 2 ? "bg-white text-[#005baa] font-black" : "bg-slate-200 text-slate-700"
              }`}
            >
              2
            </span>
            <span>Bắp Nước & Khuyến Mãi</span>
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

        {/* ============================================================== */}
        {/* SUB-STEP 1: CHỌN GHẾ NGỒI (ẨN HOÀN TOÀN BẮP NƯỚC Ở ĐÂY)         */}
        {/* ============================================================== */}
        {subStep === 1 && (
          <div className="space-y-6">
            {/* Tiêu đề trang & Nút làm mới sơ đồ */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
              <div>
                <span className="inline-block text-xs font-bold uppercase tracking-wider text-rose-600 mb-1">
                  BƯỚC 4.1: CHỌN GHẾ NGỒI THEO SƠ ĐỒ
                </span>
                <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  Chọn Ghế Ngồi Phòng Chiếu
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

            {/* Bố cục 2 cột Bước 4.1 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* CỘT TRÁI (8/12): Sơ đồ ghế ngồi */}
              <div className="lg:col-span-8 space-y-6">
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
              </div>

              {/* CỘT PHẢI (4/12): Booking Summary */}
              <div className="lg:col-span-4">
                <BookingSummary
                  selectedSeats={selectedSeats}
                  selectedCombos={selectedCombos}
                  ticketTotal={ticketTotal}
                  comboTotal={comboTotal}
                  grandTotal={grandTotal}
                  onContinue={handleContinueToSubstep2}
                  showtime={showtimeDetail}
                  isHolding={isHolding}
                  holdCountdown={holdCountdown}
                  holdError={holdError}
                />
              </div>
            </div>
          </div>
        )}

        {/* ============================================================== */}
        {/* SUB-STEP 2: BẮP NƯỚC, KHUYẾN MÃI & THÔNG TIN THANH TOÁN (ẢNH 2) */}
        {/* ============================================================== */}
        {subStep === 2 && (
          <div className="space-y-6">
            {/* Breadcrumb theo style ảnh mẫu */}
            <div className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <Link to="/" className="text-slate-800 hover:text-rose-600 font-bold transition">
                Trang chủ
              </Link>
              <span>&gt;</span>
              <span className="text-slate-600">Đặt vé</span>
              <span>&gt;</span>
              <span className="text-[#005baa] font-bold">
                {showtimeDetail?.movieTitle || "Chi tiết đơn đặt"}
              </span>
            </div>

            {/* Bố cục 2 cột Bước 4.2 */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* CỘT TRÁI (8/12 cols) */}
              <div className="lg:col-span-8 space-y-5">
                {/* 1. Cảnh báo quy định Cục Điện Ảnh */}
                <div className="bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl px-4 py-3 text-xs font-semibold text-center shadow-2xs flex items-center justify-center gap-2">
                  <ShieldAlert size={16} className="text-amber-600 shrink-0" />
                  <span>
                    Theo quy định của cục điện ảnh, phim này không dành cho khán giả dưới 16 tuổi.
                  </span>
                </div>

                {/* 2. Khối THÔNG TIN THANH TOÁN / NGƯỜI ĐẶT VÉ */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <CircleUserRound size={18} />
                      </div>
                      <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-800">
                        Thông Tin Thanh Toán
                      </h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditingCustomer(!isEditingCustomer)}
                      className="text-xs font-bold text-[#005baa] hover:underline cursor-pointer"
                    >
                      {isEditingCustomer ? "Hoàn tất" : "Chỉnh sửa"}
                    </button>
                  </div>

                  {isEditingCustomer ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Họ Tên:
                        </label>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Nhập họ tên"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#005baa]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Số điện thoại:
                        </label>
                        <input
                          type="tel"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          placeholder="Nhập số điện thoại"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#005baa]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">
                          Email:
                        </label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="Nhập email"
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#005baa]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Họ Tên:</span>
                        <strong className="text-slate-800 font-bold text-sm mt-0.5 block truncate">
                          {customerName || user?.fullName || "Khách hàng"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Số điện thoại:</span>
                        <strong className="text-slate-800 font-bold text-sm mt-0.5 block truncate">
                          {customerPhone || user?.phone || "Chưa cập nhật"}
                        </strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[11px] font-medium">Email:</span>
                        <strong className="text-slate-800 font-bold text-sm mt-0.5 block truncate">
                          {customerEmail || user?.email || "Chưa cập nhật"}
                        </strong>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Khối GHẾ ĐÃ CHỌN (Phân chia Ghế thường & Ghế VIP) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Ticket size={18} className="text-rose-600" />
                      <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-800">
                        Ghế Đã Chọn ({selectedSeats.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubStep(1)}
                      className="text-xs font-bold text-[#005baa] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw size={13} /> Đổi ghế khác
                    </button>
                  </div>

                  <div className="space-y-2 text-xs">
                    {standardSeats.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1 border-b border-slate-50">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 uppercase tracking-wide">
                            GHẾ THƯỜNG
                          </span>
                          <span className="text-slate-500 font-medium">
                            ({standardSeats.map((s) => `${s.row}${s.number}`).join(", ")})
                          </span>
                        </div>
                        <div className="font-semibold text-slate-700 sm:text-right">
                          {standardSeats.length} x {(standardSeats[0]?.price || 0).toLocaleString("vi-VN")}đ ={" "}
                          <strong className="text-slate-900 font-bold">
                            {standardSeats.reduce((sum, s) => sum + s.price, 0).toLocaleString("vi-VN")} vnđ
                          </strong>
                        </div>
                      </div>
                    )}

                    {vipSeats.length > 0 && (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 py-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-amber-800 uppercase tracking-wide">
                            GHẾ VIP
                          </span>
                          <span className="text-slate-500 font-medium">
                            ({vipSeats.map((s) => `${s.row}${s.number}`).join(", ")})
                          </span>
                        </div>
                        <div className="font-semibold text-slate-700 sm:text-right">
                          {vipSeats.length} x {(vipSeats[0]?.price || 0).toLocaleString("vi-VN")}đ ={" "}
                          <strong className="text-slate-900 font-bold">
                            {vipSeats.reduce((sum, s) => sum + s.price, 0).toLocaleString("vi-VN")} vnđ
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Khối COMBO BẮP NƯỚC ƯU ĐÃI (Dạng bảng danh sách ảnh 2) */}
                <ComboSelectionSection
                  combos={POPULAR_COMBOS}
                  comboQuantities={comboQuantities}
                  onUpdateQuantity={handleUpdateComboQuantity}
                  comboTotal={comboTotal}
                />

                {/* 5. Khối MÃ VOUCHER / KHUYẾN MÃI */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center gap-2">
                    <Tag size={18} className="text-[#005baa]" />
                    <h3 className="font-heading font-extrabold text-sm uppercase tracking-wider text-slate-800">
                      Mã Voucher / Khuyến Mãi
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={voucherCodeInput}
                      onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                      placeholder="Nhập mã ưu đãi (VD: FNB20, CINEMA10...)"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-800 focus:outline-none focus:border-[#005baa] focus:ring-1 focus:ring-[#005baa]"
                    />
                    <button
                      type="button"
                      onClick={() => handleApplyVoucher()}
                      className="px-5 py-2.5 rounded-xl bg-[#005baa] hover:bg-[#004785] text-white font-bold text-xs uppercase tracking-wider transition shadow-2xs cursor-pointer shrink-0"
                    >
                      Áp dụng
                    </button>
                  </div>

                  {/* Gợi ý mã nhanh */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span className="text-slate-400 font-medium">Gợi ý mã hot:</span>
                    {[
                      { code: "FNB20", desc: "Giảm 20K Combo" },
                      { code: "CINEMA10", desc: "Giảm 10% vé" },
                      { code: "5TOP2026", desc: "Ưu đãi thành viên" },
                    ].map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => {
                          setVoucherCodeInput(item.code)
                          handleApplyVoucher(item.code)
                        }}
                        className="px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#005baa] border border-sky-200 font-bold text-[11px] transition cursor-pointer"
                      >
                        {item.code} ({item.desc})
                      </button>
                    ))}
                  </div>

                  {voucherMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                        voucherMessage.type === "success"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-rose-50 text-rose-800 border border-rose-200"
                      }`}
                    >
                      <span>{voucherMessage.text}</span>
                      {appliedVoucher && (
                        <button
                          type="button"
                          onClick={handleRemoveVoucher}
                          className="text-xs text-rose-600 hover:underline font-bold cursor-pointer"
                        >
                          Hủy mã
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* CỘT PHẢI (4/12 cols): SIDEBAR TỔNG KẾT THEO PHONG CÁCH ẢNH 2 */}
              <div className="lg:col-span-4">
                <aside className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4 sticky top-24">
                  {/* Poster & Tên phim */}
                  <div className="flex gap-3.5">
                    <div className="relative w-20 h-28 rounded-xl overflow-hidden shadow-sm shrink-0 border border-slate-100 bg-slate-100">
                      <img
                        src={showtimeDetail?.moviePoster || MOVIE_THUMBNAIL}
                        alt={showtimeDetail?.movieTitle || "Phim"}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-amber-500 text-white font-extrabold text-[9px] shadow-xs">
                        T16
                      </span>
                    </div>

                    <div className="min-w-0 flex flex-col justify-center">
                      <h3 className="font-heading font-extrabold text-base text-slate-900 leading-snug line-clamp-2">
                        {showtimeDetail?.movieTitle || "Đang tải phim..."}
                      </h3>
                      <span className="text-xs text-rose-600 font-bold mt-1">
                        {showtimeDetail?.format || "2D Phụ đề"}
                      </span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Thể loại:</span>
                      <span className="font-medium text-slate-800 truncate max-w-[170px]">
                        Hành động, Phiêu lưu
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Thời lượng:</span>
                      <span className="font-medium text-slate-800">115 phút</span>
                    </div>
                  </div>

                  {/* Chi tiết Suất chiếu & Rạp (đường kẻ đứt) */}
                  <div className="space-y-2 text-xs pt-3 border-t border-dashed border-slate-200">
                    <div className="flex items-start justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                        <Building2 size={13} className="text-slate-400" /> Rạp chiếu:
                      </span>
                      <span className="font-bold text-slate-800 text-right">
                        {showtimeDetail?.cinemaName || "5TOP CINEMA"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Calendar size={13} className="text-slate-400" /> Ngày chiếu:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatDisplayDate(showtimeDetail?.startTime)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Clock3 size={13} className="text-slate-400" /> Giờ chiếu:
                      </span>
                      <span className="font-semibold text-slate-800">
                        {formatDisplayTime(showtimeDetail?.startTime)}
                      </span>
                    </div>
                    <div className="flex items-start justify-between">
                      <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                        <Ticket size={13} className="text-slate-400" /> Ghế ngồi:
                      </span>
                      <span className="font-bold text-rose-600 text-right">
                        {selectedSeats.map((s) => `${s.row}${s.number}`).join(", ")}
                      </span>
                    </div>
                  </div>

                  {/* Chi tiết combo đã chọn */}
                  {selectedCombos.length > 0 && (
                    <div className="pt-3 border-t border-dashed border-slate-200 text-xs space-y-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                        Combo đã chọn ({selectedCombos.reduce((s, c) => s + c.quantity, 0)}):
                      </span>
                      {selectedCombos.map((c) => (
                        <div key={c.id} className="flex justify-between items-center text-slate-700">
                          <span className="truncate pr-2 font-medium">
                            {c.name} x{c.quantity}
                          </span>
                          <span className="font-semibold shrink-0">
                            {(c.price * c.quantity).toLocaleString("vi-VN")}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tổng kết tài chính */}
                  <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Tiền vé xem phim:</span>
                      <span className="font-semibold text-slate-900">
                        {ticketTotal.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Tiền combo bắp nước:</span>
                      <span className="font-semibold text-slate-900">
                        {comboTotal.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                    {appliedVoucher && appliedVoucher.valid && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Giảm giá ({appliedVoucher.promotion?.code}):</span>
                        <span>-{appliedVoucher.discountAmount.toLocaleString("vi-VN")}đ</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2.5 border-t border-slate-200 text-slate-900">
                      <div>
                        <span className="font-extrabold text-xs block text-slate-900 uppercase">
                          Tổng cộng:
                        </span>
                        <span className="text-[10px] text-slate-400">Đã gồm thuế GTGT</span>
                      </div>
                      <span className="text-xl font-extrabold text-rose-600">
                        {grandTotal.toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  </div>

                  {/* 2 Nút hành động: QUAY LẠI & TIẾP TỤC */}
                  <div className="pt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setSubStep(1)}
                      className="flex-1 py-3 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition cursor-pointer text-center"
                    >
                      Quay Lại
                    </button>
                    <button
                      type="button"
                      onClick={handleProceedToCheckout}
                      disabled={isHolding}
                      className="flex-1 py-3 px-3 rounded-xl bg-[#005baa] hover:bg-[#004785] text-white font-bold text-xs uppercase tracking-wider transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer text-center disabled:opacity-50"
                    >
                      {isHolding ? (
                        <>
                          <Loader2 size={15} className="animate-spin" />
                          <span>Đang xử lý...</span>
                        </>
                      ) : (
                        <>
                          <span>Tiếp Tục</span>
                          <ArrowRight size={14} />
                        </>
                      )}
                    </button>
                  </div>

                  {/* Countdown giữ vé */}
                  <p className="text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
                    <Clock3 size={13} className="text-slate-400" />
                    {holdCountdown !== undefined && holdCountdown > 0
                      ? `Thời gian giữ vé: ${formatCountdown(holdCountdown)}`
                      : "Vé được giữ trong 05:00 phút sau khi chọn ghế"}
                  </p>
                </aside>
              </div>
            </div>
          </div>
        )}
      </div>

      {authModalOpen && (
        <AuthModal
          message="Vui lòng đăng nhập để tiếp tục chọn bắp nước và nhận ưu đãi khuyến mãi."
          onClose={() => setAuthModalOpen(false)}
          onAuthenticated={() => {
            setAuthModalOpen(false)
            handleContinueToSubstep2()
          }}
        />
      )}
    </main>
  )
}
