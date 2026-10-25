import React, { useState, useEffect } from "react"
import {
  ArrowLeft,
  Check,
  CreditCard,
  Download,
  MapPin,
  MonitorPlay,
  QrCode,
  Ticket,
  CalendarDays,
  Clock3,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { getMyTickets } from "../services/bookingApi"
import { TicketItem, BookingDetail, ShowtimeDetail } from "../types/booking"

// ─── Helpers ──────────────────────────────────────────────────────────────────

const cn = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(" ")

const MOVIE_THUMBNAIL = "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg"

// ─── BookingSteps (re-used from SeatsPage context) ───────────────────────────

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

// ─── Brand ───────────────────────────────────────────────────────────────────

export function Brand() {
  return (
    <Link to="/" className="brand" aria-label="5TOP CINEMA">
      <span className="brand-mark">
        <Ticket size={20} />
      </span>
      <span>
        5TOP <span className="brand-accent">CINEMA</span>
      </span>
    </Link>
  )
}

// ─── TicketDetailModal ────────────────────────────────────────────────────────

export function TicketDetailModal({
  ticket,
  onClose,
}: {
  ticket: TicketItem | null
  onClose: () => void
}) {
  const navigate = useNavigate()

  if (!ticket) return null

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

  const isUsed = ticket.status === "USED"
  const isCancelled = ticket.status === "CANCELLED"
  const isValid = ticket.status === "VALID"

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Ticket size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Chi tiết vé điện tử</h3>
              <p className="text-xs text-slate-500">Mã vé: {ticket.ticketCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Movie Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
              <span className="text-xs font-bold tracking-widest text-blue-400">
                5TOP CINEMA · E-TICKET
              </span>
              <span
                className={cn(
                  "text-xs px-2.5 py-0.5 rounded-full font-semibold border",
                  isValid && "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                  isUsed && "bg-slate-500/20 text-slate-300 border-slate-500/30",
                  isCancelled && "bg-rose-500/20 text-rose-400 border-rose-500/30",
                )}
              >
                {isValid ? "Hợp lệ / Đã thanh toán" : isUsed ? "Đã soát vé" : "Đã hủy"}
              </span>
            </div>
            <div className="flex gap-4">
              <img
                src={ticket.showtime?.movie?.poster || MOVIE_THUMBNAIL}
                alt={ticket.showtime?.movie?.title || "Phim"}
                className="w-20 h-28 object-cover rounded-xl shadow-md border border-slate-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/40 text-blue-300 border border-blue-500/30 mb-1.5">
                  {ticket.showtime?.movie?.format || "2D Digital"}
                </span>
                <h4 className="text-lg font-bold text-white leading-tight">
                  {ticket.showtime?.movie?.title || "Phim điện ảnh"}
                </h4>
                <p className="text-xs text-slate-300 mt-2 flex items-center gap-1.5">
                  <MapPin size={13} className="text-blue-400 shrink-0" />{" "}
                  {ticket.showtime?.room?.cinema?.name || "5TOP CINEMA"}
                </p>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                  <MonitorPlay size={13} className="text-blue-400 shrink-0" /> Phòng chiếu:{" "}
                  {ticket.showtime?.room?.name || "Phòng chiếu"}
                </p>
              </div>
            </div>
            {/* Ticket info row */}
            <div className="grid grid-cols-3 gap-2 text-center bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 mt-4">
              <div>
                <span className="block text-[11px] text-slate-400 mb-0.5">Ngày chiếu</span>
                <b className="text-sm font-semibold text-white">
                  {formatDate(ticket.showtime?.startTime)}
                </b>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 mb-0.5">Suất chiếu</span>
                <b className="text-sm font-semibold text-blue-300">
                  {formatTime(ticket.showtime?.startTime)}
                </b>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 mb-0.5">Ghế ngồi</span>
                <b className="text-sm font-bold text-amber-300">
                  {ticket.seat?.row}
                  {ticket.seat?.number}
                </b>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 mb-2">
              {ticket.qrCode ? (
                <img
                  src={ticket.qrCode}
                  alt={`QR ${ticket.ticketCode}`}
                  className="w-[130px] h-[130px] object-contain"
                />
              ) : (
                <QrCode size={130} className="text-slate-900" strokeWidth={1.4} />
              )}
            </div>
            <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mt-1">
              Mã đặt vé
            </span>
            <b className="text-2xl font-mono font-extrabold text-blue-600 tracking-wider">
              {ticket.ticketCode}
            </b>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs">
              <div className="mt-2 mb-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                🎟️ MÃ QR CHECK-IN VÀO RẠP (Không phải mã thanh toán)
              </div>
              Quét mã này tại quầy vé hoặc cổng vào phòng chiếu trước giờ phim chiếu 15 phút.
            </p>
          </div>

          {/* Detailed breakdown */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2 text-sm text-slate-600">
            <h5 className="font-bold text-slate-800 text-sm border-b border-slate-200/80 pb-2">
              Chi tiết đơn hàng &amp; Thanh toán
            </h5>
            <div className="flex justify-between py-1">
              <span>
                Vé xem phim (Ghế {ticket.seat?.row}
                {ticket.seat?.number} · {ticket.seat?.type === "vip" ? "VIP" : "Thường"})
              </span>
              <span className="font-semibold text-slate-800">
                {Number(ticket.price).toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Mã đơn đặt hàng</span>
              <span className="font-semibold text-slate-800">
                {ticket.booking?.bookingCode || ticket.bookingId}
              </span>
            </div>
            <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-base text-slate-900">
              <span>Tổng thanh toán</span>
              <span className="text-blue-600">
                {Number(ticket.price).toLocaleString("vi-VN")}đ
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
              <CreditCard size={14} className="text-emerald-500" />
              <span>
                Đã thanh toán qua {ticket.booking?.payment?.method || "Cổng thanh toán điện tử"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate("/success", { state: { tickets: [ticket] } })
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Ticket size={16} /> Xem trang vé đầy đủ
          </button>
          <button
            type="button"
            onClick={() => {
              alert(`Đã lưu vé điện tử ${ticket.ticketCode} về thiết bị của bạn!`)
            }}
            className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
          >
            <Download size={16} /> Tải vé
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-sm transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── SuccessPage ─────────────────────────────────────────────────────────────

export function SuccessPage() {
  const location = useLocation()
  const stateData = location.state as {
    booking?: BookingDetail
    tickets?: TicketItem[]
    showtime?: ShowtimeDetail
    selectedCombos?: Array<{ id: string; name: string; quantity: number; price: number }>
    ticketTotal?: number
    comboTotal?: number
    finalTotal?: number
  } | undefined

  const [tickets, setTickets] = useState<TicketItem[]>(stateData?.tickets || [])
  const [booking, setBooking] = useState<BookingDetail | null>(stateData?.booking || null)
  const [loading, setLoading] = useState(!stateData?.tickets?.length)

  useEffect(() => {
    if (!stateData?.tickets?.length) {
      getMyTickets()
        .then((res) => {
          if (res.tickets && res.tickets.length > 0) {
            setTickets([res.tickets[0]])
            if (res.tickets[0].booking) {
              setBooking(res.tickets[0].booking as any)
            }
          }
        })
        .catch((err) => console.error("Error loading success ticket:", err))
        .finally(() => setLoading(false))
    }
  }, [stateData])

  const primaryTicket = tickets[0]
  const showtimeInfo = primaryTicket?.showtime
  const seatNames = tickets.map((t) => `${t.seat?.row}${t.seat?.number}`).join(", ")

  const formatTime = (iso?: string) => {
    if (!iso) return "19:30"
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatDate = (iso?: string) => {
    if (!iso) return "28/09/2026"
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <main className="success-page">
      <div className="success-wrap">
        <BookingSteps current={5} />
        <div className="success-check">
          <Check size={34} strokeWidth={2.5} />
        </div>
        <span className="eyebrow">Thanh toán thành công</span>
        <h1>Đặt vé thành công!</h1>
        <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-xs">
          ✉️ Thông tin vé và mã QR đã được gửi về email của bạn
        </div>
        <p>Vé điện tử đã được lưu vào tài khoản và sẵn sàng vào rạp.</p>

        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
            <p className="text-xs">Đang nạp thông tin vé điện tử...</p>
          </div>
        ) : primaryTicket ? (
          /* Physical ticket UI */
          <div className="ticket">
            <div className="ticket-main">
              <div className="ticket-brand">
                <Brand />
                <span>VÉ ĐIỆN TỬ</span>
              </div>
              <div className="ticket-movie">
                <img
                  src={showtimeInfo?.movie?.poster || MOVIE_THUMBNAIL}
                  alt={showtimeInfo?.movie?.title || "Phim"}
                />
                <div>
                  <span>{showtimeInfo?.movie?.format || "2D DIGITAL"}</span>
                  <h2>{showtimeInfo?.movie?.title || "Phim điện ảnh"}</h2>
                  <p>
                    {showtimeInfo?.room?.cinema?.name || "5TOP CINEMA"} ·{" "}
                    {showtimeInfo?.room?.name || "Phòng chiếu"}
                  </p>
                </div>
              </div>
              <div className="ticket-info">
                <div>
                  <span>Ngày</span>
                  <b>{formatDate(showtimeInfo?.startTime)}</b>
                </div>
                <div>
                  <span>Giờ</span>
                  <b>{formatTime(showtimeInfo?.startTime)}</b>
                </div>
                <div>
                  <span>Ghế</span>
                  <b>{seatNames || "D5, D6"}</b>
                </div>
              </div>
            </div>
            <div className="ticket-cut">
              <i />
              <i />
            </div>
            <div className="ticket-code">
              <div className="fake-qr flex items-center justify-center">
                {primaryTicket.qrCode ? (
                  <img
                    src={primaryTicket.qrCode}
                    alt="QR Check-in"
                    className="w-28 h-28 object-contain"
                  />
                ) : (
                  <QrCode size={112} strokeWidth={1.4} />
                )}
              </div>
              <span>Mã đặt vé</span>
              <b>{booking?.bookingCode || primaryTicket.ticketCode}</b>
              <div className="my-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 uppercase">
                MÃ QR CHECK-IN VÀO RẠP
              </div>
              <small>Quét mã này tại cổng soát vé rạp chiếu (Không phải mã thanh toán)</small>
              {stateData?.selectedCombos && stateData.selectedCombos.length > 0 && (
                <div className="mt-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-left">
                  <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block mb-1.5">
                    🍿 Bắp nước kèm theo ({stateData.selectedCombos.reduce((s, c) => s + c.quantity, 0)} món)
                  </span>
                  <div className="space-y-1 text-xs text-rose-950 font-medium">
                    {stateData.selectedCombos.map((c) => (
                      <div key={c.id} className="flex justify-between">
                        <span>{c.name} x{c.quantity}</span>
                        <span className="font-bold">{(c.price * c.quantity).toLocaleString("vi-VN")}đ</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-rose-600 mt-2 italic">
                    * Đưa mã vé này tại quầy để nhân viên phục vụ bắp nước.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500">
            <p>Không tìm thấy thông tin vé vừa đặt.</p>
          </div>
        )}

        <div className="success-actions">
          <Link to="/my-tickets" className="button button-primary">
            <Ticket size={17} /> Xem vé của tôi
          </Link>
          <button
            type="button"
            onClick={() => {
              alert(
                `Đã tải vé điện tử ${primaryTicket?.ticketCode || ""} về máy!`,
              )
            }}
            className="button button-secondary cursor-pointer"
          >
            <Download size={17} /> Tải vé
          </button>
          <Link to="/" className="back-home">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  )
}

// ─── TicketsPage (default export) ─────────────────────────────────────────────

export default function TicketsPage() {
  const [tab, setTab] = useState<"upcoming" | "watched" | "cancelled">("upcoming")
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    getMyTickets()
      .then((res) => {
        if (active) {
          setTickets(res.tickets || [])
        }
      })
      .catch((err: any) => {
        if (active) {
          setError(err.message || "Không thể tải danh sách vé của bạn")
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  const now = new Date()

  // Phân loại vé theo tab:
  // Sắp xem: status === 'VALID' và giờ kết thúc chưa qua
  const upcomingTickets = tickets.filter((t) => {
    if (t.status === "VALID") {
      const endTime = t.showtime?.endTime ? new Date(t.showtime.endTime) : new Date(t.showtime.startTime)
      return endTime >= now
    }
    return false
  })

  // Đã xem: status === 'USED' hoặc vé đã qua giờ chiếu
  const watchedTickets = tickets.filter((t) => {
    if (t.status === "USED") return true
    if (t.status === "VALID") {
      const endTime = t.showtime?.endTime ? new Date(t.showtime.endTime) : new Date(t.showtime.startTime)
      return endTime < now
    }
    return false
  })

  // Đã hủy: status === 'CANCELLED'
  const cancelledTickets = tickets.filter((t) => t.status === "CANCELLED")

  const currentTickets =
    tab === "upcoming"
      ? upcomingTickets
      : tab === "watched"
      ? watchedTickets
      : cancelledTickets

  const formatDate = (iso?: string) => {
    if (!iso) return "--/--"
    return new Date(iso).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  const formatTime = (iso?: string) => {
    if (!iso) return "--:--"
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  return (
    <main className="page-main">
      <section className="container">
        <div className="page-header">
          <span className="eyebrow">Tài khoản của tôi</span>
          <h1>Vé của tôi</h1>
        </div>

        {/* Tabs */}
        <div className="tabs wide">
          <button
            type="button"
            className={cn(tab === "upcoming" && "active")}
            onClick={() => setTab("upcoming")}
          >
            Sắp xem {upcomingTickets.length > 0 && <span>{upcomingTickets.length}</span>}
          </button>
          <button
            type="button"
            className={cn(tab === "watched" && "active")}
            onClick={() => setTab("watched")}
          >
            Đã xem {watchedTickets.length > 0 && <span>{watchedTickets.length}</span>}
          </button>
          <button
            type="button"
            className={cn(tab === "cancelled" && "active")}
            onClick={() => setTab("cancelled")}
          >
            Đã hủy {cancelledTickets.length > 0 && <span>{cancelledTickets.length}</span>}
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500">Đang tải danh sách vé...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-600 max-w-lg mx-auto">
            <AlertCircle className="w-10 h-10 mx-auto mb-2 text-rose-500" />
            <p className="font-semibold">{error}</p>
          </div>
        ) : currentTickets.length > 0 ? (
          <div className="space-y-6">
            {currentTickets.map((ticket) => (
              <article className="my-ticket" key={ticket.id}>
                <img
                  src={ticket.showtime?.movie?.poster || MOVIE_THUMBNAIL}
                  alt={ticket.showtime?.movie?.title || "Phim"}
                />
                <div className="my-ticket-main">
                  <span className="format-badge">
                    {ticket.showtime?.movie?.format || "2D DIGITAL"}
                  </span>
                  <h2>{ticket.showtime?.movie?.title || "Phim điện ảnh"}</h2>
                  <p>
                    <MapPin size={16} /> {ticket.showtime?.room?.cinema?.name || "5TOP CINEMA"}
                  </p>
                  <div>
                    <span>
                      <CalendarDays size={16} /> {formatDate(ticket.showtime?.startTime)}
                    </span>
                    <span>
                      <Clock3 size={16} /> {formatTime(ticket.showtime?.startTime)}
                    </span>
                    <span>
                      <MonitorPlay size={16} /> {ticket.showtime?.room?.name || "Phòng chiếu"}
                    </span>
                  </div>
                  <b>
                    Ghế {ticket.seat?.row}
                    {ticket.seat?.number} ({ticket.seat?.type === "vip" ? "VIP" : "Thường"})
                  </b>
                </div>
                <div className="my-ticket-code">
                  <div className="w-20 h-20 mb-2 flex items-center justify-center">
                    {ticket.qrCode ? (
                      <img
                        src={ticket.qrCode}
                        alt={`QR ${ticket.ticketCode}`}
                        className="w-20 h-20 object-contain"
                      />
                    ) : (
                      <QrCode size={80} />
                    )}
                  </div>
                  <span>Mã vé</span>
                  <b>{ticket.ticketCode}</b>
                  <button
                    className="button button-primary"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    Xem vé
                  </button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 my-6">
            <Ticket size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700 text-lg mb-1">
              {tab === "upcoming"
                ? "Chưa có vé sắp xem"
                : tab === "watched"
                ? "Chưa có vé đã xem"
                : "Không có vé nào bị hủy"}
            </h3>
            <p className="text-sm text-slate-400">
              {tab === "upcoming"
                ? "Bạn chưa có vé phim nào sắp tới. Hãy chọn suất chiếu để đặt vé ngay!"
                : tab === "watched"
                ? "Những bộ phim bạn đã xem xong sẽ xuất hiện ở đây."
                : "Bạn chưa có đơn đặt vé nào bị hủy."}
            </p>
            {tab === "upcoming" && (
              <div className="mt-4">
                <Link to="/showtimes" className="button button-primary">
                  Xem lịch chiếu
                </Link>
              </div>
            )}
          </div>
        )}

        {selectedTicket && (
          <TicketDetailModal
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
          />
        )}
      </section>
    </main>
  )
}
