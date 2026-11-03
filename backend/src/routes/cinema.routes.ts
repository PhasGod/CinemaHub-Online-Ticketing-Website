import { Router } from "express"
import { getCinemas, createCinema } from "../controllers/room.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// Public route to inspect all cinemas with child rooms
router.get("/", getCinemas)

// Protected admin route to create cinema (Admin Cinema Management)
router.post("/", authenticate, requireRole("admin"), createCinema)

export default router
