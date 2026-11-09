import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"
import { Link } from "react-router-dom"

/** Fixed desktop-only promotion placements. Images are local so they never depend on an external host. */
export function FloatingPromotionBanners() {
  const [isVisible, setIsVisible] = useState(false)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const updateVisibility = () => setIsVisible(window.scrollY > 200)

    updateVisibility()
    window.addEventListener("scroll", updateVisibility, { passive: true })
    return () => window.removeEventListener("scroll", updateVisibility)
  }, [])

  const transition = { duration: reduceMotion ? 0 : 0.7, ease: [0.16, 1, 0.3, 1] as const }

  return (
    <aside className="promo-floating-banners pointer-events-none" aria-label="Ưu đãi nổi bật 5TOP Cinema">
      {/* Banner trái */}
      <div className="hidden xl:block fixed left-2 xl:left-4 top-1/2 -translate-y-1/2 z-20 w-28 xl:w-32 max-w-[120px] pointer-events-auto">
        <motion.div
          className="promo-floating-banner promo-floating-banner-left w-full"
          initial={{ x: reduceMotion ? 0 : "-150%", opacity: 0 }}
          animate={{ x: isVisible || reduceMotion ? 0 : "-150%", opacity: isVisible || reduceMotion ? 1 : 0 }}
          whileHover={isVisible && !reduceMotion ? { y: -6, scale: 1.025 } : undefined}
          transition={transition}
        >
          <Link
            className="promo-floating-banner-link block relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            to="/khuyen-mai/giam-ngay-20k-combo-online"
            tabIndex={isVisible ? 0 : -1}
          >
            <img
              src="/promo/floating-member-combo-blue.png"
              alt="Đặc quyền thành viên: giảm 20K khi mua combo online"
              className="h-auto w-full object-contain block"
            />
            <div className="sr-only">
              <span className="text-[10px] xl:text-[11px]">ĐẶC QUYỀN THÀNH VIÊN</span>
              <span className="text-sm font-bold">GIẢM 20K</span>
              <span className="text-xs py-1 px-2">68.000đ - ĐẶT NGAY</span>
            </div>
          </Link>
        </motion.div>
      </div>

      {/* Banner phải */}
      <div className="hidden xl:block fixed right-2 xl:right-4 top-1/2 -translate-y-1/2 z-20 w-28 xl:w-32 max-w-[120px] pointer-events-auto">
        <motion.div
          className="promo-floating-banner promo-floating-banner-right w-full"
          initial={{ x: reduceMotion ? 0 : "150%", opacity: 0 }}
          animate={{ x: isVisible || reduceMotion ? 0 : "150%", opacity: isVisible || reduceMotion ? 1 : 0 }}
          whileHover={isVisible && !reduceMotion ? { y: -6, scale: 1.025 } : undefined}
          transition={{ ...transition, delay: isVisible && !reduceMotion ? 0.08 : 0 }}
        >
          <Link
            className="promo-floating-banner-link block relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
            to="/khuyen-mai/giam-ngay-20k-combo-online"
            tabIndex={isVisible ? 0 : -1}
          >
            <img
              src="/promo/floating-member-combo-blue.png"
              alt="Đặc quyền thành viên: giảm 20K khi mua combo online"
              className="h-auto w-full object-contain block"
            />
            <div className="sr-only">
              <span className="text-[10px] xl:text-[11px]">ĐẶC QUYỀN THÀNH VIÊN</span>
              <span className="text-sm font-bold">GIẢM 20K</span>
              <span className="text-xs py-1 px-2">68.000đ - ĐẶT NGAY</span>
            </div>
          </Link>
        </motion.div>
      </div>
    </aside>
  )
}
