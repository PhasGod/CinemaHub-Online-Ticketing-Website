import { Clapperboard, Play, Ticket, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

export type MovieCardData = {
  id: string
  posterUrl: string
  ageRating: "T18" | "T16" | "T13" | "P"
  badgeType: "HOT" | "2D" | "3D" | "IMAX"
  title: string
  genres: string
  duration: string
  releaseDate: string
  trailerYoutubeId?: string
  detailPath?: string
  status?: "now-showing" | "coming-soon" | "special-screening"
  description?: string
  director?: string
  cast?: string
  language?: string
  country?: string
}

type MovieCardProps = {
  movie: MovieCardData
  onPlayTrailer: (movie: MovieCardData) => void
  onBuyTicket: (movie: MovieCardData) => void
}

export function MovieCard({ movie, onPlayTrailer, onBuyTicket }: MovieCardProps) {
  const detailPath = movie.detailPath || `/chi-tiet-phim/${movie.id}`
  const isHot = movie.badgeType === "HOT"
  const releaseLabel = movie.status === "now-showing"
    ? "Đang chiếu từ"
    : movie.status === "special-screening"
      ? "Suất đặc biệt"
      : "Khởi chiếu"
  const [imageFailed, setImageFailed] = useState(false)

  return (
    <article className="cinema-movie-card">
      <div className="cinema-movie-poster">
        {!imageFailed ? (
          <img
            src={movie.posterUrl}
            alt={`Poster phim ${movie.title}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="cinema-poster-fallback" aria-label={`Poster thay thế cho phim ${movie.title}`}>
            <Clapperboard size={36} aria-hidden="true" />
            <span>{movie.badgeType}</span>
            <strong>{movie.title}</strong>
            <small>{movie.genres}</small>
          </div>
        )}
        <span className="cinema-age-badge">{movie.ageRating}</span>
        <span className={`cinema-format-badge ${isHot ? "is-hot" : ""}`}>
          {movie.badgeType}
        </span>
        <div className="cinema-poster-shade" />
        {movie.trailerYoutubeId ? (
          <button
            type="button"
            className="cinema-play-button"
            aria-label={`Xem trailer phim ${movie.title}`}
            onClick={() => onPlayTrailer(movie)}
          >
            <Play size={28} fill="currentColor" aria-hidden="true" />
            <span>Trailer</span>
          </button>
        ) : (
          <Link className="cinema-play-button" to={detailPath} aria-label={`Xem chi tiết phim ${movie.title}`}>
            <Play size={28} fill="currentColor" aria-hidden="true" />
            <span>Chi tiết</span>
          </Link>
        )}
      </div>

      <div className="cinema-movie-content">
        <h2 title={movie.title}>
          <Link to={detailPath}>{movie.title}</Link>
        </h2>
        <p className="cinema-movie-genres">{movie.genres}</p>
        <div className="cinema-movie-meta">
          <span>{movie.duration}</span>
          <span className="cinema-release-date">{releaseLabel}: {movie.releaseDate}</span>
        </div>
        <button
          type="button"
          className="cinema-buy-button"
          onClick={() => onBuyTicket(movie)}
        >
          <Ticket size={18} aria-hidden="true" />
          MUA VÉ
        </button>
      </div>
    </article>
  )
}

export function TrailerModal({
  movie,
  onClose,
}: {
  movie: MovieCardData | null
  onClose: () => void
}) {
  useEffect(() => {
    if (!movie) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [movie, onClose])

  if (!movie) return null

  return (
    <div className="cinema-trailer-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="cinema-trailer-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="trailer-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="cinema-trailer-header">
          <div>
            <span>TRAILER CHÍNH THỨC</span>
            <h2 id="trailer-title">{movie.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng trailer">
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <div className="cinema-video-frame">
          {movie.trailerYoutubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${movie.trailerYoutubeId}?autoplay=1&rel=0`}
              title={`Trailer ${movie.title}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : <p>Trailer của phim này đang được cập nhật.</p>}
        </div>
      </section>
    </div>
  )
}
