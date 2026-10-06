import { Request, Response } from "express"
import { prisma } from "../config/db.js"

export async function getAdminStats(req: Request, res: Response) {
  try {
    const [
      totalUsers,
      totalStaff,
      totalMovies,
      totalGenres,
      totalCinemas,
      totalRooms,
      totalSeats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: { in: ["staff", "admin"] } } }),
      prisma.movie.count(),
      prisma.genre.count(),
      prisma.cinema.count(),
      prisma.room.count(),
      prisma.seat.count({ where: { isActive: true } }),
    ])

    return res.json({
      stats: {
        totalUsers,
        totalStaff,
        totalMovies,
        totalGenres,
        totalCinemas,
        totalRooms,
        totalSeats,
      },
      revenueNote: "Chưa có dữ liệu bán vé thực tế (Tính năng đặt vé & thanh toán sẽ được triển khai ở Sprint 2)",
    })
  } catch (error) {
    console.error("Get admin stats error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải thống kê tổng quan" })
  }
}
