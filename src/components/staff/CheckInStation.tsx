import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Camera,
  CameraOff,
  Upload,
  Keyboard,
  Clock,
  Film,
  User,
  Armchair,
  Sparkles,
  ArrowRight,
  Volume2,
  X,
  RefreshCw,
} from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"
import {
  staffCheckInTicket,
  CheckInMaskedData,
  StaffCheckInResponse,
} from "../../services/bookingApi"

// ==========================================
// 1. ĐỊNH NGHĨA TYPES & INTERFACES
// ==========================================

export interface ScanLogItem {
  id: string
  timestamp: Date
  ticketCode: string
  movieTitle?: string
  seats?: string[]
  roomName?: string
  customerName?: string
  status: "SUCCESS" | "ERROR"
  message: string
}

export interface CurrentScanResult {
  status: "IDLE" | "SUCCESS" | "ERROR"
  message: string
  data?: CheckInMaskedData
  ticketCode?: string
  timestamp?: Date
}

// ==========================================
// 2. WEB AUDIO API - TẠO ÂM THANH TRỰC TIẾP
// ==========================================

function playAudioFeedback(type: "success" | "error") {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()

    if (type === "success") {
      // Âm Beep ngắn tần số cao (880Hz -> 1175Hz)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = "sine"
      osc.connect(gain)
      gain.connect(ctx.destination)

      const now = ctx.currentTime
      osc.frequency.setValueAtTime(880, now)
      osc.frequency.setValueAtTime(1175, now + 0.08)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)

      osc.start(now)
      osc.stop(now + 0.22)
    } else {
      // Âm Buzzer trầm cảnh báo (220Hz - 250Hz, ngắt quãng 2 hồi)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = "sawtooth"
      osc1.frequency.setValueAtTime(220, ctx.currentTime)
      osc1.connect(gain1)
      gain1.connect(ctx.destination)

      // Hồi 1 (0 -> 120ms)
      gain1.gain.setValueAtTime(0.3, ctx.currentTime)
      gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12)
      osc1.start(ctx.currentTime)
      osc1.stop(ctx.currentTime + 0.12)

      // Hồi 2 (160ms -> 320ms)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = "sawtooth"
      osc2.frequency.setValueAtTime(200, ctx.currentTime + 0.16)
      osc2.connect(gain2)
      gain2.connect(ctx.destination)

      gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.16)
      gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.34)
      osc2.start(ctx.currentTime + 0.16)
      osc2.stop(ctx.currentTime + 0.34)
    }
  } catch (e) {
    console.warn("Audio feedback error:", e)
  }
}

// ==========================================
// 3. COMPONENT CHÍNH: CheckInStation
// ==========================================

