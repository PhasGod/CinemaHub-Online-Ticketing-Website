import React from "react"
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom"
import {
  LayoutDashboard,
  QrCode,
  Search,
  CalendarDays,
  LogOut,
  UserCheck,
  Clapperboard,
  Home,
  ShieldAlert,
} from "lucide-react"
import { useAuth } from "../../context/AuthContext"

export function StaffLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/", { replace: true })
    } catch (err) {
      console.error("Staff logout error:", err)
      navigate("/", { replace: true })
    }
  }

  const staffNavItems = [
    { label: "Tổng quan", path: "/staff", icon: LayoutDashboard, end: true },
    { label: "Soát vé (Check-in QR)", path: "/staff/check-in", icon: QrCode, end: false },
    { label: "Tra cứu đơn & vé", path: "/staff/tickets", icon: Search, end: false },
    { label: "Lịch chiếu hôm nay", path: "/staff/showtimes", icon: CalendarDays, end: false },
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Top Staff App Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
        <div className="container max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Badge */}
          <div className="flex items-center gap-3">
            <Link to="/staff" className="flex items-center gap-2 font-black text-lg tracking-tight text-slate-900">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Clapperboard size={20} />
              </span>
              <span>
                CinemaHub <span className="text-emerald-700 font-bold text-xs uppercase px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 ml-1">Staff Portal</span>
              </span>
            </Link>
          </div>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              <UserCheck size={16} className="text-emerald-600" />
              <div>
                <p className="font-bold text-slate-800 leading-tight">{user?.fullName || "Nhân viên rạp"}</p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">{user?.email}</p>
              </div>
            </div>

            {user?.role === "admin" && (
              <Link
                to="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xs font-bold hover:bg-blue-100 transition"
              >
                <ShieldAlert size={14} /> Quản trị
              </Link>
            )}

            <Link
              to="/"
              className="p-2 md:px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200 transition text-xs font-semibold flex items-center gap-1"
              title="Về giao diện khách hàng"
            >
              <Home size={16} /> <span className="hidden md:inline">Trang chủ</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 md:px-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition text-xs font-bold flex items-center gap-1.5"
              title="Đăng xuất ca làm việc"
            >
              <LogOut size={16} /> <span className="hidden md:inline">Đăng xuất</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-white border-t border-slate-100 px-4">
          <div className="container max-w-7xl mx-auto flex gap-1 overflow-x-auto scrollbar-none py-1.5">
            {staffNavItems.map(({ label, path, icon: Icon, end }) => (
              <NavLink
                key={path}
                to={path}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`
                }
              >
                <Icon size={16} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  )
}
