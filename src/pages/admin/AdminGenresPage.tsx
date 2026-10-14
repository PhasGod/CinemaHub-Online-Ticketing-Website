import React, { useState, useEffect, useCallback } from "react"
import { Tag, Plus, Edit3, Trash2, X, Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react"
import { adminGetGenres, adminCreateGenre, adminUpdateGenre, adminDeleteGenre, Genre } from "../../services/admin.service"

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

function GenreModal({ editGenre, onClose, onSaved }: { editGenre: Genre | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(editGenre?.name || "")
  const [slug, setSlug] = useState(editGenre?.slug || "")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      if (editGenre) {
        await adminUpdateGenre(editGenre.id, { name, slug: slug || undefined })
      } else {
        await adminCreateGenre({ name, slug: slug || undefined })
      }
      onSaved()
    } catch (err: any) { setError(err.message || "Thao tác thất bại") }
    finally { setIsLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">{editGenre ? "Chỉnh sửa thể loại" : "Thêm thể loại mới"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên thể loại *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Hành động"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Slug (tự động nếu để trống)</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="hanh-dong"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono" />
          </div>
          {error && <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl"><AlertCircle size={16} />{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 size={15} className="animate-spin" />Đang xử lý...</> : (editGenre ? "Lưu thay đổi" : "Tạo thể loại")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminGenresPage() {
  const [genres, setGenres] = useState<Genre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [editGenre, setEditGenre] = useState<Genre | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const loadGenres = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await adminGetGenres()
      setGenres(res.genres)
    } catch { setToast({ msg: "Không thể tải danh sách thể loại", type: "error" }) }
    finally { setIsLoading(false) }
  }, [])

  useEffect(() => { loadGenres() }, [loadGenres])

  const handleDelete = async (genre: Genre) => {
    if (genre.movieCount && genre.movieCount > 0) {
      setToast({ msg: `Không thể xóa "${genre.name}" vì đang có ${genre.movieCount} phim sử dụng`, type: "error" })
      return
    }
    if (!confirm(`Bạn có chắc muốn xóa thể loại "${genre.name}"?`)) return
    try {
      const res = await adminDeleteGenre(genre.id)
      setToast({ msg: res.message, type: "success" })
      loadGenres()
    } catch (err: any) { setToast({ msg: err.message || "Xóa thất bại", type: "error" }) }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Tag size={24} className="text-blue-600" /> Quản lý thể loại phim
          </h1>
          <p className="text-sm text-slate-500 mt-1">US.05 — {genres.length} thể loại</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadGenres} className="px-3 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-2">
            <RefreshCw size={15} />
          </button>
          <button onClick={() => { setEditGenre(null); setShowModal(true) }}
            className="button button-primary flex items-center gap-2 px-4 py-2.5">
            <Plus size={17} /> Thêm thể loại
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : genres.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Tag size={40} className="mx-auto mb-3 opacity-30" />
            <p>Chưa có thể loại phim nào</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Tên thể loại</th>
                <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Slug</th>
                <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Số phim</th>
                <th className="text-right px-5 py-3.5 text-slate-600 font-semibold">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {genres.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800">{g.name}</td>
                  <td className="px-5 py-3.5 font-mono text-slate-500 text-xs">{g.slug}</td>
                  <td className="px-5 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                      ${g.movieCount && g.movieCount > 0 ? "bg-blue-100 text-blue-800" : "bg-slate-100 text-slate-600"}`}>
                      {g.movieCount ?? 0} phim
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => { setEditGenre(g); setShowModal(true) }}
                        className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"><Edit3 size={15} /></button>
                      <button onClick={() => handleDelete(g)}
                        className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <GenreModal
          editGenre={editGenre}
          onClose={() => { setShowModal(false); setEditGenre(null) }}
          onSaved={() => { setShowModal(false); setEditGenre(null); loadGenres(); setToast({ msg: editGenre ? "Cập nhật thể loại thành công" : "Tạo thể loại thành công", type: "success" }) }}
        />
      )}
    </div>
  )
}
