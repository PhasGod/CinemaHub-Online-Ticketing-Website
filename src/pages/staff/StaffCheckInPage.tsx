import React, { useState, useEffect, useRef } from "react"
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  CameraOff,
  Keyboard,
  Clock,
  Film,
  User,
  Armchair,
  History,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Volume2,
} from "lucide-react"
import { staffCheckInTicket } from "../../services/bookingApi"
import { TicketItem } from "../../types/booking"

interface RecentScanItem {
  id: string
  ticketCode: string
  status: "SUCCESS" | "ALREADY_USED" | "INVALID"
  message: string
  movieTitle?: string
  seatName?: string
  roomName?: string
  customerName?: string
  timestamp: Date
  ticket?: TicketItem
}

function playAudioFeedback(type: "success" | "error" | "warning") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)

    if (type === "success") {
      osc.type = "sine"
      osc.frequency.setValueAtTime(880, ctx.currentTime)
      osc.frequency.setValueAtTime(1175, ctx.currentTime + 0.08)
      gain.gain.setValueAtTime(0.25, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.22)
    } else if (type === "error") {
      osc.type = "sawtooth"
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.35)
    } else {
      osc.type = "triangle"
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2)
      osc.start(ctx.currentTime)
      osc.stop(ctx.currentTime + 0.2)
    }
  } catch (e) {
    console.warn("Audio feedback error:", e)
  }
}

