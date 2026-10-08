import { Response } from "express"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "../config/db.js"
import { AuthRequest } from "../middleware/auth.js"
import { parsePagination } from "../utils/pagination.js"

const createStaffSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z.string().optional().nullable(),
  role: z.enum(["staff", "admin"]).default("staff"),
})

const updateUserSchema = z.object({
  fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
  phone: z.string().optional().nullable(),
  role: z.enum(["customer", "staff", "admin"]).optional(),
})

const selectWithoutHash = {
  id: true,
  email: true,
  fullName: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
}

export async function getUsers(req: AuthRequest, res: Response) {
  try {
    const q = ((req.query.q || req.query.search) as string | undefined || "").trim()
    const roleFilter = req.query.role as string | undefined
    let pagination
    try {
      pagination = parsePagination(req.query.page, req.query.limit, 10)
    } catch (err: unknown) {
      return res.status(400).json({ error: err instanceof Error ? err.message : "Phân trang không hợp lệ" })
    }
    const { page, limit, skip } = pagination

    const where: Record<string, unknown> = {}
    if (q) {
      where.OR = [
        { fullName: { contains: q } },
        { email: { contains: q } },
      ]
    }
    if (roleFilter && ["customer", "staff", "admin"].includes(roleFilter)) {
      where.role = roleFilter
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: selectWithoutHash,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
    ])

    return res.json({
      users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    })
  } catch (error) {
    console.error("Get users error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tải danh sách tài khoản" })
  }
}

export async function createStaff(req: AuthRequest, res: Response) {
  try {
    const parseResult = createStaffSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(", ") })
    }

    const { email, password, fullName, phone, role } = parseResult.data
    const lowerEmail = email.toLowerCase()

    const existing = await prisma.user.findUnique({ where: { email: lowerEmail } })
    if (existing) {
      return res.status(400).json({ error: "Email này đã được sử dụng" })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    const newUser = await prisma.user.create({
      data: { email: lowerEmail, passwordHash, fullName, phone: phone || null, role, isActive: true },
      select: selectWithoutHash,
    })

    return res.status(201).json({ message: "Tạo tài khoản nhân viên thành công", user: newUser })
  } catch (error) {
    console.error("Create staff error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi tạo tài khoản nhân viên" })
  }
}

export async function updateUser(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string
    const parseResult = updateUserSchema.safeParse(req.body)
    if (!parseResult.success) {
      return res.status(400).json({ error: parseResult.error.errors.map((e) => e.message).join(", ") })
    }

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) return res.status(404).json({ error: "Không tìm thấy tài khoản" })

    const { fullName, phone, role } = parseResult.data

    // Protect last admin demotion
    if (role && targetUser.role === "admin" && role !== "admin") {
      const activeAdminCount = await prisma.user.count({ where: { role: "admin", isActive: true } })
      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: "Không thể hạ quyền Quản trị viên duy nhất đang hoạt động" })
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { fullName, phone: phone || null, ...(role ? { role } : {}) },
      select: selectWithoutHash,
    })

    return res.json({ message: "Cập nhật thông tin tài khoản thành công", user: updated })
  } catch (error) {
    console.error("Update user error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi cập nhật tài khoản" })
  }
}

export async function toggleUserStatus(req: AuthRequest, res: Response) {
  try {
    const id = req.params["id"] as string

    if (id === req.user?.id) {
      return res.status(400).json({ error: "Quản trị viên không thể tự khóa tài khoản của chính mình" })
    }

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) return res.status(404).json({ error: "Không tìm thấy tài khoản" })

    const nextStatus = !targetUser.isActive

    if (targetUser.role === "admin" && !nextStatus) {
      const activeAdminCount = await prisma.user.count({ where: { role: "admin", isActive: true } })
      if (activeAdminCount <= 1) {
        return res.status(400).json({ error: "Không thể khóa Quản trị viên duy nhất đang hoạt động" })
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: nextStatus },
      select: selectWithoutHash,
    })

    // Revoke all sessions if locking
    if (!nextStatus) {
      await prisma.session.deleteMany({ where: { userId: id } })
    }

    return res.json({
      message: nextStatus ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản thành công",
      user: updated,
    })
  } catch (error) {
    console.error("Toggle user status error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi thay đổi trạng thái tài khoản" })
  }
}
