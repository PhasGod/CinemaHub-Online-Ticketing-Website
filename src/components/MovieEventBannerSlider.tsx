import React, { useState, useEffect, useCallback } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"

export interface EventMovie {
  id: string
  title: string
  releaseInfo: string
  dateColor?: "blue" | "red"
  borderColor: "pink" | "green" | "cyan"
  hasStar?: boolean
  posterUrl: string
  linkUrl?: string
}

export const EVENT_MOVIES_THANG_11: EventMovie[] = [
  {
    id: "bo-sua-bay",
    title: "BÒ SỮA BAY",
    releaseInfo: "SUẤT CHIẾU SỚM SAU 18H 05/11",
    dateColor: "red",
    borderColor: "pink",
    hasStar: true,
    posterUrl: "/banners/cards/card-1-bo-sua-bay.jpg",
    linkUrl: "/movies",
  },
  {
    id: "godzilla-tru-khong",
    title: "GODZILLA TRỪ KHÔNG",
    releaseInfo: "06/11",
    dateColor: "blue",
    borderColor: "green",
    hasStar: true,
    posterUrl: "/banners/cards/card-2-godzilla.jpg",
    linkUrl: "/movies",
  },
  {
    id: "ramayana",
    title: "RAMAYANA: KHỞI NGUỒN MỘT HUYỀN THOẠI",
    releaseInfo: "06/11",
    dateColor: "blue",
    borderColor: "cyan",
    hasStar: true,
    posterUrl: "/banners/cards/card-3-ramayana.jpg",
    linkUrl: "/movies",
  },
  {
    id: "ngay-con-con-me",
    title: "NGÀY CON CÒN MẸ",
    releaseInfo: "11/11",
    dateColor: "blue",
    borderColor: "green",
    hasStar: true,
    posterUrl: "/banners/cards/card-4-ngay-con-con-me.jpg",
    linkUrl: "/movies",
  },
  {
    id: "trai-giam-hanh-phuc",
    title: "TRẠI GIAM HẠNH PHÚC",
    releaseInfo: "20/11",
    dateColor: "blue",
    borderColor: "pink",
    hasStar: true,
    posterUrl: "/banners/cards/card-5-trai-giam-hanh-phuc.jpg",
    linkUrl: "/movies",
  },
  {
    id: "dau-truong-sinh-tu",
    title: "ĐẤU TRƯỜNG SINH TỬ: BÌNH MINH NGÀY CHIẾU QUÂN",
    releaseInfo: "20/11",
    dateColor: "blue",
    borderColor: "cyan",
    hasStar: true,
    posterUrl: "/banners/cards/card-6-dau-truong-sinh-tu.jpg",
    linkUrl: "/movies",
  },
  {
    id: "me-min",
    title: "MẸ MÌN",
    releaseInfo: "27/11",
    dateColor: "blue",
    borderColor: "green",
    hasStar: true,
    posterUrl: "/banners/cards/card-7-me-min.jpg",
    linkUrl: "/movies",
  },
]

export interface BannerSlide {
  id: string
  type: "event_movies" | "image"
  title: string
  imageUrl?: string
  fitMode?: "cover" | "contain"
  targetUrl?: string
}

export const BANNER_SLIDES: BannerSlide[] = [
  {
    id: "slide-phim-thang-11",
    type: "event_movies",
    title: "Phim Hay Tháng 11 - 5TOP Cinemas",
    targetUrl: "/movies",
  },
  {
    id: "slide-chi-chi-em-em",
    type: "image",
    title: "Chị Chị Em Em 3 - Đã Mở Bán Vé",
    imageUrl: "/banners/banner-chichiemem3.jpg",
    fitMode: "contain",
    targetUrl: "/movies",
  },
  {
    id: "slide-godzilla",
    type: "image",
    title: "Godzilla Minus Zero - Đã Mở Bán Vé 06.11",
    imageUrl: "/banners/banner-godzilla.jpg",
    fitMode: "contain",
    targetUrl: "/movies",
  },
  {
    id: "slide-member-40k",
    type: "image",
    title: "Member 5TOP 40K - Đồng giá vé mọi lứa tuổi",
    imageUrl: "/banners/banner-member-40k.jpg",
    fitMode: "cover",
    targetUrl: "/promotions",
  },
  {
    id: "slide-lipton-deal",
    type: "image",
    title: "Chơi Thu Man Mát - Bật Ngàn Deal Ngon Lipton",
    imageUrl: "/banners/banner-lipton-deal-clean.jpg",
    fitMode: "cover",
    targetUrl: "/promotions",
  },
]

