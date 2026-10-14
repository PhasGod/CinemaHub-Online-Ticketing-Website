import { motion, useReducedMotion } from "framer-motion"
import type { PropsWithChildren } from "react"

type ScrollRevealProps = PropsWithChildren<{
  className?: string
  delay?: number
}>

/** A one-time fade-up transition for content that enters the viewport. */
export function ScrollReveal({ children, className, delay = 0 }: ScrollRevealProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: reduceMotion ? 0 : 0.65, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}
