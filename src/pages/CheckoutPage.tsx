import React, { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import {
  CreditCard,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  Film,
  Armchair,
  Sparkles,
} from "lucide-react"
import {
  payBooking,
  getBookingById,
  releaseSeats,
} from "../services/bookingApi"
import {
  BookingDetail,
  ShowtimeDetail,
  ShowtimeSeatItem,
} from "../types/booking"

export default function CheckoutPage() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const navigate = useNavigate()
  const location = useLocation()

  const stateData = location.state as {
    showtime?: ShowtimeDetail
    heldSeats?: ShowtimeSeatItem[]
    holdResult?: any
  } | undefined

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(!stateData)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"MOCK" | "SANDBOX">("MOCK")

  // Countdown timer 5 minutes (300 seconds)
  const initialSeconds = stateData?.holdResult?.expiresInSeconds || 300
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)

  // Tải dữ liệu booking nếu chưa có qua state
  useEffect(() => {
    if (!bookingId) return

    let active = true
    getBookingById(bookingId)
      .then((res) => {
        if (active) {
          setBooking(res.booking)
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Không thể tải thông tin đơn đặt vé")
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [bookingId])

  // Countdown effect
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true)
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val)
  }

  const handlePaySuccess = async () => {
    if (!bookingId || isExpired) return
    setIsProcessing(true)
    setError("")

    try {
      const res = await payBooking(bookingId, {
        method: paymentMethod,
        result: "SUCCESS",
        showtimeId: stateData?.showtime?.id,
        seatIds: stateData?.heldSeats?.map((s) => s.id),
      })

      // Điều hướng sang trang vé điện tử
      navigate("/booking/success", {
        state: {
          newBookingSuccess: true,
          booking: res.booking,
          tickets: res.tickets,
          showtime: stateData?.showtime,
        },
      })
    } catch (err: any) {
      setError(err.message || "Thanh toán thất bại. Vui lòng thử lại.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayFailedOrCancel = async () => {
    if (!bookingId) return
    if (
      window.confirm(
        "Bạn có chắc chắn muốn hủy đơn đặt vé này và giải phóng ghế đã chọn?",
      )
    ) {
      setIsProcessing(true)
      try {
        await payBooking(bookingId, {
          method: paymentMethod,
          result: "FAILED",
          showtimeId: stateData?.showtime?.id,
          seatIds: stateData?.heldSeats?.map((s) => s.id),
        })
      } catch (err) {
        // Expected cancellation
      } finally {
        navigate("/showtimes")
      }
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white pt-28 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="animate-spin text-rose-500" size={40} />
          <p className="text-sm">Đang tải thông tin đơn đặt vé...</p>
        </div>
      </main>
    )
  }

  const bookingCode =
    booking?.bookingCode ||
    stateData?.holdResult?.bookingCode ||
    `BK-${bookingId}`
  const totalAmount =
    booking?.totalAmount || stateData?.holdResult?.totalAmount || 0
  const movieTitle = stateData?.showtime?.movieTitle || "Vé xem phim CinemaHub"
  const cinemaRoom = stateData?.showtime
    ? `${stateData.showtime.cinemaName} · ${stateData.showtime.roomName}`
    : "Rạp CinemaHub"
  const seatsList =
    stateData?.heldSeats?.map((s) => `${s.row}${s.number}`) || []

  return (
    <main className="min-h-screen bg-slate-950 text-white pt-24 pb-16">
      {/* Expired Modal */}
      {isExpired && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-4">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Hết thời gian giữ ghế!</h3>
            <p className="text-sm text-slate-400 mb-6">
              Thời gian giữ chỗ 05:00 phút của bạn đã hết hạn. Ghế đã được giải
              phóng để nhường cho khách hàng khác. Vui lòng chọn lại vé.
            </p>
            <button
              onClick={() => navigate("/showtimes")}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 font-bold rounded-xl text-white transition text-sm shadow-lg shadow-rose-900/40"
            >
              Chọn lại suất chiếu
            </button>
          </div>
        </div>
      )}

      <div className="container max-w-4xl mx-auto px-4">
        {/* Back Link */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 transition"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Thanh toán vé xem phim
            </h1>
            <p className="text-xs text-slate-400">
              Kiểm tra thông tin và chọn phương thức thanh toán
            </p>
          </div>
        </div>

        {/* Countdown Banner */}
        <div
          className={`mb-8 p-4 rounded-2xl border flex items-center justify-between ${
            timeLeft < 60
              ? "bg-rose-500/10 border-rose-500/40 text-rose-300 animate-pulse"
              : "bg-slate-900/90 border-slate-800 text-slate-300"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-slate-400">
                Thời gian giữ chỗ còn lại
              </p>
              <p className="text-xl font-black font-mono text-rose-400">
                {formatCountdown(timeLeft)}
              </p>
            </div>
          </div>
          <span className="text-xs text-slate-400 hidden sm:inline">
            Vui lòng hoàn tất thanh toán trước khi hết giờ
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-sm">
            <AlertTriangle size={18} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Checkout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Order Summary (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4 pb-3 border-b border-slate-800 flex items-center gap-2">
                <Film size={18} className="text-rose-500" /> Tóm tắt đơn đặt vé
              </h2>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Mã đặt chỗ</span>
                  <span className="font-mono font-bold text-rose-400">
                    {bookingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phim</span>
                  <span className="font-semibold text-white text-right max-w-[240px]">
                    {movieTitle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Rạp & Phòng</span>
                  <span className="text-slate-200 text-right">
                    {cinemaRoom}
                  </span>
                </div>
                {stateData?.showtime && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Suất chiếu</span>
                    <span className="text-slate-200 text-right">
                      {new Date(
                        stateData.showtime.startTime,
                      ).toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      ·{" "}
                      {new Date(
                        stateData.showtime.startTime,
                      ).toLocaleDateString("vi-VN", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {seatsList.length > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Ghế đã chọn</span>
                    <div className="flex gap-1.5 flex-wrap justify-end">
                      {seatsList.map((st) => (
                        <span
                          key={st}
                          className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        >
                          {st}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-semibold text-slate-300">
                  Tổng thanh toán
                </span>
                <span className="text-2xl font-black text-rose-500">
                  {formatPrice(totalAmount)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-rose-500" /> Chọn phương
                thức thanh toán
              </h2>

              <div className="space-y-3">
                <label
                  onClick={() => setPaymentMethod("MOCK")}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === "MOCK"
                      ? "bg-rose-500/10 border-rose-500 text-white"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/80 flex items-center justify-center font-bold text-rose-400 text-xs">
                      MOCK
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        Thanh toán mô phỏng (Mock Payment)
                      </p>
                      <p className="text-xs text-slate-400">
                        Môi trường thử nghiệm an toàn, sinh mã vé tức thì
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "MOCK"
                        ? "border-rose-500 bg-rose-500"
                        : "border-slate-600"
                    }`}
                  >
                    {paymentMethod === "MOCK" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </label>

                <label
                  onClick={() => setPaymentMethod("SANDBOX")}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === "SANDBOX"
                      ? "bg-rose-500/10 border-rose-500 text-white"
                      : "bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-700/80 flex items-center justify-center font-bold text-blue-400 text-xs">
                      SANDBOX
                    </div>
                    <div>
                      <p className="font-bold text-sm">
                        Cổng thanh toán Sandbox
                      </p>
                      <p className="text-xs text-slate-400">
                        Giả lập cổng thanh toán trực tuyến
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "SANDBOX"
                        ? "border-rose-500 bg-rose-500"
                        : "border-slate-600"
                    }`}
                  >
                    {paymentMethod === "SANDBOX" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Card (5 cols) */}
          <div className="md:col-span-5 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                <ShieldCheck size={16} /> Bảo mật & Xác thực giao dịch
              </div>
              <h3 className="text-lg font-bold">Xác nhận thanh toán</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Sau khi thanh toán thành công, hệ thống sẽ cấp ngay vé điện tử
                kèm mã QR Code để bạn quét tại quầy soát vé rạp chiếu.
              </p>
            </div>

            <div className="space-y-3 pt-8">
              {/* Nút 1: Xác nhận thanh toán thành công */}
              <button
                disabled={isProcessing || isExpired}
                onClick={handlePaySuccess}
                className="w-full py-4 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 font-bold text-white text-base shadow-xl shadow-rose-900/40 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang xử lý thanh toán...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Xác nhận thanh toán (Thành công)
                  </>
                )}
              </button>

              {/* Nút 2: Hủy bỏ / Giả lập thất bại */}
              <button
                disabled={isProcessing}
                onClick={handlePayFailedOrCancel}
                className="w-full py-3.5 px-6 rounded-2xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-rose-400 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <XCircle size={16} />
                Hủy bỏ / Giả lập thất bại
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
