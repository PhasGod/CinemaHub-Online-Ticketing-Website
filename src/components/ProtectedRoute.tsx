import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { UserRole } from "../types/auth"
import { ShieldAlert, Loader2 } from "lucide-react"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8">
        <Loader2 className="animate-spin text-blue-600 mb-4" size={40} />
        <p className="text-slate-600 font-medium">Đang kiểm tra quyền truy cập...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center container max-w-lg">
        <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Vui lòng đăng nhập</h2>
        <p className="text-slate-600 mb-6">
          Bạn cần đăng nhập bằng tài khoản có quyền quản trị để truy cập trang này.
        </p>
        <Navigate to="/" replace />
      </div>
    )
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="min-h-[500px] flex flex-col items-center justify-center p-8 text-center container max-w-lg">
        <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Quyền truy cập bị từ chối</h2>
        <p className="text-slate-600 mb-6">
          Tài khoản của bạn (<b>{user.email}</b> - Vai trò: <b>{user.role}</b>) không có quyền truy cập trang quản trị hệ thống.
        </p>
        <a href="/" className="button button-primary">
          Trở về trang chủ
        </a>
      </div>
    )
  }

  return <>{children}</>
}
