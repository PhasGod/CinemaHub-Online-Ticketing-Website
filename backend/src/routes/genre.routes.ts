import { Router } from "express"
import { getGenres, createGenre, updateGenre, deleteGenre } from "../controllers/genre.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// Public route for fetching genres
router.get("/", getGenres)

// Protected admin/staff routes
router.post("/", authenticate, requireRole("admin"), createGenre)
router.put("/:id", authenticate, requireRole("admin"), updateGenre)
router.delete("/:id", authenticate, requireRole("admin"), deleteGenre)

export default router
