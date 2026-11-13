import { Router } from "express"
import { getAdminStats } from "../controllers/stats.controller.js"
import { getDashboardStats } from "../controllers/report.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

router.get("/", authenticate, requireRole("admin"), getAdminStats)
router.get("/dashboard", authenticate, requireRole("admin"), getDashboardStats)
router.get("/dashboard/stats", authenticate, requireRole("admin"), getDashboardStats)

export default router
