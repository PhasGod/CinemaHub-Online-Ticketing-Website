import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
    adminGetMovies,
    type Movie,
} from "../services/admin.service"

function MovieCard({ movie }: { movie: Movie }) {
    return (
        <article className="movie-card">
            <Link to={`/movies/${movie.id}`} className="poster-wrap">
                {movie.poster ? (
                    <img
                        src={movie.poster}
                        alt={movie.title}
                        onError={(e) => {
                            e.currentTarget.style.display = "none"
                        }}
                    />
                ) : (
                    <div className="flex h-64 items-center justify-center bg-slate-100">
                        Chưa có poster
                    </div>
                )}

                <span className="format-badge">{movie.format}</span>
            </Link>

            <div className="movie-info">
                <Link to={`/movies/${movie.id}`} className="movie-title">
                    {movie.title}
                </Link>

                <p className="movie-meta">
                    {movie.runtime} phút · {movie.rating}/10
                </p>

                <p className="mb-3 text-sm text-slate-500">
                    {movie.genres.map((genre) => genre.name).join(", ")}
                </p>

                {movie.status === "coming_soon" && (
                    <p className="mb-3 text-sm text-blue-600">
                        Khởi chiếu: {
                            movie.releaseDate
                                ? new Date(movie.releaseDate).toLocaleDateString("vi-VN")
                                : "Chưa cập nhật"
                        }
                    </p>
                )}

                <Link
                    to={`/movies/${movie.id}`}
                    className="button button-primary card-button"
                >
                    Xem chi tiết
                </Link>
            </div>
        </article>
    )
}

export default function HomePage() {
    const [showing, setShowing] = useState<Movie[]>([])
    const [upcoming, setUpcoming] = useState<Movie[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [reload, setReload] = useState(0)

    useEffect(() => {
        let active = true

        setLoading(true)
        setError("")

        Promise.all([
            adminGetMovies({ status: "showing", limit: 5 }),
            adminGetMovies({ status: "coming_soon", limit: 4 }),
        ])
            .then(([showingResult, upcomingResult]) => {
                if (!active) return
                setShowing(showingResult.movies)
                setUpcoming(upcomingResult.movies)
            })
            .catch((err: unknown) => {
                if (!active) return
                setError(
                    err instanceof Error ? err.message : "Không thể tải phim",
                )
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [reload])

    const featured = showing[0] ?? upcoming[0]

    if (loading) {
        return (
            <main className="page-main">
                <p className="py-20 text-center">Đang tải trang chủ...</p>
            </main>
        )
    }

    if (error) {
        return (
            <main className="page-main text-center">
                <p role="alert" className="mb-5 text-red-600">{error}</p>
                <button
                    className="button button-primary"
                    onClick={() => setReload((value) => value + 1)}
                >
                    Thử lại
                </button>
            </main>
        )
    }

    return (
        <main>
            <div className="container home-top">
                {featured ? (
                    <section className="hero">
                        {featured.poster && (
                            <img
                                className="hero-backdrop"
                                src={featured.poster}
                                alt=""
                                onError={(e) => {
                                    e.currentTarget.style.display = "none"
                                }}
                            />
                        )}

                        <div className="hero-overlay" />

                        <div className="hero-content">
                            <div className="hero-copy">
                                <span className="hero-label">
                                    {featured.status === "showing"
                                        ? "Phim đang chiếu"
                                        : "Phim sắp chiếu"}
                                </span>

                                <h1>{featured.title}</h1>

                                <div className="hero-meta">
                                    <span>{featured.runtime} phút</span>
                                    <span>{featured.format}</span>
                                </div>

                                <div className="hero-rating">
                                    <b>{featured.rating}</b>
                                    <span>/10</span>
                                </div>

                                <p>
                                    {featured.description || "Chưa có mô tả phim."}
                                </p>

                                <div className="hero-buttons">
                                    <Link
                                        to={`/movies/${featured.id}`}
                                        className="button button-primary"
                                    >
                                        Xem chi tiết
                                    </Link>

                                    <Link
                                        to="/movies"
                                        className="button button-secondary"
                                    >
                                        Khám phá phim
                                    </Link>
                                </div>
                            </div>

                            {featured.poster && (
                                <div className="hero-poster">
                                    <img
                                        src={featured.poster}
                                        alt={featured.title}
                                        onError={(e) => {
                                            e.currentTarget.style.display = "none"
                                        }}
                                    />
                                    <span className="poster-chip">
                                        {featured.format}
                                    </span>
                                </div>
                            )}
                        </div>
                    </section>
                ) : (
                    <div className="rounded-2xl bg-white p-12 text-center">
                        Rạp chưa cập nhật phim.
                    </div>
                )}

                <div className="mt-6 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-700">
                    Lịch chiếu và chức năng đặt vé sẽ được triển khai ở sprint tiếp theo.
                </div>
            </div>

            <section className="container section-block">
                <div className="section-heading">
                    <div>
                        <span className="eyebrow">Khám phá điện ảnh</span>
                        <h2>Phim đang chiếu</h2>
                    </div>

                    <Link to="/movies" className="section-link">
                        Xem tất cả →
                    </Link>
                </div>

                {showing.length === 0 ? (
                    <p>Chưa có phim đang chiếu.</p>
                ) : (
                    <div className="movie-grid">
                        {showing.map((movie) => (
                            <MovieCard key={movie.id} movie={movie} />
                        ))}
                    </div>
                )}
            </section>

            <section className="upcoming-bg">
                <div className="container section-block">
                    <div className="section-heading">
                        <div>
                            <span className="eyebrow">Khám phá điện ảnh</span>
                            <h2>Phim sắp chiếu</h2>
                        </div>
                    </div>

                    {upcoming.length === 0 ? (
                        <p>Chưa có phim sắp chiếu.</p>
                    ) : (
                        <div className="movie-grid four">
                            {upcoming.map((movie) => (
                                <MovieCard key={movie.id} movie={movie} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </main>
    )
}