import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../config/db.js"
import { AuthRequest } from "../middleware/auth.js"

const createShowtimeSchema = z.object({
  movieId: z.string().min(1, "Vui lòng chọn phim"),
  roomId: z.string().min(1, "Vui lòng chọn phòng chiếu"),
  startTime: z
    .string()
    .datetime({ message: "startTime phải là định dạng ISO-8601 hợp lệ" }),
  endTime: z
    .string()
    .datetime({ message: "endTime phải là định dạng ISO-8601 hợp lệ" }),
  price: z.number().positive("Giá vé phải là số dương"),
})

// POST /api/showtimes (Chỉ Admin/Staff)
export async function createShowtime(req: AuthRequest, res: Response) {
  try {
    const parseResult = createShowtimeSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({
        error: "Dữ liệu đầu vào không hợp lệ",
        details: parseResult.error.format(),
      })
    }

    const { movieId, roomId, startTime, endTime, price } = parseResult.data
    const start = new Date(startTime)
    const end = new Date(endTime)
    const now = new Date()

    // Validation thời gian
    if (start >= end) {
      return res
        .status(400)
        .json({
          error:
            "Thời gian bắt đầu (startTime) phải trước thời gian kết thúc (endTime)",
        })
    }

    if (start <= now) {
      return res
        .status(400)
        .json({
          error:
            "Thời gian bắt đầu (startTime) phải lớn hơn thời điểm hiện tại",
        })
    }

    // Kiểm tra phim và phòng có tồn tại không
    const [movie, room] = await Promise.all([
      prisma.movie.findUnique({ where: { id: movieId } }),
      prisma.room.findUnique({
        where: { id: roomId },
        include: { cinema: true },
      }),
    ])

    if (!movie) {
      return res.status(404).json({ error: "Không tìm thấy phim tương ứng" })
    }

    if (!room) {
      return res
        .status(404)
        .json({ error: "Không tìm thấy phòng chiếu tương ứng" })
    }

    // Chống trùng phòng (Crucial):
    // WHERE roomId = :roomId AND status = 'ACTIVE' AND (startTime < :endTime AND endTime > :startTime)
    const conflictingShowtime = await prisma.showtime.findFirst({
      where: {
        roomId,
        status: "ACTIVE",
        startTime: { lt: end },
        endTime: { gt: start },
      },
    })

    if (conflictingShowtime) {
      return res
        .status(409)
        .json({ error: "Khung giờ này phòng chiếu đã có suất chiếu khác." })
    }

    // Transaction: Tạo Showtime & tự động sinh ShowtimeSeat với trạng thái AVAILABLE
    const result = await prisma.$transaction(async (tx) => {
      // Kiểm tra lại xung đột trong transaction
      const innerConflict = await tx.showtime.findFirst({
        where: {
          roomId,
          status: "ACTIVE",
          startTime: { lt: end },
          endTime: { gt: start },
        },
      })
      if (innerConflict) {
        throw Object.assign(
          new Error("Khung giờ này phòng chiếu đã có suất chiếu khác."),
          { status: 409 },
        )
      }

      const showtime = await tx.showtime.create({
        data: {
          movieId,
          roomId,
          startTime: start,
          endTime: end,
          price,
          status: "ACTIVE",
        },
        include: {
          movie: true,
          room: { include: { cinema: true } },
        },
      })

      // Query toàn bộ ghế đang hoạt động của phòng chiếu
      const seats = await tx.seat.findMany({
        where: {
          roomId,
          isActive: true,
        },
      })

      if (seats.length > 0) {
        await tx.showtimeSeat.createMany({
          data: seats.map((seat) => ({
            showtimeId: showtime.id,
            seatId: seat.id,
            status: "AVAILABLE" as const,
          })),
        })
      }

      return { showtime, seatsCount: seats.length }
    })

    return res.status(201).json({
      message: "Tạo suất chiếu thành công",
      showtime: result.showtime,
      seatsCreated: result.seatsCount,
    })
  } catch (error: any) {
    if (error.status === 409) {
      return res.status(409).json({ error: error.message })
    }
    console.error("Create showtime error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tạo suất chiếu" })
  }
}

// GET /api/showtimes (Public)
// Query params: movieId, date (YYYY-MM-DD), cinemaId
export async function getShowtimes(req: Request, res: Response) {
  try {
    const { movieId, date, cinemaId } = req.query as {
      movieId?: string
      date?: string
      cinemaId?: string
    }

    const where: any = {
      status: "ACTIVE",
    }

    if (movieId) {
      where.movieId = movieId
    }

    if (cinemaId) {
      where.room = {
        cinemaId,
      }
    }

    if (date) {
      // Parse YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(date)) {
        return res
          .status(400)
          .json({
            error: "Định dạng ngày (date) không hợp lệ, yêu cầu YYYY-MM-DD",
          })
      }
      const startOfDay = new Date(`${date}T00:00:00.000Z`)
      const endOfDay = new Date(`${date}T23:59:59.999Z`)
      where.startTime = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    const showtimes = await prisma.showtime.findMany({
      where,
      include: {
        movie: {
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
          },
        },
        room: {
          include: {
            cinema: true,
          },
        },
        _count: {
          select: {
            showtimeSeats: {
              where: { status: "AVAILABLE" },
            },
          },
        },
      },
      orderBy: {
        startTime: "asc",
      },
    })

    return res.json({
      showtimes: showtimes.map((st) => ({
        id: st.id,
        movieId: st.movieId,
        movieTitle: st.movie.title,
        movieSlug: st.movie.slug,
        moviePoster: st.movie.poster,
        format: st.movie.format,
        runtime: st.movie.runtime,
        rating: st.movie.rating,
        genres: st.movie.genres.map((g) => g.genre.name),
        roomId: st.roomId,
        roomName: st.room.name,
        roomFormat: st.room.format,
        cinemaId: st.room.cinemaId,
        cinemaName: st.room.cinema.name,
        cinemaLocation: st.room.cinema.location,
        startTime: st.startTime,
        endTime: st.endTime,
        price: Number(st.price),
        status: st.status,
        availableSeats: st._count.showtimeSeats,
        createdAt: st.createdAt,
      })),
    })
  } catch (error) {
    console.error("Get showtimes error:", error)
    return res
      .status(500)
      .json({ error: "Lỗi hệ thống khi tải danh sách suất chiếu" })
  }
}

