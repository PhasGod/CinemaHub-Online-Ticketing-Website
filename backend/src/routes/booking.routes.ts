import { Router } from "express"
import {
  holdSeats,
  payBooking,
  releaseSeats,
  getMyBookings,
  getBookingById,
  resendBookingEmail,
} from "../controllers/booking.controller.js"
import { authenticate } from "../middleware/auth.js"

const router = Router()

// All booking routes require authentication
router.post("/hold", authenticate, holdSeats)
router.post("/pay", authenticate, payBooking)
router.post("/:id/pay", authenticate, payBooking)
router.post("/:id/send-email", authenticate, resendBookingEmail)
router.post("/release", authenticate, releaseSeats)
router.post("/:id/cancel", authenticate, releaseSeats)
router.get("/my-bookings", authenticate, getMyBookings)
router.get("/:id", authenticate, getBookingById)

export default router
