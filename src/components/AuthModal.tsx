import React, { useState, useEffect, type FormEvent } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, X, Loader2, KeyRound, CheckCircle2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"
import { forgotPasswordApi, resetPasswordApi } from "../services/auth.service"

interface AuthModalProps {
  initialMode?: "login" | "register" | "forgot" | "reset"
  message?: string
  onClose: () => void
  onAuthenticated?: () => void
}

export function AuthModal({
  initialMode = "login",
  message,
  onClose,
  onAuthenticated,
}: AuthModalProps) {
  const navigate = useNavigate()
  const { login, register } = useAuth()
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">(initialMode)

  // Form states
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")

  // Forgot / Reset password states
  const [otp, setOtp] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [devOtp, setDevOtp] = useState<string | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Status & feedback
  const [error, setError] = useState("")
  const [successMsg, setSuccessMsg] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const switchMode = (nextMode: "login" | "register" | "forgot" | "reset") => {
    setMode(nextMode)
    setError("")
    setSuccessMsg("")
  }

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("123456")
  }

  // Handle forgot password request (send OTP)
  const handleForgotPassword = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccessMsg("")

    if (!email.trim()) {
      setError("Vui lòng nhập địa chỉ email của bạn.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await forgotPasswordApi(email.trim())
      setSuccessMsg(res.message || "Mã xác thực đã được gửi về email của bạn!")
      if (res.devOtp) {
        setDevOtp(res.devOtp)
      }
      setCountdown(60)
      setMode("reset")
    } catch (err: any) {
      setError(err.message || "Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra lại email.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle resending OTP
  const handleResendOtp = async () => {
    if (countdown > 0 || isSubmitting) return
    setError("")
    setSuccessMsg("")
    setIsSubmitting(true)
    try {
      const res = await forgotPasswordApi(email.trim())
      setSuccessMsg("Mã OTP mới đã được gửi lại về email của bạn.")
      if (res.devOtp) {
        setDevOtp(res.devOtp)
      }
      setCountdown(60)
    } catch (err: any) {
      setError(err.message || "Lỗi khi gửi lại mã OTP.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle resetting password
  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccessMsg("")

    if (!otp.trim() || otp.trim().length !== 6) {
      setError("Mã xác thực OTP phải gồm 6 chữ số.")
      return
    }

    if (!newPassword || newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.")
      return
    }

    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp. Vui lòng nhập lại.")
      return
    }

    setIsSubmitting(true)
    try {
      const res = await resetPasswordApi({
        email: email.trim(),
        otp: otp.trim(),
        newPassword,
      })
      setSuccessMsg(res.message || "Đặt lại mật khẩu thành công! Vui lòng đăng nhập.")
      setPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setOtp("")
      setDevOtp(null)
      setMode("login")
    } catch (err: any) {
      setError(err.message || "Đặt lại mật khẩu thất bại. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle standard login and register
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      if (mode === "login") {
        if (!email.trim() || !password) {
          setError("Vui lòng điền đầy đủ email và mật khẩu.")
          setIsSubmitting(false)
          return
        }
        const loggedUser = await login({ email: email.trim(), password })
        onClose()
        if (onAuthenticated) {
          onAuthenticated()
        } else {
          const role = loggedUser.role.toLowerCase()
          if (role === "admin") navigate("/admin")
          else if (role === "staff") navigate("/staff")
        }
        return
      } else if (mode === "register") {
        if (!fullName.trim() || !email.trim() || !password) {
          setError("Vui lòng điền đầy đủ họ tên, email và mật khẩu.")
          setIsSubmitting(false)
          return
        }
        if (password.length < 6) {
          setError("Mật khẩu phải có ít nhất 6 ký tự.")
          setIsSubmitting(false)
          return
        }
        await register({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
        })
        onClose()
        if (onAuthenticated) {
          onAuthenticated()
        }
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="auth-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="auth-close" aria-label="Đóng" onClick={onClose}>
          <X size={19} />
        </button>
        <span className="eyebrow">5TOP CINEMA MEMBER</span>

        {/* TIÊU ĐỀ THEO TỪNG CHẾ ĐỘ */}
        <h2 id="auth-title">
          {mode === "login" && "Đăng nhập tài khoản"}
          {mode === "register" && "Tạo tài khoản mới"}
          {mode === "forgot" && "Quên mật khẩu"}
          {mode === "reset" && "Đặt lại mật khẩu"}
        </h2>

        <p className="auth-intro">
          {mode === "login" &&
            (message || "Đăng nhập để quản lý vé và tiếp tục đặt chỗ.")}
          {mode === "register" && "Tạo tài khoản để nhận ưu đãi thành viên."}
          {mode === "forgot" &&
            "Nhập email đã đăng ký. Hệ thống sẽ gửi mã xác thực OTP 6 số để bạn thiết lập lại mật khẩu."}
          {mode === "reset" &&
            `Nhập mã OTP 6 số đã gửi đến hòm thư ${email} và mật khẩu mới của bạn.`}
        </p>

        {/* THÔNG BÁO THÀNH CÔNG */}
        {successMsg && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TÀI KHOẢN MẪU (CHẾ ĐỘ LOGIN) */}
        {mode === "login" && (
          <div className="demo-account">
            <span>Tài khoản mẫu: </span>
            <button
              type="button"
              className="text-xs text-blue-600 underline font-semibold mr-2"
              onClick={() => fillDemoAccount("user@5top.vn")}
            >
              user@5top.vn (Khách)
            </button>
            <button
              type="button"
              className="text-xs text-blue-600 underline font-semibold"
              onClick={() => fillDemoAccount("admin@5top.vn")}
            >
              admin@5top.vn (Quản trị)
            </button>
          </div>
        )}

        {/* ===================== FORM QUÊN MẬT KHẨU ===================== */}
        {mode === "forgot" && (
          <form onSubmit={handleForgotPassword}>
            <label>
              Email đã đăng ký *
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="example@gmail.com"
                autoComplete="email"
                disabled={isSubmitting}
                required
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="button button-primary full-button flex items-center justify-center gap-2 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  <span>Đang gửi mã...</span>
                </>
              ) : (
                <>
                  <span>Gửi mã xác nhận</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                className="text-xs text-slate-500 hover:text-blue-600 underline font-medium"
                onClick={() => switchMode("login")}
                disabled={isSubmitting}
              >
                ← Quay lại Đăng nhập
              </button>
            </div>
          </form>
        )}

        {/* ===================== FORM ĐẶT LẠI MẬT KHẨU ===================== */}
        {mode === "reset" && (
          <form onSubmit={handleResetPassword}>
            {devOtp && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs flex items-center justify-between">
                <span>
                  Mã OTP thử nghiệm: <strong>{devOtp}</strong>
                </span>
                <button
                  type="button"
                  className="text-xs text-amber-800 underline font-bold"
                  onClick={() => setOtp(devOtp)}
                >
                  Điền nhanh
                </button>
              </div>
            )}

            <label>
              Mã xác thực OTP (6 chữ số) *
              <input
                type="text"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                maxLength={6}
                disabled={isSubmitting}
                required
                className="text-center tracking-widest font-mono text-base font-bold"
              />
            </label>

            <label>
              Mật khẩu mới *
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Tối thiểu 6 ký tự"
                autoComplete="new-password"
                disabled={isSubmitting}
                required
              />
            </label>

            <label>
              Xác nhận mật khẩu mới *
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                autoComplete="new-password"
                disabled={isSubmitting}
                required
              />
            </label>

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="button button-primary full-button flex items-center justify-center gap-2 mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  <span>Đang cập nhật...</span>
                </>
              ) : (
                <>
                  <KeyRound size={17} />
                  <span>Xác nhận đổi mật khẩu</span>
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-500 mt-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                className="hover:text-blue-600 underline font-medium"
                onClick={() => switchMode("login")}
                disabled={isSubmitting}
              >
                ← Quay lại Đăng nhập
              </button>

              <button
                type="button"
                className={`${countdown > 0 ? "text-slate-400 cursor-not-allowed" : "text-blue-600 underline font-medium"}`}
                onClick={handleResendOtp}
                disabled={countdown > 0 || isSubmitting}
              >
                {countdown > 0 ? `Gửi lại mã (${countdown}s)` : "Gửi lại mã OTP"}
              </button>
            </div>
          </form>
        )}

        {/* ===================== FORM LOGIN & REGISTER ===================== */}
        {(mode === "login" || mode === "register") && (
          <form onSubmit={submit}>
            {mode === "register" && (
              <>
                <label>
                  Họ và tên *
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Nguyễn Minh Anh"
                    disabled={isSubmitting}
                    required
                  />
                </label>
                <label>
                  Số điện thoại
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="0901234567"
                    disabled={isSubmitting}
                  />
                </label>
              </>
            )}

            <label>
              Email *
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="user@5top.vn"
                autoComplete="username"
                disabled={isSubmitting}
                required
              />
            </label>

            <label>
              Mật khẩu *
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                disabled={isSubmitting}
                required
              />
            </label>

            {mode === "login" && (
              <div className="login-options flex items-center justify-between">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập
                </label>
                <button
                  type="button"
                  className="text-xs text-blue-600 hover:underline font-semibold cursor-pointer"
                  onClick={() => switchMode("forgot")}
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {error && <p className="auth-error">{error}</p>}

            <button
              type="submit"
              className="button button-primary full-button flex items-center justify-center gap-2 mt-4"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={17} />
                  <span>Đang xử lý...</span>
                </>
              ) : (
                <>
                  <span>{mode === "login" ? "Đăng nhập" : "Đăng ký"}</span>
                  <ArrowRight size={17} />
                </>
              )}
            </button>
          </form>
        )}

        {(mode === "login" || mode === "register") && (
          <p className="signup">
            {mode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "register" : "login")}
              disabled={isSubmitting}
            >
              {mode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
            </button>
          </p>
        )}
      </div>
    </div>
  )
}