export function CheckInStation() {
  // --- States quản lý số lượng và kết quả ---
  const [validCount, setValidCount] = useState<number>(0)
  const [errorCount, setErrorCount] = useState<number>(0)
  const [recentLogs, setRecentLogs] = useState<ScanLogItem[]>([])
  const [currentResult, setCurrentResult] = useState<CurrentScanResult>({
    status: "IDLE",
    message: "Sẵn sàng nhận mã vé từ máy quét hoặc bàn phím.",
  })

  // --- States quản lý ô nhập liệu & máy quét ---
  const [ticketInput, setTicketInput] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const [autoKeepFocus, setAutoKeepFocus] = useState<boolean>(true)

  // --- States Camera & Modal quét QR ---
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isFileScanning, setIsFileScanning] = useState<boolean>(false)

  // --- Refs ---
  const inputRef = useRef<HTMLInputElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const html5QrCodeScannerRef = useRef<Html5Qrcode | null>(null)

  // ------------------------------------------
  // TỰ ĐỘNG GIỮ TRỎ CHUỘT (Auto Focus)
  // ------------------------------------------
  const triggerFocus = useCallback(() => {
    if (autoKeepFocus && inputRef.current && !isCameraModalOpen) {
      inputRef.current.focus()
    }
  }, [autoKeepFocus, isCameraModalOpen])

  useEffect(() => {
    triggerFocus()
  }, [triggerFocus, currentResult])

  // ------------------------------------------
  // HÀM XỬ LÝ SOÁT VÉ (Core Check-in Logic)
  // ------------------------------------------
  const handleProcessCheckIn = async (codeToScan?: string) => {
    const rawCode = (codeToScan || ticketInput).trim()
    if (!rawCode) return

    setLoading(true)
    setCameraError(null)

    try {
      // Gọi API POST /api/staff/tickets/check-in
      const res: StaffCheckInResponse = await staffCheckInTicket(rawCode)

      // 1. Phản hồi thành công
      playAudioFeedback("success")
      setValidCount((prev) => prev + 1)

      const successResult: CurrentScanResult = {
        status: "SUCCESS",
        message: res.message || "Soát vé thành công",
        data: res.data,
        ticketCode: rawCode,
        timestamp: new Date(),
      }
      setCurrentResult(successResult)

      // Lưu vào recentLogs (tối đa 10 lượt)
      const newLog: ScanLogItem = {
        id: `${rawCode}-${Date.now()}`,
        timestamp: new Date(),
        ticketCode: rawCode,
        movieTitle: res.data?.movieTitle,
        seats: res.data?.seats,
        roomName: res.data?.roomName,
        customerName: res.data?.customerName,
        status: "SUCCESS",
        message: res.message || "Soát vé thành công",
      }
      setRecentLogs((prev) => [newLog, ...prev.slice(0, 9)])
      setTicketInput("")
    } catch (err: any) {
      // 2. Phản hồi thất bại / Cảnh báo lỗi
      playAudioFeedback("error")
      setErrorCount((prev) => prev + 1)

      const errorMsg =
        err?.data?.error || err?.message || "Lỗi kiểm tra vé hoặc vé không hợp lệ"

      const errorResult: CurrentScanResult = {
        status: "ERROR",
        message: errorMsg,
        ticketCode: rawCode,
        timestamp: new Date(),
      }
      setCurrentResult(errorResult)

      // Lưu vào recentLogs (tối đa 10 lượt)
      const errorLog: ScanLogItem = {
        id: `err-${rawCode}-${Date.now()}`,
        timestamp: new Date(),
        ticketCode: rawCode,
        status: "ERROR",
        message: errorMsg,
      }
      setRecentLogs((prev) => [errorLog, ...prev.slice(0, 9)])
      setTicketInput("")
    } finally {
      setLoading(false)
      triggerFocus()
    }
  }

  // ------------------------------------------
  // XỬ LÝ CAMERA THỜI GIAN THỰC (html5-qrcode)
  // ------------------------------------------
  const startCameraScanner = async () => {
    setCameraError(null)
    setIsCameraModalOpen(true)

    // Đợi DOM modal render xong container
    setTimeout(async () => {
      try {
        const qrId = "qr-reader-viewport"
        if (!document.getElementById(qrId)) return

        if (html5QrCodeScannerRef.current) {
          try {
            await html5QrCodeScannerRef.current.stop()
          } catch {
            // bỏ qua
          }
        }

        const html5QrCode = new Html5Qrcode(qrId)
        html5QrCodeScannerRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 15,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            // Khi quét thành công mã QR
            stopCameraScanner()
            handleProcessCheckIn(decodedText)
          },
          () => {
            // Quá trình quét nền
          }
        )
      } catch (err: any) {
        console.error("Camera scanner error:", err)
        setCameraError(
          err?.message ||
            "Không thể truy cập máy ảnh. Vui lòng cấp quyền hoặc dùng tính năng Tải ảnh QR."
        )
      }
    }, 300)
  }

  const stopCameraScanner = async () => {
    if (html5QrCodeScannerRef.current) {
      try {
        await html5QrCodeScannerRef.current.stop()
        html5QrCodeScannerRef.current.clear()
      } catch (e) {
        console.warn("Camera stop error:", e)
      }
      html5QrCodeScannerRef.current = null
    }
    setIsCameraModalOpen(false)
    triggerFocus()
  }

  // ------------------------------------------
  // DỰ PHÒNG: TẢI ẢNH QR ĐỂ GIẢI MÃ (scanFile)
  // ------------------------------------------
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsFileScanning(true)
    setCameraError(null)

    try {
      const tempScanner = new Html5Qrcode("qr-hidden-file-reader")
      const decodedText = await tempScanner.scanFile(file, true)
      tempScanner.clear()

      if (decodedText) {
        handleProcessCheckIn(decodedText)
      }
    } catch (err: any) {
      playAudioFeedback("error")
      setCameraError(
        "Không thể nhận diện mã QR từ ảnh tải lên. Vui lòng thử lại với ảnh rõ hơn."
      )
    } finally {
      setIsFileScanning(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
      triggerFocus()
    }
  }

  return (
    <div className="space-y-6">
      {/* Container ẩn phục vụ scan file QR */}
      <div id="qr-hidden-file-reader" className="hidden" aria-hidden="true" />

      {/* ========================================================= */}
      {/* 1. KHỐI TIÊU ĐỀ & BỘ ĐẾM CA TRỰC (Header & Counters)       */}
      {/* ========================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs">
            <QrCode size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-900 flex items-center gap-2">
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

        {/* Bộ đếm thống kê ca trực */}
        <div className="flex items-center gap-3 text-xs">
          <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <div>
              <p className="text-slate-500 font-semibold">Hợp lệ ca này</p>
              <p className="text-base font-black text-slate-800">{validCount} vé</p>
            </div>
          </div>

          <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5">
            <AlertTriangle size={18} className="text-amber-500" />
            <div>
              <p className="text-slate-500 font-semibold">Cảnh báo / Lỗi</p>
              <p className="text-base font-black text-slate-800">{errorCount} lượt</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 2. KHUNG NHẬP LIỆU & LỊCH SỬ SOÁT VÉ                       */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* CỘT TRÁI: Ô NHẬP MÃ VÉ & CÁC NÚT ĐIỀU HÀNH */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Keyboard size={15} className="text-rose-500" /> Quét hoặc nhập mã vé
              </label>

              <div className="flex items-center gap-3 text-xs">
                {/* Checkbox tự động giữ trỏ chuột */}
                <label className="flex items-center gap-1.5 text-slate-600 cursor-pointer hover:text-slate-900 select-none">
                  <input
                    type="checkbox"
                    checked={autoKeepFocus}
                    onChange={(e) => setAutoKeepFocus(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-0 cursor-pointer"
                  />
                  <span>Tự động giữ trỏ chuột</span>
                </label>

                {/* Nút quét Camera */}
                <button
                  type="button"
                  onClick={startCameraScanner}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition active:scale-95 cursor-pointer"
                >
                  <Camera size={14} className="text-slate-600" />
                  <span>Quét Camera</span>
                </button>

                {/* Nút tải ảnh QR dự phòng */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isFileScanning}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  <Upload size={14} className="text-slate-600" />
                  <span>{isFileScanning ? "Đang đọc..." : "Tải ảnh QR"}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </div>

            {/* Thông báo lỗi Camera nếu có */}
            {cameraError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <XCircle size={16} className="shrink-0" />
                <span className="flex-1">{cameraError}</span>
                <button
                  type="button"
                  onClick={() => setCameraError(null)}
                  className="p-1 hover:bg-rose-100 rounded text-rose-500"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Form nhập mã vé với phím Enter tự động soát */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleProcessCheckIn()
              }}
              className="flex gap-2"
            >
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  onBlur={() => {
                    if (autoKeepFocus && !isCameraModalOpen) {
                      setTimeout(triggerFocus, 100)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleProcessCheckIn()
                    }
                  }}
                  placeholder="Mã vé (VD: TKT-..., bấm Enter để soát)..."
                  disabled={loading}
                  className="w-full h-14 pl-4 pr-20 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 font-mono text-base font-bold placeholder:font-sans placeholder:text-sm placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition disabled:opacity-60"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <span className="text-[10px] uppercase font-bold text-slate-500 bg-slate-200 px-2 py-1 rounded border border-slate-300">
                    ENTER ↵
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !ticketInput.trim()}
                className="h-14 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 active:scale-98 disabled:opacity-50 text-white font-bold flex items-center gap-2 shadow-md shadow-rose-500/20 transition cursor-pointer"
              >
                {loading ? (
                  <RefreshCw size={18} className="animate-spin" />
                ) : (
                  <>
                    <span>Soát vé</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* ========================================================= */}
          {/* HIỂN THỊ KẾT QUẢ SOÁT VÉ HIỆN TẠI (Big Current Result)    */}
          {/* ========================================================= */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 transition-all">
            {/* TRẠNG THÁI 1: CHỜ LỆNH (IDLE) */}
            {currentResult.status === "IDLE" && (
              <div className="bg-white p-8 text-center text-slate-500 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 mx-auto flex items-center justify-center text-slate-400">
                  <QrCode size={32} />
                </div>
                <h3 className="text-base font-bold text-slate-700">
                  Trạm soát vé đang chờ lệnh
                </h3>
                <p className="text-xs max-w-sm mx-auto text-slate-500 leading-relaxed">
                  Sử dụng súng bắn mã vạch quét trực tiếp lên màn hình điện thoại hoặc vé in của khách. Kết quả sẽ phản hồi tức thì bằng âm thanh và giao diện.
                </p>
              </div>
            )}

            {/* TRẠNG THÁI 2: THÀNH CÔNG (THẺ XANH) */}
            {currentResult.status === "SUCCESS" && (
              <div className="bg-emerald-50/80 border border-emerald-300 p-6 md:p-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 size={36} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-black tracking-wider uppercase border border-emerald-300">
                      HỢP LỆ — MỜI VÀO RẠP
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">
                      {currentResult.data?.movieTitle || "Vé xem phim hợp lệ"}
                    </h2>
                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">
                      {currentResult.message}
                    </p>
                  </div>
                </div>

                {/* Bảng chi tiết thông tin đã được Data Masking */}
                {currentResult.data && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-emerald-200 text-xs shadow-xs">
                    <div>
                      <p className="text-slate-400 font-medium">Phòng chiếu</p>
                      <p className="font-black text-slate-800 text-base mt-0.5">
                        {currentResult.data.roomName}
                      </p>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 mt-1">
                        {currentResult.data.format}
                      </span>
                    </div>

                    <div>
                      <p className="text-slate-400 font-medium">Ghế ngồi</p>
                      <p className="font-black text-rose-600 text-lg mt-0.5">
                        {currentResult.data.seats.join(", ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-medium">Suất chiếu</p>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {currentResult.data.showTime}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {currentResult.data.showDate}
                      </p>
                    </div>

                    <div>
                      <p className="text-slate-400 font-medium">Khách hàng</p>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        {currentResult.data.customerName}
                      </p>
                      <p className="text-slate-400 text-[10px] mt-1 font-mono">
                        Mã: {currentResult.ticketCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TRẠNG THÁI 3: CẢNH BÁO / LỖI / VÉ ĐÃ DÙNG (THẺ ĐỎ) */}
            {currentResult.status === "ERROR" && (
              <div className="bg-rose-50 border border-rose-300 p-6 md:p-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-rose-600/20">
                    <XCircle size={36} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 rounded-md bg-rose-100 text-rose-800 text-xs font-black tracking-wider uppercase border border-rose-300">
                      CẢNH BÁO — TỪ CHỐI CHECK-IN
                    </span>
                    <h2 className="text-xl font-black text-rose-700 mt-1">
                      {currentResult.message}
                    </h2>
                    {currentResult.ticketCode && (
                      <p className="text-xs text-slate-500 mt-1 font-mono">
                        Mã vé kiểm tra: <span className="font-bold text-slate-800">{currentResult.ticketCode}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-rose-200 text-xs text-slate-600 leading-relaxed">
                  Vui lòng yêu cầu khách xuất trình vé gốc trên app 5TOP Cinema hoặc liên hệ quầy vé để đối soát lại đơn hàng.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CỘT PHẢI: LỊCH SỬ SOÁT VÉ GẦN NHẤT (recentLogs tối đa 10) */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Clock size={15} className="text-rose-500" /> Lịch sử soát vé gần nhất
              </h3>
              <span className="text-xs font-semibold text-slate-400">
                {recentLogs.length} lượt
              </span>
            </div>

            {recentLogs.length === 0 ? (
              <div className="my-auto py-16 text-center text-slate-400 space-y-2">
                <Volume2 size={32} className="mx-auto opacity-30" />
                <p className="text-xs">Chưa có lượt quét nào trong phiên này.</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[520px] pr-1">
                {recentLogs.map((log) => {
                  const isSuccess = log.status === "SUCCESS"
                  const timeFormatted = log.timestamp.toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })

                  return (
                    <div
                      key={log.id}
                      className={`p-3 rounded-xl border transition text-xs ${
                        isSuccess
                          ? "bg-emerald-50/60 border-emerald-200"
                          : "bg-rose-50/60 border-rose-200"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-mono font-bold text-slate-800">
                          {log.ticketCode}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {timeFormatted}
                        </span>
                      </div>

                      {isSuccess ? (
                        <div className="flex items-center justify-between text-emerald-800">
                          <p className="font-bold truncate max-w-[180px]">
                            {log.movieTitle}
                          </p>
                          <span className="font-black px-2 py-0.5 rounded bg-emerald-100 border border-emerald-300 text-[11px]">
                            Ghế: {log.seats?.join(", ") || "—"}
                          </span>
                        </div>
                      ) : (
                        <p className="text-rose-600 font-medium leading-tight">
                          {log.message}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* 3. MODAL QUÉT CAMERA THỜI GIAN THỰC (html5-qrcode)         */}
      {/* ========================================================= */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera size={18} className="text-rose-500" />
                <h3 className="font-bold text-slate-800 text-sm">
                  Quét mã QR từ Camera
                </h3>
              </div>
              <button
                type="button"
                onClick={stopCameraScanner}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Vùng hiển thị camera quét QR */}
              <div
                id="qr-reader-viewport"
                className="w-full aspect-square rounded-2xl overflow-hidden bg-black border-2 border-emerald-500/40"
              />

              <p className="text-xs text-center text-slate-500">
                Căn chỉnh mã QR trên vé hoặc điện thoại của khách vào giữa khung hình để hệ thống tự động nhận diện.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={stopCameraScanner}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng camera
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckInStation

