import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import {
    adminGetMovies,
    type Movie,
} from "../services/admin.service"

export default function MoviesPage() {
    const [status, setStatus] = useState("showing")
    const [movies, setMovies] = useState<Movie[]>([])
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

    useEffect(() => {
        let active = true
        setLoading(true)
        setError("")

        adminGetMovies({ status, page, limit: 12 })
            .then((res) => {
                if (!active) return
                setMovies(res.movies)
                setTotalPages(res.pagination.totalPages)
            })
            .catch((err: unknown) => {
                if (active) {
                    setError(
                        err instanceof Error ? err.message : "Không thể tải phim",
                    )
                }
            })
            .finally(() => {
                if (active) setLoading(false)
            })

        return () => {
            active = false
        }
    }, [status, page])

    return (
        <main className="page-main">
            <section className="container">
                <div className="page-header">
                    <h1>Phim tại 5TOP CINEMA</h1>
                </div>

                <select
                    aria-label="Trạng thái phim"
                    value={status}
                    onChange={(e) => {
                        setStatus(e.target.value)
                        setPage(1)
                    }}
                    className="mb-6 rounded-xl border bg-white p-3"
                >
                    <option value="showing">Đang chiếu</option>
                    <option value="coming_soon">Sắp chiếu</option>
                </select>

                {loading ? (
                    <p className="py-10 text-center">Đang tải phim...</p>
                ) : error ? (
                    <p role="alert" className="py-10 text-center text-red-600">
                        {error}
                    </p>
                ) : movies.length === 0 ? (
                    <p className="py-10 text-center">Chưa có phim phù hợp.</p>
                ) : (
                    <>
                        <div className="movie-grid six">
                            {movies.map((movie) => (
                                <article key={movie.id} className="movie-card">
                                    <Link
                                        to={`/movies/${movie.id}`}
                                        className="poster-wrap"
                                    >
                                        {movie.poster ? (
                                            <img src={movie.poster} alt={movie.title} />
                                        ) : (
                                            <div className="flex h-64 items-center justify-center bg-slate-100">
                                                Chưa có poster
                                            </div>
                                        )}
                                        <span className="format-badge">{movie.format}</span>
                                    </Link>

                                    <div className="movie-info">
                                        <Link
                                            to={`/movies/${movie.id}`}
                                            className="movie-title"
                                        >
                                            {movie.title}
                                        </Link>

                                        <p className="movie-meta">
                                            {movie.runtime} phút · {movie.rating}/10
                                        </p>

                                        <p className="mb-3 text-sm text-slate-500">
                                            {movie.genres.map((g) => g.name).join(", ")}
                                        </p>

                                        <Link
                                            to={`/movies/${movie.id}`}
                                            className="button button-primary card-button"
                                        >
                                            Xem chi tiết
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-4">
                            <button
                                className="button button-secondary"
                                disabled={page <= 1}
                                onClick={() => setPage((p) => p - 1)}
                            >
                                Trước
                            </button>

                            <span>Trang {page}/{totalPages}</span>

                            <button
                                className="button button-secondary"
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Sau
                            </button>
                        </div>
                    </>
                )}
            </section>
        </main>
    )
}