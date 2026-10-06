import React, { useState, useEffect, useCallback } from "react"
import {
  MonitorPlay, Plus, Edit3, Trash2, X, Loader2, CheckCircle2, AlertCircle, RefreshCw, Settings
} from "lucide-react"
import { useNavigate } from "react-router-dom"
import {
  adminGetCinemas, adminGetRooms, adminCreateRoom, adminUpdateRoom, adminDeleteRoom,
  Cinema, Room
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

function RoomModal({
  editRoom, cinemas, defaultCinemaId, onClose, onSaved,
}: {
  editRoom: Room | null; cinemas: Cinema[]; defaultCinemaId: string; onClose: () => void; onSaved: () => void;
}) {
  const [cinemaId, setCinemaId] = useState(editRoom?.cinemaId || defaultCinemaId || cinemas[0]?.id || "")
  const [name, setName] = useState(editRoom?.name || "")
  const [format, setFormat] = useState(editRoom?.format || "2D")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      if (editRoom) await adminUpdateRoom(editRoom.id, { name, format })
      else await adminCreateRoom({ cinemaId, name, format })
      onSaved()
    } catch (err: any) { setError(err.message || "Thao tác thất bại") }
    finally { setIsLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">{editRoom ? "Chỉnh sửa phòng chiếu" : "Thêm phòng chiếu mới"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!editRoom && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Rạp chiếu *</label>
              <select value={cinemaId} onChange={(e) => setCinemaId(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {cinemas.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên phòng chiếu *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Phòng 01"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Định dạng</label>
            <select value={format} onChange={(e) => setFormat(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              {["2D", "3D", "IMAX", "4DX"].map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          {error && <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl"><AlertCircle size={16} />{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 size={15} className="animate-spin" />Đang xử lý...</> : (editRoom ? "Lưu thay đổi" : "Tạo phòng")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminRoomsPage() {
  const navigate = useNavigate()
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [selectedCinema, setSelectedCinema] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [editRoom, setEditRoom] = useState<Room | null>(null)
  const [showModal, setShowModal] = useState(false)

  const loadAll = useCallback(async () => {
    setIsLoading(true)
    try {
      const [cRes, rRes] = await Promise.all([
        adminGetCinemas(),
        adminGetRooms(selectedCinema || undefined),
      ])
      setCinemas(cRes.cinemas)
      setRooms(rRes.rooms)
      if (!selectedCinema && cRes.cinemas[0]) setSelectedCinema(cRes.cinemas[0].id)
    } catch { setToast({ msg: "Không thể tải danh sách phòng chiếu", type: "error" }) }
    finally { setIsLoading(false) }
  }, [selectedCinema])

  useEffect(() => { loadAll() }, [selectedCinema])

  const handleDelete = async (room: Room) => {
    if (!confirm(`Xóa phòng chiếu "${room.name}"?`)) return
    try {
      const res = await adminDeleteRoom(room.id)
      setToast({ msg: res.message, type: "success" })
      loadAll()
    } catch (err: any) { setToast({ msg: err.message || "Xóa thất bại", type: "error" }) }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MonitorPlay size={24} className="text-blue-600" /> Quản lý phòng chiếu
          </h1>
          <p className="text-sm text-slate-500 mt-1">US.07 — {rooms.length} phòng chiếu</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadAll} className="px-3 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-2"><RefreshCw size={15} /></button>
          <button onClick={() => { setEditRoom(null); setShowModal(true) }}
            className="button button-primary flex items-center gap-2 px-4 py-2.5">
            <Plus size={17} /> Thêm phòng
          </button>
        </div>
      </div>

      {/* Cinema filter tabs */}
      {cinemas.length > 0 && (
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {cinemas.map((c) => (
            <button key={c.id} onClick={() => setSelectedCinema(c.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-colors
                ${selectedCinema === c.id ? "bg-blue-600 text-white" : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full flex items-center justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : rooms.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500">
            <MonitorPlay size={40} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có phòng chiếu nào</p>
          </div>
        ) : rooms.map((r) => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold text-slate-800">{r.name}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{r.cinemaName}</p>
              </div>
              <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">{r.format}</span>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Sức chứa: <span className="font-semibold text-slate-800">{r.capacity} ghế đang hoạt động</span>
            </p>
            <div className="flex gap-2">
              <button onClick={() => navigate(`/admin/rooms/${r.id}/seats`)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors">
                <Settings size={14} /> Sơ đồ ghế
              </button>
              <button onClick={() => { setEditRoom(r); setShowModal(true) }}
                className="p-2 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors">
                <Edit3 size={15} />
              </button>
              <button onClick={() => handleDelete(r)}
                className="p-2 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <RoomModal
          editRoom={editRoom} cinemas={cinemas} defaultCinemaId={selectedCinema}
          onClose={() => { setShowModal(false); setEditRoom(null) }}
          onSaved={() => {
            setShowModal(false); setEditRoom(null)
            setToast({ msg: editRoom ? "Cập nhật phòng thành công" : "Tạo phòng chiếu thành công", type: "success" })
            loadAll()
          }}
        />
      )}
    </div>
  )
}
