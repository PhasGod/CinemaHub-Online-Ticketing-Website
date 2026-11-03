import { ArrowLeft, Play, Ticket, Home, ChevronRight } from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { TrailerModal, type MovieCardData } from "../components/MovieCard"
import { movieCardMockData } from "../data/movieCardMockData"

// ─── Info Row for detail table ────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex items-start py-2 border-b border-slate-100 last:border-0">
      <dt className="text-slate-500 font-semibold text-[13px] shrink-0" style={{ width: 140 }}>
        {label}:
      </dt>
      <dd className="m-0 text-slate-800 text-[13px] leading-relaxed flex-1">
        {value}
      </dd>
    </div>
  )
}

// ─── Age Rating Badge ─────────────────────────────────────────────────────────

const AGE_COLORS: Record<string, string> = {
  T18: "#dc2626",
  T16: "#d97706",
  T13: "#2563eb",
  P: "#16a34a",
}

function AgeRatingBadge({ rating }: { rating: string }) {
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-white text-xs font-black tracking-wide"
      style={{ background: AGE_COLORS[rating] ?? "#6b7280" }}
    >
      {rating}
    </span>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MockMovieDetailPage() {
  const { id } = useParams()
  const movie = movieCardMockData.find((item) => item.id === id)
  const [trailerMovie, setTrailerMovie] = useState<MovieCardData | null>(null)

  if (!movie) {
    return (
      <main className="page-main">
        <section className="container py-20 text-center">
          <h1 className="text-2xl font-bold text-slate-700 mb-3">Không tìm thấy phim</h1>
          <p className="text-slate-500 mb-6">Bộ phim này không còn trong danh sách hiện tại.</p>
          <Link
            to="/movies"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0a4d92] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#063a80] transition-colors"
          >
            <ArrowLeft size={16} /> Quay lại danh sách phim
          </Link>
        </section>
      </main>
    )
  }

  const dateLabel =
    movie.status === "now-showing"
      ? "Đang chiếu từ"
      : movie.status === "special-screening"
      ? "Suất đặc biệt từ"
      : "Khởi chiếu"

  const statusLabel =
    movie.status === "now-showing"
      ? "PHIM ĐANG CHIẾU"
      : movie.status === "special-screening"
      ? "SUẤT CHIẾU ĐẶC BIỆT"
      : "PHIM SẮP CHIẾU"

  return (
    <main className="page-main">
      <section className="container" style={{ maxWidth: 960, paddingTop: 16, paddingBottom: 60 }}>

        {/* Breadcrumb */}
        <nav
          className="flex items-center gap-1.5 text-sm mb-6 flex-wrap"
          aria-label="Điều hướng"
        >
          <Link
            to="/"
            className="flex items-center gap-1 text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            <Home size={14} />
            Trang chủ
          </Link>
          <ChevronRight size={14} className="text-slate-400 shrink-0" />
          <Link
            to="/movies"
            className="text-slate-600 hover:text-slate-900 transition-colors font-medium"
          >
            Phim
          </Link>
          <ChevronRight size={14} className="text-slate-400 shrink-0" />
          <span className="text-[#0a4d92] font-semibold truncate max-w-[260px]">
            {movie.title}
          </span>
        </nav>

        {/* Back link */}
        <Link
          to="/movies"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors font-medium"
        >
          <ArrowLeft size={15} /> Danh sách phim
        </Link>

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(15,47,100,0.10)] border border-slate-100 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-0">

            {/* ── Poster Column ─────────────────────────────────── */}
            <div className="relative flex-shrink-0 md:w-[220px] lg:w-[240px] bg-slate-100">
              {movie.posterUrl ? (
                <img
                  src={movie.posterUrl}
                  alt={`Poster phim ${movie.title}`}
                  className="w-full h-full object-cover"
                  style={{ aspectRatio: "2/3", minHeight: 280 }}
                  onError={(e) => { e.currentTarget.style.display = "none" }}
                />
              ) : (
                <div
                  className="w-full flex items-center justify-center bg-slate-200 text-slate-400 text-sm font-medium"
                  style={{ aspectRatio: "2/3", minHeight: 280 }}
                >
                  Chưa có poster
                </div>
              )}

              {/* Age Rating Badge overlaid on poster top-left */}
              <div className="absolute top-3 left-3">
                <AgeRatingBadge rating={movie.ageRating} />
              </div>
            </div>

            {/* ── Info Column ───────────────────────────────────── */}
            <div className="flex-1 p-6 md:p-8 flex flex-col">

              {/* Status kicker */}
              <p className="text-[11px] font-black tracking-[1.5px] text-[#0a4d92] uppercase mb-2 opacity-70">
                {statusLabel}
              </p>

              {/* Title */}
              <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] leading-tight mb-3">
                {movie.title}
              </h1>

              {/* Synopsis */}
              {movie.description && (
                <p className="text-[#374151] text-sm leading-relaxed mb-5 max-w-2xl">
                  {movie.description}
                </p>
              )}

              {/* Key-Value Info Table */}
              <dl className="w-full mb-6">
                {movie.director && <InfoRow label="Đạo diễn" value={movie.director} />}
                {movie.cast && (
                  <InfoRow label="Diễn viên" value={movie.cast} />
                )}
                <InfoRow label="Thể loại" value={movie.genres} />
                <InfoRow label="Thời lượng" value={movie.duration} />
                {movie.language && <InfoRow label="Ngôn ngữ" value={movie.language} />}
                {movie.country && <InfoRow label="Quốc gia" value={movie.country} />}
                <InfoRow label={dateLabel} value={movie.releaseDate} />
              </dl>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-auto">
                {movie.trailerYoutubeId && (
                  <button
                    type="button"
                    onClick={() => setTrailerMovie(movie)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0a4d92] hover:bg-[#063a80] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                  >
                    <Play size={16} fill="currentColor" />
                    Xem trailer
                  </button>
                )}

                <Link
                  to={`/showtimes/${movie.id}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#fb7185] hover:bg-[#f43f5e] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-900/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                >
                  <Ticket size={16} />
                  Đặt vé ngay
                </Link>
              </div>

              {/* Booking link */}
              <p className="mt-4 text-sm text-[#0a4d92]">
                <Link
                  to={`/showtimes/${movie.id}`}
                  className="font-semibold underline underline-offset-2 hover:text-[#063a80] transition-colors"
                >
                  Xem các suất chiếu và Đặt vé trực tuyến ngay →
                </Link>
              </p>
            </div>
          </div>
        </div>

      </section>

      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />
    </main>
  )
}
