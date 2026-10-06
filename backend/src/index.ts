import express, { Request, Response, NextFunction } from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
import dotenv from "dotenv"
import authRoutes from "./routes/auth.routes.js"
import userRoutes from "./routes/user.routes.js"
import genreRoutes from "./routes/genre.routes.js"
import movieRoutes from "./routes/movie.routes.js"
import roomRoutes from "./routes/room.routes.js"
import statsRoutes from "./routes/stats.routes.js"

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:8443"

// CORS – only allow configured frontend origin
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true) // curl/Postman/server-side
      const allowed = [CLIENT_URL, "http://localhost:8443", "http://localhost:5173"]
      if (allowed.includes(origin)) {
        callback(null, true)
      } else {
        callback(new Error(`CORS: Origin ${origin} not allowed`))
      }
    },
    credentials: true,
  })
)

app.use(express.json({ limit: "2mb" }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// Health check
app.get("/api/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", message: "CinemaHub Backend Server is running" })
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", userRoutes)
app.use("/api/genres", genreRoutes)
app.use("/api/movies", movieRoutes)
app.use("/api/cinema", roomRoutes)
app.use("/api/stats", statsRoutes)

// Centralized 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Đường dẫn ${req.originalUrl} không tồn tại` })
})

// Centralized error handler (no internal details leaked to client)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled Error:", err.message)
  res.status(500).json({ error: "Lỗi hệ thống máy chủ" })
})

app.listen(PORT, () => {
  console.log(`🚀 CinemaHub Backend Server listening on http://localhost:${PORT}`)
})
