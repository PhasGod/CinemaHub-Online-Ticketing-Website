import React, { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Search,
  X,
  Ticket,
  Clock,
  Star,
  Film,
  Sparkles,
  ArrowRight,
  User,
  Tag,
  Calendar,
  Layers,
  Flame,
} from "lucide-react"
import { movieCardMockData } from "../data/movieCardMockData"
import { adminGetMovies, type Movie } from "../services/admin.service"
import { useCinemaLocation, ALL_CINEMAS_OPTION } from "../context/CinemaLocationContext"

function cn(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ")
}

// Bỏ dấu tiếng Việt để tìm kiếm thông minh không dấu
function removeVietnameseTones(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
}

export interface SearchMovieItem {
  id: string
  title: string
  posterUrl: string
  duration: string
  genres: string
  rating?: number | string
  ageRating: "P" | "T13" | "T16" | "T18"
  badgeType?: string
  director?: string
  cast?: string
  releaseDate?: string
  status?: string
}

interface SearchMovieModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchMovieModal({
  isOpen,
  onClose,
}: SearchMovieModalProps) {
  const [query, setQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchMovieItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeItemIndex, setActiveItemIndex] = useState(0)

  const inputRef = useRef<HTMLInputElement>(null)
  const modalContainerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()
  const { selectedCinema } = useCinemaLocation()

  // Phim đang hot / gợi ý khi chưa gõ gì
  const suggestedMovies = useMemo<SearchMovieItem[]>(() => {
    return movieCardMockData.slice(0, 4).map((m) => ({
      id: m.id,
      title: m.title,
      posterUrl: m.posterUrl,
      duration: m.duration,
      genres: m.genres,
      rating: 9.0,
      ageRating: (m.ageRating as SearchMovieItem["ageRating"]) || "T13",
      badgeType: m.badgeType,
      director: m.director,
      cast: m.cast,
    }))
  }, [])

  // Thể loại phổ biến để bấm tìm nhanh
  const popularGenres = [
    "Hành động",
    "Kinh dị",
    "Hoạt hình",
    "Khoa học viễn tưởng",
    "Hài hước",
    "Giật gân",
  ]

  // Autofocus input khi mở modal & reset query
  useEffect(() => {
    if (isOpen) {
      setQuery("")
      setDebouncedQuery("")
      setActiveItemIndex(0)
      const timer = setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  // Lắng nghe phím ESC hoặc Click Outside để đóng modal
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (!isOpen) return

      if (event.key === "Escape") {
        event.preventDefault()
        onClose()
      } else if (event.key === "ArrowDown") {
        event.preventDefault()
        setActiveItemIndex((prev) =>
          prev < searchResults.length - 1 ? prev + 1 : prev
        )
      } else if (event.key === "ArrowUp") {
        event.preventDefault()
        setActiveItemIndex((prev) => (prev > 0 ? prev - 1 : 0))
      } else if (event.key === "Enter" && searchResults[activeItemIndex]) {
        event.preventDefault()
        handleViewDetail(searchResults[activeItemIndex].id)
      }
    }

    function handleClickOutside(event: MouseEvent) {
      if (
        modalContainerRef.current &&
        !modalContainerRef.current.contains(event.target as Node)
      ) {
        onClose()
      }
    }

    if (isOpen) {
      document.body.style.overflow = "hidden"
      document.addEventListener("keydown", handleKeyDown)
      document.addEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.body.style.overflow = "auto"
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, searchResults, activeItemIndex, onClose])

  // Debounce 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Tìm kiếm theo từ khóa debouncedQuery
  useEffect(() => {
    if (!debouncedQuery) {
      setSearchResults([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    let active = true

    const normalizedQuery = removeVietnameseTones(debouncedQuery)

    // 1. Tìm trong Mock Data
    const mockMatches = movieCardMockData.filter((movie) => {
      const matchTitle = removeVietnameseTones(movie.title).includes(
        normalizedQuery
      )
      const matchGenres = removeVietnameseTones(movie.genres).includes(
        normalizedQuery
      )
      const matchCast = movie.cast
        ? removeVietnameseTones(movie.cast).includes(normalizedQuery)
        : false
      const matchDirector = movie.director
        ? removeVietnameseTones(movie.director).includes(normalizedQuery)
        : false
      const matchDesc = movie.description
        ? removeVietnameseTones(movie.description).includes(normalizedQuery)
        : false

      return (
        matchTitle || matchGenres || matchCast || matchDirector || matchDesc
      )
    })

    const formattedMockResults: SearchMovieItem[] = mockMatches.map((m) => ({
      id: m.id,
      title: m.title,
      posterUrl: m.posterUrl,
      duration: m.duration,
      genres: m.genres,
      rating: 9.1,
      ageRating: (m.ageRating as SearchMovieItem["ageRating"]) || "T13",
      badgeType: m.badgeType,
      director: m.director,
      cast: m.cast,
      releaseDate: m.releaseDate,
    }))

    // 2. Đồng thời gọi backend API nếu có để lấy phim mới nhất
    adminGetMovies({ q: debouncedQuery, limit: 10 })
      .then((res) => {
        if (!active) return
        const apiMovies: SearchMovieItem[] = (res.movies || []).map(
          (m: Movie) => {
            const ageRating: SearchMovieItem["ageRating"] =
              m.rating >= 9 ? "T18" : m.rating >= 8.5 ? "T16" : "T13"
            return {
              id: m.id,
              title: m.title,
              posterUrl: m.poster || "",
              duration: `${m.runtime || 120} phút`,
              genres:
                m.genres?.map((g) => g.name).join(", ") || "Đang cập nhật",
              rating: m.rating || 8.5,
              ageRating,
              badgeType: m.format || "2D",
              director: "",
              cast: "",
              releaseDate: m.releaseDate || undefined,
            }
          }
        )

        // Ghép và lọc trùng lặp ID hoặc tên
        const seen = new Set<string>()
        const combined: SearchMovieItem[] = []

        apiMovies.forEach((m) => {
          seen.add(m.title.toLowerCase())
          combined.push(m)
        })

        formattedMockResults.forEach((m) => {
          if (!seen.has(m.title.toLowerCase())) {
            seen.add(m.title.toLowerCase())
            combined.push(m)
          }
        })

        setSearchResults(combined)
        setActiveItemIndex(0)
      })
      .catch(() => {
        if (active) {
          setSearchResults(formattedMockResults)
          setActiveItemIndex(0)
        }
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [debouncedQuery])

  // Chuyển tới trang chi tiết phim
  const handleViewDetail = (movieId: string) => {
    onClose()
    navigate(`/movies/${movieId}`)
  }

  // Chuyển tới trang đặt vé của phim
  const handleBookTicket = (e: React.MouseEvent, movieId: string) => {
    e.stopPropagation()
    onClose()
    const cinemaParam =
      selectedCinema && selectedCinema.id !== ALL_CINEMAS_OPTION.id
        ? `&cinemaId=${selectedCinema.id}`
        : ""
    navigate(`/showtimes?movieId=${movieId}${cinemaParam}`)
  }

  // Hiển thị badge độ tuổi với màu tương ứng
  const renderAgeRatingBadge = (ageRating: string) => {
    switch (ageRating) {
      case "P":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 shrink-0">
            P
          </span>
        )
      case "T13":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-100 text-amber-800 shrink-0">
            T13
          </span>
        )
      case "T16":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-800 shrink-0">
            T16
          </span>
        )
      case "T18":
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-100 text-rose-800 shrink-0">
            T18
          </span>
        )
      default:
        return (
          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-800 shrink-0">
            {ageRating}
          </span>
        )
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-12 sm:pt-20 p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Tìm kiếm phim"
    >
      <div
        ref={modalContainerRef}
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
      >
        {/* Thanh Input Tìm Kiếm Lớn */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Search size={20} strokeWidth={2.4} />
          </div>

          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên phim, diễn viên, đạo diễn, thể loại..."
              className="w-full text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none bg-transparent pr-8"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("")
                  inputRef.current?.focus()
                }}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Xóa từ khóa"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-md">
              ESC
            </kbd>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Đóng tìm kiếm"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nội dung kết quả tìm kiếm */}
        <div className="overflow-y-auto max-h-[calc(85vh-120px)] divide-y divide-slate-100">
          {/* Trạng thái Loading */}
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-3">
              <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-medium">Đang tìm kiếm phim...</p>
            </div>
          ) : query.trim() !== "" ? (
            /* Kết quả tìm kiếm theo từ khóa */
            searchResults.length > 0 ? (
              <div className="p-2 sm:p-3">
                <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-500 font-medium">
                  <span>
                    Tìm thấy{" "}
                    <b className="text-blue-600 font-bold">
                      {searchResults.length}
                    </b>{" "}
                    phim phù hợp
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Bấm Enter để xem chi tiết
                  </span>
                </div>

                <div className="space-y-1.5 mt-1">
                  {searchResults.map((movie, index) => {
                    const isSelected = index === activeItemIndex
                    return (
                      <div
                        key={movie.id}
                        onClick={() => handleViewDetail(movie.id)}
                        onMouseEnter={() => setActiveItemIndex(index)}
                        className={cn(
                          "flex items-center justify-between p-2.5 sm:p-3 rounded-xl cursor-pointer transition-all border",
                          isSelected
                            ? "bg-blue-50/70 border-blue-200 shadow-xs"
                            : "bg-white border-transparent hover:bg-slate-50"
                        )}
                      >
                        {/* Cột trái: Poster + Thông tin */}
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-3">
                          <div className="w-13 h-18 sm:w-16 sm:h-22 rounded-lg overflow-hidden bg-slate-100 shrink-0 shadow-sm relative">
                            {movie.posterUrl ? (
                              <img
                                src={movie.posterUrl}
                                alt={movie.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback nếu ảnh không tải được
                                  ;(e.target as HTMLImageElement).src =
                                    "https://placehold.co/100x150/1e293b/ffffff?text=5TOP"
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Film size={20} />
                              </div>
                            )}
                            {movie.badgeType && (
                              <span className="absolute top-1 left-1 px-1 py-0.2 bg-blue-600/90 text-[9px] font-bold text-white rounded">
                                {movie.badgeType}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4
                                className={cn(
                                  "text-sm sm:text-base font-bold truncate",
                                  isSelected
                                    ? "text-blue-700"
                                    : "text-slate-800"
                                )}
                              >
                                {movie.title}
                              </h4>
                              {renderAgeRatingBadge(movie.ageRating)}
                            </div>

                            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                              <span className="flex items-center gap-1 font-medium">
                                <Clock size={13} className="text-slate-400" />
                                {movie.duration}
                              </span>
                              <span className="flex items-center gap-1 truncate text-slate-500">
                                <Tag size={13} className="text-slate-400" />
                                {movie.genres}
                              </span>
                              {movie.rating && (
                                <span className="flex items-center gap-1 text-amber-600 font-semibold">
                                  <Star size={13} className="fill-amber-400 text-amber-400" />
                                  {movie.rating}
                                </span>
                              )}
                            </div>

                            {(movie.cast || movie.director) && (
                              <p className="text-[11px] text-slate-400 truncate mt-1">
                                {movie.director && (
                                  <span>ĐD: {movie.director} • </span>
                                )}
                                {movie.cast && <span>DV: {movie.cast}</span>}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Cột phải: Nút Đặt Vé Nhanh */}
                        <div className="shrink-0 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => handleBookTicket(e, movie.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white shadow-sm transition-all"
                            title="Đặt vé ngay cho phim này"
                          >
                            <Ticket size={14} />
                            <span>Đặt vé</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Trạng thái trống (Empty State) */
              <div className="py-14 px-4 text-center">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <Search size={28} />
                </div>
                <h4 className="text-sm font-bold text-slate-800">
                  Không tìm thấy phim phù hợp
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Không có kết quả phù hợp với từ khóa &ldquo;
                  <span className="text-blue-600 font-semibold">{debouncedQuery}</span>
                  &rdquo;. Vui lòng thử tìm với tên tiếng Việt, diễn viên hoặc thể loại khác.
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">Gợi ý từ khóa:</span>
                  {["Avengers", "Dune", "Lật Mặt", "Inside Out", "Hành động"].map(
                    (kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => setQuery(kw)}
                        className="px-2.5 py-1 text-xs rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition"
                      >
                        {kw}
                      </button>
                    )
                  )}
                </div>
              </div>
            )
          ) : (
            /* Khi chưa gõ gì: Hiển thị Phim Đang Chiếu Hot & Thể loại */
            <div className="p-4 space-y-5">
              {/* Thể loại nổi bật */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  <Sparkles size={14} className="text-amber-500" />
                  <span>Thể loại nổi bật</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {popularGenres.map((genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() => setQuery(genre)}
                      className="px-3 py-1.5 text-xs font-medium rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 transition flex items-center gap-1"
                    >
                      <Tag size={12} className="text-slate-400" />
                      {genre}
                    </button>
                  ))}
                </div>
              </div>

              {/* Phim đề xuất / Phim đang hot */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Flame size={14} className="text-rose-500" />
                    <span>Phim đang chiếu nổi bật</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      navigate("/movies")
                    }}
                    className="text-blue-600 hover:underline normal-case font-semibold flex items-center gap-1"
                  >
                    Xem tất cả &rarr;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {suggestedMovies.map((movie) => (
                    <div
                      key={movie.id}
                      onClick={() => handleViewDetail(movie.id)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-blue-50/50 hover:border-blue-200 cursor-pointer transition-all group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <img
                          src={movie.posterUrl}
                          alt={movie.title}
                          className="w-10 h-14 object-cover rounded-lg shadow-xs shrink-0"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src =
                              "https://placehold.co/100x150/1e293b/ffffff?text=5TOP"
                          }}
                        />
                        <div className="truncate">
                          <h5 className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-600">
                            {movie.title}
                          </h5>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">
                            {movie.genres}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {renderAgeRatingBadge(movie.ageRating)}
                            <span className="text-[10px] text-slate-400">
                              {movie.duration}
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleBookTicket(e, movie.id)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 text-blue-600 hover:bg-blue-600 hover:text-white shrink-0 transition shadow-xs"
                        title="Đặt vé nhanh"
                      >
                        <Ticket size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer hướng dẫn phím tắt */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
                ↓
              </kbd>{" "}
              Điều hướng
            </span>
            <span className="hidden sm:inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
                Enter
              </kbd>{" "}
              Chi tiết
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-[10px]">
                ESC
              </kbd>{" "}
              Đóng
            </span>
          </div>

          <div className="text-slate-400">
            Hệ thống rạp: <b className="text-slate-600 font-semibold">{selectedCinema.name}</b>
          </div>
        </div>
      </div>
    </div>
  )
}
