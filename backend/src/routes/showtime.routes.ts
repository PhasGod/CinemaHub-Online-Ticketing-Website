import { Router } from "express"
import {
  createShowtime,
  getShowtimes,
  getShowtimeById,
  getShowtimeSeats,
  cancelShowtime,
} from "../controllers/showtime.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// Public routes
router.get("/", getShowtimes)
router.get("/:id", getShowtimeById)
router.get("/:id/seats", getShowtimeSeats)

// Protected Admin/Staff routes
router.post("/", authenticate, requireRole("admin", "staff"), createShowtime)
router.patch(
  "/:id/cancel",
  authenticate,
  requireRole("admin", "staff"),
  cancelShowtime,
)

export default router
