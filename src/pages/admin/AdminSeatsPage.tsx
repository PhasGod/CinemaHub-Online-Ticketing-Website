import React, { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, X, RotateCcw, Save, Settings
} from "lucide-react"
import {
  adminGetRoom, adminGetSeats, adminGenerateSeats, adminUpdateSeat, adminBatchUpdateSeats, adminClearSeats,
  Seat
} from "../../services/admin.service"

function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium
      ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={15} /></button>
    </div>
  )
}

export function AdminSeatsPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()

  const [roomName, setRoomName] = useState("")
  const [seats, setSeats] = useState<Seat[]>([])
  const [capacity, setCapacity] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [hasExisting, setHasExisting] = useState(false)

  // Generate layout form
  const [rowCount, setRowCount] = useState(6)
  const [seatsPerRow, setSeatsPerRow] = useState(10)
  const [vipRows, setVipRows] = useState("D,E,F")
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false)

  const loadSeats = useCallback(async () => {
    if (!roomId) return
    setIsLoading(true)
    try {
      const [roomRes, seatsRes] = await Promise.all([
        adminGetRoom(roomId),
        adminGetSeats(roomId),
      ])
      setRoomName(roomRes.room.name)
      setSeats(seatsRes.seats)
      setCapacity(roomRes.room.capacity)
      setHasExisting(seatsRes.seats.length > 0)
    } catch { setToast({ msg: "Không thể tải dữ liệu ghế", type: "error" }) }
    finally { setIsLoading(false) }
  }, [roomId])

  useEffect(() => { loadSeats() }, [loadSeats])

  const handleGenerate = async (overwrite = false) => {
    if (!roomId) return
    const vipRowArr = vipRows.split(",").map((r) => r.trim().toUpperCase()).filter(Boolean)
    setIsGenerating(true)
    try {
      const res = await adminGenerateSeats(roomId, {
        rowCount, seatsPerRow, vipRows: vipRowArr, overwrite,
      })
      setToast({ msg: res.message, type: "success" })
      setShowGenerateConfirm(false)
      loadSeats()
    } catch (err: any) {
      if (err.message?.includes("overwrite")) {
        setShowGenerateConfirm(true)
      } else {
        setToast({ msg: err.message || "Không thể sinh sơ đồ ghế", type: "error" })
      }
    } finally { setIsGenerating(false) }
  }

  const handleSeatClick = (seat: Seat) => {
    const next = new Set(selected)
    if (next.has(seat.id)) next.delete(seat.id)
    else next.add(seat.id)
    setSelected(next)
  }

  const handleBatchSetType = async (type: "standard" | "vip") => {
    if (!roomId || selected.size === 0) return
    try {
      const res = await adminBatchUpdateSeats(roomId, { seatIds: [...selected], type })
      setToast({ msg: `${res.message} — Sức chứa: ${res.newRoomCapacity} ghế`, type: "success" })
      setSelected(new Set())
      loadSeats()
    } catch (err: any) { setToast({ msg: err.message, type: "error" }) }
  }

  const handleBatchToggleActive = async (isActive: boolean) => {
    if (!roomId || selected.size === 0) return
    try {
      const res = await adminBatchUpdateSeats(roomId, { seatIds: [...selected], isActive })
      setToast({ msg: `${res.message} — Sức chứa: ${res.newRoomCapacity} ghế`, type: "success" })
      setSelected(new Set())
      loadSeats()
    } catch (err: any) { setToast({ msg: err.message, type: "error" }) }
  }

  const handleClearAll = async () => {
    if (!roomId) return
    if (!confirm("Xóa toàn bộ sơ đồ ghế của phòng này?")) return
    try {
      const res = await adminClearSeats(roomId)
      setToast({ msg: res.message, type: "success" })
      loadSeats()
    } catch (err: any) { setToast({ msg: err.message, type: "error" }) }
  }

  // Group seats by row
  const seatsByRow = seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    if (!acc[seat.row]) acc[seat.row] = []
    acc[seat.row].push(seat)
    return acc
  }, {})
  const rowKeys = Object.keys(seatsByRow).sort()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-600" size={36} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/admin/rooms")}
          className="p-2 hover:bg-slate-100 rounded-xl text-slate-600">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Settings size={24} className="text-blue-600" /> Sơ đồ ghế — {roomName}
          </h1>
          <p className="text-sm text-slate-500 mt-1">US.08 — Sức chứa thực: {capacity} ghế đang hoạt động</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left panel: Generate + controls */}
        <div className="lg:col-span-1 space-y-4">
          {/* Generate layout */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Settings size={16} /> Sinh sơ đồ ghế</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Số hàng (1-26)</label>
                <input type="number" min={1} max={26} value={rowCount} onChange={(e) => setRowCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Số ghế/hàng (1-30)</label>
                <input type="number" min={1} max={30} value={seatsPerRow} onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Hàng VIP (vd: D,E,F)</label>
                <input value={vipRows} onChange={(e) => setVipRows(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
              </div>

              {showGenerateConfirm && (
                <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-800">
                  <p className="font-semibold mb-2">⚠️ Phòng đã có {seats.length} ghế. Ghi đè sẽ xóa toàn bộ sơ đồ cũ!</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowGenerateConfirm(false)}
                      className="flex-1 px-3 py-1.5 border border-amber-300 rounded-lg">Hủy</button>
                    <button onClick={() => handleGenerate(true)} disabled={isGenerating}
                      className="flex-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg font-semibold">
                      {isGenerating ? "Đang xử lý..." : "Xác nhận ghi đè"}
                    </button>
                  </div>
                </div>
              )}

              <button onClick={() => handleGenerate(false)} disabled={isGenerating}
                className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {isGenerating ? <><Loader2 size={15} className="animate-spin" />Đang sinh...</> : <><Save size={15} />Sinh sơ đồ</>}
              </button>

              {seats.length > 0 && (
                <button onClick={handleClearAll}
                  className="w-full py-2 border border-rose-300 text-rose-700 rounded-xl text-xs font-semibold hover:bg-rose-50 flex items-center justify-center gap-2">
                  <RotateCcw size={13} /> Xóa toàn bộ sơ đồ
                </button>
              )}
            </div>
          </div>

          {/* Batch actions */}
          {selected.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 space-y-2">
              <p className="text-sm font-semibold text-blue-800">Đã chọn {selected.size} ghế</p>
              <button onClick={() => handleBatchSetType("standard")}
                className="w-full py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50">
                Đặt thành Standard
              </button>
              <button onClick={() => handleBatchSetType("vip")}
                className="w-full py-2 bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold hover:bg-amber-200">
                Đặt thành VIP
              </button>
              <button onClick={() => handleBatchToggleActive(false)}
                className="w-full py-2 bg-rose-100 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold hover:bg-rose-200">
                Vô hiệu hóa
              </button>
              <button onClick={() => handleBatchToggleActive(true)}
                className="w-full py-2 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold hover:bg-emerald-200">
                Kích hoạt
              </button>
              <button onClick={() => setSelected(new Set())}
                className="w-full py-2 text-slate-500 text-xs hover:underline">
                Bỏ chọn
              </button>
            </div>
          )}

          {/* Legend */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs space-y-2">
            <p className="font-semibold text-slate-700 mb-3">Chú thích</p>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-slate-200 border border-slate-300" /> Standard</div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-amber-100 border border-amber-300" /> VIP</div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-blue-200 border border-blue-400" /> Đang chọn</div>
            <div className="flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-slate-100 border border-dashed border-slate-300 opacity-50" /> Vô hiệu hóa</div>
          </div>
        </div>

        {/* Right panel: Seat grid */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-auto p-5">
            {seats.length === 0 ? (
              <div className="py-16 text-center text-slate-500">
                <Settings size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium mb-1">Chưa có sơ đồ ghế</p>
                <p className="text-sm">Sử dụng form bên trái để sinh sơ đồ ghế</p>
              </div>
            ) : (
              <div className="min-w-max">
                {/* Screen */}
                <div className="mb-8 flex justify-center">
                  <div className="w-3/4 py-2 text-center text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 rounded-xl border border-slate-300">
                    MÀN HÌNH
                  </div>
                </div>

                {rowKeys.map((row) => (
                  <div key={row} className="flex items-center justify-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-500 w-5 text-center shrink-0">{row}</span>
                    <div className="flex gap-1.5">
                      {seatsByRow[row].map((seat) => {
                        const isSelected = selected.has(seat.id)
                        const isVip = seat.type === "vip"
                        const isDisabled = !seat.isActive
                        return (
                          <button
                            key={seat.id}
                            onClick={() => handleSeatClick(seat)}
                            title={`${row}${seat.number} — ${isVip ? "VIP" : "Standard"}${isDisabled ? " (Vô hiệu)" : ""}`}
                            className={`w-7 h-7 rounded-lg text-[10px] font-bold border transition-all select-none
                              ${isSelected
                                ? "bg-blue-500 border-blue-600 text-white scale-110 shadow-md"
                                : isDisabled
                                  ? "bg-slate-100 border-dashed border-slate-300 text-slate-300 opacity-50"
                                  : isVip
                                    ? "bg-amber-100 border-amber-300 text-amber-800 hover:bg-amber-200"
                                    : "bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300"}`}>
                            {seat.number}
                          </button>
                        )
                      })}
                    </div>
                    <span className="text-xs font-bold text-slate-500 w-5 text-center shrink-0">{row}</span>
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
