import React, { useState, useEffect, useCallback } from "react"
import {
  Film, Plus, Search, Edit3, Trash2, X, Loader2, CheckCircle2,
  AlertCircle, RefreshCw, ChevronLeft, ChevronRight, Star
} from "lucide-react"
import {
  adminGetMovies, adminGetGenres, adminCreateMovie, adminUpdateMovie, adminDeleteMovie,
  Movie, Genre
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

const STATUS_LABELS: Record<string, string> = { coming_soon: "Sắp chiếu", showing: "Đang chiếu", ended: "Đã kết thúc" }
const STATUS_COLORS: Record<string, string> = {
  coming_soon: "bg-amber-100 text-amber-800",
  showing: "bg-emerald-100 text-emerald-800",
  ended: "bg-slate-100 text-slate-600",
}

function MovieModal({
  editMovie, allGenres, onClose, onSaved,
}: {
  editMovie: Movie | null; allGenres: Genre[]; onClose: () => void; onSaved: () => void;
}) {
  const isEdit = !!editMovie
  const [title, setTitle] = useState(editMovie?.title || "")
  const [description, setDescription] = useState(editMovie?.description || "")
  const [poster, setPoster] = useState(editMovie?.poster || "")
  const [format, setFormat] = useState(editMovie?.format || "2D")
  const [runtime, setRuntime] = useState(editMovie?.runtime || 120)
  const [rating, setRating] = useState(editMovie?.rating || 0)
  const [status, setStatus] = useState(editMovie?.status || "showing")
  const [releaseDate, setReleaseDate] = useState(
    editMovie?.releaseDate ? editMovie.releaseDate.split("T")[0] : ""
  )
  const [selectedGenreIds, setSelectedGenreIds] = useState<string[]>(
    editMovie?.genres?.map((g) => g.id) || []
  )
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const toggleGenre = (id: string) => {
    setSelectedGenreIds((prev) => prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (selectedGenreIds.length === 0) { setError("Vui lòng chọn ít nhất một thể loại"); return }
    setIsLoading(true)
    const data = {
      title, description: description || undefined, poster: poster || undefined,
      format, runtime: Number(runtime), rating: Number(rating), status,
      releaseDate: releaseDate || undefined, genreIds: selectedGenreIds,
    }
    try {
      if (isEdit) await adminUpdateMovie(editMovie!.id, data)
      else await adminCreateMovie(data)
      onSaved()
    } catch (err: any) { setError(err.message || "Thao tác thất bại") }
    finally { setIsLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-4 p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">{isEdit ? "Chỉnh sửa phim" : "Thêm phim mới"}</h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Tên phim *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Poster URL</label>
              <input value={poster} onChange={(e) => setPoster(e.target.value)} placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Định dạng</label>
              <select value={format} onChange={(e) => setFormat(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                {["2D", "3D", "IMAX", "4DX"].map((f) => <option key={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Thời lượng (phút) *</label>
              <input type="number" min={1} max={500} value={runtime} onChange={(e) => setRuntime(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Đánh giá (0-10)</label>
              <input type="number" min={0} max={10} step={0.1} value={rating} onChange={(e) => setRating(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày khởi chiếu</label>
              <input type="date" value={releaseDate} onChange={(e) => setReleaseDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as "coming_soon" | "showing" | "ended")}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                <option value="showing">Đang chiếu</option>
                <option value="coming_soon">Sắp chiếu</option>
                <option value="ended">Đã kết thúc</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mô tả</label>
              <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Thể loại *</label>
              <div className="flex flex-wrap gap-2">
                {allGenres.map((g) => (
                  <button type="button" key={g.id}
                    onClick={() => toggleGenre(g.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors
                      ${selectedGenreIds.includes(g.id)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-slate-600 border-slate-300 hover:border-blue-400"}`}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {error && <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl"><AlertCircle size={16} />{error}</div>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">Hủy</button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 size={15} className="animate-spin" />Đang xử lý...</> : (isEdit ? "Lưu thay đổi" : "Tạo phim")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function AdminMoviesPage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [editMovie, setEditMovie] = useState<Movie | null>(null)
  const [showModal, setShowModal] = useState(false)

  const loadAll = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const [moviesRes, genresRes] = await Promise.all([
        adminGetMovies({ q: search, status: statusFilter || undefined, page, limit: 10 }),
        adminGetGenres(),
      ])
      setMovies(moviesRes.movies)
      setPagination(moviesRes.pagination)
      setGenres(genresRes.genres)
    } catch { setToast({ msg: "Không thể tải danh sách phim", type: "error" }) }
    finally { setIsLoading(false) }
  }, [search, statusFilter])

  useEffect(() => { loadAll(1) }, [search, statusFilter])

  const handleDelete = async (movie: Movie) => {
    if (!confirm(`Xóa phim "${movie.title}"?`)) return
    try {
      const res = await adminDeleteMovie(movie.id)
      setToast({ msg: res.message, type: "success" })
      loadAll(1)
    } catch (err: any) { setToast({ msg: err.message || "Xóa thất bại", type: "error" }) }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Film size={24} className="text-blue-600" /> Quản lý phim
          </h1>
          <p className="text-sm text-slate-500 mt-1">US.06 — Tổng {pagination.total} bộ phim</p>
        </div>
        <button onClick={() => { setEditMovie(null); setShowModal(true) }}
          className="button button-primary flex items-center gap-2 px-4 py-2.5">
          <Plus size={17} /> Thêm phim
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input placeholder="Tìm kiếm tên phim..."
            value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]">
          <option value="">Tất cả trạng thái</option>
          <option value="showing">Đang chiếu</option>
          <option value="coming_soon">Sắp chiếu</option>
          <option value="ended">Đã kết thúc</option>
        </select>
        <button onClick={() => loadAll(1)} className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-2">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
        ) : movies.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Film size={40} className="mx-auto mb-3 opacity-30" />
            <p>Không tìm thấy phim nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Phim</th>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Định dạng</th>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Thời lượng</th>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Đánh giá</th>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Trạng thái</th>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Thể loại</th>
                  <th className="text-right px-5 py-3.5 text-slate-600 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movies.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {m.poster ? (
                          <img src={m.poster} alt="" className="w-10 h-14 object-cover rounded-lg shrink-0" onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
                        ) : (
                          <div className="w-10 h-14 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                            <Film size={16} className="text-slate-400" />
                          </div>
                        )}
                        <span className="font-medium text-slate-800 max-w-[180px] truncate">{m.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{m.format}</td>
                    <td className="px-5 py-3.5 text-slate-600">{Math.floor(m.runtime / 60)}h {m.runtime % 60}m</td>
                    <td className="px-5 py-3.5">
                      <span className="flex items-center gap-1 text-amber-600 font-semibold">
                        <Star size={13} fill="currentColor" />{m.rating.toFixed(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[m.status]}`}>
                        {STATUS_LABELS[m.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {m.genres.slice(0, 2).map((g) => (
                          <span key={g.id} className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-xs">{g.name}</span>
                        ))}
                        {m.genres.length > 2 && <span className="text-xs text-slate-400">+{m.genres.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditMovie(m); setShowModal(true) }}
                          className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg"><Edit3 size={15} /></button>
                        <button onClick={() => handleDelete(m)}
                          className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-lg"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/50">
            <span className="text-sm text-slate-500">Trang {pagination.page}/{pagination.totalPages} — {pagination.total} phim</span>
            <div className="flex gap-2">
              <button disabled={pagination.page <= 1} onClick={() => loadAll(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} /></button>
              <button disabled={pagination.page >= pagination.totalPages} onClick={() => loadAll(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <MovieModal
          editMovie={editMovie} allGenres={genres}
          onClose={() => { setShowModal(false); setEditMovie(null) }}
          onSaved={() => {
            setShowModal(false); setEditMovie(null)
            setToast({ msg: editMovie ? "Cập nhật phim thành công" : "Thêm phim thành công", type: "success" })
            loadAll(1)
          }}
        />
      )}
    </div>
  )
}
