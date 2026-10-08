import { Router } from "express"
import { register, login, logout, getMe, updateProfile } from "../controllers/auth.controller.js"
import { authenticate } from "../middleware/auth.js"

import { createAuthLimiter } from "../middleware/security.js"

const router = Router()
const authLimiter = createAuthLimiter()

router.post("/register", authLimiter, register)
router.post("/login", authLimiter, login)
router.post("/logout", logout)
router.get("/me", authenticate, getMe)
router.put("/profile", authenticate, updateProfile)

export default router
