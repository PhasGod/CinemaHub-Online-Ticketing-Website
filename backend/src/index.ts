import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import genreRoutes from "./routes/genre.routes.js"
import movieRoutes from "./routes/movie.routes.js"
import roomRoutes from "./routes/room.routes.js"
import cinemaRoutes from "./routes/cinema.routes.js"
import showtimeRoutes from "./routes/showtime.routes.js"
import bookingRoutes from "./routes/booking.routes.js"
import ticketRoutes from "./routes/ticket.routes.js"
import paymentRoutes from "./routes/payment.routes.js"
import { csrfProtection } from "./middleware/security.js"
import statsRoutes from "./routes/stats.routes.js"
import promotionRoutes from "./routes/promotion.routes.js"
import adminPromotionRoutes from "./routes/admin-promotion.routes.js"
import adminRoutes from "./routes/admin.routes.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:8443"

const allowedOrigins = [
  ...new Set([
    CLIENT_URL,
    "http://localhost:8443",
    "http://localhost:5173",
    "http://127.0.0.1:8443",
    "http://127.0.0.1:5173",
  ]),
]

// CORS – only allow configured frontend origin
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true) // curl/Postman/server-side
      const allowed = allowedOrigins
      if (allowed.includes(origin)) {
        callback(null, true)
      } else {
        callback(
          Object.assign(new Error("Origin không được phép"), { status: 403 }),
        )
      }
    },
    credentials: true,
  }),
)

app.use(express.json({ limit: "2mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use("/api", csrfProtection(allowedOrigins))

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "CinemaHub Backend Server is running" })
})

<<<<<<< Updated upstream
// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/genres", genreRoutes)
app.use("/api/movies", movieRoutes)
app.use("/api/cinemas", cinemaRoutes)
app.use("/api/cinema", roomRoutes)
app.use("/api/showtimes", showtimeRoutes)
app.use("/api/bookings", bookingRoutes)
app.use("/api/payments", paymentRoutes)
app.use("/api/tickets", ticketRoutes)
app.use("/api/staff/tickets", ticketRoutes)
app.use("/api/stats", statsRoutes)
app.use("/api/promotions", promotionRoutes)
app.use("/api/admin/promotions", adminPromotionRoutes)
=======
// 5. Routes (đăng ký cả prefix /api và root để tương thích với mọi cấu hình URL frontend)
const registerRoutes = (prefix: string) => {
  app.use(`${prefix}/auth`, authRoutes)
  app.use(`${prefix}/users`, userRoutes)
  app.use(`${prefix}/genres`, genreRoutes)
  app.use(`${prefix}/movies`, movieRoutes)
  app.use(`${prefix}/cinemas`, cinemaRoutes)
  app.use(`${prefix}/cinema`, roomRoutes)
  app.use(`${prefix}/showtimes`, showtimeRoutes)
  app.use(`${prefix}/bookings`, bookingRoutes)
  app.use(`${prefix}/payments`, paymentRoutes)
  app.use(`${prefix}/tickets`, ticketRoutes)
  app.use(`${prefix}/staff/tickets`, ticketRoutes)
  app.use(`${prefix}/stats`, statsRoutes)
  app.use(`${prefix}/promotions`, promotionRoutes)
  app.use(`${prefix}/admin/promotions`, adminPromotionRoutes)
  app.use(`${prefix}/admin`, adminRoutes)
}

registerRoutes("/api")
registerRoutes("")
>>>>>>> Stashed changes

// Centralized 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Đường dẫn ${req.originalUrl} không tồn tại` })
})

// Centralized error handler (no internal details leaked to client)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Error:", err.message)
  const status = (err as Error & { status?: number }).status
  res
    .status(status === 403 ? 403 : 500)
    .json({
      error: status === 403 ? "Origin không được phép" : "Lỗi hệ thống máy chủ",
    })
})

app.listen(PORT, () => {
  console.log(
    `🚀 CinemaHub Backend Server listening on http://localhost:${PORT}`,
  )
})
