import { Router } from "express"
import {
  createMomoPaymentController,
  momoIpnController,
  getMomoPaymentStatusController,
} from "../controllers/payment.controller.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

// Khởi tạo thanh toán MoMo Sandbox (yêu cầu đăng nhập)
router.post("/momo/create", authenticate, createMomoPaymentController)
router.post("/momo/create/:bookingId", authenticate, createMomoPaymentController)

// Webhook / IPN callback từ cổng MoMo (MoMo gọi trực tiếp)
router.post("/momo/ipn", momoIpnController)

// Tra cứu trạng thái giao dịch MoMo (Frontend polling)
router.get("/momo/status/:orderId", getMomoPaymentStatusController)
router.get("/booking/:bookingId/status", getMomoPaymentStatusController)

export default router
