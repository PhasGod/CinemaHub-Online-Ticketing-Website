import { Router } from "express"
import { getMovies, getMovieByIdOrSlug, createMovie, updateMovie, deleteMovie } from "../controllers/movie.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// Public routes for fetching movies & movie detail
router.get("/", getMovies)
router.get("/:idOrSlug", getMovieByIdOrSlug)

// Protected admin/staff routes
router.post("/", authenticate, requireRole("admin"), createMovie)
router.put("/:id", authenticate, requireRole("admin"), updateMovie)
router.delete("/:id", authenticate, requireRole("admin"), deleteMovie)

export default router
