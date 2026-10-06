import React, { useState, type FormEvent } from "react"
import { ArrowRight, X, Loader2 } from "lucide-react"
import { useAuth } from "../context/AuthContext"

interface AuthModalProps {
  initialMode?: "login" | "register"
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
  const { login, register } = useAuth()
  const [mode, setMode] = useState<"login" | "register">(initialMode)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

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
        await login({ email: email.trim(), password })
      } else {
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
      }

      onClose()
      if (onAuthenticated) {
        onAuthenticated()
      }
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const switchMode = (nextMode: "login" | "register") => {
    setMode(nextMode)
    setError("")
  }

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail)
    setPassword("123456")
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
        <h2 id="auth-title">
          {mode === "login" ? "Đăng nhập tài khoản" : "Tạo tài khoản mới"}
        </h2>
        <p className="auth-intro">
          {message ||
            (mode === "login"
              ? "Đăng nhập để quản lý vé và tiếp tục đặt chỗ."
              : "Tạo tài khoản để nhận ưu đãi thành viên.")}
        </p>

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
            <div className="login-options">
              <label>
                <input type="checkbox" defaultChecked /> Ghi nhớ đăng nhập
              </label>
              <button type="button">Quên mật khẩu?</button>
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
      </div>
    </div>
  )
}
