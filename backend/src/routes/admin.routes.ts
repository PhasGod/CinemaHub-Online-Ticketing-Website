import { Router } from "express"
import { getDashboardStats } from "../controllers/report.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// GET /api/admin/dashboard/stats
router.get("/dashboard/stats", authenticate, requireRole("admin"), getDashboardStats)

export default router
