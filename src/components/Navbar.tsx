import React, { useState, useEffect } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
  Clapperboard,
  CircleUserRound,
  ChevronDown,
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
    <Link to="/" className="brand" aria-label="5TOP CINEMA - Trang chủ">
      <span className="brand-mark">
        <Clapperboard size={21} strokeWidth={2.4} />
      </span>
      {!compact && (
        <span>
          5TOP <span className="brand-accent">CINEMA</span>
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

  // Lắng nghe phím tắt Ctrl + K / Cmd + K để mở Quick Search Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      <header className="navbar">
        <div className="container nav-inner">
          <Brand />

          {/* Navigation Links Desktop & Mobile */}
          <nav className={cn("nav-links", open && "nav-open")}>
            {/* Quick search input trên mobile menu */}
            {open && (
              <div className="mb-2 pb-3 border-b border-slate-100 sm:hidden">
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    setIsSearchOpen(true)
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-slate-100 text-slate-500 text-xs font-medium hover:bg-slate-200 transition"
                >
                  <Search size={16} className="text-blue-600" />
                  <span>Tìm phim, diễn viên, thể loại...</span>
                </button>
              </div>
            )}

            {nav.map(([label, path]) => (
              <NavLink
                key={path}
                to={path}
                onClick={() => setOpen(false)}
                className={({ isActive }) => cn("nav-link", isActive && "active")}
              >
                {label}
              </NavLink>
            ))}

            {/* Hiển thị chọn rạp trong mobile menu nếu đang mở mobile */}
            {open && (
              <div className="mt-3 pt-3 border-t border-slate-100 sm:hidden flex flex-col gap-2">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Cụm rạp đang chọn
                </span>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-blue-600" />
                    <span className="text-xs font-semibold">
                      {isAllCinemasSelected ? "Tất cả rạp" : selectedCinema.name}
                    </span>
                  </div>
                  <NavLink
                    to="/cinemas"
                    onClick={() => setOpen(false)}
                    className="text-[11px] font-bold text-blue-600 hover:underline"
                  >
                    Đổi rạp
                  </NavLink>
                </div>
              </div>
            )}
          </nav>

          {/* Action Buttons trên Header */}
          <div className="nav-actions">
            {/* Nút Tìm kiếm (kèm shortcut tooltip) */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="icon-button relative group hover:border-blue-400 hover:text-blue-600 transition-colors"
              aria-label="Tìm kiếm phim (Ctrl + K)"
              title="Tìm kiếm phim (Ctrl + K)"
            >
              <Search size={19} />
              <span className="sr-only">Tìm kiếm</span>
            </button>

            {/* Dropdown Chọn Rạp / Khu Vực */}
            <CinemaSelectorDropdown />

            {/* Account Menu / Login */}
            {user ? (
              <div className="account-menu relative">
                <button
                  className="account-trigger flex items-center gap-2"
                  aria-expanded={accountOpen}
                  onClick={() => setAccountOpen(!accountOpen)}
                >
                  <span className="avatar">
                    <CircleUserRound size={22} />
                  </span>
                  <span className="account-name hide-mobile font-medium">
                    {user.fullName}
                  </span>
                  <ChevronDown className="hide-mobile" size={14} />
                </button>
                {accountOpen && (
                  <div className="account-dropdown">
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 rounded-t-xl mb-1">
                      <p className="text-xs text-slate-500">Đang đăng nhập với</p>
                      <p className="text-sm font-semibold text-slate-800 truncate">
                        {user.email}
                      </p>
                      <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2"
                    >
                      <UserIcon size={16} />
                      <span>Tài khoản của tôi</span>
                    </Link>

                    <Link
                      to="/my-tickets"
                      onClick={() => setAccountOpen(false)}
                      className="flex items-center gap-2"
                    >
                      <Ticket size={16} />
                      <span>Vé của tôi</span>
                    </Link>

                    {(user.role === "admin" || user.role === "staff") && (
                      <Link
                        to="/staff"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 font-semibold text-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/70"
                      >
                        <Ticket size={16} />
                        <span>Cổng nhân viên (Staff)</span>
                      </Link>
                    )}

                    {user.role === "admin" && (
                      <Link
                        to="/admin"
                        onClick={() => setAccountOpen(false)}
                        className="flex items-center gap-2 font-semibold text-blue-600 bg-blue-50/70 hover:bg-blue-100/70"
                      >
                        <ShieldAlert size={16} />
                        <span>Trang quản trị</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut size={16} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button className="login-link hide-mobile" onClick={onOpenLogin}>
                  Đăng nhập
                </button>
                <button
                  className="avatar"
                  aria-label="Đăng nhập"
                  onClick={onOpenLogin}
                >
                  <CircleUserRound size={26} />
                </button>
              </>
            )}

            <button
              className="icon-button menu-button"
              aria-label="Mở menu"
              onClick={() => setOpen(!open)}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      {/* Quick Search Modal */}
      <SearchMovieModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  )
}
