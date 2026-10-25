import React, { useState, useEffect } from "react"
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"
import QRCode from "qrcode"
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
  ExternalLink,
  QrCode as QrIcon,
  X,
  Ticket as TicketIcon,
  Sparkles,
  Tag,
  ShoppingBag,
} from "lucide-react"
import { BookingHeaderStepper } from "../components/BookingHeaderStepper"
import { SelectedComboItem } from "../data/comboData"
import {
  getSelectedVoucher,
  verifyVoucher,
  clearSelectedVoucher,
} from "../services/promotion.service"
import { VoucherApplyResult } from "../types/promotion"
import {
  payBooking,
  getBookingById,
  releaseSeats,
  createMomoPaymentApi,
  getMomoPaymentStatusApi,
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
    selectedCombos?: SelectedComboItem[]
    ticketTotal?: number
    comboTotal?: number
    grandTotal?: number
  } | undefined

  const [booking, setBooking] = useState<BookingDetail | null>(null)
  const [isLoading, setIsLoading] = useState(!stateData)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState("")
  const [paymentMethod, setPaymentMethod] = useState<"MOCK" | "MOMO">("MOCK")

  // Countdown timer 5 minutes (300 seconds)
  const initialSeconds = stateData?.holdResult?.expiresInSeconds || 300
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds)
  const [isExpired, setIsExpired] = useState(false)

  // MoMo Sandbox Modal & Polling state
  const [momoModalData, setMomoModalData] = useState<{
    orderId: string
    requestId: string
    amount: number
    payUrl: string
    deeplink?: string
    qrCodeUrl: string
    qrDataUrl?: string
    isSimulation?: boolean
  } | null>(null)
  const [momoStatus, setMomoStatus] = useState<"PENDING" | "SUCCESS" | "FAILED">("PENDING")
  const [momoStatusMessage, setMomoStatusMessage] = useState<string>("")

  // Voucher / Promotion state
  const [voucherCodeInput, setVoucherCodeInput] = useState("")
  const [appliedVoucher, setAppliedVoucher] = useState<VoucherApplyResult | null>(null)
  const [voucherMessage, setVoucherMessage] = useState<{
    type: "success" | "error" | "info"
    text: string
  } | null>(null)

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

  // MoMo Status Polling Effect
  useEffect(() => {
    if (!momoModalData || momoStatus === "SUCCESS" || momoStatus === "FAILED" || isExpired || !bookingId) {
      return
    }

    const interval = setInterval(async () => {
      try {
        const res = await getMomoPaymentStatusApi(momoModalData.orderId, bookingId)
        if (res.status === "SUCCESS") {
          setMomoStatus("SUCCESS")
          setMomoStatusMessage("Thanh toán MoMo thành công! Đang chuyển đến vé điện tử...")
          clearInterval(interval)
          setTimeout(() => {
            navigate("/booking/success", {
              state: {
                newBookingSuccess: true,
                booking: res.booking,
                tickets: res.tickets,
                showtime: stateData?.showtime,
                selectedCombos,
                ticketTotal,
                comboTotal,
                finalTotal,
              },
            })
          }, 1200)
        } else if (res.status === "FAILED") {
          setMomoStatus("FAILED")
          setMomoStatusMessage(res.message || "Giao dịch thanh toán đã thất bại hoặc bị hủy.")
          clearInterval(interval)
        }
      } catch {
        // Tiếp tục polling
      }
    }, 2500)

    return () => clearInterval(interval)
  }, [momoModalData, momoStatus, isExpired, bookingId, navigate, stateData])

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

  const handlePay = async () => {
    if (!bookingId || isExpired) return
    setIsProcessing(true)
    setError("")

    if (paymentMethod === "MOCK") {
      try {
        const res = await payBooking(bookingId, {
          method: "MOCK",
          result: "SUCCESS",
          showtimeId: stateData?.showtime?.id || (booking as any)?.showtimeId,
          seatIds: stateData?.heldSeats?.map((s) => s.id) || (booking as any)?.heldSeats,
          amount: Number(finalTotal || 0),
          totalAmount: Number(rawTotalAmount || 0),
          discountAmount: Number(discountAmount || 0),
          voucherCode: appliedVoucher?.promotion?.code || undefined,
        })

        // Điều hướng sang trang vé điện tử
        navigate("/booking/success", {
          state: {
            newBookingSuccess: true,
            booking: res.booking,
            tickets: res.tickets,
            showtime: stateData?.showtime,
            selectedCombos,
            ticketTotal,
            comboTotal,
            finalTotal,
          },
        })
      } catch (err: any) {
        setError(err.message || "Thanh toán thất bại. Vui lòng thử lại.")
      } finally {
        setIsProcessing(false)
      }
    } else {
      // MoMo Sandbox Flow
      try {
        const momoRes = await createMomoPaymentApi(bookingId, Number(finalTotal || 0))

        // Sinh mã QR hình ảnh từ qrCodeUrl hoặc payUrl bằng qrcode
        const targetQr = momoRes.qrCodeUrl || momoRes.payUrl
        let qrDataUrl = ""
        try {
          qrDataUrl = await QRCode.toDataURL(targetQr, {
            width: 280,
            margin: 2,
            color: {
              dark: "#A50064",
              light: "#FFFFFF",
            },
          })
        } catch {
          qrDataUrl = targetQr
        }

        setMomoStatus("PENDING")
        setMomoStatusMessage("Đang chờ thanh toán qua MoMo Sandbox...")
        setMomoModalData({
          ...momoRes,
          qrDataUrl,
        })
      } catch (err: any) {
        setError(err.message || "Không thể khởi tạo cổng thanh toán MoMo Sandbox")
      } finally {
        setIsProcessing(false)
      }
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
          showtimeId: stateData?.showtime?.id || (booking as any)?.showtimeId,
          seatIds: stateData?.heldSeats?.map((s) => s.id) || (booking as any)?.heldSeats,
          amount: Number(finalTotal || 0),
          totalAmount: Number(rawTotalAmount || 0),
          discountAmount: Number(discountAmount || 0),
          voucherCode: appliedVoucher?.promotion?.code || undefined,
        })
      } catch {
        // Expected cancellation
      } finally {
        navigate("/showtimes")
      }
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-50 text-gray-800 pt-28 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-gray-500">
          <Loader2 className="animate-spin text-rose-600" size={40} />
          <p className="text-sm font-medium">Đang tải thông tin đơn đặt vé...</p>
        </div>
      </main>
    )
  }

  const bookingCode =
    booking?.bookingCode ||
    stateData?.holdResult?.bookingCode ||
    (bookingId ? `BK-${bookingId}` : "TICKET")

  const selectedCombos = stateData?.selectedCombos || []
  const ticketTotal =
    stateData?.ticketTotal ??
    stateData?.heldSeats?.reduce((sum, s) => sum + (s.price || 0), 0) ??
    Number(booking?.totalAmount || 0)
  const comboTotal =
    stateData?.comboTotal ??
    selectedCombos.reduce((sum, c) => sum + c.price * c.quantity, 0)
  const rawTotalAmount = ticketTotal + comboTotal

  const discountAmount = appliedVoucher?.valid ? appliedVoucher.discountAmount : 0
  const finalTotal = Math.max(0, rawTotalAmount - discountAmount)
  const amount = Number(finalTotal || 0)
  const code = bookingCode || "TICKET"
  const description = encodeURIComponent(`Ve CinemaHub ${code}`)

  // Tự động kiểm tra và kích hoạt voucher nếu đã chọn từ trang Khuyến mãi
  useEffect(() => {
    if (rawTotalAmount <= 0) return
    const stored = getSelectedVoucher()
    if (stored && stored.code && !appliedVoucher) {
      setVoucherCodeInput(stored.code)
      const res = verifyVoucher(stored.code, rawTotalAmount)
      if (res.valid) {
        setAppliedVoucher(res)
        setVoucherMessage({
          type: "success",
          text: `Đã tự động áp dụng mã ưu đãi "${stored.code}" từ trang Khuyến mãi!`,
        })
      } else {
        setVoucherMessage({
          type: "info",
          text: `Mã ưu đãi "${stored.code}": ${res.message}`,
        })
      }
    }
  }, [rawTotalAmount])

  const handleApplyVoucher = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const target = voucherCodeInput.trim()
    if (!target) {
      setVoucherMessage({ type: "error", text: "Vui lòng nhập mã ưu đãi" })
      return
    }

    const res = verifyVoucher(target, rawTotalAmount)
    if (res.valid) {
      setAppliedVoucher(res)
      setVoucherMessage({ type: "success", text: res.message })
    } else {
      setAppliedVoucher(null)
      setVoucherMessage({ type: "error", text: res.message })
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherCodeInput("")
    setVoucherMessage(null)
    clearSelectedVoucher()
  }

  // VietQR Dynamic URL (Cách 1) & Fallback QRServer (Cách 2)
  const vietQrUrl = `https://img.vietqr.io/image/MB-0967630387-compact2.png?amount=${amount}&addInfo=${description}&accountName=CINEMAHUB`
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=190x190&data=CINEMAHUB_${code}_AMOUNT_${amount}`

  const movieTitle = stateData?.showtime?.movieTitle || "Vé xem phim CinemaHub"
  const cinemaRoom = stateData?.showtime
    ? `${stateData.showtime.cinemaName} · ${stateData.showtime.roomName}`
    : "Rạp CinemaHub"
  const seatsList =
    stateData?.heldSeats?.map((s) => `${s.row}${s.number}`) || []

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 pt-24 pb-16 px-4">
      {/* Expired Modal */}
      {isExpired && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-md w-full p-6 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 border border-amber-200 flex items-center justify-center mx-auto mb-4">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Hết thời gian giữ ghế!</h3>
            <p className="text-sm text-gray-600 mb-6">
              Thời gian giữ chỗ 05:00 phút của bạn đã hết hạn. Ghế đã được giải
              phóng để nhường cho khách hàng khác. Vui lòng chọn lại vé.
            </p>
            <button
              onClick={() => navigate("/showtimes")}
              className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 font-bold rounded-xl text-white transition text-sm shadow-md"
            >
              Chọn lại suất chiếu
            </button>
          </div>
        </div>
      )}

      {/* MOMO SANDBOX PAYMENT MODAL */}
      {momoModalData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-3xl max-w-md w-full p-6 shadow-2xl text-center relative overflow-hidden">
            {/* Header / Brand */}
            <button
              onClick={() => setMomoModalData(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 transition"
              aria-label="Đóng"
            >
              <X size={18} />
            </button>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#A50064] text-white text-xs font-black uppercase tracking-wider mb-3">
              <span>MoMo Sandbox</span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-1">
              Thanh toán vé qua MoMo
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              Quét mã QR bằng ứng dụng MoMo để hoàn tất thanh toán
            </p>

            {/* Simulation alert if keys not yet in .env */}
            {momoModalData.isSimulation && (
              <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px] leading-relaxed text-left">
                💡 <strong>Chế độ mô phỏng Sandbox:</strong> MOMO_SECRET_KEY chưa
                cấu hình trong backend/.env. Bạn có thể bấm nút bên dưới hoặc gửi
                IPN để kiểm thử.
              </div>
            )}

            {/* QR Code Canvas Card */}
            <div className="bg-white p-4 rounded-2xl shadow-sm max-w-[260px] mx-auto border-2 border-pink-100 mb-3">
              {momoModalData.qrDataUrl ? (
                <img
                  src={momoModalData.qrDataUrl}
                  alt="Mã QR Thanh Toán MoMo"
                  className="w-full h-auto object-contain mx-auto"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center bg-gray-50 text-gray-400">
                  <QrIcon size={80} />
                </div>
              )}
            </div>

            {/* Clear QR label notice */}
            <div className="mb-4">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#D82D8B] block">
                ⚡ MÃ QR THANH TOÁN TIỀN VÉ
              </span>
              <p className="text-[11px] text-gray-500 mt-0.5">
                (Khác với mã QR vé vào rạp check-in nhận sau khi thanh toán)
              </p>
            </div>

            {/* Button mở MoMo Web/App */}
            <a
              href={momoModalData.payUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 rounded-xl bg-[#A50064] hover:bg-[#850050] text-white font-bold text-sm flex items-center justify-center gap-2 shadow-md transition mb-4"
            >
              <span>Mở MoMo để thanh toán (PayUrl)</span>
              <ExternalLink size={16} />
            </a>

            {/* Order info details */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-2 text-xs mb-4 text-left">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Số tiền:</span>
                <span className="font-extrabold text-base text-rose-600">
                  {formatPrice(momoModalData.amount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Mã đơn thanh toán:</span>
                <span className="font-mono text-gray-900 font-bold">
                  {momoModalData.orderId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Thời gian giữ vé:</span>
                <span className="font-mono font-bold text-amber-600">
                  {formatCountdown(timeLeft)}
                </span>
              </div>
            </div>

            {/* Polling status banner */}
            <div className="mb-3">
              {momoStatus === "PENDING" && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-100 border border-gray-200 text-xs text-gray-700">
                  <Loader2 className="animate-spin text-[#D82D8B]" size={16} />
                  <span>{momoStatusMessage}</span>
                </div>
              )}
              {momoStatus === "SUCCESS" && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-700 font-bold">
                  <CheckCircle2 className="text-emerald-600" size={18} />
                  <span>{momoStatusMessage}</span>
                </div>
              )}
              {momoStatus === "FAILED" && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-bold">
                  <XCircle className="text-rose-600" size={18} />
                  <span>{momoStatusMessage}</span>
                </div>
              )}
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={() => setMomoModalData(null)}
              className="text-xs text-gray-500 hover:text-gray-800 underline transition"
            >
              Hủy thanh toán / Quay lại chọn phương thức khác
            </button>
          </div>
        </div>
      )}

      <div className="container max-w-5xl mx-auto">
        {/* 1. THANH STEPPER 5 BƯỚC CHUẨN HÓA (Đang ở BƯỚC 5: Thanh Toán) */}
        <BookingHeaderStepper
          currentStep={5}
          selectedCinemaName={stateData?.showtime?.cinemaName || (booking as any)?.cinemaName}
          selectedMovieTitle={stateData?.showtime?.movieTitle || (booking as any)?.movieTitle}
          selectedShowtimeInfo={
            stateData?.showtime?.startTime
              ? `${new Date(stateData.showtime.startTime).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} · ${new Date(stateData.showtime.startTime).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}`
              : undefined
          }
          selectedSeatsSummary={
            seatsList.length > 0
              ? `${seatsList.join(", ")} (${seatsList.length} vé)`
              : undefined
          }
          onStepClick={(step) => {
            if (step <= 3) {
              navigate(
                `/showtimes?cinemaId=${stateData?.showtime?.cinemaId || ""}&movieId=${stateData?.showtime?.movieId || ""}`,
              )
            } else if (step === 4) {
              if (stateData?.showtime?.id) {
                navigate(`/booking/${stateData.showtime.id}`)
              } else {
                navigate(-1)
              }
            }
          }}
        />

        {/* Back Link to Step 4 & Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <button
            type="button"
            onClick={() => {
              if (stateData?.showtime?.id) {
                navigate(`/booking/${stateData.showtime.id}`)
              } else {
                navigate(-1)
              }
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 text-gray-700 hover:text-rose-600 transition shadow-xs text-xs sm:text-sm font-bold cursor-pointer self-start sm:self-auto"
          >
            <ArrowLeft size={16} />
            <span>Quay lại BƯỚC 4: Chọn Ghế & Bắp Nước</span>
          </button>

          <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
            BƯỚC 5 / 5: XÁC NHẬN & THANH TOÁN
          </span>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            Thanh Toán Vé Xem Phim & Bắp Nước
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Kiểm tra chi tiết đơn hàng, áp dụng mã ưu đãi và quét mã QR chuyển khoản hoặc MoMo Sandbox.
          </p>
        </div>

        {/* Countdown Banner */}
        <div
          className={`mb-8 p-4 rounded-2xl border flex items-center justify-between ${
            timeLeft < 60
              ? "bg-rose-50 border-rose-200 text-rose-700 animate-pulse"
              : "bg-white border-gray-200 text-gray-700 shadow-sm"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              timeLeft < 60 ? "bg-rose-100 text-rose-600" : "bg-rose-50 text-rose-600"
            }`}>
              <Clock size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-500">
                Thời gian giữ chỗ còn lại
              </p>
              <p className="text-xl font-black font-mono text-rose-600">
                {formatCountdown(timeLeft)}
              </p>
            </div>
          </div>
          <span className="text-xs text-gray-500 hidden sm:inline">
            Vui lòng hoàn tất thanh toán trước khi hết giờ
          </span>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2 text-sm">
            <AlertTriangle size={18} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Checkout Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Order Summary (7 cols) */}
          <div className="md:col-span-7 space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-gray-900 font-bold text-lg mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                <Film size={18} className="text-rose-600" /> Tóm tắt đơn đặt vé
              </h2>

              <div className="space-y-3.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium text-sm">Mã đặt chỗ</span>
                  <span className="font-mono font-bold text-rose-600">
                    {bookingCode}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium text-sm">Phim</span>
                  <span className="font-semibold text-gray-900 text-right max-w-[240px]">
                    {movieTitle}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium text-sm">Rạp & Phòng</span>
                  <span className="text-gray-900 font-semibold text-right">
                    {cinemaRoom}
                  </span>
                </div>
                {stateData?.showtime && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium text-sm">Suất chiếu</span>
                    <span className="text-gray-900 font-semibold text-right">
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
                  <div className="flex justify-between items-start">
                    <span className="text-gray-500 font-medium text-sm">
                      Ghế đã chọn ({seatsList.length})
                    </span>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex gap-1.5 flex-wrap justify-end">
                        {seatsList.map((st) => (
                          <span
                            key={st}
                            className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-slate-600">
                        Tiền vé: {formatPrice(ticketTotal)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Danh sách Combo Bắp Nước */}
                <div className="flex justify-between items-start pt-3 border-t border-gray-100">
                  <span className="text-gray-500 font-medium text-sm flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-rose-500" /> Bắp nước kèm theo
                  </span>
                  <div className="flex flex-col items-end gap-1 max-w-[260px]">
                    {selectedCombos.length === 0 ? (
                      <span className="text-xs text-gray-400 italic">Không chọn bắp nước kèm theo</span>
                    ) : (
                      <div className="space-y-1 text-right">
                        {selectedCombos.map((combo) => (
                          <div key={combo.id} className="text-xs font-medium text-slate-800">
                            {combo.name} <strong className="text-rose-600">x{combo.quantity}</strong>:{" "}
                            {formatPrice(combo.price * combo.quantity)}
                          </div>
                        ))}
                        <div className="text-xs font-bold text-rose-600 pt-0.5">
                          Tiền bắp nước: {formatPrice(comboTotal)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Voucher Promotion Input Box */}
              <div className="mt-6 pt-5 border-t border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                    <TicketIcon size={15} className="text-teal-600" /> Mã khuyến mãi / Voucher
                  </span>
                  <Link
                    to="/promotions"
                    target="_blank"
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    Xem ưu đãi hiện có <ExternalLink size={11} />
                  </Link>
                </div>

                {/* If voucher is already applied */}
                {appliedVoucher?.valid ? (
                  <div className="p-3.5 rounded-2xl bg-teal-50 border-2 border-dashed border-teal-300 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                        <CheckCircle2 size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-teal-950 flex items-center gap-1.5 truncate">
                          <span>Mã: <strong className="font-mono text-teal-700">{appliedVoucher.promotion?.code}</strong></span>
                          <span className="text-emerald-700 font-extrabold">(-{formatPrice(appliedVoucher.discountAmount)})</span>
                        </p>
                        <p className="text-[11px] text-teal-700 truncate">
                          {appliedVoucher.promotion?.title || "Đã áp dụng ưu đãi"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleRemoveVoucher}
                      className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 px-2.5 py-1.5 rounded-xl border border-rose-200 shadow-sm transition shrink-0"
                    >
                      Bỏ chọn
                    </button>
                  </div>
                ) : (
                  /* Form to enter voucher */
                  <form onSubmit={handleApplyVoucher} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={voucherCodeInput}
                        onChange={(e) => setVoucherCodeInput(e.target.value.toUpperCase())}
                        placeholder="Nhập mã (ví dụ: CINEMA50K, FNB20...)"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white text-xs sm:text-sm font-mono uppercase text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs sm:text-sm shadow-sm transition shrink-0"
                    >
                      Áp dụng
                    </button>
                  </form>
                )}

                {/* Voucher status message */}
                {voucherMessage && (
                  <p
                    className={`text-xs flex items-center gap-1.5 px-3 py-2 rounded-xl ${
                      voucherMessage.type === "success"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : voucherMessage.type === "error"
                        ? "bg-rose-50 text-rose-800 border border-rose-200"
                        : "bg-sky-50 text-sky-800 border border-sky-200"
                    }`}
                  >
                    {voucherMessage.type === "success" ? (
                      <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                    )}
                    <span>{voucherMessage.text}</span>
                  </p>
                )}
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Tiền vé xem phim</span>
                  <span className="text-gray-900 font-semibold">{formatPrice(ticketTotal)}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 font-medium">Tiền combo bắp nước</span>
                  <span className="text-gray-900 font-semibold">{formatPrice(comboTotal)}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-teal-700 font-semibold flex items-center gap-1">
                      <Sparkles size={14} className="text-teal-600" />
                      Giảm giá khuyến mãi ({appliedVoucher?.promotion?.code})
                    </span>
                    <span className="text-emerald-600 font-bold">-{formatPrice(discountAmount)}</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-100 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-gray-800 block">Tổng thanh toán</span>
                    {discountAmount > 0 && (
                      <span className="text-[11px] text-emerald-600 font-semibold">
                        (Tiết kiệm {formatPrice(discountAmount)})
                      </span>
                    )}
                  </div>
                  <span className="text-rose-600 font-black text-2xl">
                    {formatPrice(finalTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-gray-900 font-bold text-lg mb-4 flex items-center gap-2">
                <CreditCard size={18} className="text-rose-600" /> Chọn phương
                thức thanh toán
              </h2>

              <div className="space-y-3">
                {/* 1. MOCK PAYMENT / VIETQR */}
                <label
                  onClick={() => setPaymentMethod("MOCK")}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === "MOCK"
                      ? "bg-rose-50/70 border-rose-500 text-gray-900 ring-1 ring-rose-500"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center font-bold text-rose-600 text-xs">
                      <QrIcon size={20} />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">
                        Chuyển khoản QR ngân hàng (VietQR 24/7)
                      </p>
                      <p className="text-xs text-gray-500">
                        Quét mã QR qua mọi ứng dụng ngân hàng, tự động nhận diện giá tiền
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "MOCK"
                        ? "border-rose-600 bg-rose-600"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === "MOCK" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </label>

                {/* 2. REAL MOMO SANDBOX */}
                <label
                  onClick={() => setPaymentMethod("MOMO")}
                  className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition ${
                    paymentMethod === "MOMO"
                      ? "bg-pink-50/70 border-[#A50064] text-gray-900 ring-1 ring-[#A50064]"
                      : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#A50064] flex items-center justify-center font-black text-white text-xs shadow-sm">
                      MOMO
                    </div>
                    <div>
                      <p className="font-bold text-sm text-gray-900 flex items-center gap-2">
                        <span>Ví MoMo Sandbox</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-pink-100 text-[#A50064] border border-pink-200">
                          SANDBOX THẬT
                        </span>
                      </p>
                      <p className="text-xs text-gray-500">
                        Quét mã QR MoMo và thanh toán qua cổng chính thức
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      paymentMethod === "MOMO"
                        ? "border-[#A50064] bg-[#A50064]"
                        : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === "MOMO" && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Card (5 cols) */}
          <div className="md:col-span-5 bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                <ShieldCheck size={16} /> Bảo mật & Xác thực giao dịch
              </div>
              <h3 className="text-gray-900 font-bold text-xl">Xác nhận thanh toán</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Sau khi thanh toán thành công qua VietQR hoặc MoMo Sandbox, hệ thống
                sẽ cấp ngay vé điện tử kèm mã QR Check-in để bạn quét tại quầy
                soát vé rạp chiếu.
              </p>

              {/* Dynamic QR Box */}
              <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl my-4">
                <img
                  src={vietQrUrl}
                  alt="Mã QR Thanh Toán"
                  className="w-48 h-48 object-contain rounded-lg border border-gray-100 shadow-sm bg-white"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = fallbackQrUrl
                  }}
                />
                <p className="text-xs text-gray-500 font-medium mt-3 text-center">
                  Quét mã để thanh toán đúng số tiền:{" "}
                  <span className="text-rose-600 font-bold">
                    {amount.toLocaleString("vi-VN")} đ
                  </span>
                </p>
                <div className="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5 flex-wrap justify-center">
                  <span>Ngân hàng: <strong>MBBank</strong></span>
                  <span>•</span>
                  <span>STK: <strong className="font-mono">0967630387</strong></span>
                  <span>•</span>
                  <span>Tên: <strong>CINEMAHUB</strong></span>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              {/* Nút thanh toán */}
              <button
                disabled={isProcessing || isExpired}
                onClick={handlePay}
                className={`w-full font-bold py-3.5 rounded-xl shadow-md transition duration-200 disabled:opacity-50 text-white text-base flex items-center justify-center gap-2 ${
                  paymentMethod === "MOMO"
                    ? "bg-[#A50064] hover:bg-[#850050]"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                {isProcessing ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Đang kết nối cổng thanh toán...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    <span>
                      {paymentMethod === "MOMO"
                        ? "Thanh toán với MoMo Sandbox"
                        : "Xác nhận thanh toán"}
                    </span>
                  </>
                )}
              </button>

              {/* Nút Hủy bỏ */}
              <button
                disabled={isProcessing}
                onClick={handlePayFailedOrCancel}
                className="w-full py-3 px-6 rounded-xl bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-600 hover:text-rose-600 font-semibold text-sm transition-all flex items-center justify-center gap-2"
              >
                <XCircle size={16} />
                Hủy bỏ đơn đặt vé này
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
