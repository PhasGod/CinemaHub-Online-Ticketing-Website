import React, { useState, FormEvent, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { CircleUserRound, ShieldCheck, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Link } from "react-router-dom"

export function ProfilePage() {
  const { user, updateProfile, isLoading } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || "")
      setPhone(user.phone || "")
    }
  }, [user])

  if (isLoading) {
    return (
      <div className="container py-16 text-center min-h-[400px] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-blue-600 mb-3" size={36} />
        <p className="text-slate-600 font-medium">Đang tải thông tin cá nhân...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container py-16 text-center min-h-[400px] flex flex-col items-center justify-center">
        <AlertCircle className="text-amber-500 mb-3" size={42} />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Vui lòng đăng nhập</h2>
        <p className="text-slate-600 mb-6">Bạn cần đăng nhập để xem và cập nhật hồ sơ cá nhân.</p>
        <Link to="/" className="button button-primary">
          Về trang chủ
        </Link>
      </div>
    )
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSuccessMsg("")
    setErrorMsg("")
    setIsSubmitting(true)

    try {
      if (!fullName.trim()) {
        setErrorMsg("Họ và tên không được để trống")
        setIsSubmitting(false)
        return
      }
      await updateProfile({
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      })
      setSuccessMsg("Cập nhật thông tin thành công!")
    } catch (err: any) {
      setErrorMsg(err.message || "Cập nhật thất bại. Vui lòng thử lại.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const roleLabels: Record<string, string> = {
    customer: "Khách hàng",
    staff: "Nhân viên rạp",
    admin: "Quản trị viên",
  }

  return (
    <div className="container py-10 max-w-4xl">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Header section */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-8 text-white">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border-2 border-white/40 text-white shrink-0">
              <CircleUserRound size={48} />
            </div>
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap mb-1">
                <h1 className="text-2xl font-bold">{user.fullName}</h1>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/40 border border-white/30 text-white flex items-center gap-1">
                  <ShieldCheck size={14} />
                  {roleLabels[user.role] || user.role}
                </span>
              </div>
              <p className="text-blue-100 text-sm">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-800 mb-6 pb-3 border-b border-slate-100">
            Cập nhật thông tin cá nhân
          </h2>

          {successMsg && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-3">
              <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-3">
              <AlertCircle size={20} className="text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Địa chỉ Email (Không thể thay đổi)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Vai trò (Không thể thay đổi)
              </label>
              <input
                type="text"
                value={roleLabels[user.role] || user.role}
                disabled
                className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-500 cursor-not-allowed text-sm font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Họ và tên *
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nhập họ và tên"
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm transition"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0901234567"
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-800 text-sm transition"
              />
            </div>

            <div className="pt-4 flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="button button-primary px-6 py-3 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu thay đổi</span>
                )}
              </button>
              {(user.role === "admin" || user.role === "staff") && (
                <Link to="/admin" className="button button-secondary px-6 py-3">
                  Trang quản trị
                </Link>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