// 3D Silver Star Icon Component
function SilverStar() {
  return (
    <div className="absolute -top-3.5 -left-3 z-30 drop-shadow-[0_2px_5px_rgba(0,0,0,0.65)] pointer-events-none">
      <svg viewBox="0 0 24 24" className="w-7 h-7 sm:w-8 sm:h-8">
        <defs>
          <linearGradient id="silverStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#f1f5f9" />
            <stop offset="65%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <filter id="starGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000" floodOpacity="0.4" />
          </filter>
        </defs>
        <polygon
          points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9"
          fill="url(#silverStarGrad)"
          stroke="#ffffff"
          strokeWidth="0.8"
          filter="url(#starGlow)"
        />
      </svg>
    </div>
  )
}

// 5Top Cinemas Logo Component
function FiveTopLogo() {
  return (
    <Link to="/" className="flex items-center gap-2 select-none group">
      <img
        src="/logo-5top-cinema.png"
        alt="5TOP CINEMA"
        className="w-7 h-7 sm:w-8 sm:h-8 object-contain rounded-lg drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
      />
      <div className="flex items-baseline gap-1">
        <span className="text-xl sm:text-2xl font-black tracking-tight text-[#0f2e6b]">5Top</span>
        <span className="text-lg sm:text-xl font-bold tracking-tight text-slate-800">cinemas</span>
      </div>
    </Link>
  )
}

