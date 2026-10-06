import { Router } from "express"
import { getAdminStats } from "../controllers/stats.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

router.get("/", authenticate, requireRole("admin", "staff"), getAdminStats)

export default router
