import React, { useState, useEffect } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  Clapperboard,
  CircleUserRound,
  ChevronDown,
  ChevronRight,
  Search,
  MapPin,
  Menu,
  X,
  ShieldAlert,
  LogOut,
  User as UserIcon,
  Ticket,
} from "lucide-react"
import { useAuth } from "../context/AuthContext"
import CinemaSelectorDropdown from "./CinemaSelectorDropdown"
import SearchMovieModal from "./SearchMovieModal"
import { useCinemaLocation, ALL_CINEMAS_OPTION } from "../context/CinemaLocationContext"

function cn(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ")
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand flex items-center gap-2 select-none" aria-label="5TOP CINEMA - Trang chủ">
      <img
        src="/logo-5top-cinema.png"
        alt="5TOP CINEMA Logo"
        className="h-7 w-7 sm:h-8 sm:w-8 object-contain rounded-lg drop-shadow-[0_2px_8px_rgba(37,99,235,0.25)] transition-transform duration-200 hover:scale-105 shrink-0"
      />
      {!compact && (
        <span className="font-extrabold text-base sm:text-lg tracking-tight text-slate-900 whitespace-nowrap">
          5TOP <span className="text-blue-600">CINEMA</span>
        </span>
      )}
    </Link>
  )
}

export function Navbar({ onOpenLogin }: { onOpenLogin: () => void }) {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { selectedCinema, isAllCinemasSelected } = useCinemaLocation()
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  // Khóa cuộn màn hình nền khi Mobile Drawer đang mở
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  // Lắng nghe phím Escape để đóng Drawer & Ctrl+K để mở Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false)
        setAccountOpen(false)
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setIsSearchOpen((prev) => !prev)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleLogout = async () => {
    setAccountOpen(false)
    setOpen(false)
    try {
      await logout()
      navigate("/", { replace: true })
    } catch (err: unknown) {
      console.error("Logout error:", err)
      window.alert(err instanceof Error ? err.message : "Đăng xuất thất bại")
    }
  }

  const nav = [
    ["Trang chủ", "/"],
    ["Phim", "/movies"],
    ["Rạp chiếu", "/cinemas"],
    ["Suất chiếu", "/showtimes"],
    ["Khuyến mãi", "/promotions"],
  ]

  return (
    <>
      <header className="navbar sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm pt-safe w-full">
        <div className="flex items-center justify-between px-4 sm:px-6 h-14 md:h-16 w-full max-w-7xl mx-auto">
          {/* Bên trái: Logo 5TOP CINEMA thu gọn trên Mobile */}
          <Brand />

          {/* Ở giữa: Navigation Links (Desktop only, ẩn trên Mobile) */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-8" aria-label="Menu chính">
            {nav.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  cn(
                    "text-xs lg:text-sm font-semibold transition-colors duration-150 relative py-1",
                    isActive
                      ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600 after:rounded-full"
                      : "text-slate-600 hover:text-blue-600"
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Bên phải: Gom cụm hành động */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Nút Tìm kiếm (Icon Kính lúp mở Modal) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-400 bg-white transition-colors cursor-pointer"
              aria-label="Tìm kiếm phim (Ctrl + K)"
              title="Tìm kiếm phim (Ctrl + K)"
            >
              <Search size={18} />
            </button>

            {/* Dropdown Chọn Rạp - Ẩn trên Mobile (< md:), đưa vào Drawer */}
            <div className="hidden md:block">
              <CinemaSelectorDropdown />
            </div>

            {/* Trạng thái tài khoản (Account Menu / Nút Đăng nhập) */}
            {user ? (
              <div className="account-menu relative">
                <button
                  className="account-trigger flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 rounded-full hover:bg-slate-100 transition cursor-pointer"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen(!accountOpen)}
                  aria-label="Menu tài khoản"
                >
                  <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                    <CircleUserRound size={20} />
                  </span>
                  <span className="hidden lg:inline-block max-w-[110px] truncate text-xs font-semibold text-slate-800">
                    {user.fullName}
                  </span>
                  <ChevronDown className="hidden lg:inline-block text-slate-400" size={14} />
                </button>
                {accountOpen && (
                  <div className="account-dropdown absolute top-full right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/80 rounded-xl mb-1">
                      <p className="text-[11px] text-slate-500">Đang đăng nhập với</p>
                      <p className="text-xs font-semibold text-slate-800 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg transition"
                    >
                      <UserIcon size={15} />
                      <span>Tài khoản của tôi</span>
                    </Link>

                    <Link
                      to="/my-tickets"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-slate-700 hover:text-blue-600 hover:bg-blue-50/60 rounded-lg transition"
                    >
                      <Ticket size={15} />
                      <span>Vé của tôi</span>
                    </Link>

                    {(user.role === "admin" || user.role === "staff") && (
                      <Link
                        to="/staff"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-lg transition"
                      >
                        <Ticket size={15} />
                        <span>Cổng nhân viên (Staff)</span>
                      </Link>
                    )}

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100/70 rounded-lg transition"
                      >
                        <ShieldAlert size={15} />
                        <span>Trang quản trị</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer text-left"
                    >
                      <LogOut size={15} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
                  onClick={onOpenLogin}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100 transition cursor-pointer"
                  aria-label="Đăng nhập"
                  onClick={onOpenLogin}
                  title="Đăng nhập"
                >
                  <CircleUserRound size={20} />
                </button>
              </div>
            )}

            {/* Nút Hamburger Menu (Mobile only, < md:) */}
            <button
              type="button"
              className="md:hidden flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl border border-slate-200 text-slate-700 hover:text-blue-600 hover:bg-slate-100 transition cursor-pointer"
              aria-label="Mở menu điều hướng"
              aria-expanded={open}
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer / Sheet Menu trượt từ bên phải */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Menu điều hướng di động"
        >
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Sheet */}
          <aside
            className="fixed inset-y-0 right-0 w-3/4 max-w-xs bg-white z-50 shadow-2xl p-6 flex flex-col justify-between overflow-y-auto transform transition-transform duration-300 ease-in-out"
          >
            {/* Vùng trên: Header Drawer + Chọn rạp + Tìm kiếm + Links */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <Brand compact={false} />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
                  aria-label="Đóng menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* 1. Vị trí rạp hiện tại (Cho phép đổi rạp) */}
              <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-200/80">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider flex items-center gap-1">
                    <MapPin size={13} className="text-blue-600" />
                    Cụm rạp đang chọn
                  </span>
                  <NavLink
                    to="/cinemas"
                    onClick={() => setOpen(false)}
                    className="text-[11px] font-bold text-blue-600 hover:underline inline-flex items-center"
                  >
                    Đổi rạp &rarr;
                  </NavLink>
                </div>
                <p className="text-xs font-bold text-slate-800 line-clamp-1">
                  {isAllCinemasSelected ? "Tất cả rạp trên toàn quốc" : selectedCinema.name}
                </p>
                {!isAllCinemasSelected && selectedCinema.address && (
                  <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">
                    {selectedCinema.address}
                  </p>
                )}
              </div>

              {/* Ô tìm kiếm nhanh trong Drawer */}
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  setIsSearchOpen(true)
                }}
                className="mt-3 w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium hover:bg-slate-200 transition cursor-pointer"
              >
                <Search size={16} className="text-blue-600" />
                <span>Tìm kiếm phim, rạp...</span>
              </button>

              {/* 2. Danh sách liên kết điều hướng */}
              <nav className="mt-5 flex flex-col gap-1" aria-label="Menu điều hướng di động">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">
                  Điều hướng
                </span>
                {nav.map(([label, path]) => (
                  <NavLink
                    key={path}
                    to={path}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all",
                        isActive
                          ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                          : "text-slate-700 hover:bg-slate-100 hover:text-blue-600"
                      )
                    }
                  >
                    <span>{label}</span>
                    <ChevronRight size={14} className="opacity-50" />
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* 3. Trạng thái tài khoản (Dưới cùng Drawer) */}
            <div className="pt-4 mt-6 border-t border-slate-100">
              {user ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <CircleUserRound size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 truncate">
                        {user.fullName}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 mt-1">
                    <Link
                      to="/profile"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                    >
                      <UserIcon size={15} className="text-slate-500" />
                      <span>Tài khoản của tôi</span>
                    </Link>

                    <Link
                      to="/my-tickets"
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 transition"
                    >
                      <Ticket size={15} className="text-slate-500" />
                      <span>Vé của tôi</span>
                    </Link>

                    {(user.role === "admin" || user.role === "staff") && (
                      <Link
                        to="/staff"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-emerald-600 bg-emerald-50/70"
                      >
                        <Ticket size={15} />
                        <span>Cổng nhân viên</span>
                      </Link>
                    )}

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50/70"
                      >
                        <ShieldAlert size={15} />
                        <span>Trang quản trị</span>
                      </Link>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setOpen(false)
                        handleLogout()
                      }}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 text-left cursor-pointer mt-1 transition"
                    >
                      <LogOut size={15} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false)
                      onOpenLogin()
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-600/20 hover:bg-blue-700 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <CircleUserRound size={17} />
                    <span>Đăng nhập / Đăng ký</span>
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Đăng nhập để nhận điểm và ưu đãi thành viên
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      )}

      {/* Quick Search Modal */}
      <SearchMovieModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  )
}
