import { Router } from "express"
import { getMovies, getMovieByIdOrSlug, createMovie, updateMovie, deleteMovie } from "../controllers/movie.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// Public routes for fetching movies & movie detail
router.get("/", getMovies)
router.get("/:idOrSlug", getMovieByIdOrSlug)

// Protected admin/staff routes
router.post("/", authenticate, requireRole("admin", "staff"), createMovie)
router.put("/:id", authenticate, requireRole("admin", "staff"), updateMovie)
router.delete("/:id", authenticate, requireRole("admin", "staff"), deleteMovie)

export default router
