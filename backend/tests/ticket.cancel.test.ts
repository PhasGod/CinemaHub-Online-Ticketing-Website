import assert from "node:assert/strict"
import { test } from "node:test"
import { prisma } from "../src/config/db.js"
import { cancelTicket } from "../src/controllers/ticket.controller.js"

function createResponseRecorder() {
  const result: { statusCode: number; body?: any } = {
    statusCode: 200,
  }
  const response: any = {
    status(code: number) {
      result.statusCode = code
      return response
    },
    json(body: any) {
      result.body = body
      return response
    },
  }
  return { response, result }
}

test("TICKET-CANCEL: rejects unauthorized or non-owner user", async () => {
  const futureDate = new Date(Date.now() + 120 * 60 * 1000) // 2 hours in the future
  const mockTicket: any = {
    id: "ticket-1",
    ticketCode: "TK12345",
    status: "VALID",
    bookingId: "booking-1",
    showtimeId: "showtime-1",
    seatId: "seat-1",
    booking: {
      userId: "user-owner",
      payment: { id: "pay-1", status: "SUCCESS" },
      tickets: [],
    },
    showtime: {
      startTime: futureDate,
    },
  }

  const originalTicket = Object.getOwnPropertyDescriptor(prisma, "ticket")
  const originalBooking = Object.getOwnPropertyDescriptor(prisma, "booking")
  try {
    Object.defineProperty(prisma, "ticket", {
      configurable: true,
      value: {
        findFirst: async () => mockTicket,
      },
    })
    Object.defineProperty(prisma, "booking", {
      configurable: true,
      value: {
        findFirst: async () => null,
      },
    })

    // 1. Not logged in
    const { response: res1, result: r1 } = createResponseRecorder()
    await cancelTicket({ params: { id: "ticket-1" } } as any, res1)
    assert.equal(r1.statusCode, 401)

    // 2. Logged in as different customer
    const { response: res2, result: r2 } = createResponseRecorder()
    await cancelTicket(
      {
        params: { id: "ticket-1" },
        user: { id: "user-other", role: "customer" },
      } as any,
      res2,
    )
    assert.equal(r2.statusCode, 403)
  } finally {
    if (originalTicket) Object.defineProperty(prisma, "ticket", originalTicket)
    if (originalBooking) Object.defineProperty(prisma, "booking", originalBooking)
  }
})

test("TICKET-CANCEL: rejects if ticket is USED or within 60 minutes of showtime", async () => {
  const futureDate = new Date(Date.now() + 120 * 60 * 1000)
  const soonDate = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes in future

  const usedTicket: any = {
    id: "ticket-used",
    ticketCode: "TK-USED",
    status: "USED",
    bookingId: "booking-1",
    showtimeId: "showtime-1",
    seatId: "seat-1",
    booking: {
      userId: "user-owner",
      payment: { id: "pay-1" },
    },
    showtime: {
      startTime: futureDate,
    },
  }

  const soonTicket: any = {
    id: "ticket-soon",
    ticketCode: "TK-SOON",
    status: "VALID",
    bookingId: "booking-1",
    showtimeId: "showtime-1",
    seatId: "seat-1",
    booking: {
      userId: "user-owner",
      payment: { id: "pay-1" },
    },
    showtime: {
      startTime: soonDate,
    },
  }

  const originalTicket = Object.getOwnPropertyDescriptor(prisma, "ticket")
  try {
    // Test USED ticket
    Object.defineProperty(prisma, "ticket", {
      configurable: true,
      value: {
        findFirst: async () => usedTicket,
      },
    })
    const { response: res1, result: r1 } = createResponseRecorder()
    await cancelTicket(
      {
        params: { id: "ticket-used" },
        user: { id: "user-owner", role: "customer" },
      } as any,
      res1,
    )
    assert.equal(r1.statusCode, 400)
    assert.match(r1.body.error, /Vé đã qua cửa, không thể hủy/)

    // Test SOON ticket (< 60 minutes)
    Object.defineProperty(prisma, "ticket", {
      configurable: true,
      value: {
        findFirst: async () => soonTicket,
      },
    })
    const { response: res2, result: r2 } = createResponseRecorder()
    await cancelTicket(
      {
        params: { id: "ticket-soon" },
        user: { id: "user-owner", role: "customer" },
      } as any,
      res2,
    )
    assert.equal(r2.statusCode, 400)
    assert.match(r2.body.error, /Chỉ được hủy vé trước giờ chiếu ít nhất 60 phút/)
  } finally {
    if (originalTicket) Object.defineProperty(prisma, "ticket", originalTicket)
  }
})

