import React, { useState, useEffect, useCallback } from "react"
import {
  Users, Plus, Search, RefreshCw, ChevronLeft, ChevronRight,
  Lock, Unlock, Edit3, X, Loader2, CheckCircle2, AlertCircle, Shield, Eye, EyeOff
} from "lucide-react"
import {
  adminGetUsers, adminCreateStaff, adminUpdateUser, adminToggleUserStatus,
  AdminUser
} from "../../services/admin.service"

// ======== Reusable toast ========
function Toast({ msg, type, onClose }: { msg: string; type: "success" | "error"; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [onClose])
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all
      ${type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}>
      {type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      <span>{msg}</span>
      <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={15} /></button>
    </div>
  )
}

const ROLE_LABELS: Record<string, string> = { admin: "Quản trị viên", staff: "Nhân viên", customer: "Khách hàng" }
const ROLE_COLORS: Record<string, string> = {
  admin: "bg-purple-100 text-purple-800",
  staff: "bg-blue-100 text-blue-800",
  customer: "bg-slate-100 text-slate-700",
}

// ======== Create/Edit Modal ========
function UserModal({
  editUser,
  onClose,
  onSaved,
}: {
  editUser: AdminUser | null
  onClose: () => void
  onSaved: () => void
}) {
  const isEdit = !!editUser
  const [fullName, setFullName] = useState(editUser?.fullName || "")
  const [email, setEmail] = useState(editUser?.email || "")
  const [phone, setPhone] = useState(editUser?.phone || "")
  const [role, setRole] = useState<"staff" | "admin">(
    editUser?.role === "admin" ? "admin" : "staff"
  )
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      if (isEdit) {
        await adminUpdateUser(editUser!.id, { fullName, phone: phone || undefined, role })
      } else {
        if (!password || password.length < 6) {
          setError("Mật khẩu phải có ít nhất 6 ký tự")
          setIsLoading(false)
          return
        }
        await adminCreateStaff({ email, password, fullName, phone: phone || undefined, role })
      }
      onSaved()
    } catch (err: any) {
      setError(err.message || "Thao tác thất bại")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-slate-800">
            {isEdit ? "Chỉnh sửa tài khoản" : "Thêm nhân viên mới"}
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và tên *</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} required
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Email *</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>

          {!isEdit && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu *</label>
              <div className="relative">
                <input type={showPw ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Vai trò</label>
            <select value={role} onChange={(e) => setRole(e.target.value as "staff" | "admin")}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
              <option value="staff">Nhân viên rạp</option>
              <option value="admin">Quản trị viên</option>
            </select>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
              <AlertCircle size={16} className="shrink-0" />{error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50">
              Hủy
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 size={15} className="animate-spin" />Đang xử lý...</> : (isEdit ? "Lưu thay đổi" : "Tạo tài khoản")}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ======== Main Component ========
export function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, totalPages: 1 })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [showModal, setShowModal] = useState(false)

  const loadUsers = useCallback(async (page = 1) => {
    setIsLoading(true)
    try {
      const res = await adminGetUsers({ q: search, role: roleFilter || undefined, page, limit: 10 })
      setUsers(res.users)
      setPagination(res.pagination)
    } catch {
      setToast({ msg: "Không thể tải danh sách tài khoản", type: "error" })
    } finally {
      setIsLoading(false)
    }
  }, [search, roleFilter])

  useEffect(() => { loadUsers(1) }, [search, roleFilter])

  const handleToggleStatus = async (user: AdminUser) => {
    try {
      const res = await adminToggleUserStatus(user.id)
      setToast({ msg: res.message, type: "success" })
      loadUsers(pagination.page)
    } catch (err: any) {
      setToast({ msg: err.message || "Thao tác thất bại", type: "error" })
    }
  }

  const handleSaved = (msg: string) => {
    setToast({ msg, type: "success" })
    setShowModal(false)
    setEditUser(null)
    loadUsers(1)
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users size={24} className="text-blue-600" /> Quản lý tài khoản nhân viên
          </h1>
          <p className="text-sm text-slate-500 mt-1">US.04 — Tổng {pagination.total} tài khoản</p>
        </div>
        <button onClick={() => { setEditUser(null); setShowModal(true) }}
          className="button button-primary flex items-center gap-2 px-4 py-2.5">
          <Plus size={17} /> Thêm nhân viên
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            placeholder="Tìm kiếm họ tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none min-w-[160px]">
          <option value="">Tất cả vai trò</option>
          <option value="admin">Quản trị viên</option>
          <option value="staff">Nhân viên</option>
          <option value="customer">Khách hàng</option>
        </select>
        <button onClick={() => loadUsers(pagination.page)}
          className="px-4 py-2.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50 text-sm flex items-center gap-2">
          <RefreshCw size={15} /> Làm mới
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-500">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p>Không tìm thấy tài khoản phù hợp</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Họ tên</th>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Email</th>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Điện thoại</th>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Vai trò</th>
                  <th className="text-left px-5 py-3.5 text-slate-600 font-semibold">Trạng thái</th>
                  <th className="text-right px-5 py-3.5 text-slate-600 font-semibold">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                          {u.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800">{u.fullName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600">{u.email}</td>
                    <td className="px-5 py-3.5 text-slate-600">{u.phone || "—"}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[u.role]}`}>
                        {u.role === "admin" && <Shield size={11} />}
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${u.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                        {u.isActive ? "Hoạt động" : "Đã khóa"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditUser(u); setShowModal(true) }}
                          title="Chỉnh sửa"
                          className="p-1.5 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors">
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(u)}
                          title={u.isActive ? "Khóa tài khoản" : "Mở khóa tài khoản"}
                          className={`p-1.5 rounded-lg transition-colors ${u.isActive
                            ? "hover:bg-rose-100 text-rose-600"
                            : "hover:bg-emerald-100 text-emerald-600"}`}>
                          {u.isActive ? <Lock size={15} /> : <Unlock size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-slate-200 bg-slate-50/50">
            <span className="text-sm text-slate-500">
              Trang {pagination.page}/{pagination.totalPages} — {pagination.total} bản ghi
            </span>
            <div className="flex gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => loadUsers(pagination.page - 1)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => loadUsers(pagination.page + 1)}
                className="p-1.5 rounded-lg border border-slate-300 hover:bg-slate-100 disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <UserModal
          editUser={editUser}
          onClose={() => { setShowModal(false); setEditUser(null) }}
          onSaved={() => handleSaved(editUser ? "Cập nhật tài khoản thành công" : "Tạo tài khoản nhân viên thành công")}
        />
      )}
    </div>
  )
}
