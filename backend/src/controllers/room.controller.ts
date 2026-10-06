import { Request, Response } from "express"
import { z } from "zod"
import { prisma } from "../config/db.js"

const roomSchema = z.object({
  cinemaId: z.string().min(1, "Vui lòng chọn rạp chiếu"),
  name: z.string().min(2, "Tên phòng chiếu phải có ít nhất 2 ký tự"),
  format: z.string().default("2D"),
})

const generateSeatsSchema = z.object({
  rowCount: z.number().int().min(1).max(26).default(6),
  seatsPerRow: z.number().int().min(1).max(30).default(10),
  vipRows: z.array(z.string()).optional().default([]),
  overwrite: z.boolean().optional().default(false),
})

// ========== Cinemas ==========
export async function getCinemas(_req: Request, res: Response) {
  try {
    const cinemas = await prisma.cinema.findMany({ orderBy: { name: "asc" } })
    return res.json({ cinemas })
  } catch (error) {
    console.error("Get cinemas error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải danh sách rạp" })
  }
}

// ========== Rooms ==========
export async function getRooms(req: Request, res: Response) {
  try {
    const cinemaIdFilter = req.query.cinemaId as string | undefined
    const where = cinemaIdFilter ? { cinemaId: cinemaIdFilter } : {}

    const rooms = await prisma.room.findMany({
      where,
      include: {
        cinema: true,
        _count: { select: { seats: { where: { isActive: true } } } },
      },
      orderBy: { name: "asc" },
    })

    return res.json({
      rooms: rooms.map((r) => ({
        id: r.id,
        cinemaId: r.cinemaId,
        cinemaName: r.cinema.name,
        name: r.name,
        format: r.format,
        capacity: r._count.seats,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    })
  } catch (error) {
    console.error("Get rooms error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải danh sách phòng chiếu" })
  }
}

export async function getRoomById(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        cinema: true,
        seats: { orderBy: [{ row: "asc" }, { number: "asc" }] },
      },
    })
    if (!room) return res.status(404).json({ error: "Không tìm thấy phòng chiếu" })

    const activeCount = room.seats.filter((s) => s.isActive).length
    return res.json({
      room: {
        id: room.id,
        cinemaId: room.cinemaId,
        cinemaName: room.cinema.name,
        name: room.name,
        format: room.format,
        capacity: activeCount,
        createdAt: room.createdAt,
        updatedAt: room.updatedAt,
        seats: room.seats,
      },
    })
  } catch (error) {
    console.error("Get room detail error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải thông tin phòng chiếu" })
  }
}

export async function createRoom(req: Request, res: Response) {
  try {
    const parseResult = roomSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(", ") })
    }
    const { cinemaId, name, format } = parseResult.data

    const cinema = await prisma.cinema.findUnique({ where: { id: cinemaId } })
    if (!cinema) return res.status(404).json({ error: "Rạp chiếu không tồn tại" })

    const dup = await prisma.room.findUnique({
      where: { cinemaId_name: { cinemaId, name: name.trim() } },
    })
    if (dup) return res.status(400).json({ error: `Phòng chiếu "${name.trim()}" đã tồn tại tại rạp ${cinema.name}` })

    const room = await prisma.room.create({
      data: { cinemaId, name: name.trim(), format, capacity: 0 },
      include: { cinema: true },
    })
    return res.status(201).json({
      message: "Tạo phòng chiếu thành công",
      room: { ...room, cinemaName: room.cinema.name },
    })
  } catch (error) {
    console.error("Create room error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tạo phòng chiếu mới" })
  }
}

export async function updateRoom(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string
    const { name, format } = req.body as { name?: string; format?: string }

    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: "Tên phòng chiếu phải có ít nhất 2 ký tự" })
    }

    const existing = await prisma.room.findUnique({ where: { id } })
    if (!existing) return res.status(404).json({ error: "Không tìm thấy phòng chiếu" })

    const conflict = await prisma.room.findFirst({
      where: { id: { not: id }, cinemaId: existing.cinemaId, name: name.trim() },
    })
    if (conflict) return res.status(400).json({ error: `Tên phòng "${name.trim()}" đã trùng với phòng khác trong cùng rạp` })

    const updated = await prisma.room.update({
      where: { id },
      data: { name: name.trim(), format: format || existing.format },
      include: { cinema: true },
    })
    return res.json({
      message: "Cập nhật phòng chiếu thành công",
      room: { ...updated, cinemaName: updated.cinema.name },
    })
  } catch (error) {
    console.error("Update room error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi cập nhật phòng chiếu" })
  }
}

export async function deleteRoom(req: Request, res: Response) {
  try {
    const id = req.params["id"] as string
    const existing = await prisma.room.findUnique({
      where: { id },
      include: { _count: { select: { seats: true } } },
    })
    if (!existing) return res.status(404).json({ error: "Không tìm thấy phòng chiếu" })

    if (existing._count.seats > 0) {
      return res.status(400).json({
        error: `Phòng chiếu đang chứa ${existing._count.seats} ghế. Vui lòng xóa sơ đồ ghế trước.`,
      })
    }
    await prisma.room.delete({ where: { id } })
    return res.json({ message: "Xóa phòng chiếu thành công" })
  } catch (error) {
    console.error("Delete room error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi xóa phòng chiếu" })
  }
}

