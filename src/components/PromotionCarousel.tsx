import React, { useState, useEffect, useRef, useCallback } from "react"
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Link, useNavigate } from "react-router-dom"
import { promotionBannerData, type PromotionBanner } from "../data/promotionBannerData"

type PromotionCarouselProps = {
  banners?: PromotionBanner[]
  intervalMs?: number
  variant?: "standard" | "hero"
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: "spring" as const, stiffness: 280, damping: 30 },
      opacity: { duration: 0.4 },
      scale: { duration: 0.4 },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
    transition: {
      x: { type: "spring" as const, stiffness: 280, damping: 30 },
      opacity: { duration: 0.3 },
      scale: { duration: 0.3 },
    },
  }),
}

export function PromotionCarousel({
  banners = promotionBannerData,
  intervalMs = 5000,
}: PromotionCarouselProps) {
  const [[page, direction], setPage] = useState<[number, number]>([0, 0])
  const [isHovered, setIsHovered] = useState(false)
  const [failedImageIds, setFailedImageIds] = useState<string[]>([])
  const navigate = useNavigate()

  const bannerCount = banners.length
  const activeIndex = ((page % bannerCount) + bannerCount) % bannerCount
  const activeBanner = banners[activeIndex]

  const paginate = useCallback(
    (newDirection: number) => {
      setPage(([prevPage]) => [prevPage + newDirection, newDirection])
    },
    []
  )

  const goToSlide = (index: number) => {
    const diff = index - activeIndex
    if (diff !== 0) {
      setPage(([prevPage]) => [prevPage + diff, diff > 0 ? 1 : -1])
    }
  }

  // Tự động chuyển slide khi không hover
  useEffect(() => {
    if (bannerCount < 2 || isHovered) return

    const timer = window.setInterval(() => {
      paginate(1)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [bannerCount, intervalMs, isHovered, paginate])

  if (bannerCount === 0) return null

  const imageFailed = failedImageIds.includes(activeBanner.id)

  return (
    <div
      className="relative w-full max-w-full aspect-[16/8] sm:aspect-[16/7] md:aspect-[21/9] min-h-[300px] max-h-[500px] rounded-3xl overflow-hidden bg-slate-950 shadow-2xl shadow-blue-950/20 border border-slate-200/80 group select-none touch-pan-x"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label="Khuyến mãi nổi bật 5TOP Cinema"
    >
      {/* Slide Container với AnimatePresence */}
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          onDragEnd={(_e, { offset, velocity }) => {
            const swipePower = Math.abs(offset.x) * velocity.x
            if (swipePower < -8000 || offset.x < -80) {
              paginate(1)
            } else if (swipePower > 8000 || offset.x > 80) {
              paginate(-1)
            }
          }}
          className="absolute inset-0 w-full h-full cursor-pointer"
          onClick={() => {
            if (activeBanner.targetUrl) {
              navigate(activeBanner.targetUrl)
            }
          }}
        >
          {!imageFailed ? (
            <div className="relative w-full h-full overflow-hidden bg-slate-900">
              <img
                src={activeBanner.imageUrl}
                alt={activeBanner.title}
                className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.02]"
                referrerPolicy="no-referrer"
                onError={() =>
                  setFailedImageIds((ids) => [...new Set([...ids, activeBanner.id])])
                }
              />
              {/* Lớp phủ chuyển màu gradient tinh tế ở đáy để các nút và tiêu đề nổi rõ ràng */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950/40 via-transparent to-slate-950/20 pointer-events-none" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-6 text-center">
              <span className="text-rose-400 font-extrabold tracking-widest text-xs uppercase mb-2">
                5TOP CINEMA
              </span>
              <h2 className="text-2xl sm:text-3xl font-black mb-2">{activeBanner.title}</h2>
              <p className="text-slate-300 text-sm">Ưu đãi bắp nước và combo điện ảnh cực chất</p>
            </div>
          )}

          {/* Tag thông tin góc trái dưới gọn gàng, không che nội dung ảnh */}
          <div className="absolute bottom-5 left-5 sm:bottom-7 sm:left-7 z-10 max-w-[85%] sm:max-w-[70%] pointer-events-none">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/90 text-white text-[11px] sm:text-xs font-black uppercase tracking-wider mb-2 shadow-lg backdrop-blur-xs">
              <Sparkles size={12} className="fill-current" /> Ưu Đãi Độc Quyền
            </div>
            <h2 className="text-white text-base sm:text-xl md:text-2xl font-black tracking-tight drop-shadow-lg line-clamp-1">
              {activeBanner.title}
            </h2>
            <div className="mt-2.5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600/90 hover:bg-blue-600 text-white text-xs sm:text-sm font-bold shadow-lg shadow-blue-900/30 backdrop-blur-xs pointer-events-auto transition-all hover:scale-105 active:scale-95">
              <span>Khám phá ngay</span>
              <ArrowRight size={15} />
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Nút điều hướng Trái */}
      <button
        type="button"
        className="absolute left-3 sm:left-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/25 shadow-xl flex items-center justify-center transition-all duration-200 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-90"
        onClick={(e) => {
          e.stopPropagation()
          paginate(-1)
        }}
        aria-label="Banner trước"
      >
        <ChevronLeft size={24} className="stroke-[2.5]" />
      </button>

      {/* Nút điều hướng Phải */}
      <button
        type="button"
        className="absolute right-3 sm:right-5 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-black/40 hover:bg-black/80 text-white backdrop-blur-md border border-white/25 shadow-xl flex items-center justify-center transition-all duration-200 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 hover:scale-110 active:scale-90"
        onClick={(e) => {
          e.stopPropagation()
          paginate(1)
        }}
        aria-label="Banner tiếp theo"
      >
        <ChevronRight size={24} className="stroke-[2.5]" />
      </button>

      {/* Thanh Pagination Dots & Số trang ở góc phải dưới */}
      <div className="absolute bottom-5 right-5 sm:bottom-7 sm:right-7 z-20 flex items-center gap-2 bg-black/45 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 shadow-xl">
        <span className="text-[11px] font-bold text-white/80 mr-1 hidden sm:inline">
          {activeIndex + 1}/{bannerCount}
        </span>
        <div className="flex items-center gap-1.5" role="tablist" aria-label="Chọn banner">
          {banners.map((banner, index) => {
            const isActive = index === activeIndex
            return (
              <button
                key={banner.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Banner ${index + 1}: ${banner.title}`}
                className={`transition-all duration-300 rounded-full h-2 ${
                  isActive
                    ? "w-7 bg-gradient-to-r from-blue-400 to-indigo-400 shadow-[0_0_10px_rgba(96,165,250,0.8)]"
                    : "w-2 bg-white/40 hover:bg-white/70"
                }`}
                onClick={(e) => {
                  e.stopPropagation()
                  goToSlide(index)
                }}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
export default PromotionCarousel