// GET /api/showtimes/:id (Public)
export async function getShowtimeById(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string

    const showtime = await prisma.showtime.findUnique({
      where: { id },
      include: {
        movie: {
          include: {
            genres: {
              include: {
                genre: true,
              },
            },
          },
        },
        room: {
          include: {
            cinema: true,
          },
        },
      },
    })

    if (!showtime) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu" })
    }

    return res.json({
      showtime: {
        id: showtime.id,
        movieId: showtime.movieId,
        movieTitle: showtime.movie.title,
        movieSlug: showtime.movie.slug,
        moviePoster: showtime.movie.poster,
        format: showtime.movie.format,
        runtime: showtime.movie.runtime,
        rating: showtime.movie.rating,
        genres: showtime.movie.genres.map((g) => g.genre.name),
        roomId: showtime.roomId,
        roomName: showtime.room.name,
        roomFormat: showtime.room.format,
        cinemaId: showtime.room.cinemaId,
        cinemaName: showtime.room.cinema.name,
        cinemaLocation: showtime.room.cinema.location,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        price: Number(showtime.price),
        status: showtime.status,
        createdAt: showtime.createdAt,
      },
    })
  } catch (error) {
    console.error("Get showtime by id error:", error)
    return res
      .status(500)
      .json({ error: "Lỗi hệ thống khi tải chi tiết suất chiếu" })
  }
}

// GET /api/showtimes/:id/seats (Public / Customer)
export async function getShowtimeSeats(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string

    const showtime = await prisma.showtime.findUnique({
      where: { id },
      include: {
        movie: true,
        room: {
          include: {
            cinema: true,
          },
        },
      },
    })

    if (!showtime) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu" })
    }

    // Lazy Release ghế hết hạn:
    // Tự động update các ShowtimeSeat đang có status = 'HELD' và holdExpiresAt < NOW() về lại AVAILABLE
    await prisma.showtimeSeat.updateMany({
      where: {
        showtimeId: id,
        status: "HELD",
        holdExpiresAt: {
          lt: new Date(),
        },
      },
      data: {
        status: "AVAILABLE",
        heldByUserId: null,
        holdExpiresAt: null,
      },
    })

    // Lấy toàn bộ danh sách ghế của suất chiếu
    const showtimeSeats = await prisma.showtimeSeat.findMany({
      where: { showtimeId: id },
      include: {
        seat: true,
      },
      orderBy: [{ seat: { row: "asc" } }, { seat: { number: "asc" } }],
    })

    const basePrice = Number(showtime.price)
    const currentUserId = req.user?.id

    const seats = showtimeSeats.map((stSeat) => {
      // Ghế VIP phụ thu 20% làm tròn lên hàng nghìn
      const seatPrice =
        stSeat.seat.type === "vip"
          ? Math.round((basePrice * 1.2) / 1000) * 1000
          : basePrice

      const isHeldByMe = Boolean(
        currentUserId &&
          stSeat.status === "HELD" &&
          stSeat.heldByUserId === currentUserId,
      )

      return {
        id: stSeat.id,
        seatId: stSeat.seatId,
        row: stSeat.seat.row,
        number: stSeat.seat.number,
        type: stSeat.seat.type, // standard | vip
        status: stSeat.status, // AVAILABLE | HELD | BOOKED
        price: seatPrice,
        holdExpiresAt: stSeat.holdExpiresAt,
        isHeldByMe,
      }
    })

    return res.json({
      showtime: {
        id: showtime.id,
        movieId: showtime.movieId,
        movieTitle: showtime.movie.title,
        moviePoster: showtime.movie.poster,
        format: showtime.movie.format,
        roomId: showtime.roomId,
        roomName: showtime.room.name,
        cinemaId: showtime.room.cinemaId,
        cinemaName: showtime.room.cinema.name,
        startTime: showtime.startTime,
        endTime: showtime.endTime,
        price: basePrice,
        status: showtime.status,
      },
      totalSeats: seats.length,
      availableSeats: seats.filter((s) => s.status === "AVAILABLE").length,
      seats,
    })
  } catch (error) {
    console.error("Get showtime seats error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải sơ đồ ghế" })
  }
}

// PATCH /api/showtimes/:id/cancel (Chỉ Admin/Staff)
export async function cancelShowtime(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string

    const showtime = await prisma.showtime.findUnique({
      where: { id },
    })

    if (!showtime) {
      return res.status(404).json({ error: "Không tìm thấy suất chiếu" })
    }

    // Kiểm tra xem đã có vé nào được đặt chưa
    const bookedSeatsCount = await prisma.showtimeSeat.count({
      where: {
        showtimeId: id,
        status: "BOOKED",
      },
    })

    if (bookedSeatsCount > 0) {
      return res.status(400).json({
        error: `Không thể hủy suất chiếu đã có ${bookedSeatsCount} vé được mua thành công`,
      })
    }

    const updated = await prisma.showtime.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    })

    return res.json({
      message: "Hủy suất chiếu thành công",
      showtime: updated,
    })
  } catch (error) {
    console.error("Cancel showtime error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi hủy suất chiếu" })
  }
}
