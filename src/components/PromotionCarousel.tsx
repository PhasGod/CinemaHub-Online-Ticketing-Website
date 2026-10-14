import { ChevronLeft, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"
import { promotionBannerData, type PromotionBanner } from "../data/promotionBannerData"

type PromotionCarouselProps = {
  banners?: PromotionBanner[]
  intervalMs?: number
  variant?: "standard" | "hero"
}

export function PromotionCarousel({
  banners = promotionBannerData,
  intervalMs = 4500,
  variant = "standard",
}: PromotionCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [failedImageIds, setFailedImageIds] = useState<string[]>([])

  useEffect(() => {
    if (banners.length < 2) return

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % banners.length)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [banners.length, intervalMs])

  if (banners.length === 0) return null

  const activeBanner = banners[activeIndex]
  const imageFailed = failedImageIds.includes(activeBanner.id)
  const previous = () => setActiveIndex((index) => (index - 1 + banners.length) % banners.length)
  const next = () => setActiveIndex((index) => (index + 1) % banners.length)

  return (
    <section
      className={`promotion-carousel${variant === "hero" ? " promotion-carousel--hero" : ""}`}
      aria-label="Ưu đãi bắp nước và đối tác"
    >
      <a href={activeBanner.targetUrl} className="promotion-carousel-visual" aria-label={activeBanner.title}>
        {!imageFailed ? (
          <>
            <img
              className="promotion-carousel-backdrop"
              src={activeBanner.imageUrl}
              alt=""
              aria-hidden="true"
              referrerPolicy="no-referrer"
            />
            <img
              key={activeBanner.id}
              className="promotion-carousel-image"
              src={activeBanner.imageUrl}
              alt={activeBanner.title}
              referrerPolicy="no-referrer"
              onError={() => setFailedImageIds((ids) => [...new Set([...ids, activeBanner.id])])}
            />
          </>
        ) : (
          <div className="promotion-carousel-fallback">
            <span>5TOP CINEMA</span>
            <strong>{activeBanner.title}</strong>
            <small>Ưu đãi F&amp;B hấp dẫn tại rạp</small>
          </div>
        )}
      </a>

      {variant === "hero" && (
        <div className="promotion-carousel-copy">
          <span>ƯU ĐÃI TẠI RẠP</span>
          <h1>Combo bắp nước hấp dẫn</h1>
          <p>Thưởng thức phim trọn vị với các ưu đãi F&amp;B và quà tặng giới hạn.</p>
          <a href="/promotions" className="promotion-carousel-cta">Khám phá ưu đãi</a>
        </div>
      )}

      <button type="button" className="promotion-carousel-arrow is-left" onClick={previous} aria-label="Banner trước">
        <ChevronLeft size={25} aria-hidden="true" />
      </button>
      <button type="button" className="promotion-carousel-arrow is-right" onClick={next} aria-label="Banner tiếp theo">
        <ChevronRight size={25} aria-hidden="true" />
      </button>

      <div className="promotion-carousel-dots" role="tablist" aria-label="Chọn banner khuyến mãi">
        {banners.map((banner, index) => (
          <button
            key={banner.id}
            type="button"
            role="tab"
            aria-selected={index === activeIndex}
            aria-label={`Hiển thị: ${banner.title}`}
            className={index === activeIndex ? "is-active" : ""}
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  )
}
