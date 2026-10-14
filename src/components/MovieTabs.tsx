import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { adminGetMovies, type Movie } from "../services/admin.service"
import { MovieCard, TrailerModal, type MovieCardData } from "./MovieCard"
import { ScrollReveal } from "./ScrollReveal"

type MovieStatus = "now-showing" | "coming-soon" | "special-screening"

const tabs: Array<{ id: MovieStatus; label: string }> = [
  { id: "now-showing", label: "PHIM ĐANG CHIẾU" },
  { id: "coming-soon", label: "PHIM SẮP CHIẾU" },
  { id: "special-screening", label: "SUẤT CHIẾU ĐẶC BIỆT" },
]

const specialScreeningSlugs = new Set([
  "interstellar-special", "your-name-special", "la-la-land-special", "spirited-away-special",
])

function toDisplayMovie(movie: Movie): MovieCardData {
  const status: MovieStatus = specialScreeningSlugs.has(movie.slug)
    ? "special-screening"
    : movie.status === "coming_soon" ? "coming-soon" : "now-showing"
  const releaseDate = movie.releaseDate
    ? new Intl.DateTimeFormat("vi-VN", { timeZone: "UTC" }).format(new Date(movie.releaseDate))
    : "Đang cập nhật"
  const format = movie.format.toUpperCase()

  return {
    id: movie.id,
    posterUrl: movie.poster || "",
    ageRating: movie.rating >= 9 ? "T18" : movie.rating >= 8.5 ? "T16" : "T13",
    badgeType: format === "IMAX" || format === "3D" || format === "2D" ? format : "HOT",
    title: movie.title,
    genres: movie.genres.map((genre) => genre.name).join(", ") || "Đang cập nhật",
    duration: `${movie.runtime} phút`,
    releaseDate,
    status,
    description: movie.description || undefined,
    trailerYoutubeId: movie.trailerYoutubeId || undefined,
    detailPath: `/movies/${movie.id}`,
  }
}

export function MovieTabs() {
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<MovieStatus>("now-showing")
  const [movies, setMovies] = useState<MovieCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [trailerMovie, setTrailerMovie] = useState<MovieCardData | null>(null)
  const [bookingMessage, setBookingMessage] = useState("")

  useEffect(() => {
    let active = true
    setLoading(true)
    adminGetMovies({ limit: 100 })
      .then((result) => {
        if (active) setMovies(result.movies.map(toDisplayMovie))
      })
      .catch((error: unknown) => {
        if (active) setLoadError(error instanceof Error ? error.message : "Không thể tải danh sách phim")
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const searchQuery = (searchParams.get("search") || "").trim().toLocaleLowerCase("vi-VN")
  const filteredMovies = useMemo(() => movies.filter((movie) => {
    const matchesSearch = !searchQuery || `${movie.title} ${movie.genres}`.toLocaleLowerCase("vi-VN").includes(searchQuery)
    return matchesSearch && (Boolean(searchQuery) || movie.status === activeTab)
  }), [activeTab, movies, searchQuery])

  const selectTab = (tab: MovieStatus) => {
    setActiveTab(tab)
    setBookingMessage("")
  }

  return (
    <section className="cinema-tabs-section" aria-label="Danh sách phim">
      <div className="cinema-tabs" role="tablist" aria-label="Danh mục phim">
        {tabs.map((tab) => (
          <button key={tab.id} id={`movie-tab-${tab.id}`} type="button" role="tab"
            aria-selected={activeTab === tab.id} aria-controls="movie-tab-panel"
            className={activeTab === tab.id ? "is-active" : ""} onClick={() => selectTab(tab.id)}>
            {tab.label}
          </button>
        ))}
      </div>

      <div id="movie-tab-panel" role="tabpanel" aria-labelledby={`movie-tab-${activeTab}`}>
        {loading ? <p className="cinema-movie-state">Đang tải danh sách phim...</p>
          : loadError ? <p className="cinema-movie-state is-error">{loadError}</p>
            : filteredMovies.length === 0 ? <p className="cinema-movie-state">Chưa có phim phù hợp.</p>
              : <div className="cinema-movie-grid">
                {filteredMovies.map((movie, index) => (
                  <ScrollReveal key={movie.id} delay={index * 0.12}>
                    <MovieCard movie={movie} onPlayTrailer={setTrailerMovie}
                      onBuyTicket={(selectedMovie) => setBookingMessage(`Bạn đã chọn mua vé cho “${selectedMovie.title}”.`)} />
                  </ScrollReveal>
                ))}
              </div>}
        {bookingMessage && <p className="cinema-booking-message" role="status">{bookingMessage}</p>}
      </div>

      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />
    </section>
  )
}
