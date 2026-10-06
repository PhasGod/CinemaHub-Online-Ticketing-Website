import { Router } from "express"
import { getUsers, createStaff, updateUser, toggleUserStatus } from "../controllers/user.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// Protected admin routes
router.use(authenticate, requireRole("admin"))

router.get("/", getUsers)
router.post("/", createStaff)
router.put("/:id", updateUser)
router.patch("/:id/status", toggleUserStatus)

export default router
