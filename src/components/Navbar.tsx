import React, { useEffect, useRef, useState } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import {
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
import { adminGetMovies, type Movie } from "../services/admin.service"

function cn(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ")
}

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="brand" aria-label="5TOP CINEMA - Trang chủ">
      <span className="brand-mark">
        <img src="/logo-5top-cinema.png" alt="" />
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
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [locationOpen, setLocationOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [searchMovies, setSearchMovies] = useState<Movie[]>([])
  const [location, setLocation] = useState(() => localStorage.getItem("5top-selected-location") || "Biên Hòa")
  const searchMenuRef = useRef<HTMLDivElement>(null)
  const locationMenuRef = useRef<HTMLDivElement>(null)

  const locations = ["Biên Hòa", "TP. Hồ Chí Minh", "Hà Nội", "Đà Nẵng"]
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN")
  const searchResults = normalizedQuery
    ? searchMovies.filter((movie) => `${movie.title} ${movie.genres.map((genre) => genre.name).join(" ")}`.toLocaleLowerCase("vi-VN").includes(normalizedQuery)).slice(0, 4)
    : searchMovies.slice(0, 3)

  useEffect(() => {
    let active = true
    adminGetMovies({ limit: 100 })
      .then((result) => { if (active) setSearchMovies(result.movies) })
      .catch(() => { if (active) setSearchMovies([]) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const closeMenus = (event: MouseEvent) => {
      const target = event.target as Node
      if (!searchMenuRef.current?.contains(target)) setSearchOpen(false)
      if (!locationMenuRef.current?.contains(target)) setLocationOpen(false)
    }
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSearchOpen(false)
        setLocationOpen(false)
      }
    }

    document.addEventListener("mousedown", closeMenus)
    document.addEventListener("keydown", closeWithEscape)
    return () => {
      document.removeEventListener("mousedown", closeMenus)
      document.removeEventListener("keydown", closeWithEscape)
    }
  }, [])

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!normalizedQuery) return
    navigate(`/movies?search=${encodeURIComponent(query.trim())}`)
    setSearchOpen(false)
  }

  const chooseLocation = (nextLocation: string) => {
    setLocation(nextLocation)
    localStorage.setItem("5top-selected-location", nextLocation)
    setLocationOpen(false)
  }

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
          <div className="nav-action-menu hide-mobile" ref={searchMenuRef}>
            <button
              className="icon-button"
              type="button"
              aria-label="Tìm kiếm phim"
              aria-expanded={searchOpen}
              aria-controls="movie-search-menu"
              onClick={() => {
                setSearchOpen((value) => !value)
                setLocationOpen(false)
              }}
            >
              <Search size={19} />
            </button>
            {searchOpen && (
              <div className="nav-search-popover" id="movie-search-menu">
                <form onSubmit={submitSearch} className="nav-search-form">
                  <Search size={17} aria-hidden="true" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Tìm tên phim hoặc thể loại..."
                    aria-label="Tìm tên phim hoặc thể loại"
                  />
                  <button type="submit">Tìm</button>
                </form>
                <div className="nav-search-results" aria-live="polite">
                  <p>{normalizedQuery ? "Kết quả gợi ý" : "Phim được quan tâm"}</p>
                  {searchResults.length > 0 ? searchResults.map((movie) => (
                    <Link
                      key={movie.id}
                      to={`/movies/${movie.id}`}
                      onClick={() => setSearchOpen(false)}
                    >
                      <span>{movie.title}</span>
                      <small>{movie.genres.map((genre) => genre.name).join(", ") || "Đang cập nhật"}</small>
                    </Link>
                  )) : <span className="nav-search-empty">Không tìm thấy phim phù hợp.</span>}
                </div>
              </div>
            )}
          </div>
          <div className="nav-action-menu hide-tablet" ref={locationMenuRef}>
            <button
              className="location-button"
              type="button"
              aria-expanded={locationOpen}
              aria-controls="location-menu"
              onClick={() => {
                setLocationOpen((value) => !value)
                setSearchOpen(false)
              }}
            >
              <MapPin size={17} /> {location} <ChevronDown size={15} />
            </button>
            {locationOpen && (
              <div className="location-dropdown" id="location-menu" role="menu" aria-label="Chọn khu vực rạp">
                <p>Khu vực của bạn</p>
                {locations.map((item) => (
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={location === item}
                    className={location === item ? "selected" : ""}
                    key={item}
                    onClick={() => chooseLocation(item)}
                  >
                    <MapPin size={15} /> {item}
                    {location === item && <span>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

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
