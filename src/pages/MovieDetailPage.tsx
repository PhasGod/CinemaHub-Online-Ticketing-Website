import { Play, Ticket, Home, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { TrailerModal, type MovieCardData } from "../components/MovieCard"
import { adminGetMovie, type Movie } from "../services/admin.service"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Đang cập nhật"
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(dateStr))
}

function getStatusLabel(status: Movie["status"]): string {
  if (status === "showing") return "Đang chiếu"
  if (status === "coming_soon") return "Sắp chiếu"
  return "Đã ngừng chiếu"
}

function getStatusColor(status: Movie["status"]): string {
  if (status === "showing") return "#16a34a"
  if (status === "coming_soon") return "#2563eb"
  return "#6b7280"
}

// ─── Age Rating Badge ──────────────────────────────────────────────────────────

function AgeRatingBadge({ rating }: { rating: number }) {
  let label = "P"
  let bg = "#16a34a"
  if (rating >= 9) { label = "T18"; bg = "#dc2626" }
  else if (rating >= 8.5) { label = "T16"; bg = "#d97706" }
  else if (rating >= 7.5) { label = "T13"; bg = "#2563eb" }

  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-white text-xs font-black tracking-wide"
      style={{ background: bg }}
    >
      {label}
    </span>
  )
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null
  return (
    <div className="flex gap-0 items-start py-2 border-b border-slate-100 last:border-0">
      <dt className="text-slate-500 font-semibold text-[13px] shrink-0" style={{ width: 140 }}>
        {label}:
      </dt>
      <dd className="m-0 text-slate-800 text-[13px] leading-relaxed flex-1">
        {value}
      </dd>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MovieDetailPage() {
  const { id } = useParams()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [trailerMovie, setTrailerMovie] = useState<MovieCardData | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError("")
    setMovie(null)

    if (!id) {
      setError("Đường dẫn phim không hợp lệ")
      setLoading(false)
      return
    }

    adminGetMovie(id)
      .then((res) => { if (active) setMovie(res.movie) })
      .catch((err: unknown) => {
        if (active) setError(err instanceof Error ? err.message : "Không thể tải phim")
      })
      .finally(() => { if (active) setLoading(false) })

    return () => { active = false }
  }, [id])


  // ── Loading / Error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="page-main">
        <section className="container py-20 text-center text-slate-500">
          Đang tải thông tin phim...
        </section>
      </main>
    )
  }

  if (error || !movie) {
    return (
      <main className="page-main">
        <section className="container py-20 text-center text-red-600" role="alert">
          {error || "Không tìm thấy phim."}
        </section>
      </main>
    )
  }

  const genresText = movie.genres.map((g) => g.name).join(", ") || "Đang cập nhật"
  const releaseDateFmt = formatDate(movie.releaseDate)
  const isUpcoming =
    movie.status === "coming_soon" ||
    (movie.status as string) === "UPCOMING" ||
    Boolean(movie.releaseDate && new Date(movie.releaseDate).getTime() > Date.now())

  const movieCardData: MovieCardData = {
    id: movie.id,
    title: movie.title,
    posterUrl: movie.poster || "",
    ageRating: "T13",
    badgeType: "2D",
    genres: genresText,
    duration: `${movie.runtime} phút`,
    releaseDate: releaseDateFmt,
    trailerYoutubeId: movie.trailerYoutubeId || undefined,
  }

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

        {/* Main card */}
        <div className="bg-white rounded-2xl shadow-[0_4px_24px_rgba(15,47,100,0.10)] border border-slate-100 overflow-hidden">
          <div className="flex flex-col md:flex-row gap-0">

            {/* ── Poster Column ─────────────────────────────────── */}
            <div className="relative flex-shrink-0 md:w-[220px] lg:w-[240px] bg-slate-100">
              {movie.poster ? (
                <img
                  src={movie.poster}
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
                <AgeRatingBadge rating={movie.rating} />
              </div>
            </div>

            {/* ── Info Column ───────────────────────────────────── */}
            <div className="flex-1 p-6 md:p-8 flex flex-col">

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
                <InfoRow label="Thể loại" value={genresText} />
                <InfoRow label="Thời lượng" value={`${movie.runtime} phút`} />
                <InfoRow
                  label="Ngôn ngữ"
                  value="Tiếng Anh"
                />
                <InfoRow
                  label="Định dạng"
                  value={movie.format.toUpperCase()}
                />
                <InfoRow
                  label="Trạng thái"
                  value={
                    <span style={{ color: getStatusColor(movie.status), fontWeight: 600 }}>
                      {getStatusLabel(movie.status)}
                    </span>
                  }
                />
                <InfoRow label="Ngày khởi chiếu" value={releaseDateFmt} />
                <InfoRow
                  label="Đánh giá"
                  value={
                    <span className="flex items-center gap-1.5">
                      <span className="text-amber-500 font-bold">{movie.rating}/10</span>
                      <span className="text-slate-400 text-xs">IMDb</span>
                    </span>
                  }
                />
              </dl>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 mt-auto">
                {movie.trailerYoutubeId && (
                  <button
                    type="button"
                    onClick={() => setTrailerMovie(movieCardData)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#0a4d92] hover:bg-[#063a80] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-blue-900/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                  >
                    <Play size={16} fill="currentColor" />
                    Xem trailer
                  </button>
                )}

                {isUpcoming ? (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center gap-2 rounded-xl bg-slate-300 text-slate-500 px-5 py-2.5 text-sm font-bold opacity-75 cursor-not-allowed shadow-none select-none"
                    aria-disabled="true"
                    title="Phim sắp khởi chiếu, chưa mở bán vé"
                  >
                    <Ticket size={16} />
                    COMING SOON
                  </button>
                ) : (
                  <Link
                    to={`/showtimes?movieId=${movie.id}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#fb7185] hover:bg-[#f43f5e] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-rose-900/20 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                  >
                    <Ticket size={16} />
                    Đặt vé ngay
                  </Link>
                )}
              </div>

              {/* Booking link / notice */}
              {isUpcoming ? (
                <p className="mt-4 text-sm text-slate-500 flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-500" />
                  Phim sắp khởi chiếu. Hệ thống sẽ mở đặt vé trước ngày khởi chiếu, vui lòng quay lại sau!
                </p>
              ) : (
                <p className="mt-4 text-sm text-[#0a4d92]">
                  <Link
                    to={`/showtimes?movieId=${movie.id}`}
                    className="font-semibold underline underline-offset-2 hover:text-[#063a80] transition-colors"
                  >
                    Xem các suất chiếu và Đặt vé trực tuyến ngay →
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

      </section>

      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />
    </main>
  )
}
