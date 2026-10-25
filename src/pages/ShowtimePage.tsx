import React, { useState, useEffect, useMemo, useRef } from "react"
import { useNavigate, useSearchParams, Link } from "react-router-dom"
import {
  Calendar,
  Clock,
  Film,
  MapPin,
  ChevronRight,
  Loader2,
  Armchair,
  Sparkles,
  Building2,
  Check,
  ArrowRight,
  RotateCcw,
  Ticket,
  ArrowLeft,
} from "lucide-react"
import { getShowtimes } from "../services/bookingApi"
import { adminGetCinemas, Cinema } from "../services/admin.service"
import { ShowtimeItem } from "../types/booking"
import { useCinemaLocation, ALL_CINEMAS_OPTION } from "../context/CinemaLocationContext"
import { BookingHeaderStepper } from "../components/BookingHeaderStepper"

interface MovieSummary {
  id: string
  title: string
  slug: string
  poster: string | null
  format: string
  runtime: number
  rating: number
  genres: string[]
  showtimesCount: number
}

export default function ShowtimePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialMovieId = searchParams.get("movieId") || ""
  const initialCinemaId = searchParams.get("cinemaId") || ""

  // Step state: 1: Chọn Cụm Rạp, 2: Chọn Phim, 3: Chọn Suất Chiếu
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1)

  // Danh sách cụm rạp từ API
  const [cinemas, setCinemas] = useState<Cinema[]>([])
  const [selectedCity, setSelectedCity] = useState<string>("Tất cả")
  const [selectedCinema, setSelectedCinema] = useState<Cinema | null>(null)
  const [isLoadingCinemas, setIsLoadingCinemas] = useState(true)
  const { selectedCinema: globalCinema, changeCinema } = useCinemaLocation()

  // Danh sách suất chiếu của rạp đã chọn
  const [cinemaShowtimes, setCinemaShowtimes] = useState<ShowtimeItem[]>([])
  const [isLoadingShowtimes, setIsLoadingShowtimes] = useState(false)
  const [errorShowtimes, setErrorShowtimes] = useState("")

  // Phim được chọn
  const [selectedMovie, setSelectedMovie] = useState<MovieSummary | null>(null)

  // Danh sách 7 ngày tới (tính từ hôm nay)
  const dateOptions = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() + i)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, "0")
      const dd = String(d.getDate()).padStart(2, "0")
      const dateStr = `${yyyy}-${mm}-${dd}`

      const dayName =
        i === 0
          ? "Hôm nay"
          : i === 1
            ? "Ngày mai"
            : `Thứ ${d.getDay() === 0 ? "CN" : d.getDay() + 1}`

      const displayDate = `${dd}/${mm}`

      return { dateStr, dayName, displayDate }
    })
  }, [])

  const [selectedDate, setSelectedDate] = useState<string>(dateOptions[0].dateStr)
  // Ref cho scroll mượt
  const stepSectionRef = useRef<HTMLDivElement>(null)

  // Đồng bộ khi người dùng đổi rạp từ Header Dropdown
  useEffect(() => {
    if (globalCinema.id === ALL_CINEMAS_OPTION.id) {
      if (!initialCinemaId) {
        setSelectedCinema(null)
        setCurrentStep(1)
      }
      return
    }

    if (cinemas.length > 0) {
      const matched = cinemas.find(
        (c) =>
          c.id === globalCinema.id ||
          c.name.toLowerCase() === globalCinema.name.toLowerCase()
      )
      if (matched) {
        setSelectedCinema(matched)
        setCurrentStep(2)
      } else {
        setSelectedCinema({
          id: globalCinema.id,
          name: globalCinema.name,
          location: globalCinema.city,
          city: globalCinema.city,
          address: globalCinema.address || null,
        })
        setCurrentStep(2)
      }
    }
  }, [globalCinema, cinemas, initialCinemaId])

  // Tải danh sách cụm rạp từ API
  useEffect(() => {
    let active = true
    setIsLoadingCinemas(true)

    adminGetCinemas()
      .then((res) => {
        if (!active) return
        const list = res.cinemas || []
        setCinemas(list)

        // Nếu có initialCinemaId từ query
        if (initialCinemaId) {
          const matched = list.find((c) => c.id === initialCinemaId)
          if (matched) {
            setSelectedCinema(matched)
            setCurrentStep(2)
          }
        } else if (globalCinema.id !== ALL_CINEMAS_OPTION.id) {
          const matched = list.find(
            (c) =>
              c.id === globalCinema.id ||
              c.name.toLowerCase() === globalCinema.name.toLowerCase()
          )
          if (matched) {
            setSelectedCinema(matched)
            setCurrentStep(2)
          } else {
            setSelectedCinema({
              id: globalCinema.id,
              name: globalCinema.name,
              location: globalCinema.city,
              city: globalCinema.city,
              address: globalCinema.address || null,
            })
            setCurrentStep(2)
          }
        }
      })
      .catch((err) => {
        console.error("Không thể tải danh sách cụm rạp:", err)
      })
      .finally(() => {
        if (active) setIsLoadingCinemas(false)
      })

    return () => {
      active = false
    }
  }, [initialCinemaId])

  // Tải tất cả suất chiếu của rạp đã chọn
  useEffect(() => {
    if (!selectedCinema) {
      setCinemaShowtimes([])
      return
    }

    let active = true
    setIsLoadingShowtimes(true)
    setErrorShowtimes("")

    getShowtimes({
      cinemaId: selectedCinema.id,
    })
      .then((data) => {
        if (!active) return
        const stList = data.showtimes || []
        setCinemaShowtimes(stList)

        // Nếu có initialMovieId truyền từ trang chi tiết phim
        if (initialMovieId && !selectedMovie) {
          const matchedSt = stList.find((s) => s.movieId === initialMovieId)
          if (matchedSt) {
            setSelectedMovie({
              id: matchedSt.movieId,
              title: matchedSt.movieTitle,
              slug: matchedSt.movieSlug,
              poster: matchedSt.moviePoster,
              format: matchedSt.format,
              runtime: matchedSt.runtime || 120,
              rating: matchedSt.rating || 8.5,
              genres: matchedSt.genres || [],
              showtimesCount: stList.filter((s) => s.movieId === matchedSt.movieId).length,
            })
            setCurrentStep(3)
          }
        }
      })
      .catch((err) => {
        if (active) setErrorShowtimes(err.message || "Không thể tải suất chiếu của rạp này")
      })
      .finally(() => {
        if (active) setIsLoadingShowtimes(false)
      })

    return () => {
      active = false
    }
  }, [selectedCinema, initialMovieId])

  // Danh sách Tỉnh / Thành phố từ các rạp hiện có
  const cityList = useMemo(() => {
    const set = new Set<string>()
    cinemas.forEach((c) => {
      const city = c.city || c.location
      if (city) set.add(city.trim())
    })
    return ["Tất cả", ...Array.from(set)]
  }, [cinemas])

  // Lọc rạp theo Tỉnh / Thành
  const filteredCinemas = useMemo(() => {
    if (selectedCity === "Tất cả") return cinemas
    return cinemas.filter((c) => (c.city || c.location) === selectedCity)
  }, [cinemas, selectedCity])

  // Lọc danh sách phim độc nhất đang có suất chiếu tại rạp đã chọn
  const moviesAtSelectedCinema = useMemo<MovieSummary[]>(() => {
    const movieMap = new Map<string, MovieSummary>()
    cinemaShowtimes.forEach((st) => {
      if (!movieMap.has(st.movieId)) {
        movieMap.set(st.movieId, {
          id: st.movieId,
          title: st.movieTitle,
          slug: st.movieSlug,
          poster: st.moviePoster,
          format: st.format,
          runtime: st.runtime || 120,
          rating: st.rating || 8.5,
          genres: st.genres || [],
          showtimesCount: 1,
        })
      } else {
        const item = movieMap.get(st.movieId)!
        item.showtimesCount += 1
      }
    })
    return Array.from(movieMap.values())
  }, [cinemaShowtimes])

  // Lọc suất chiếu của phim đã chọn theo ngày đã chọn
  const showtimesForSelectedMovieAndDate = useMemo(() => {
    if (!selectedMovie) return []
    return cinemaShowtimes.filter((st) => {
      const matchMovie = st.movieId === selectedMovie.id
      const stDate = st.startTime.slice(0, 10)
      return matchMovie && stDate === selectedDate
    })
  }, [cinemaShowtimes, selectedMovie, selectedDate])

  // Nhóm suất chiếu theo định dạng phòng chiếu (IMAX, 2D, 3D...)
  const groupedShowtimesByFormat = useMemo(() => {
    const groups: Record<string, ShowtimeItem[]> = {}
    showtimesForSelectedMovieAndDate.forEach((st) => {
      const fmt = st.roomFormat || st.format || "2D Standard"
      if (!groups[fmt]) groups[fmt] = []
      groups[fmt].push(st)
    })
    return groups
  }, [showtimesForSelectedMovieAndDate])

  // Chọn Cụm Rạp (Bước 1 -> Bước 2)
  const handleSelectCinema = (cinema: Cinema) => {
    setSelectedCinema(cinema)
    changeCinema({
      id: cinema.id,
      name: cinema.name,
      city: cinema.city || cinema.location,
      address: cinema.address || undefined,
    })
    setSelectedMovie(null)
    setCurrentStep(2)
    stepSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Chọn Phim (Bước 2 -> Bước 3)
  const handleSelectMovie = (movie: MovieSummary) => {
    setSelectedMovie(movie)
    setCurrentStep(3)
    stepSectionRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Bước 4: Điều hướng sang Chọn Ghế & Thanh toán
  const handleSelectShowtime = (showtimeId: string) => {
    // Điều hướng trực tiếp sang trang Chọn Ghế
    // Từ đó khách bấm tiếp tục sẽ sang /booking/checkout/:bookingId (có QR code thanh toán)
    navigate(`/booking/${showtimeId}`)
  }

  const formatTime = (isoString: string) => {
    const d = new Date(isoString)
    return d.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val)
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 pt-24 pb-20">
      <div className="container max-w-6xl mx-auto px-4" ref={stepSectionRef}>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-2">
            <Sparkles size={16} /> Đặt vé trực tuyến 5TOP CINEMA
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Lịch Chiếu & Đặt Vé Theo Cụm Rạp
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Chọn Rạp chiếu → Chọn Phim → Chọn Suất chiếu → Chọn Ghế & Bắp nước → Thanh toán nhận vé
          </p>
        </div>

        {/* Thanh Stepper 5 Bước Chuẩn Hóa */}
        <BookingHeaderStepper
          currentStep={currentStep}
          selectedCinemaName={selectedCinema?.name}
          selectedMovieTitle={selectedMovie?.title}
          selectedShowtimeInfo={undefined}
          onStepClick={(step) => {
            if (step === 1) {
              setCurrentStep(1)
              stepSectionRef.current?.scrollIntoView({ behavior: "smooth" })
            } else if (step === 2 && selectedCinema) {
              setCurrentStep(2)
              stepSectionRef.current?.scrollIntoView({ behavior: "smooth" })
            } else if (step === 3 && selectedMovie) {
              setCurrentStep(3)
              stepSectionRef.current?.scrollIntoView({ behavior: "smooth" })
            }
          }}
        />

        {/* ============================================================== */}
        {/* BƯỚC 1: CHỌN TỈNH/THÀNH & CỤM RẠP */}
        {/* ============================================================== */}
        {currentStep === 1 && (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                  <Building2 size={22} className="text-rose-500" />
                  Bước 1: Chọn Cụm Rạp Chiếu Phim
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Lọc rạp theo Tỉnh / Thành phố để tìm rạp chiếu gần bạn nhất
                </p>
              </div>

              {/* Bộ lọc Tỉnh/Thành */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                {cityList.map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCity(city)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      selectedCity === city
                        ? "bg-rose-500 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:text-slate-900 shadow-2xs"
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            </div>

            {isLoadingCinemas ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={36} className="animate-spin text-rose-500" />
                <p className="text-sm font-medium">Đang nạp danh sách cụm rạp...</p>
              </div>
            ) : filteredCinemas.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center shadow-2xs">
                <Building2 size={40} className="mx-auto mb-3 opacity-30 text-rose-500" />
                <h3 className="text-base font-bold text-slate-800 mb-1">
                  Chưa có rạp chiếu tại khu vực {selectedCity}
                </h3>
                <p className="text-xs text-slate-500">
                  Vui lòng chọn Tỉnh / Thành phố khác hoặc chọn "Tất cả".
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCinemas.map((cinema) => {
                  const isSelected = selectedCinema?.id === cinema.id
                  const roomCount = cinema.rooms?.length || 0

                  return (
                    <div
                      key={cinema.id}
                      onClick={() => handleSelectCinema(cinema)}
                      className={`group relative p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-rose-50/60 border-2 border-rose-500 shadow-md ring-1 ring-rose-500/20"
                          : "bg-white border-slate-200 hover:border-rose-400 hover:shadow-md shadow-xs"
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                              <Building2 size={18} />
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-slate-900 group-hover:text-rose-600 transition">
                                {cinema.name}
                              </h3>
                              <span className="text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded">
                                {cinema.city || cinema.location}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                              <Check size={14} strokeWidth={2.5} />
                            </span>
                          )}
                        </div>

                        {cinema.address && (
                          <p className="text-xs text-slate-500 flex items-start gap-1.5 mt-2.5">
                            <MapPin size={13} className="text-slate-400 shrink-0 mt-0.5" />
                            <span className="line-clamp-2">{cinema.address}</span>
                          </p>
                        )}
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-500">
                          {roomCount > 0 ? `${roomCount} phòng chiếu` : "Đang cập nhật phòng"}
                        </span>
                        <span className="font-medium text-rose-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform group-hover:underline">
                          Chọn rạp này <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* BƯỚC 2: CHỌN PHIM TẠI RẠP ĐÃ CHỌN */}
        {/* ============================================================== */}
        {currentStep === 2 && selectedCinema && (
          <section className="space-y-6">
            {/* Banner rạp đã chọn */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
                    Cụm rạp đang chọn
                  </div>
                  <div className="text-base font-extrabold text-slate-900">
                    {selectedCinema.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {selectedCinema.address || selectedCinema.location}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCurrentStep(1)}
                className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
              >
                <RotateCcw size={13} /> Đổi rạp khác
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
                  <Film size={22} className="text-rose-500" />
                  Bước 2: Chọn Phim Đang Chiếu Tại {selectedCinema.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Nhấp chọn phim bạn muốn xem để xem chi tiết lịch chiếu
                </p>
              </div>
            </div>

            {isLoadingShowtimes ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
                <Loader2 size={36} className="animate-spin text-rose-500" />
                <p className="text-sm font-medium">Đang nạp danh sách phim tại rạp này...</p>
              </div>
            ) : errorShowtimes ? (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center text-rose-700">
                <p className="font-semibold">{errorShowtimes}</p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-semibold hover:bg-rose-700 transition shadow-sm"
                >
                  Chọn rạp khác
                </button>
              </div>
            ) : moviesAtSelectedCinema.length === 0 ? (
              <div className="bg-white border border-dashed border-slate-300 rounded-3xl p-12 text-center shadow-2xs">
                <Film size={40} className="mx-auto mb-3 opacity-30 text-rose-500" />
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Chưa có suất chiếu nào tại {selectedCinema.name}
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mb-5">
                  Rạp đang chuẩn bị lịch chiếu mới cho tuần này. Bạn có thể chọn cụm rạp khác để đặt vé ngay.
                </p>
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition inline-flex items-center gap-2 shadow-sm"
                >
                  <ArrowLeft size={16} /> Quay lại chọn rạp khác
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {moviesAtSelectedCinema.map((m) => {
                  const isSelected = selectedMovie?.id === m.id

                  return (
                    <div
                      key={m.id}
                      onClick={() => handleSelectMovie(m)}
                      className={`group relative rounded-2xl overflow-hidden border transition-all cursor-pointer flex flex-col bg-white ${
                        isSelected
                          ? "border-2 border-rose-500 shadow-lg ring-1 ring-rose-500/30"
                          : "border-slate-200 hover:border-rose-400 hover:scale-[1.02] shadow-sm hover:shadow-md"
                      }`}
                    >
                      {/* Poster */}
                      <div className="relative aspect-[2/3] w-full overflow-hidden bg-slate-100">
                        <img
                          src={
                            m.poster ||
                            "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&q=80"
                          }
                          alt={m.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white shadow-xs">
                            {m.format || "2D"}
                          </span>
                        </div>
                        <div className="absolute top-2 right-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-white/90 backdrop-blur-sm text-slate-800 border border-slate-200 shadow-xs">
                            ⭐ {m.rating}
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3.5 flex flex-col justify-between flex-1">
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 group-hover:text-rose-600 transition line-clamp-2">
                            {m.title}
                          </h3>
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-1">
                            {m.genres?.join(", ") || "Hành động, Phiêu lưu"}
                          </p>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock size={12} className="text-slate-400" />
                            {m.runtime}p
                          </span>
                          <span className="text-rose-500 font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            Đặt vé <ChevronRight size={13} />
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* ============================================================== */}
        {/* BƯỚC 3: CHỌN NGÀY & SUẤT CHIẾU CỤ THỂ */}
        {/* ============================================================== */}
        {currentStep === 3 && selectedCinema && selectedMovie && (
          <section className="space-y-6">
            {/* Banner tóm tắt Rạp & Phim */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
              <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                  <img
                    src={
                      selectedMovie.poster ||
                      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200&q=80"
                    }
                    alt=""
                    className="w-16 h-24 object-cover rounded-xl border border-slate-200 shadow-sm shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-600 text-white">
                        {selectedMovie.format || "2D"}
                      </span>
                      <span className="text-xs text-rose-600 font-bold">
                        ⭐ {selectedMovie.rating} · {selectedMovie.runtime} phút
                      </span>
                    </div>
                    <h2 className="text-xl font-extrabold text-slate-900">
                      {selectedMovie.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5 flex items-center gap-1.5">
                      <Building2 size={13} className="text-rose-500" />
                      Tại: <strong className="text-slate-900">{selectedCinema.name}</strong> ({selectedCinema.city || selectedCinema.location})
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 self-start md:self-center">
                  <button
                    onClick={() => setCurrentStep(2)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <RotateCcw size={13} /> Đổi phim
                  </button>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
                  >
                    <Building2 size={13} /> Đổi rạp
                  </button>
                </div>
              </div>
            </div>

            {/* Thanh chọn ngày (7 ngày tới) */}
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                <Calendar size={14} className="text-rose-500" /> Chọn ngày xem phim
              </div>

              <div className="overflow-x-auto pb-2 scrollbar-none">
                <div className="flex gap-2.5 min-w-max">
                  {dateOptions.map(({ dateStr, dayName, displayDate }) => {
                    const isSelected = selectedDate === dateStr
                    return (
                      <button
                        key={dateStr}
                        onClick={() => setSelectedDate(dateStr)}
                        className={`flex flex-col items-center justify-center w-24 py-3 px-2 rounded-2xl border transition-all ${
                          isSelected
                            ? "bg-rose-500 border-2 border-rose-600 text-white shadow-md shadow-rose-500/20 scale-105 font-bold"
                            : "bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-2xs"
                        }`}
                      >
                        <span className={`text-[11px] ${isSelected ? "text-rose-100 font-semibold" : "text-slate-500 font-medium"}`}>
                          {dayName}
                        </span>
                        <span className="text-base font-extrabold mt-0.5">
                          {displayDate}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Danh sách suất chiếu theo phòng */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
                  <Clock size={18} className="text-rose-500" />
                  Suất Chiếu Ngày {selectedDate.split("-").reverse().join("/")}
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {showtimesForSelectedMovieAndDate.length} suất chiếu khả dụng
                </span>
              </div>

              {showtimesForSelectedMovieAndDate.length === 0 ? (
                <div className="bg-white border border-dashed border-slate-300 rounded-2xl p-8 sm:p-10 text-center shadow-2xs">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
                    <Calendar size={28} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1">
                    Không có suất chiếu vào ngày này
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Vui lòng chọn ngày khác (như Hôm nay hoặc Ngày mai) trên thanh lịch ở trên.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(groupedShowtimesByFormat).map(([formatName, list]) => (
                    <div
                      key={formatName}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                    >
                      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                        <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200">
                          {formatName}
                        </span>
                        <span className="text-xs text-slate-500">
                          · {list[0]?.roomName || "Phòng tiêu chuẩn"}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                        {list.map((st) => (
                          <button
                            key={st.id}
                            onClick={() => handleSelectShowtime(st.id)}
                            className="group p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 text-left transition-all hover:scale-[1.03] shadow-2xs hover:shadow-md flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-base font-black text-slate-900 group-hover:text-rose-600 transition">
                                  {formatTime(st.startTime)}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  ~ {formatTime(st.endTime)}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-600 font-medium truncate">
                                {st.roomName}
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                              <span className="text-rose-600 font-bold">
                                {formatPrice(st.price)}
                              </span>
                              <span className="text-slate-500 flex items-center gap-1 text-[11px]">
                                <Armchair size={11} className="text-slate-400" /> {st.availableSeats ?? "?"}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bước 4 Ghi chú điều hướng */}
            <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-4 flex items-center gap-3 text-xs shadow-2xs">
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Ticket size={16} />
              </div>
              <div className="leading-relaxed">
                <strong className="text-rose-950 font-bold">Bước 4 (Kế tiếp):</strong> Nhấp vào khung giờ bất kỳ ở trên để chuyển sang bước{" "}
                <span className="text-slate-900 font-bold">Chọn ghế ngồi theo sơ đồ rạp</span>. Sau khi chọn ghế, hệ thống sẽ chuyển sang màn hình{" "}
                <span className="text-rose-600 font-bold">Thanh toán vé bằng mã QR động</span>.
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
