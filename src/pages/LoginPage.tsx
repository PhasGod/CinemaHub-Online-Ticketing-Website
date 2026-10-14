import React, { useState, FormEvent } from "react"
import { useAuth } from "../context/AuthContext"
import { useNavigate, Link, Navigate } from "react-router-dom"
import { ArrowRight, Loader2, Clapperboard } from "lucide-react"

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return (
      <Navigate
        to={user.role === "admin" ? "/admin" : "/"}
        replace
      />
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)

    try {
      const loggedUser = await login({
        email: email.trim(),
        password,
      })

      navigate(loggedUser.role === "admin" ? "/admin" : "/", {
        replace: true,
      })
    } catch (err: any) {
      setError(err.message || "Đăng nhập thất bại")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-8">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-bold text-blue-600 mb-2">
            <Clapperboard size={28} />
            <span>5TOP CINEMA</span>
          </Link>
          <h1 className="text-xl font-bold text-slate-800">Đăng nhập tài khoản</h1>
          <p className="text-sm text-slate-500 mt-1">Truy cập hệ thống đặt vé 5TOP CINEMA</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 text-xs text-blue-800">
          <p className="font-semibold mb-1">Tài khoản thử nghiệm hệ thống:</p>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => {
                setEmail("admin@5top.vn")
                setPassword("123456")
              }}
              className="text-left hover:underline text-blue-700 font-medium"
            >
              • Admin: admin@5top.vn (mật khẩu: 123456)
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("staff@5top.vn")
                setPassword("123456")
              }}
              className="text-left hover:underline text-blue-700 font-medium"
            >
              • Staff: staff@5top.vn (mật khẩu: 123456)
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail("user@5top.vn")
                setPassword("123456")
              }}
              className="text-left hover:underline text-blue-700 font-medium"
            >
              • Khách: user@5top.vn (mật khẩu: 123456)
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@5top.vn"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>

          {error && <p className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-lg border border-rose-200">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full button button-primary py-3 flex items-center justify-center gap-2 mt-4"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <span>Đang xử lý...</span>
              </>
            ) : (
              <>
                <span>Đăng nhập</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