test("TICKET-CANCEL: successfully cancels valid ticket > 60 minutes in prisma.$transaction", async () => {
  const futureDate = new Date(Date.now() + 180 * 60 * 1000) // 3 hours

  const validTicket: any = {
    id: "ticket-valid",
    ticketCode: "TK-VALID",
    status: "VALID",
    bookingId: "booking-1",
    showtimeId: "showtime-1",
    seatId: "seat-1",
    booking: {
      userId: "user-owner",
      payment: { id: "pay-1", status: "SUCCESS" },
      tickets: [],
    },
    showtime: {
      startTime: futureDate,
    },
  }

  const updates: Array<{ model: string; data: any; where: any }> = []

  const originalTicket = Object.getOwnPropertyDescriptor(prisma, "ticket")
  const originalBooking = Object.getOwnPropertyDescriptor(prisma, "booking")
  const originalShowtimeSeat = Object.getOwnPropertyDescriptor(prisma, "showtimeSeat")
  const originalPayment = Object.getOwnPropertyDescriptor(prisma, "payment")
  const originalTransaction = Object.getOwnPropertyDescriptor(prisma, "$transaction")

  try {
    Object.defineProperty(prisma, "ticket", {
      configurable: true,
      value: {
        findFirst: async () => validTicket,
      },
    })

    Object.defineProperty(prisma, "$transaction", {
      configurable: true,
      value: async (callback: any) => {
        const tx = {
          ticket: {
            update: async ({ where, data }: any) => {
              updates.push({ model: "ticket", where, data })
              return { ...validTicket, ...data }
            },
            count: async () => 0, // No remaining active tickets
          },
          booking: {
            update: async ({ where, data }: any) => {
              updates.push({ model: "booking", where, data })
            },
          },
          showtimeSeat: {
            updateMany: async ({ where, data }: any) => {
              updates.push({ model: "showtimeSeat", where, data })
            },
          },
          payment: {
            update: async ({ where, data }: any) => {
              updates.push({ model: "payment", where, data })
            },
          },
        }
        return callback(tx)
      },
    })

    const { response, result } = createResponseRecorder()
    await cancelTicket(
      {
        params: { id: "ticket-valid" },
        user: { id: "user-owner", role: "customer" },
      } as any,
      response,
    )

    assert.equal(result.statusCode, 200)
    assert.equal(result.body.success, true)
    assert.equal(result.body.message, "Hủy vé thành công")

    // Check updates inside transaction
    const ticketUpdate = updates.find((u) => u.model === "ticket")
    assert.equal(ticketUpdate?.data.status, "CANCELLED")

    const bookingUpdate = updates.find((u) => u.model === "booking")
    assert.equal(bookingUpdate?.data.status, "CANCELLED")

    const seatUpdate = updates.find((u) => u.model === "showtimeSeat")
    assert.equal(seatUpdate?.data.status, "AVAILABLE")
    assert.equal(seatUpdate?.data.heldByUserId, null)
    assert.equal(seatUpdate?.data.holdExpiresAt, null)

    const paymentUpdate = updates.find((u) => u.model === "payment")
    assert.equal(paymentUpdate?.data.status, "FAILED")
  } finally {
    if (originalTicket) Object.defineProperty(prisma, "ticket", originalTicket)
    if (originalBooking) Object.defineProperty(prisma, "booking", originalBooking)
    if (originalShowtimeSeat) Object.defineProperty(prisma, "showtimeSeat", originalShowtimeSeat)
    if (originalPayment) Object.defineProperty(prisma, "payment", originalPayment)
    if (originalTransaction) Object.defineProperty(prisma, "$transaction", originalTransaction)
  }
})
