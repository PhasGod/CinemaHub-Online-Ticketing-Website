import assert from "node:assert/strict"
import { test } from "node:test"
import { prisma } from "../src/config/db.js"
import { getDashboardStats } from "../src/controllers/report.controller.js"

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

test("DASHBOARD-STATS: calculates correct zeroes when database has no bookings or tickets", async () => {
  const originalBooking = Object.getOwnPropertyDescriptor(prisma, "booking")
  const originalTicket = Object.getOwnPropertyDescriptor(prisma, "ticket")
  const originalShowtime = Object.getOwnPropertyDescriptor(prisma, "showtime")
  const originalCinema = Object.getOwnPropertyDescriptor(prisma, "cinema")
  const originalMovie = Object.getOwnPropertyDescriptor(prisma, "movie")

  try {
    Object.defineProperty(prisma, "booking", {
      configurable: true,
      value: {
        findMany: async () => [],
      },
    })
    Object.defineProperty(prisma, "ticket", {
      configurable: true,
      value: {
        count: async () => 0,
        findMany: async () => [],
      },
    })
    Object.defineProperty(prisma, "showtime", {
      configurable: true,
      value: {
        findMany: async () => [],
      },
    })
    Object.defineProperty(prisma, "movie", {
      configurable: true,
      value: {
        findMany: async () => [],
      },
    })
    Object.defineProperty(prisma, "cinema", {
      configurable: true,
      value: {
        findMany: async () => [
          { id: "cinema-1", name: "5TOP Cinema Nguyen Du", location: "TP. Hồ Chí Minh" },
        ],
      },
    })

    const { response, result } = createResponseRecorder()
    await getDashboardStats(
      {
        query: { timeRange: "today", cinemaId: "ALL" },
        user: { id: "admin-1", role: "admin" },
      } as any,
      response
    )

    assert.equal(result.statusCode, 200)
    assert.equal(result.body.success, true)
    const data = result.body.data

    // KPI validations
    assert.equal(data.kpi.totalRevenue, 0)
    assert.equal(data.kpi.previousRevenue, 0)
    assert.equal(data.kpi.revenueGrowthPercent, 0)
    assert.equal(data.kpi.ticketsSold, 0)
    assert.equal(data.kpi.previousTicketsSold, 0)
    assert.equal(data.kpi.ticketsGrowthPercent, 0)
    assert.equal(data.kpi.averageOccupancyRate, 0)
    assert.equal(data.kpi.totalShowtimes, 0)
    assert.equal(data.kpi.showtimesPlaying, 0)
    assert.equal(data.kpi.showtimesUpcoming, 0)
    assert.equal(data.kpi.showtimesFinished, 0)
    assert.equal(data.kpi.fnbRevenue, 0)
    assert.equal(data.kpi.fnbSharePercent, 0)

    // Array structures
    assert.ok(Array.isArray(data.revenueChart))
    assert.equal(data.topMovies.length, 0)
    assert.equal(data.liveShowtimes.length, 0)
    assert.equal(data.recentTransactions.length, 0)
    // Includes "ALL" plus 1 DB cinema
    assert.equal(data.cinemas.length, 2)
    assert.equal(data.cinemas[0].id, "ALL")
    assert.equal(data.cinemas[1].id, "cinema-1")
  } finally {
    if (originalBooking) Object.defineProperty(prisma, "booking", originalBooking)
    if (originalTicket) Object.defineProperty(prisma, "ticket", originalTicket)
    if (originalShowtime) Object.defineProperty(prisma, "showtime", originalShowtime)
    if (originalCinema) Object.defineProperty(prisma, "cinema", originalCinema)
    if (originalMovie) Object.defineProperty(prisma, "movie", originalMovie)
  }
})

