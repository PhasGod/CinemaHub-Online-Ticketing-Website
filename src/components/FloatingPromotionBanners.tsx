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
    <aside className="promo-floating-banners" aria-label="Ưu đãi nổi bật 5TOP Cinema">
      <motion.div
        className="promo-floating-banner promo-floating-banner-left"
        initial={{ x: reduceMotion ? 0 : "-150%", opacity: 0 }}
        animate={{ x: isVisible || reduceMotion ? 0 : "-150%", opacity: isVisible || reduceMotion ? 1 : 0 }}
        whileHover={isVisible && !reduceMotion ? { y: -6, scale: 1.025 } : undefined}
        transition={transition}
      >
        <Link className="promo-floating-banner-link" to="/khuyen-mai/giam-ngay-20k-combo-online" tabIndex={isVisible ? 0 : -1}>
          <img src="/promo/floating-member-combo-blue.png" alt="Đặc quyền thành viên: giảm 20K khi mua combo online" />
        </Link>
      </motion.div>
      <motion.div
        className="promo-floating-banner promo-floating-banner-right"
        initial={{ x: reduceMotion ? 0 : "150%", opacity: 0 }}
        animate={{ x: isVisible || reduceMotion ? 0 : "150%", opacity: isVisible || reduceMotion ? 1 : 0 }}
        whileHover={isVisible && !reduceMotion ? { y: -6, scale: 1.025 } : undefined}
        transition={{ ...transition, delay: isVisible && !reduceMotion ? 0.08 : 0 }}
      >
        <Link className="promo-floating-banner-link" to="/khuyen-mai/giam-ngay-20k-combo-online" tabIndex={isVisible ? 0 : -1}>
          <img src="/promo/floating-member-combo-blue.png" alt="Đặc quyền thành viên: giảm 20K khi mua combo online" />
        </Link>
      </motion.div>
    </aside>
  )
}
