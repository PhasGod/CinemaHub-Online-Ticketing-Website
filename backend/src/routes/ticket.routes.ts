import { Router } from "express"
import {
  getMyTickets,
  getTicketByCode,
  checkInTicket,
  getStaffStats,
  searchStaffTickets,
} from "../controllers/ticket.controller.js"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

// Customer tickets
router.get("/my-tickets", authenticate, getMyTickets)

// Staff stats & search (Must be before /:ticketCode)
router.get("/staff/stats", authenticate, requireRole("admin", "staff"), getStaffStats)
router.get("/staff/search", authenticate, requireRole("admin", "staff"), searchStaffTickets)

// Lookup ticket by code
router.get("/verify/:ticketCode", getTicketByCode)
router.get("/:ticketCode", getTicketByCode)

// Staff/Admin check-in
router.post(
  "/check-in",
  authenticate,
  requireRole("admin", "staff"),
  checkInTicket,
)

export default router
