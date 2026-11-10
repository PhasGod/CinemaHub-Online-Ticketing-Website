import { Router } from "express"
import {
  getMyTickets,
  getTicketByCode,
  checkInTicket,
  getStaffStats,
  searchStaffTickets,
  resendTicketEmail,
  cancelTicket,
} from "../controllers/ticket.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// Customer tickets
router.get("/my-tickets", authenticate, getMyTickets)

// Cancel ticket endpoints (Customer, Staff, Admin)
router.post("/:id/cancel", authenticate, cancelTicket)
router.post("/cancel/:id", authenticate, cancelTicket)

// Staff stats & search (Must be before /:ticketCode)
router.get("/staff/stats", authenticate, requireRole("admin", "staff"), getStaffStats)
router.get("/staff/search", authenticate, requireRole("admin", "staff"), searchStaffTickets)

// Resend ticket email
router.post("/send-email", authenticate, resendTicketEmail)
router.post("/:ticketCode/send-email", authenticate, resendTicketEmail)

// Lookup ticket by code
router.get("/verify/:ticketCode", getTicketByCode)
router.get("/:ticketCode", getTicketByCode)

// Staff/Admin check-in endpoints
router.post(
  "/check-in",
  authenticate,
  requireRole("admin", "staff"),
  checkInTicket,
)

router.post(
  "/staff/tickets/check-in",
  authenticate,
  requireRole("admin", "staff"),
  checkInTicket,
)

export default router
