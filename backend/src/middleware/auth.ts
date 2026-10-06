import { Request, Response, NextFunction } from "express"
import { prisma } from "../config/db.js"

export interface AuthenticatedUser {
  id: string
  email: string
  fullName: string
  phone: string | null
  role: "customer" | "staff" | "admin"
  isActive: boolean
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser
  sessionToken?: string
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.session_token || req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      return res.status(401).json({ error: "Vui lòng đăng nhập để thực hiện" })
    }

    const session = await prisma.session.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!session || new Date() > session.expiresAt) {
      if (session) {
        await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
      }
      res.clearCookie("session_token", { path: "/" })
      return res.status(401).json({ error: "Phiên đăng nhập đã hết hạn hoặc không hợp lệ" })
    }

    if (!session.user.isActive) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {})
      res.clearCookie("session_token", { path: "/" })
      return res.status(401).json({ error: "Tài khoản của bạn đã bị khóa" })
    }

    req.user = {
      id: session.user.id,
      email: session.user.email,
      fullName: session.user.fullName,
      phone: session.user.phone,
      role: session.user.role as "customer" | "staff" | "admin",
      isActive: session.user.isActive,
    }
    req.sessionToken = token

    next()
  } catch (error) {
    console.error("Auth middleware error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi xác thực" })
  }
}

export function requireRole(...allowedRoles: Array<"customer" | "staff" | "admin">) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Yêu cầu đăng nhập" })
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Bạn không có quyền truy cập tài nguyên này" })
    }

    next()
  }
}
