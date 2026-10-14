import { ArrowLeft, Play, Ticket } from "lucide-react"
import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { TrailerModal, type MovieCardData } from "../components/MovieCard"
import { movieCardMockData } from "../data/movieCardMockData"

export default function MockMovieDetailPage() {
  const { id } = useParams()
  const movie = movieCardMockData.find((item) => item.id === id)
  const [trailerMovie, setTrailerMovie] = useState<MovieCardData | null>(null)

  if (!movie) {
    return (
      <main className="cinema-movie-detail-page">
        <section className="cinema-movie-detail-inner cinema-movie-detail-not-found">
          <h1>Không tìm thấy phim</h1>
          <p>Bộ phim này không còn trong danh sách hiện tại.</p>
          <Link to="/movies" className="cinema-detail-back"><ArrowLeft size={17} /> Quay lại danh sách phim</Link>
        </section>
      </main>
    )
  }

  const dateLabel = movie.status === "now-showing" ? "Đang chiếu từ" : movie.status === "special-screening" ? "Suất đặc biệt" : "Khởi chiếu"
  const details = [
    ["Thể loại", movie.genres],
    ["Thời lượng", movie.duration],
    ["Ngôn ngữ", movie.language],
    ["Quốc gia", movie.country],
    [dateLabel, movie.releaseDate],
    ["Đạo diễn", movie.director],
    ["Diễn viên", movie.cast],
  ].filter(([, value]) => Boolean(value))

  return (
    <main className="cinema-movie-detail-page">
      <section className="cinema-movie-detail-inner">
        <nav className="cinema-detail-breadcrumb" aria-label="Điều hướng">
          <Link to="/">Trang chủ</Link><span>/</span><Link to="/movies">Phim</Link><span>/</span><b>{movie.title}</b>
        </nav>
        <Link to="/movies" className="cinema-detail-back"><ArrowLeft size={17} /> Danh sách phim</Link>

        <article className="cinema-movie-detail-card">
          <div className="cinema-detail-poster">
            <img src={movie.posterUrl} alt={`Poster phim ${movie.title}`} />
            <span>{movie.ageRating}</span>
          </div>
          <div className="cinema-detail-copy">
            <p className="cinema-detail-kicker">{movie.status === "now-showing" ? "PHIM ĐANG CHIẾU" : "THÔNG TIN PHIM"}</p>
            <h1>{movie.title}</h1>
            <p className="cinema-detail-summary">{movie.description || `Khám phá thông tin, trailer và lịch chiếu của ${movie.title}.`}</p>
            <dl className="cinema-detail-facts">
              {details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
            </dl>
            <div className="cinema-detail-actions">
              <button type="button" className="cinema-detail-trailer" onClick={() => setTrailerMovie(movie)}><Play size={18} fill="currentColor" /> Xem trailer</button>
              <Link to={`/showtimes/${movie.id}`} className="cinema-detail-buy"><Ticket size={18} /> Mua vé</Link>
            </div>
          </div>
        </article>
      </section>
      <TrailerModal movie={trailerMovie} onClose={() => setTrailerMovie(null)} />
    </main>
  )
}