// ========== Seats ==========
export async function getSeatsByRoom(req: Request, res: Response) {
  try {
    const roomId = req.params["roomId"] as string
    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) return res.status(404).json({ error: "Không tìm thấy phòng chiếu" })

    const seats = await prisma.seat.findMany({
      where: { roomId },
      orderBy: [{ row: "asc" }, { number: "asc" }],
    })
    return res.json({ roomId: room.id, roomName: room.name, seats })
  } catch (error) {
    console.error("Get seats error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải sơ đồ ghế" })
  }
}

export async function generateSeatLayout(req: Request, res: Response) {
  try {
    const roomId = req.params["roomId"] as string
    const parseResult = generateSeatsSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(", ") })
    }

    const room = await prisma.room.findUnique({ where: { id: roomId } })
    if (!room) return res.status(404).json({ error: "Không tìm thấy phòng chiếu" })

    const { rowCount, seatsPerRow, vipRows, overwrite } = parseResult.data
    const existingCount = await prisma.seat.count({ where: { roomId } })

    if (existingCount > 0 && !overwrite) {
      return res.status(400).json({
        error: `Phòng "${room.name}" đã có ${existingCount} ghế. Đặt overwrite: true để ghi đè.`,
        hasExistingSeats: true,
      })
    }

    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const rowLetters = Array.from({ length: rowCount }, (_, i) => alphabet[i]!)

    interface SeatInput {
      roomId: string
      row: string
      number: number
      type: "standard" | "vip"
      isActive: boolean
    }
    const newSeats: SeatInput[] = []
    for (const row of rowLetters) {
      const isVip = vipRows.includes(row)
      for (let num = 1; num <= seatsPerRow; num++) {
        newSeats.push({
          roomId,
          row,
          number: num,
          type: isVip ? "vip" : "standard",
          isActive: true,
        })
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      if (existingCount > 0) {
        await tx.seat.deleteMany({ where: { roomId } })
      }
      await tx.seat.createMany({ data: newSeats, skipDuplicates: true })
      const activeCount = await tx.seat.count({ where: { roomId, isActive: true } })
      await tx.room.update({ where: { id: roomId }, data: { capacity: activeCount } })
      const allSeats = await tx.seat.findMany({
        where: { roomId },
        orderBy: [{ row: "asc" }, { number: "asc" }],
      })
      return { seats: allSeats, activeCapacity: activeCount }
    })

    return res.status(201).json({
      message: `Đã sinh thành công sơ đồ ${result.seats.length} ghế cho ${room.name}`,
      ...result,
    })
  } catch (error) {
    console.error("Generate seat layout error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi sinh sơ đồ ghế" })
  }
}

export async function updateSeat(req: Request, res: Response) {
  try {
    const roomId = req.params["roomId"] as string
    const seatId = req.params["seatId"] as string
    const { type, isActive } = req.body as { type?: string; isActive?: boolean }

    const seat = await prisma.seat.findFirst({ where: { id: seatId, roomId } })
    if (!seat) return res.status(404).json({ error: "Không tìm thấy thông tin ghế" })

    const result = await prisma.$transaction(async (tx) => {
      const updateData: Record<string, unknown> = {}
      if (type && ["standard", "vip"].includes(type)) updateData.type = type
      if (typeof isActive === "boolean") updateData.isActive = isActive

      const updatedSeat = await tx.seat.update({ where: { id: seatId }, data: updateData })
      const activeCount = await tx.seat.count({ where: { roomId, isActive: true } })
      await tx.room.update({ where: { id: roomId }, data: { capacity: activeCount } })
      return { updatedSeat, activeCount }
    })

    return res.json({ message: "Cập nhật ghế thành công", seat: result.updatedSeat, newRoomCapacity: result.activeCount })
  } catch (error) {
    console.error("Update seat error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi cập nhật ghế" })
  }
}

export async function batchUpdateSeats(req: Request, res: Response) {
  try {
    const roomId = req.params["roomId"] as string
    const { seatIds, type, isActive } = req.body as { seatIds?: string[]; type?: string; isActive?: boolean }

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ error: "Vui lòng chọn danh sách ghế cần cập nhật" })
    }

    const updateData: Record<string, unknown> = {}
    if (type && ["standard", "vip"].includes(type)) updateData.type = type
    if (typeof isActive === "boolean") updateData.isActive = isActive

    const newCapacity = await prisma.$transaction(async (tx) => {
      await tx.seat.updateMany({ where: { id: { in: seatIds }, roomId }, data: updateData })
      const activeCount = await tx.seat.count({ where: { roomId, isActive: true } })
      await tx.room.update({ where: { id: roomId }, data: { capacity: activeCount } })
      return activeCount
    })

    return res.json({ message: `Cập nhật thành công ${seatIds.length} ghế`, newRoomCapacity: newCapacity })
  } catch (error) {
    console.error("Batch update seats error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi cập nhật nhiều ghế" })
  }
}

export async function clearSeatLayout(req: Request, res: Response) {
  try {
    const roomId = req.params["roomId"] as string
    await prisma.$transaction(async (tx) => {
      await tx.seat.deleteMany({ where: { roomId } })
      await tx.room.update({ where: { id: roomId }, data: { capacity: 0 } })
    })
    return res.json({ message: "Đã xóa toàn bộ sơ đồ ghế và đặt lại sức chứa về 0" })
  } catch (error) {
    console.error("Clear seat layout error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi xóa sơ đồ ghế" })
  }
}
