import { Response } from "express"
import { z } from "zod"
import bcrypt from "bcryptjs"
import crypto from "node:crypto"
import { prisma } from "../config/db.js"
import { AuthRequest } from "../middleware/auth.js"
import { sendPasswordResetEmail } from "../services/mail.service.js"

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
    if (token) await prisma.session.deleteMany({ where: { token } })
    res.clearCookie("session_token", { path: "/" })
    return res.json({ message: "Đăng xuất thành công" })
  } catch (error) {
    console.error("Logout error:", error)
    return res.status(503).json({ error: "Chưa thể kết thúc phiên. Vui lòng thử lại." })
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

// ==================== QUÊN VÀ ĐẶT LẠI MẬT KHẨU ====================

const forgotPasswordSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
})

const resetPasswordSchema = z.object({
  email: z.string().email("Email không đúng định dạng"),
  otp: z.string().min(6, "Mã xác thực gồm 6 chữ số").max(6, "Mã xác thực gồm 6 chữ số"),
  newPassword: z.string().min(6, "Mật khẩu mới phải có ít nhất 6 ký tự"),
})

interface OtpRecord {
  otp: string
  expiresAt: number
  attempts: number
}

// Lưu trữ OTP trong bộ nhớ với thời hạn 15 phút
const passwordResetOtps = new Map<string, OtpRecord>()

// Tự động dọn dẹp các OTP hết hạn sau mỗi 10 phút
setInterval(() => {
  const now = Date.now()
  for (const [emailKey, record] of passwordResetOtps.entries()) {
    if (record.expiresAt < now) {
      passwordResetOtps.delete(emailKey)
    }
  }
}, 10 * 60 * 1000).unref()

/**
 * POST /api/auth/forgot-password
 * Tiếp nhận yêu cầu quên mật khẩu, sinh OTP 6 số và gửi thư
 */
export async function forgotPassword(req: AuthRequest, res: Response) {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body)
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ")
      return res.status(400).json({ error: errorMsg })
    }

    const { email } = parseResult.data
    const normalizedEmail = email.toLowerCase().trim()

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return res.status(404).json({
        error: "Không tìm thấy tài khoản nào liên kết với email này.",
      })
    }

    if (!user.isActive) {
      return res.status(403).json({
        error: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.",
      })
    }

    // Sinh mã OTP 6 chữ số ngẫu nhiên
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresInMinutes = 15
    const expiresAt = Date.now() + expiresInMinutes * 60 * 1000

    passwordResetOtps.set(normalizedEmail, {
      otp,
      expiresAt,
      attempts: 0,
    })

    // Kích hoạt gửi email bất đồng bộ
    sendPasswordResetEmail({
      userEmail: user.email,
      userName: user.fullName,
      otpCode: otp,
      expiresInMinutes,
    }).catch((err) => {
      console.error("[FORGOT_PASSWORD] Lỗi khi gửi email:", err)
    })

    const isSimulated = !process.env.SMTP_USER || !process.env.SMTP_PASS

    return res.status(200).json({
      message: "Mã xác thực đặt lại mật khẩu đã được gửi đến email của bạn.",
      email: user.email,
      expiresInSeconds: expiresInMinutes * 60,
      devOtp: isSimulated ? otp : undefined,
    })
  } catch (error) {
    console.error("Forgot password error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi gửi yêu cầu quên mật khẩu" })
  }
}

/**
 * POST /api/auth/reset-password
 * Xác thực mã OTP và cập nhật mật khẩu mới cho người dùng
 */
export async function resetPassword(req: AuthRequest, res: Response) {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body)
    if (!parseResult.success) {
      const errorMsg = parseResult.error.errors.map((e) => e.message).join(", ")
      return res.status(400).json({ error: errorMsg })
    }

    const { email, otp, newPassword } = parseResult.data
    const normalizedEmail = email.toLowerCase().trim()

    const record = passwordResetOtps.get(normalizedEmail)

    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({
        error: "Mã xác thực đã hết hạn hoặc không tồn tại. Vui lòng yêu cầu mã mới.",
      })
    }

    if (record.attempts >= 5) {
      passwordResetOtps.delete(normalizedEmail)
      return res.status(429).json({
        error: "Bạn đã nhập sai mã xác thực quá 5 lần. Vui lòng gửi lại yêu cầu mới.",
      })
    }

    if (record.otp !== otp.trim()) {
      record.attempts += 1
      const remainingAttempts = 5 - record.attempts
      return res.status(400).json({
        error: `Mã xác thực không chính xác. Bạn còn ${remainingAttempts} lần thử.`,
      })
    }

    // OTP chính xác -> Tiến hành đổi mật khẩu
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy tài khoản người dùng." })
    }

    const salt = await bcrypt.genSalt(10)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    // Xóa tất cả phiên đăng nhập cũ để bảo mật
    await prisma.session.deleteMany({
      where: { userId: user.id },
    })

    // Xóa mã OTP đã sử dụng
    passwordResetOtps.delete(normalizedEmail)

    return res.status(200).json({
      message: "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.",
    })
  } catch (error) {
    console.error("Reset password error:", error)
    return res.status(500).json({ error: "Lỗi hệ thống khi đặt lại mật khẩu" })
  }
}