test("DASHBOARD-STATS: aggregates real booking revenue, tickets, and top movies correctly", async () => {
  const originalBooking = Object.getOwnPropertyDescriptor(prisma, "booking")
  const originalTicket = Object.getOwnPropertyDescriptor(prisma, "ticket")
  const originalShowtime = Object.getOwnPropertyDescriptor(prisma, "showtime")
  const originalCinema = Object.getOwnPropertyDescriptor(prisma, "cinema")
  const originalMovie = Object.getOwnPropertyDescriptor(prisma, "movie")

  try {
    const now = new Date()
    const mockBookings = [
      {
        id: "b-1",
        bookingCode: "BK1001",
        totalAmount: 180000,
        createdAt: new Date(),
        status: "COMPLETED",
        payment: { method: "VNPAY", status: "SUCCESS" },
        paymentMethod: "VNPAY",
        user: { fullName: "Nguyen Van A", email: "vana@gmail.com", phone: "0901234567" },
        tickets: [
          {
            id: "t-1",
            price: 90000,
            showtimeId: "st-1",
            showtime: {
              movieId: "m-1",
              movie: {
                id: "m-1",
                title: "Mai",
                posterUrl: "/posters/mai.jpg",
                genre: "Drama",
                releaseDate: new Date("2024-02-10"),
              },
              room: { name: "Rạp 1", cinema: { name: "5TOP Cinema Nguyen Du" } },
              startTime: new Date(),
            },
          },
          {
            id: "t-2",
            price: 90000,
            showtimeId: "st-1",
            showtime: {
              movieId: "m-1",
              movie: {
                id: "m-1",
                title: "Mai",
                posterUrl: "/posters/mai.jpg",
                genre: "Drama",
                releaseDate: new Date("2024-02-10"),
              },
              room: { name: "Rạp 1", cinema: { name: "5TOP Cinema Nguyen Du" } },
              startTime: new Date(),
            },
          },
        ],
        _count: { tickets: 2 },
      },
    ]

    Object.defineProperty(prisma, "booking", {
      configurable: true,
      value: {
        findMany: async (args: any) => {
          if (args?.select?.totalAmount && !args?.select?.tickets) {
            // Previous period bookings query
            return [{ totalAmount: 100000 }]
          }
          if (args?.include?.payment) {
            // Recent transactions query
            return mockBookings
          }
          return mockBookings
        },
      },
    })

    let ticketCountCall = 0
    Object.defineProperty(prisma, "ticket", {
      configurable: true,
      value: {
        count: async () => {
          ticketCountCall++
          return ticketCountCall === 1 ? 2 : 1 // current: 2, previous: 1
        },
        findMany: async () => [
          {
            id: "t-1",
            price: 90000,
            showtime: {
              movieId: "m-1",
            },
          },
          {
            id: "t-2",
            price: 90000,
            showtime: {
              movieId: "m-1",
            },
          },
        ],
      },
    })

    const mockShowtimes = [
      {
        id: "st-1",
        movieId: "m-1",
        startTime: new Date(now.getTime() - 10 * 60 * 1000), // started 10m ago
        endTime: new Date(now.getTime() + 110 * 60 * 1000), // ends in 110m -> PLAYING
        price: 90000,
        movie: {
          id: "m-1",
          title: "Mai",
          posterUrl: "/posters/mai.jpg",
        },
        room: {
          name: "Phòng chiếu 1",
          format: "2D",
          capacity: 100,
          cinema: { name: "5TOP Cinema Nguyen Du" },
        },
        _count: {
          showtimeSeats: 100,
          tickets: 2,
        },
        tickets: [{ id: "t-1", status: "VALID" }, { id: "t-2", status: "VALID" }],
      },
    ]

    Object.defineProperty(prisma, "showtime", {
      configurable: true,
      value: {
        findMany: async () => mockShowtimes,
      },
    })

    Object.defineProperty(prisma, "movie", {
      configurable: true,
      value: {
        findMany: async () => [
          {
            id: "m-1",
            title: "Mai",
            poster: "/posters/mai.jpg",
            releaseDate: new Date("2024-02-10"),
            genres: [{ genre: { name: "Tâm Lý" } }],
          },
        ],
      },
    })

    Object.defineProperty(prisma, "cinema", {
      configurable: true,
      value: {
        findMany: async () => [
          { id: "cinema-1", name: "5TOP Cinema Nguyen Du", location: "TP. Hồ Chí Minh" },
        ],
      },
    })

    const { response, result } = createResponseRecorder()
    await getDashboardStats(
      {
        query: { timeRange: "today", cinemaId: "ALL" },
        user: { id: "admin-1", role: "admin" },
      } as any,
      response
    )

    assert.equal(result.statusCode, 200)
    assert.equal(result.body.success, true)
    const data = result.body.data

    // Revenue
    assert.equal(data.kpi.totalRevenue, 180000)
    assert.equal(data.kpi.previousRevenue, 100000)
    assert.equal(data.kpi.revenueGrowthPercent, 80) // (180000-100000)/100000 = 80%

    // Tickets
    assert.equal(data.kpi.ticketsSold, 2)
    assert.equal(data.kpi.previousTicketsSold, 1)
    assert.equal(data.kpi.ticketsGrowthPercent, 100) // (2-1)/1 = 100%

    // Showtimes & Occupancy
    assert.equal(data.kpi.totalShowtimes, 1)
    assert.equal(data.kpi.showtimesPlaying, 1)
    assert.equal(data.kpi.averageOccupancyRate, 2) // 2 / 100 = 2%

    // Top movies
    assert.equal(data.topMovies.length, 1)
    assert.equal(data.topMovies[0].title, "Mai")
    assert.equal(data.topMovies[0].revenue, 180000)
    assert.equal(data.topMovies[0].ticketsSold, 2)
    assert.equal(data.topMovies[0].sharePercent, 100)

    // Live showtime
    assert.equal(data.liveShowtimes.length, 1)
    assert.equal(data.liveShowtimes[0].status, "PLAYING")
    assert.equal(data.liveShowtimes[0].bookedSeats, 2)
    assert.equal(data.liveShowtimes[0].occupancyPercent, 2)

    // Recent transactions
    assert.equal(data.recentTransactions.length, 1)
    assert.equal(data.recentTransactions[0].bookingCode, "BK1001")
    assert.equal(data.recentTransactions[0].customerName, "Nguyen Van A")
    assert.equal(data.recentTransactions[0].amount, 180000)
    assert.equal(data.recentTransactions[0].paymentMethod, "VNPAY")
  } finally {
    if (originalBooking) Object.defineProperty(prisma, "booking", originalBooking)
    if (originalTicket) Object.defineProperty(prisma, "ticket", originalTicket)
    if (originalShowtime) Object.defineProperty(prisma, "showtime", originalShowtime)
    if (originalCinema) Object.defineProperty(prisma, "cinema", originalCinema)
    if (originalMovie) Object.defineProperty(prisma, "movie", originalMovie)
  }
})