export default function StaffCheckInPage() {
  const [ticketInput, setTicketInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [autoKeepFocus, setAutoKeepFocus] = useState(true)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Last check-in result
  const [lastResult, setLastResult] = useState<{
    status: "IDLE" | "SUCCESS" | "ALREADY_USED" | "INVALID"
    message: string
    ticket?: TicketItem
    checkedInAt?: string
  }>({
    status: "IDLE",
    message: "Sẵn sàng nhận mã vé từ máy quét barcode hoặc bàn phím.",
  })

  // History in this session
  const [recentScans, setRecentScans] = useState<RecentScanItem[]>([])

  const inputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const scanLoopRef = useRef<number | null>(null)

  // Focus lock
  useEffect(() => {
    if (autoKeepFocus && inputRef.current && !cameraActive) {
      inputRef.current.focus()
    }
  }, [autoKeepFocus, cameraActive, lastResult])

  // Camera stream cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const startCamera = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Trình duyệt không hỗ trợ truy cập máy ảnh")
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }

      setCameraActive(true)

      // Initialize BarcodeDetector if available
      if ("BarcodeDetector" in window) {
        try {
          const BarcodeDetectorClass = (window as any).BarcodeDetector
          detectorRef.current = new BarcodeDetectorClass({ formats: ["qr_code", "code_128", "ean_13"] })
          startBarcodeDetectionLoop()
        } catch (e) {
          console.warn("Native BarcodeDetector init failed:", e)
        }
      }
    } catch (err: any) {
      console.error("Camera access failed:", err)
      setCameraError(err.message || "Không thể khởi động camera. Vui lòng cấp quyền máy ảnh.")
      setCameraActive(false)
    }
  }

  const stopCamera = () => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current)
      scanLoopRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const startBarcodeDetectionLoop = () => {
    const checkBarcode = async () => {
      if (!videoRef.current || !detectorRef.current || videoRef.current.readyState < 2) {
        scanLoopRef.current = requestAnimationFrame(checkBarcode)
        return
      }

      try {
        const barcodes = await detectorRef.current.detect(videoRef.current)
        if (barcodes.length > 0) {
          const rawValue = barcodes[0].rawValue?.trim()
          if (rawValue) {
            stopCamera()
            handleExecuteCheckIn(rawValue)
            return
          }
        }
      } catch {
        // Continue detection loop
      }

      scanLoopRef.current = requestAnimationFrame(checkBarcode)
    }

    scanLoopRef.current = requestAnimationFrame(checkBarcode)
  }

  const handleExecuteCheckIn = async (codeToScan?: string) => {
    const rawCode = (codeToScan || ticketInput).trim()
    if (!rawCode) return

    setLoading(true)
    try {
      const res = await staffCheckInTicket(rawCode)
      playAudioFeedback("success")

      const ticket = res.ticket
      setLastResult({
        status: "SUCCESS",
        message: res.message || "Soát vé thành công. HỢP LỆ - MỜI VÀO RẠP!",
        ticket,
      })

      const newItem: RecentScanItem = {
        id: `${ticket.id}-${Date.now()}`,
        ticketCode: ticket.ticketCode,
        status: "SUCCESS",
        message: "Soát vé thành công",
        movieTitle: ticket.showtime?.movie?.title,
        seatName: `${ticket.seat?.row}${ticket.seat?.number}`,
        roomName: ticket.showtime?.room?.name,
        customerName: ticket.booking?.user?.fullName || "Khách hàng",
        timestamp: new Date(),
        ticket,
      }
      setRecentScans((prev) => [newItem, ...prev.slice(0, 14)])
      setTicketInput("")
    } catch (err: any) {
      const errorMsg = err.message || "Lỗi kiểm tra vé"
      const status = err.status
      const errTicket = err.data?.ticket as TicketItem | undefined

      if (errorMsg.includes("đã được soát") || (errTicket && errTicket.status === "USED")) {
        playAudioFeedback("error")
        setLastResult({
          status: "ALREADY_USED",
          message: errorMsg,
          ticket: errTicket,
          checkedInAt: errTicket?.checkedInAt || undefined,
        })

        const newItem: RecentScanItem = {
          id: `used-${Date.now()}`,
          ticketCode: rawCode,
          status: "ALREADY_USED",
          message: errorMsg,
          movieTitle: errTicket?.showtime?.movie?.title,
          seatName: errTicket ? `${errTicket.seat?.row}${errTicket.seat?.number}` : undefined,
          roomName: errTicket?.showtime?.room?.name,
          customerName: errTicket?.booking?.user?.fullName,
          timestamp: new Date(),
          ticket: errTicket,
        }
        setRecentScans((prev) => [newItem, ...prev.slice(0, 14)])
      } else {
        playAudioFeedback("warning")
        setLastResult({
          status: "INVALID",
          message: errorMsg,
        })

        const newItem: RecentScanItem = {
          id: `invalid-${Date.now()}`,
          ticketCode: rawCode,
          status: "INVALID",
          message: errorMsg,
          timestamp: new Date(),
        }
        setRecentScans((prev) => [newItem, ...prev.slice(0, 14)])
      }
      setTicketInput("")
    } finally {
      setLoading(false)
      if (autoKeepFocus && inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const successCount = recentScans.filter((s) => s.status === "SUCCESS").length
  const warningCount = recentScans.filter((s) => s.status !== "SUCCESS").length

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Banner & Session Counters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
            <QrCode size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800 flex items-center gap-2">
              Trạm soát vé điện tử (Check-in Station)
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Trực tuyến
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Hỗ trợ máy quét mã vạch USB / Bluetooth hoặc quét camera trực tiếp.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <CheckCircle2 size={16} className="text-emerald-600" />
            <div>
              <p className="text-slate-500 font-medium">Hợp lệ ca này</p>
              <p className="text-base font-black text-slate-800">{successCount} vé</p>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <AlertTriangle size={16} className="text-amber-500" />
            <div>
              <p className="text-slate-500 font-medium">Cảnh báo / Lỗi</p>
              <p className="text-base font-black text-slate-800">{warningCount} lượt</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scanner Station & Big Result Display */}
        <div className="lg:col-span-7 space-y-6">
          {/* Scanner Input Box */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Keyboard size={15} className="text-rose-500" /> Quét hoặc nhập mã vé
              </label>

              <div className="flex items-center gap-3 text-xs">
                <label className="flex items-center gap-1.5 text-slate-500 cursor-pointer hover:text-slate-700">
                  <input
                    type="checkbox"
                    checked={autoKeepFocus}
                    onChange={(e) => setAutoKeepFocus(e.target.checked)}
                    className="rounded border-slate-300 text-rose-500 focus:ring-0"
                  />
                  <span>Tự động giữ trỏ chuột</span>
                </label>

                <button
                  type="button"
                  onClick={cameraActive ? stopCamera : startCamera}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition border ${
                    cameraActive
                      ? "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100"
                      : "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200"
                  }`}
                >
                  {cameraActive ? (
                    <>
                      <CameraOff size={14} /> Tắt Camera
                    </>
                  ) : (
                    <>
                      <Camera size={14} /> Quét Camera
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Camera Viewfinder if active */}
            {cameraActive && (
              <div className="mb-4 relative rounded-xl overflow-hidden border-2 border-emerald-500/50 bg-black aspect-video flex items-center justify-center">
                <video ref={videoRef} className="w-full h-full object-cover" muted playsInline />
                <div className="absolute inset-0 border-2 border-dashed border-emerald-400/70 m-12 rounded-2xl pointer-events-none animate-pulse flex items-center justify-center">
                  <span className="text-xs font-bold bg-black/70 px-3 py-1 rounded-full text-emerald-300">
                    Đặt mã QR vé vào khung quét
                  </span>
                </div>
              </div>
            )}

            {cameraError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <XCircle size={16} className="shrink-0" />
                <span>{cameraError}</span>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleExecuteCheckIn()
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  placeholder="Mã vé (VD: TKT-..., bấm Enter để soát)..."
                  disabled={loading}
                  className="w-full h-14 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-lg font-bold placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition disabled:opacity-60"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded border border-slate-300">
                    Enter ↵
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !ticketInput.trim()}
                className="h-14 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-98 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-md shadow-rose-600/20 transition cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <span>Soát vé</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Large Result Feedback Display */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 transition-all">
            {lastResult.status === "IDLE" && (
              <div className="bg-white p-8 text-center text-slate-500 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
                  <QrCode size={32} />
                </div>
                <h3 className="text-base font-bold text-slate-700">Trạm soát vé đang chờ lệnh</h3>
                <p className="text-xs max-w-sm mx-auto text-slate-500">
                  Sử dụng súng bắn mã vạch quét trực tiếp lên màn hình điện thoại hoặc vé in của khách. Kết quả sẽ phản hồi tức thì bằng âm thanh và giao diện.
                </p>
              </div>
            )}

            {lastResult.status === "SUCCESS" && (
              <div className="bg-emerald-50/70 border border-emerald-200 p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black tracking-wider uppercase border border-emerald-300">
                      HỢP LỆ — MỜI VÀO RẠP
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">
                      {lastResult.ticket?.showtime?.movie?.title || "Vé xem phim hợp lệ"}
                    </h2>
                    <p className="text-xs text-emerald-700 font-medium">{lastResult.message}</p>
                  </div>
                </div>

                {/* Ticket Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-emerald-200 text-xs">
                  <div className="bg-white border border-emerald-100 p-3 rounded-xl shadow-xs">
                    <p className="text-slate-400 mb-0.5">Số ghế</p>
                    <p className="text-xl font-black text-emerald-600">
                      {lastResult.ticket?.seat?.row}
                      {lastResult.ticket?.seat?.number}
                    </p>
                    <span className="text-[10px] text-slate-500 uppercase">
                      Hạng: {lastResult.ticket?.seat?.type === "vip" ? "VIP" : "Thường"}
                    </span>
                  </div>

                  <div className="bg-white border border-emerald-100 p-3 rounded-xl shadow-xs">
                    <p className="text-slate-400 mb-0.5">Phòng chiếu</p>
                    <p className="text-base font-bold text-slate-800">
                      {lastResult.ticket?.showtime?.room?.name || "Phòng chiếu"}
                    </p>
                    <span className="text-[10px] text-slate-500 uppercase">
                      {lastResult.ticket?.showtime?.room?.format || "2D Digital"}
                    </span>
                  </div>

                  <div className="bg-white border border-emerald-100 p-3 rounded-xl shadow-xs">
                    <p className="text-slate-400 mb-0.5">Khung giờ</p>
                    <p className="text-base font-bold text-slate-800">
                      {lastResult.ticket?.showtime?.startTime
                        ? new Date(lastResult.ticket.showtime.startTime).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {lastResult.ticket?.showtime?.startTime
                        ? new Date(lastResult.ticket.showtime.startTime).toLocaleDateString("vi-VN")
                        : ""}
                    </span>
                  </div>

                  <div className="bg-white border border-emerald-100 p-3 rounded-xl shadow-xs">
                    <p className="text-slate-400 mb-0.5">Khách hàng</p>
                    <p className="text-sm font-bold text-slate-800 truncate">
                      {lastResult.ticket?.booking?.user?.fullName || "Khách đặt lẻ"}
                    </p>
                    <span className="text-[10px] text-slate-500">
                      {lastResult.ticket?.booking?.user?.phone || "Mã: " + lastResult.ticket?.ticketCode}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {lastResult.status === "ALREADY_USED" && (
              <div className="bg-rose-50 border border-rose-200 p-6 md:p-8 space-y-5">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/20">
                    <AlertTriangle size={36} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-md bg-rose-100 text-rose-800 text-xs font-black tracking-wider uppercase border border-rose-200">
                      CẢNH BÁO: VÉ ĐÃ ĐƯỢC SOÁT TRƯỚC ĐÓ
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">Vé không còn hiệu lực vào rạp</h2>
                    <p className="text-xs text-rose-700 font-semibold">{lastResult.message}</p>
                  </div>
                </div>

                {lastResult.ticket && (
                  <div className="bg-white border border-rose-200 p-4 rounded-xl text-xs space-y-2 shadow-xs">
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Phim:</span>
                      <span className="text-slate-900 font-bold">{lastResult.ticket.showtime?.movie?.title}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 pb-2">
                      <span className="text-slate-500">Ghế & Phòng:</span>
                      <span className="text-rose-600 font-bold">
                        Ghế {lastResult.ticket.seat?.row}
                        {lastResult.ticket.seat?.number} ({lastResult.ticket.showtime?.room?.name})
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Khách hàng:</span>
                      <span className="text-slate-800 font-medium">{lastResult.ticket.booking?.user?.fullName || "Khách"}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {lastResult.status === "INVALID" && (
              <div className="bg-amber-50 border border-amber-200 p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
                    <XCircle size={36} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-black tracking-wider uppercase border border-amber-200">
                      MÃ VÉ KHÔNG TỒN TẠI HOẶC BỊ HỦY
                    </span>
                    <h2 className="text-xl font-black text-slate-900 mt-1">Không tìm thấy vé trong hệ thống</h2>
                    <p className="text-xs text-amber-800 font-medium">{lastResult.message}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-amber-200 shadow-xs">
                  Gợi ý: Quý nhân viên hãy kiểm tra lại mã trên vé hoặc chuyển sang mục{" "}
                  <strong className="text-slate-800">Tra cứu đơn & vé</strong> để tìm kiếm theo số điện thoại khách hàng.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Scans in this session */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col h-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <History size={16} className="text-rose-500" />
                Lịch sử soát vé gần nhất
              </h3>
              <span className="text-xs font-medium text-slate-500">{recentScans.length} lượt</span>
            </div>

            {recentScans.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <Volume2 size={32} className="mx-auto text-slate-300" />
                <p className="text-xs font-medium">Chưa có lượt quét nào trong phiên này.</p>
              </div>
            ) : (
              <div className="space-y-2 overflow-y-auto max-h-[550px] pr-1 scrollbar-none">
                {recentScans.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.ticket) {
                        setLastResult({
                          status: item.status === "SUCCESS" ? "SUCCESS" : "ALREADY_USED",
                          message: item.message,
                          ticket: item.ticket,
                        })
                      }
                    }}
                    className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                      item.status === "SUCCESS"
                        ? "bg-slate-50 hover:bg-slate-100/80 border-slate-200"
                        : item.status === "ALREADY_USED"
                        ? "bg-rose-50/70 hover:bg-rose-50 border-rose-200"
                        : "bg-amber-50/70 hover:bg-amber-50 border-amber-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.status === "SUCCESS" ? (
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                        ) : item.status === "ALREADY_USED" ? (
                          <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                        ) : (
                          <XCircle size={15} className="text-amber-600 shrink-0" />
                        )}
                        <span className="font-mono font-bold text-slate-800">{item.ticketCode}</span>
                        {item.seatName && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[10px]">
                            Ghế {item.seatName}
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {item.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="truncate max-w-[200px]">
                        {item.movieTitle ? `${item.movieTitle} (${item.roomName})` : item.message}
                      </span>
                      <span className="text-slate-700 font-medium">{item.customerName || ""}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
