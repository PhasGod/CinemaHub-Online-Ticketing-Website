import { Request, Response, NextFunction } from "express"

export function csrfProtection(allowedOrigins: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next()
    const origin = req.get("Origin")
    if (req.get("X-CinemaHub-Request") !== "1" || (origin && !allowedOrigins.includes(origin))) {
      return res.status(403).json({ error: "Yêu cầu không hợp lệ. Vui lòng tải lại trang." })
    }
    return next()
  }
}

export function createAuthLimiter(max = 10, windowMs = 15 * 60 * 1000) {
  const attempts = new Map<string, { count: number; reset: number }>()
  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now()
    for (const [key, value] of attempts) if (value.reset <= now) attempts.delete(key)
    const key = req.ip || req.socket.remoteAddress || "unknown"
    const entry = attempts.get(key) || { count: 0, reset: now + windowMs }
    if (entry.count >= max) {
      res.setHeader("Retry-After", Math.ceil((entry.reset - now) / 1000))
      return res.status(429).json({ error: "Bạn đã thử quá nhiều lần. Vui lòng thử lại sau 15 phút." })
    }
    if (!attempts.has(key) && attempts.size >= 10000) {
      return res.status(429).json({ error: "Hệ thống đang bận. Vui lòng thử lại sau." })
    }
    entry.count++
    attempts.set(key, entry)
    return next()
  }
}