// Facebook Icon SVG
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-[#1877f2]">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

export function MovieEventBannerSlider() {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0])
  const [isHovered, setIsHovered] = useState(false)
  const navigate = useNavigate()

  const slideCount = BANNER_SLIDES.length
  const activeIndex = ((page % slideCount) + slideCount) % slideCount
  const currentSlide = BANNER_SLIDES[activeIndex]

  const paginate = useCallback((newDirection: number) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection])
  }, [])

  const goToSlide = (index: number) => {
    const diff = index - activeIndex
    if (diff !== 0) {
      setPage(([prevPage]) => [prevPage + diff, diff > 0 ? 1 : -1])
    }
  }

  // Tự động chuyển slide sau mỗi 6 giây nếu không hover
  useEffect(() => {
    if (isHovered) return
    const timer = window.setInterval(() => {
      paginate(1)
    }, 6000)
    return () => window.clearInterval(timer)
  }, [isHovered, paginate])

  return (
    <div
      className="w-full max-w-[1024px] mx-auto select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* KHUNG BANNER CHÍNH VỚI BO GÓC LỚN & VIỀN BÓNG BẢY - SIZE GỐC 1024PX */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl shadow-blue-950/20 border border-slate-200/80 bg-white">
        {/* VÙNG NỘI DUNG SLIDER TỈ LỆ GỐC (1024 x 495) */}
        <div className="relative w-full aspect-[16/9] sm:aspect-[2/1] md:aspect-[1024/495] min-h-[350px] sm:min-h-[420px] md:min-h-[480px] overflow-hidden bg-slate-950">
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={page}
              custom={direction}
              initial={{ x: direction > 0 ? "100%" : "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction < 0 ? "100%" : "-100%", opacity: 0 }}
              transition={{
                x: { type: "spring", stiffness: 280, damping: 32 },
                opacity: { duration: 0.35 },
              }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragEnd={(_e, { offset, velocity }) => {
                const swipe = Math.abs(offset.x) * velocity.x
                if (swipe < -8000 || offset.x < -70) {
                  paginate(1)
                } else if (swipe > 8000 || offset.x > 70) {
                  paginate(-1)
                }
              }}
              className="absolute inset-0 w-full h-full"
            >
              {/* SLIDE 1: MÔ PHỎNG SỰ KIỆN PHIM HAY THÁNG 11 */}
              {currentSlide.type === "event_movies" ? (
                <div className="relative w-full h-full flex flex-col justify-between overflow-hidden bg-[#071946]">
                  {/* Background: Shimmering velvet & vertical light strands */}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "radial-gradient(circle at 50% 15%, rgba(29, 78, 216, 0.45) 0%, transparent 65%), linear-gradient(180deg, #091f56 0%, #05143b 60%, #030c26 100%)",
                    }}
                  />
                  {/* Vertical light rays texture */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        "repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(147, 197, 253, 0.25) 40px, transparent 42px)",
                    }}
                  />

                  {/* Stage Curtains (Rèm sân khấu uốn lượn mềm mại ở đỉnh) */}
                  <div className="absolute top-0 left-0 right-0 h-16 sm:h-20 pointer-events-none z-10 overflow-hidden">
                    <svg viewBox="0 0 1200 90" preserveAspectRatio="none" className="w-full h-full opacity-90">
                      <defs>
                        <linearGradient id="curtainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#0b2b7a" />
                          <stop offset="60%" stopColor="#061c54" />
                          <stop offset="100%" stopColor="#030f2f" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M0,0 L1200,0 L1200,45 Q1050,75 900,45 Q750,75 600,45 Q450,75 300,45 Q150,75 0,45 Z"
                        fill="url(#curtainGrad)"
                      />
                      <path
                        d="M0,0 Q150,55 300,25 Q450,55 600,25 Q750,55 900,25 Q1050,55 1200,25 L1200,0 Z"
                        fill="#103c9e"
                        opacity="0.4"
                      />
                    </svg>
                  </div>

                  {/* HEADER BANNER: 3D TROPHY + PHIM HAY THÁNG 11 */}
                  <div className="relative z-20 pt-3 sm:pt-4 md:pt-6 flex items-center justify-center">
                    <div className="flex items-center gap-2 sm:gap-3 drop-shadow-[0_8px_16px_rgba(0,0,0,0.5)]">
                      {/* Film reel trophy icon */}
                      <img
                        src="/banners/trophy-3d.png"
                        alt="3D Trophy"
                        className="w-10 h-12 sm:w-12 sm:h-14 md:w-14 md:h-16 object-contain -mr-1"
                        onError={(e) => {
                          e.currentTarget.style.display = "none"
                        }}
                      />

                      {/* PHIM HAY (Green Neon Badge with 3D White border) */}
                      <div className="bg-gradient-to-b from-[#a3e635] to-[#84cc16] px-3 sm:px-4 py-1 sm:py-1.5 rounded-xl sm:rounded-2xl border-2 sm:border-4 border-white shadow-[0_4px_12px_rgba(132,204,22,0.6),inset_0_2px_4px_rgba(255,255,255,0.8)]">
                        <span className="text-white text-base sm:text-2xl md:text-3xl font-black tracking-wider uppercase drop-shadow-[0_2px_3px_rgba(0,0,0,0.4)]">
                          PHIM HAY
                        </span>
                      </div>

                      {/* THÁNG (3D Red-Pink italic text with white stroke) */}
                      <div className="relative px-1">
                        <span
                          className="text-2xl sm:text-4xl md:text-5xl font-black italic tracking-wide text-[#f43f5e] uppercase"
                          style={{
                            WebkitTextStroke: "2px #ffffff",
                            textShadow:
                              "0 3px 0 #be123c, 0 5px 0 #9f1239, 0 8px 12px rgba(0,0,0,0.7)",
                          }}
                        >
                          THÁNG
                        </span>
                      </div>

                      {/* SỐ 11 (3D Metallic Silver Chrome) */}
                      <div className="relative">
                        <span
                          className="text-3xl sm:text-5xl md:text-6xl font-black italic tracking-tighter"
                          style={{
                            background:
                              "linear-gradient(180deg, #ffffff 0%, #cbd5e1 35%, #94a3b8 50%, #f8fafc 65%, #64748b 100%)",
                            WebkitBackgroundClip: "text",
                            WebkitTextFillColor: "transparent",
                            filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.8))",
                          }}
                        >
                          11
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 7 POSTER PHIM (CARD GRID DÀN ĐỀU 7 THẺ) */}
                  <div className="relative z-20 px-3 sm:px-6 md:px-8 pb-4 sm:pb-6 my-auto">
                    <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 md:gap-3.5 max-w-full mx-auto">
                      {EVENT_MOVIES_THANG_11.map((movie) => {
                        // Color styling for border
                        const borderBg =
                          movie.borderColor === "pink"
                            ? "bg-[#f472b6]"
                            : movie.borderColor === "green"
                            ? "bg-[#a3e635]"
                            : "bg-[#38bdf8]"

                        return (
                          <div
                            key={movie.id}
                            onClick={() => navigate(movie.linkUrl || "/movies")}
                            className="group relative flex flex-col cursor-pointer transition-all duration-300 hover:scale-105 hover:-translate-y-1.5 hover:z-30"
                          >
                            {/* Khung viền ngoài màu sắc xen kẽ */}
                            <div
                              className={`relative p-1 sm:p-1.5 rounded-xl sm:rounded-2xl ${borderBg} shadow-lg shadow-black/40 group-hover:shadow-2xl group-hover:shadow-cyan-400/40 transition-all`}
                            >
                              {/* 3D Silver Star ở góc trên */}
                              {movie.hasStar && <SilverStar />}

                              {/* Poster phim bên trên */}
                              <div className="relative aspect-[3/4] w-full rounded-lg sm:rounded-xl overflow-hidden bg-slate-900">
                                <img
                                  src={movie.posterUrl}
                                  alt={movie.title}
                                  className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                                  onError={(e) => {
                                    // Fallback to placeholder if not loaded
                                    e.currentTarget.src =
                                      "/promo/carousel-combo-hot.png"
                                  }}
                                />
                              </div>

                              {/* Khối thông tin bên dưới nền trắng */}
                              <div className="bg-white rounded-b-lg sm:rounded-b-xl px-1 sm:px-1.5 py-1.5 sm:py-2 flex flex-col justify-between items-center text-center mt-1">
                                <h3 className="text-[9px] sm:text-[10px] md:text-[11px] font-black text-[#0f2e6b] uppercase leading-tight line-clamp-2 min-h-[22px] sm:min-h-[26px] md:min-h-[28px] flex items-center justify-center">
                                  {movie.title}
                                </h3>
                                <p
                                  className={`text-[8px] sm:text-[9px] md:text-[10px] font-extrabold uppercase mt-0.5 leading-none ${
                                    movie.dateColor === "red"
                                      ? "text-[#e11d48]"
                                      : "text-[#0284c7]"
                                  }`}
                                >
                                  {movie.releaseInfo}
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* CÁC SLIDE HÌNH ẢNH BANNER FULL-BLEED KHÁC - SIZE GỐC 100% SẮC NÉT */
                <div
                  className="relative w-full h-full cursor-pointer bg-slate-950 overflow-hidden flex items-center justify-center select-none"
                  onClick={() => {
                    if (currentSlide.targetUrl) navigate(currentSlide.targetUrl)
                  }}
                >
                  {/* Lớp nền ambient glow mờ ảo cùng màu cho các banner cinematic tỉ lệ siêu rộng */}
                  {currentSlide.fitMode === "contain" && (
                    <img
                      src={currentSlide.imageUrl}
                      alt=""
                      aria-hidden="true"
                      className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                    />
                  )}

                  {/* Ảnh banner kích thước gốc không bị méo, không bị crop mờ chữ */}
                  <img
                    src={currentSlide.imageUrl}
                    alt={currentSlide.title}
                    className={`relative select-none transition-transform duration-500 hover:scale-[1.01] ${
                      currentSlide.fitMode === "contain"
                        ? "max-w-full max-h-full object-contain mx-auto"
                        : "w-full h-full object-cover object-center"
                    }`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* NÚT MŨI TÊN PREV / NEXT NẰM HAI BÊN MÉP BANNER */}
          <button
            type="button"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/45 hover:bg-black/80 text-white backdrop-blur-md border border-white/25 shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
            onClick={(e) => {
              e.stopPropagation()
              paginate(-1)
            }}
            aria-label="Slide trước"
          >
            <ChevronLeft size={24} className="stroke-[2.5]" />
          </button>

          <button
            type="button"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-black/45 hover:bg-black/80 text-white backdrop-blur-md border border-white/25 shadow-2xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90"
            onClick={(e) => {
              e.stopPropagation()
              paginate(1)
            }}
            aria-label="Slide tiếp theo"
          >
            <ChevronRight size={24} className="stroke-[2.5]" />
          </button>
        </div>

        {/* PHẦN FOOTER DƯỚI CÙNG: THANH THÔNG TIN THƯƠNG HIỆU NỀN TRẮNG PHẲNG */}
        <div className="bg-white px-4 sm:px-8 py-3.5 flex flex-col md:flex-row items-center justify-between gap-3 border-t border-slate-100">
          {/* Bên trái: Logo "5Top cinemas" */}
          <div className="flex items-center">
            <FiveTopLogo />
          </div>

          {/* Ở giữa: Pagination dots của slider + thông tin liên hệ */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-sm text-slate-700">
            {/* Hệ thống phân trang (Pagination Dots) */}
            <div className="flex items-center gap-1.5" role="tablist" aria-label="Phân trang slider">
              {BANNER_SLIDES.map((slide, index) => {
                const isActive = index === activeIndex
                return (
                  <button
                    key={slide.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${index + 1}: ${slide.title}`}
                    className={`transition-all duration-300 rounded-full h-2.5 ${
                      isActive
                        ? "w-7 bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"
                        : "w-2.5 bg-slate-300 hover:bg-slate-400"
                    }`}
                    onClick={() => goToSlide(index)}
                  />
                )
              })}
            </div>

            {/* Thông tin liên hệ: Facebook */}
            <a
              href="https://facebook.com/5topcinemas"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 font-semibold text-slate-800 hover:text-blue-600 transition-colors"
            >
              <FacebookIcon />
              <span>/5topcinemas</span>
            </a>
          </div>

          {/* Bên phải: Hai nút tải ứng dụng "Get it on Google Play" và "Available on the App Store" */}
          <div className="flex items-center gap-2">
            {/* Google Play Button */}
            <a
              href="https://play.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0f172a] hover:bg-black text-white px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
              aria-label="Tải về từ Google Play"
            >
              {/* Google Play Triangle SVG */}
              <svg viewBox="0 0 24 24" className="w-4 h-4">
                <path d="M3.6 1.8 L14.5 12 L3.6 22.2 Z" fill="#22c55e" />
                <path d="M14.5 12 L18.2 8.5 L3.6 1.8 Z" fill="#3b82f6" />
                <path d="M14.5 12 L3.6 22.2 L18.2 15.5 Z" fill="#ef4444" />
                <path d="M18.2 8.5 L21.5 10.4 C22.2 10.8 22.2 11.6 21.5 12 L18.2 15.5 L14.5 12 Z" fill="#eab308" />
              </svg>
              <div className="text-left leading-none">
                <span className="block text-[8px] uppercase tracking-wider text-slate-300">GET IT ON</span>
                <span className="block text-[11px] font-bold text-white tracking-tight">Google Play</span>
              </div>
            </a>

            {/* Apple App Store Button */}
            <a
              href="https://apple.com/app-store"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#0f172a] hover:bg-black text-white px-2.5 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm transition-all hover:scale-102"
              aria-label="Tải về từ App Store"
            >
              {/* Apple Logo SVG */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-white">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.64 1.36-.57.65-1.07 1.72-.94 2.74 1 .08 2.03-.5 2.65-1.25z" />
              </svg>
              <div className="text-left leading-none">
                <span className="block text-[8px] uppercase tracking-wider text-slate-300">Available on the</span>
                <span className="block text-[11px] font-bold text-white tracking-tight">App Store</span>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
export default MovieEventBannerSlider

