import { Router } from "express"
import {
  getCinemas,
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getSeatsByRoom,
  generateSeatLayout,
  updateSeat,
  batchUpdateSeats,
  clearSeatLayout,
} from "../controllers/room.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// Public routes for cinema & room inspection
router.get("/cinemas", getCinemas)
router.get("/rooms", getRooms)
router.get("/rooms/:id", getRoomById)
router.get("/rooms/:roomId/seats", getSeatsByRoom)

// Protected admin/staff routes for room management (US.07)
router.post("/rooms", authenticate, requireRole("admin", "staff"), createRoom)
router.put("/rooms/:id", authenticate, requireRole("admin", "staff"), updateRoom)
router.delete("/rooms/:id", authenticate, requireRole("admin", "staff"), deleteRoom)

// Protected admin/staff routes for seat layout management (US.08)
router.post("/rooms/:roomId/seats/generate", authenticate, requireRole("admin", "staff"), generateSeatLayout)
router.patch("/rooms/:roomId/seats/:seatId", authenticate, requireRole("admin", "staff"), updateSeat)
router.put("/rooms/:roomId/seats/batch", authenticate, requireRole("admin", "staff"), batchUpdateSeats)
router.delete("/rooms/:roomId/seats", authenticate, requireRole("admin", "staff"), clearSeatLayout)

export default router
