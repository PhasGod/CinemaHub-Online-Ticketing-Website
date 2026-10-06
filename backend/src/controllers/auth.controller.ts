import { Response } from "express"
import { z } from "zod"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { prisma } from "../config/db.js"
import { AuthRequest } from "../middleware/auth.js"

const registerSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  password: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  phone: z.string().optional().nullable(),
})

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
})

const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Họ và tên phải có ít nhất 2 ký tự"),
  phone: z.string().optional().nullable(),
})

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

export async function register(req: AuthRequest, res: Response) {
  try {
    const parseResult = registerSchema.safeParse(req.body)
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ")
      return res.status(400).json({ error: errorMsg })
    }

    const { email, password, fullName, phone } = parseResult.data

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (existingUser) {
      return res.status(400).json({ error: "Email này đã được đăng ký tài khoản" })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(password, salt)

    // ALWAYS enforce role = "customer" for public registration
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        fullName,
        phone: phone || null,
        role: "customer",
        isActive: true,
      },
    })

    // Create Session
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + COOKIE_OPTIONS.maxAge)

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    res.cookie("session_token", token, COOKIE_OPTIONS)

    return res.status(201).json({
      message: "Đăng ký tài khoản thành công",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    console.error("Register error:", error)
    return res.status(500).json({ error: "Lỗi máy chủ khi đăng ký tài khoản" })
  }
}

export async function login(req: AuthRequest, res: Response) {
  try {
    const parseResult = loginSchema.safeParse(req.body)
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ")
      return res.status(400).json({ error: errorMsg })
    }

    const { email, password } = parseResult.data

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác" })
    }

    if (!user.isActive) {
      return res.status(401).json({ error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." })
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ error: "Email hoặc mật khẩu không chính xác" })
    }

    // Create session
    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + COOKIE_OPTIONS.maxAge)

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    })

    res.cookie("session_token", token, COOKIE_OPTIONS)

    return res.json({
      message: "Đăng nhập thành công",
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        isActive: user.isActive,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return res.status(500).json({ error: "Lỗi máy chủ khi đăng nhập" })
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "")

    if (token) {
      await prisma.session.deleteMany({
        where: { token },
      }).catch(() => {})
    }

    res.clearCookie("session_token", { path: "/" })
    return res.json({ message: "Đăng xuất thành công" })
  } catch (error) {
    console.error("Logout error:", error)
    res.clearCookie("session_token", { path: "/" })
    return res.json({ message: "Đăng xuất thành công" })
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  if (!req.user) {
    return res.status(401).json({ error: "Chưa đăng nhập" })
  }
  return res.json({ user: req.user })
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Vui lòng đăng nhập" })
    }

    const parseResult = updateProfileSchema.safeParse(req.body)
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ")
      return res.status(400).json({ error: errorMsg })
    }

    const { fullName, phone } = parseResult.data

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        fullName,
        phone: phone || null,
      },
    })

    return res.json({
      message: "Cập nhật thông tin thành công",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        phone: updatedUser.phone,
        role: updatedUser.role,
        isActive: updatedUser.isActive,
      },
    })
  } catch (error) {
    console.error("Update profile error:", error)
    return res.status(500).json({ error: "Lỗi cập nhật hồ sơ cá nhân" })
  }
}
