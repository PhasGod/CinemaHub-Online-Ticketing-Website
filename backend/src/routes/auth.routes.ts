import { Router } from "express"
import { register, login, logout, getMe, updateProfile } from "../controllers/auth.controller.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

router.post("/register", register)
router.post("/login", login)
router.post("/logout", logout)
router.get("/me", authenticate, getMe)
router.put("/profile", authenticate, updateProfile)

export default router
