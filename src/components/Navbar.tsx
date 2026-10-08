import React, { useState } from "react"
import { Link, NavLink } from "react-router-dom"
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
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)

  const nav = [
    ["Trang chủ", "/"],
    ["Phim", "/movies"],
    ["Rạp chiếu", "/cinemas"],
    ["Suất chiếu", "/showtimes"],
    ["Khuyến mãi", "/promotions"],
  ]

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Brand />
        <nav className={cn("nav-links", open && "nav-open")}>
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
        </nav>
        <div className="nav-actions">
          <button className="icon-button hide-mobile" aria-label="Tìm kiếm">
            <Search size={19} />
          </button>
          <button className="location-button hide-tablet">
            <MapPin size={17} /> Biên Hòa <ChevronDown size={15} />
          </button>

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
                    <p className="text-sm font-semibold text-slate-800 truncate">{user.email}</p>
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
                    to="/tickets"
                    onClick={() => setAccountOpen(false)}
                    className="flex items-center gap-2"
                  >
                    <Ticket size={16} />
                    <span>Vé của tôi</span>
                  </Link>

                  {(user.role === "admin" || user.role === "staff") && (
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
                    onClick={() => {
                      setAccountOpen(false)
                      logout().catch((err: unknown) => {
                        window.alert(err instanceof Error ? err.message : "Đăng xuất thất bại")
                      })
                    }}
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
  )
}
