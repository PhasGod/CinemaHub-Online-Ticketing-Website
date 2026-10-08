import { useEffect, useState } from "react"
import { Link, useParams } from "react-router-dom"
import {
    adminGetMovie,
    type Movie,
} from "../services/admin.service"

export default function MovieDetailPage() {
    const { id } = useParams()
    const [movie, setMovie] = useState<Movie | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")

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
            .then((res) => {
                if (active) setMovie(res.movie)
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
    }, [id])

    return (
        <main className="page-main">
            <section className="container">
                <Link to="/movies" className="button button-secondary mb-6">
                    ← Danh sách phim
                </Link>

                {loading ? (
                    <p className="py-12 text-center">Đang tải phim...</p>
                ) : error ? (
                    <p role="alert" className="py-12 text-center text-red-600">
                        {error}
                    </p>
                ) : movie ? (
                    <div className="grid gap-8 rounded-2xl bg-white p-6 md:grid-cols-[240px_1fr]">
                        <div className="overflow-hidden rounded-xl bg-slate-100">
                            {movie.poster ? (
                                <img
                                    src={movie.poster}
                                    alt={movie.title}
                                    className="w-full"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none"
                                    }}
                                />
                            ) : (
                                <p className="p-8 text-center">Chưa có poster</p>
                            )}
                        </div>

                        <div>
                            <h1 className="mb-4 text-3xl font-bold">{movie.title}</h1>
                            <p className="mb-3 text-slate-500">
                                {movie.runtime} phút · {movie.format} · {movie.rating}/10
                            </p>
                            <p className="mb-3">
                                Thể loại: {movie.genres.map((g) => g.name).join(", ") || "Chưa cập nhật"}
                            </p>
                            <p className="mb-3">
                                Trạng thái: {
                                    movie.status === "showing"
                                        ? "Đang chiếu"
                                        : movie.status === "coming_soon"
                                            ? "Sắp chiếu"
                                            : "Đã ngừng chiếu"
                                }
                            </p>
                            <p className="mb-5">
                                Khởi chiếu: {
                                    movie.releaseDate
                                        ? new Date(movie.releaseDate).toLocaleDateString("vi-VN")
                                        : "Chưa cập nhật"
                                }
                            </p>
                            <p className="whitespace-pre-line leading-7">
                                {movie.description || "Chưa có mô tả."}
                            </p>
                            <p className="mt-6 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
                                Chức năng suất chiếu và đặt vé sẽ được triển khai ở sprint tiếp theo.
                            </p>
                        </div>
                    </div>
                ) : (
                    <p>Không tìm thấy phim.</p>
                )}
            </section>
        </main>
    )
}