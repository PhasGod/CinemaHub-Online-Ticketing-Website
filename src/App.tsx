import { type FormEvent, useState } from "react"
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  Clapperboard,
  Clock3,
  CreditCard,
  Download,
  Film,
  LayoutDashboard,
  MapPin,
  Menu,
  Minus,
  MonitorPlay,
  Play,
  Plus,
  QrCode,
  Search,
  Star,
  Ticket,
  Users,
  X,
  Zap,
} from "lucide-react"
import {
  BrowserRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { Navbar } from "./components/Navbar"
import { AuthModal } from "./components/AuthModal"
import { ProfilePage } from "./pages/ProfilePage"
import { LoginPage } from "./pages/LoginPage"
import { ProtectedRoute } from "./components/ProtectedRoute"

const photos = {
  hero: "https://images.unsplash.com/photo-1682806816936-c3ac11f65112?auto=format&fit=crop&w=1800&q=88",
  city: "https://images.unsplash.com/photo-1727018663219-b0bd25a359e9?auto=format&fit=crop&w=800&q=85",
  giant:
    "https://images.unsplash.com/photo-1679482451632-b2e126da7142?auto=format&fit=crop&w=800&q=85",
  galaxy:
    "https://images.unsplash.com/photo-1697985189201-293f0ddfc36d?auto=format&fit=crop&w=800&q=85",
  scooter:
    "https://images.unsplash.com/photo-1606603696914-a0f46d934b9c?auto=format&fit=crop&w=800&q=85",
  cinema:
    "https://images.unsplash.com/photo-1629474468919-64a55bbae8eb?auto=format&fit=crop&w=1000&q=85",
  marquee:
    "https://images.unsplash.com/photo-1717903775083-8ad2a38483a5?auto=format&fit=crop&w=1000&q=85",
}

const movies = [
  {
    id: "avengers",
    title: "Avengers: Secret Wars",
    genre: "Hành động",
    runtime: "2h 15m",
    rating: 8.8,
    image: photos.giant,
    format: "IMAX",
  },
  {
    id: "night-city",
    title: "Đêm Thành Phố",
    genre: "Hành động",
    runtime: "2h 08m",
    rating: 8.6,
    image: photos.city,
    format: "2D",
  },
  {
    id: "beyond",
    title: "Vượt Ngoài Biên Giới",
    genre: "Khoa học viễn tưởng",
    runtime: "2h 21m",
    rating: 9.1,
    image: photos.galaxy,
    format: "3D",
  },
  {
    id: "summer",
    title: "Mùa Hè Năm Ấy",
    genre: "Tình cảm",
    runtime: "1h 48m",
    rating: 8.2,
    image: photos.scooter,
    format: "2D",
  },
  {
    id: "last-hero",
    title: "Người Hùng Cuối Cùng",
    genre: "Phiêu lưu",
    runtime: "2h 02m",
    rating: 8.7,
    image: photos.hero,
    format: "IMAX",
  },
  {
    id: "cinema",
    title: "Chuyện Ở Rạp Cũ",
    genre: "Tâm lý",
    runtime: "1h 52m",
    rating: 8.4,
    image: photos.cinema,
    format: "2D",
  },
]

const upcoming = movies.slice(2, 6).map((movie, index) => ({
  ...movie,
  date: ["12.10.2026", "18.10.2026", "25.10.2026", "02.11.2026"][index],
}))

const cn = (...names: Array<string | false | null | undefined>) =>
  names.filter(Boolean).join(" ")

type ShowtimeSelection = {
  movie: string
  cinema: string
  date: string
  time: string
  format: string
}

const defaultShowtime: ShowtimeSelection = {
  movie: "Avengers: Secret Wars",
  cinema: "5TOP CINEMA Biên Hòa",
  date: "26/09",
  time: "10:00",
  format: "2D Phụ đề",
}

function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "dark"
}) {
  return (
    <button className={cn("button", `button-${variant}`, className)} {...props}>
      {children}
    </button>
  )
}

function Brand({ compact = false }: { compact?: boolean }) {
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


function SectionTitle({
  title,
  link,
  to = "/movies",
}: {
  title: string
  link?: string
  to?: string
}) {
  return (
    <div className="section-heading">
      <div>
        <span className="eyebrow">Khám phá điện ảnh</span>
        <h2>{title}</h2>
      </div>
      {link && (
        <Link to={to} className="section-link">
          {link} <ArrowRight size={17} />
        </Link>
      )}
    </div>
  )
}

function MovieCard({
  movie,
  upcomingMode = false,
}: {
  movie: typeof movies[number] & { date?: string }
  upcomingMode?: boolean
}) {
  const navigate = useNavigate()
  return (
    <article className="movie-card">
      <Link to={`/movies/${movie.id}`} className="poster-wrap">
        <img src={movie.image} alt={`Poster phim ${movie.title}`} />
        <span className="format-badge">{movie.format}</span>
        <span className="poster-action">
          <Ticket size={17} /> Xem chi tiết
        </span>
      </Link>
      <div className="movie-info">
        <Link to={`/movies/${movie.id}`} className="movie-title">
          {movie.title}
        </Link>
        {upcomingMode ? (
          <p className="movie-meta">
            <CalendarDays size={15} /> Khởi chiếu {movie.date}
          </p>
        ) : (
          <div className="rating-row">
            <span>
              <Star size={15} fill="currentColor" /> {movie.rating}
            </span>
            <span>
              {movie.genre} · {movie.runtime}
            </span>
          </div>
        )}
        <Button
          variant={upcomingMode ? "secondary" : "primary"}
          className="card-button"
          onClick={() =>
            navigate(
              upcomingMode ? `/movies/${movie.id}` : `/showtimes/${movie.id}`,
            )
          }
        >
          {upcomingMode ? (
            <>
              <Bell size={16} /> Nhắc tôi
            </>
          ) : (
            <>
              <Ticket size={16} /> Đặt vé
            </>
          )}
        </Button>
      </div>
    </article>
  )
}

function HeroBanner() {
  const navigate = useNavigate()
  return (
    <section className="hero">
      <img className="hero-backdrop" src={photos.hero} alt="" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-copy">
          <span className="hero-label">
            <span className="live-dot" /> Phim đang chiếu
          </span>
          <h1>
            Avengers:
            <br />
            <em>Secret Wars</em>
          </h1>
          <div className="hero-meta">
            <span>2026</span>
            <i /> <span>2h 15m</span>
            <i /> <span>Hành động</span>
            <i /> <span>Phiêu lưu</span>
          </div>
          <div className="hero-rating">
            <Star size={18} fill="currentColor" /> <b>8.8</b>
            <span>/10</span>
            <small>12.4K đánh giá</small>
          </div>
          <p>
            Trận chiến đa vũ trụ lớn nhất bắt đầu. Những người hùng cuối cùng
            phải sát cánh để bảo vệ mọi thực tại.
          </p>
          <div className="hero-buttons">
            <Button onClick={() => navigate("/showtimes/avengers")}>
              <Ticket size={18} /> Đặt vé ngay
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/movies/avengers")}
            >
              <Play size={17} fill="currentColor" /> Xem trailer
            </Button>
          </div>
        </div>
        <div className="hero-poster">
          <img src={photos.giant} alt="Avengers: Secret Wars" />
          <span className="poster-chip">
            <Zap size={15} fill="currentColor" /> IMAX
          </span>
        </div>
      </div>
      <div className="hero-dots">
        <span className="active" />
        <span />
        <span />
      </div>
    </section>
  )
}

function QuickBooking() {
  const navigate = useNavigate()
  const [date, setDate] = useState("Hôm nay")
  return (
    <section className="quick-booking">
      <div className="quick-title">
        <span>
          <Zap size={20} fill="currentColor" />
        </span>
        <div>
          <h2>Đặt vé nhanh</h2>
          <p>Chọn nhanh, xem ngay</p>
        </div>
      </div>
      <label className="select-field">
        <span>
          <MapPin size={15} /> Rạp chiếu
        </span>
        <select defaultValue="bienhoa">
          <option value="bienhoa">5TOP CINEMA Biên Hòa</option>
          <option value="thuduc">5TOP CINEMA Thủ Đức</option>
        </select>
      </label>
      <label className="select-field">
        <span>
          <Film size={15} /> Phim
        </span>
        <select defaultValue="avengers">
          <option value="avengers">Avengers: Secret Wars</option>
          <option value="beyond">Vượt Ngoài Biên Giới</option>
        </select>
      </label>
      <div className="date-field">
        <span>
          <CalendarDays size={15} /> Ngày xem
        </span>
        <div>
          {["Hôm nay", "Ngày mai", "28/09"].map((item) => (
            <button
              key={item}
              className={cn(date === item && "selected")}
              onClick={() => setDate(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>
      <Button
        className="quick-submit"
        onClick={() => navigate("/showtimes/avengers")}
      >
        Xem suất chiếu <ArrowRight size={17} />
      </Button>
    </section>
  )
}

function HomePage() {
  return (
    <>
      <main>
        <div className="container home-top">
          <HeroBanner />
          <QuickBooking />
        </div>
        <section className="container section-block">
          <SectionTitle title="Phim đang chiếu" link="Xem tất cả" />
          <div className="movie-grid">
            {movies.slice(0, 5).map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </section>
        <section className="upcoming-bg">
          <div className="container section-block">
            <SectionTitle title="Phim sắp chiếu" link="Khám phá lịch phim" />
            <div className="movie-grid four">
              {upcoming.map((movie) => (
                <MovieCard key={movie.id} movie={movie} upcomingMode />
              ))}
            </div>
          </div>
        </section>
        <section className="container app-banner">
          <div>
            <span className="eyebrow">5TOP CINEMA Member</span>
            <h2>
              Mỗi lần xem phim,
              <br />
              mỗi lần thêm đặc quyền.
            </h2>
            <p>
              Tích điểm, nhận voucher và mở khóa ưu đãi dành riêng cho thành
              viên.
            </p>
            <Button variant="dark">
              Khám phá thành viên <ArrowRight size={17} />
            </Button>
          </div>
          <div className="member-card">
            <Brand />
            <span>MEMBER</span>
            <strong>5T · 2026 · 82931</strong>
          </div>
        </section>
      </main>
    </>
  )
}

function MoviesPage() {
  const [tab, setTab] = useState("now")
  return (
    <main className="page-main">
      <section className="container">
        <div className="page-header">
          <span className="eyebrow">Kho phim 5TOP CINEMA</span>
          <h1>Phim</h1>
          <p>Chọn bộ phim bạn yêu thích và đặt vé chỉ trong vài phút.</p>
        </div>
        <div className="filter-bar">
          <div className="tabs">
            <button
              className={cn(tab === "now" && "active")}
              onClick={() => setTab("now")}
            >
              Đang chiếu
            </button>
            <button
              className={cn(tab === "soon" && "active")}
              onClick={() => setTab("soon")}
            >
              Sắp chiếu
            </button>
          </div>
          <div className="filters">
            {["Thể loại", "Quốc gia", "Năm", "Định dạng"].map((filter) => (
              <button key={filter}>
                {filter}
                <ChevronDown size={15} />
              </button>
            ))}
          </div>
        </div>
        <div className="movie-grid six">
          {(tab === "now" ? movies : upcoming).map((movie) => (
            <MovieCard
              key={movie.id}
              movie={movie}
              upcomingMode={tab === "soon"}
            />
          ))}
        </div>
      </section>
    </main>
  )
}

function MovieDetailPage() {
  const navigate = useNavigate()
  return (
    <main className="detail-page">
      <div
        className="detail-backdrop"
        style={{ backgroundImage: `url(${photos.hero})` }}
      />
      <div className="container detail-content">
        <img
          className="detail-poster"
          src={photos.giant}
          alt="Poster Avengers: Secret Wars"
        />
        <div className="detail-copy">
          <span className="hero-label">Phim đang chiếu</span>
          <h1>Avengers: Secret Wars</h1>
          <p className="english-title">Biệt đội báo thù: Cuộc chiến bí mật</p>
          <div className="detail-rating">
            <span>
              <Star size={18} fill="currentColor" />
              <b>8.8</b>/10
            </span>
            <span>2026</span>
            <span>2h 15m</span>
            <span>T16</span>
          </div>
          <div className="tags">
            <span>Hành động</span>
            <span>Phiêu lưu</span>
            <span>Khoa học viễn tưởng</span>
          </div>
          <p className="synopsis">
            Khi ranh giới giữa các vũ trụ sụp đổ, những người hùng từ nhiều thực
            tại phải cùng nhau chống lại một hiểm họa có thể xóa sổ mọi thứ. Một
            chương sử thi mới bắt đầu.
          </p>
          <dl className="details-list">
            <div>
              <dt>Đạo diễn</dt>
              <dd>Anthony Russo, Joe Russo</dd>
            </div>
            <div>
              <dt>Diễn viên</dt>
              <dd>Robert Downey Jr., Chris Hemsworth, Pedro Pascal</dd>
            </div>
            <div>
              <dt>Ngôn ngữ</dt>
              <dd>Tiếng Anh · Phụ đề Tiếng Việt</dd>
            </div>
          </dl>
          <div className="hero-buttons">
            <Button onClick={() => navigate("/showtimes/avengers")}>
              <Ticket size={18} /> Đặt vé ngay
            </Button>
            <Button variant="secondary">
              <Play size={17} fill="currentColor" /> Xem trailer
            </Button>
          </div>
        </div>
      </div>
    </main>
  )
}

const dates = [
  { day: "Hôm nay", date: "26/09" },
  { day: "Thứ 7", date: "27/09" },
  { day: "Chủ nhật", date: "28/09" },
  { day: "Thứ 2", date: "29/09" },
  { day: "Thứ 3", date: "30/09" },
]

function BookingSteps({ current }: { current: number }) {
  const steps = ["Suất chiếu", "Chọn ghế", "Combo", "Thanh toán", "Hoàn tất"]
  return (
    <div className="booking-steps">
      {steps.map((step, index) => (
        <div
          key={step}
          className={cn(
            index + 1 <= current && "complete",
            index + 1 === current && "current",
          )}
        >
          <span>{index + 1 < current ? <Check size={14} /> : index + 1}</span>
          <b>{step}</b>
          {index < steps.length - 1 && <i />}
        </div>
      ))}
    </div>
  )
}

function ShowtimesPage({
  onSelectShowtime,
}: {
  onSelectShowtime: (selection: ShowtimeSelection) => void
}) {
  const [date, setDate] = useState(0)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const groups = [
    {
      name: "2D Phụ đề",
      times: ["10:00", "11:30", "13:00", "15:30", "18:00", "20:30"],
    },
    { name: "IMAX 2D", times: ["11:00", "14:00", "17:00", "21:00"] },
  ]
  return (
    <main className="page-main">
      <section className="container booking-page">
        <BookingSteps current={1} />
        <div className="page-header compact">
          <span className="eyebrow">Bước 1 / 5</span>
          <h1>Chọn suất chiếu</h1>
          <p>Avengers: Secret Wars · 5TOP CINEMA Biên Hòa</p>
        </div>
        <div className="date-selector">
          {dates.map((item, index) => (
            <button
              key={item.date}
              className={cn(date === index && "active")}
              onClick={() => setDate(index)}
            >
              <span>{item.day}</span>
              <b>{item.date}</b>
            </button>
          ))}
        </div>
        <div className="showtime-layout">
          <div className="showtime-main">
            <div className="cinema-title">
              <div className="cinema-icon">
                <MapPin size={20} />
              </div>
              <div>
                <h3>5TOP CINEMA Biên Hòa</h3>
                <p>Vincom Plaza, 1096 Phạm Văn Thuận, Đồng Nai</p>
              </div>
              <span className="distance">1.2 km</span>
            </div>
            {groups.map((group) => (
              <div className="showtime-group" key={group.name}>
                <div className="showtime-label">
                  <MonitorPlay size={18} />
                  <b>{group.name}</b>
                  <span>Phòng chiếu tiêu chuẩn</span>
                </div>
                <div className="time-grid">
                  {group.times.map((time) => (
                    <button
                      key={time}
                      className={cn(selectedTime === time && "selected")}
                      onClick={() => {
                        setSelectedTime(time)
                        onSelectShowtime({
                          ...defaultShowtime,
                          date: dates[date].date,
                          time,
                          format: group.name,
                        })
                      }}
                    >
                      <b>{time}</b>
                      <span>75.000đ</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <aside className="movie-mini">
            <img src={photos.giant} alt="" />
            <div>
              <span className="format-badge">IMAX</span>
              <h3>Avengers: Secret Wars</h3>
              <p>2h 15m · T16</p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

const bookedSeats = new Set([
  "A3",
  "A4",
  "B7",
  "C2",
  "C3",
  "D8",
  "E1",
  "F5",
  "F6",
  "G7",
])
const vipRows = new Set(["D", "E"])

function BookingSummary({
  selected,
  onContinue,
  showtime,
}: {
  selected: string[]
  onContinue: () => void
  showtime: ShowtimeSelection
}) {
  const total = selected.length * 75000
  return (
    <aside className="booking-summary">
      <div className="summary-movie">
        <img src={photos.giant} alt="" />
        <div>
          <span>{showtime.format}</span>
          <h3>{showtime.movie}</h3>
          <p>T16 · 2h 15m</p>
        </div>
      </div>
      <div className="summary-details">
        <div>
          <span>Rạp</span>
          <b>{showtime.cinema}</b>
        </div>
        <div>
          <span>Phòng chiếu</span>
          <b>Phòng 04</b>
        </div>
        <div>
          <span>Suất chiếu</span>
          <b>{showtime.time} · {showtime.date}/2026</b>
        </div>
        <div>
          <span>Ghế đã chọn</span>
          <b className={cn(!selected.length && "muted")}>
            {selected.length ? selected.join(", ") : "Chưa chọn ghế"}
          </b>
        </div>
      </div>
      <div className="summary-total">
        <div>
          <span>{selected.length} vé</span>
          <b>{total.toLocaleString("vi-VN")}đ</b>
        </div>
        <div className="grand-total">
          <span>Tổng cộng</span>
          <b>{total.toLocaleString("vi-VN")}đ</b>
        </div>
      </div>
      <Button
        className="full-button"
        disabled={!selected.length}
        onClick={onContinue}
      >
        {selected.length ? (
          <>
            Tiếp tục <ArrowRight size={18} />
          </>
        ) : (
          "Vui lòng chọn ghế"
        )}
      </Button>
      <p className="summary-note">
        <Clock3 size={14} /> Ghế được giữ trong 09:42
      </p>
    </aside>
  )
}

function SeatsPage({ showtime }: { showtime: ShowtimeSelection }) {
  const navigate = useNavigate()
  const [selected, setSelected] = useState<string[]>(["D5", "D6"])
  const toggle = (seat: string) =>
    setSelected((items) =>
      items.includes(seat)
        ? items.filter((item) => item !== seat)
        : [...items, seat],
    )
  return (
    <main className="page-main seats-page">
      <section className="container">
        <BookingSteps current={2} />
        <div className="page-header compact">
          <span className="eyebrow">Bước 2 / 5</span>
          <h1>Chọn ghế</h1>
          <p>{showtime.movie} · {showtime.cinema} · {showtime.date} · {showtime.time} · {showtime.format}</p>
        </div>
        <div className="seat-layout">
          <div className="seat-panel">
            <div className="screen">
              <span>Màn hình</span>
              <div />
            </div>
            <div className="seat-map">
              {Array.from({ length: 7 }, (_, r) =>
                String.fromCharCode(65 + r),
              ).map((row) => (
                <div className="seat-row" key={row}>
                  <span className="row-label">{row}</span>
                  {Array.from({ length: 10 }, (_, i) => `${row}${i + 1}`).map(
                    (seat) => (
                      <button
                        key={seat}
                        disabled={bookedSeats.has(seat)}
                        aria-label={`Ghế ${seat}`}
                        onClick={() => toggle(seat)}
                        className={cn(
                          "seat",
                          vipRows.has(row) && "vip",
                          bookedSeats.has(seat) && "booked",
                          selected.includes(seat) && "selected",
                        )}
                      >
                        {i + 1}
                      </button>
                    ),
                  )}
                  <span className="row-label">{row}</span>
                </div>
              ))}
            </div>
            <div className="seat-legend">
              <span>
                <i className="seat" /> Ghế thường
              </span>
              <span>
                <i className="seat vip" /> Ghế VIP
              </span>
              <span>
                <i className="seat selected" /> Đang chọn
              </span>
              <span>
                <i className="seat booked" /> Đã đặt
              </span>
            </div>
          </div>
          <BookingSummary
            selected={selected}
            onContinue={() => navigate("/combo")}
            showtime={showtime}
          />
        </div>
      </section>
    </main>
  )
}

const comboData = [
  {
    name: "Combo Solo",
    detail: "1 bắp ngọt vừa + 1 Coca",
    price: 75000,
    color: "coral",
  },
  {
    name: "Combo Couple",
    detail: "1 bắp ngọt lớn + 2 Coca",
    price: 120000,
    color: "blue",
  },
  {
    name: "Coca-Cola",
    detail: "1 ly Coca-Cola 32oz",
    price: 25000,
    color: "teal",
  },
]

function ComboPage() {
  const navigate = useNavigate()
  const [quantities, setQuantities] = useState([0, 1, 0])
  const change = (index: number, delta: number) =>
    setQuantities((old) =>
      old.map((quantity, i) =>
        i === index ? Math.max(0, quantity + delta) : quantity,
      ),
    )
  const comboTotal = quantities.reduce(
    (sum, quantity, index) => sum + quantity * comboData[index].price,
    0,
  )
  return (
    <main className="page-main">
      <section className="container booking-page">
        <BookingSteps current={3} />
        <div className="page-header compact">
          <span className="eyebrow">Bước 3 / 5</span>
          <h1>Combo bắp nước</h1>
          <p>Thêm chút ngon miệng cho trải nghiệm điện ảnh trọn vẹn.</p>
        </div>
        <div className="combo-layout">
          <div className="combo-grid">
            {comboData.map((combo, index) => (
              <article className="combo-card" key={combo.name}>
                <div className={cn("combo-visual", combo.color)}>
                  <span>{index < 2 ? "POPCORN" : "ICE COLD"}</span>
                  <Film size={52} />
                </div>
                <div className="combo-copy">
                  <h3>{combo.name}</h3>
                  <p>{combo.detail}</p>
                  <b>{combo.price.toLocaleString("vi-VN")}đ</b>
                  <div className="quantity">
                    <button onClick={() => change(index, -1)}>
                      <Minus size={16} />
                    </button>
                    <span>{quantities[index]}</span>
                    <button onClick={() => change(index, 1)}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="combo-summary">
            <h3>Tóm tắt đơn hàng</h3>
            <div>
              <span>2 vé · D5, D6</span>
              <b>150.000đ</b>
            </div>
            <div>
              <span>Combo</span>
              <b>{comboTotal.toLocaleString("vi-VN")}đ</b>
            </div>
            <div className="grand-total">
              <span>Tổng cộng</span>
              <b>{(150000 + comboTotal).toLocaleString("vi-VN")}đ</b>
            </div>
            <Button
              className="full-button"
              onClick={() => navigate("/payment")}
            >
              Tiếp tục thanh toán <ArrowRight size={18} />
            </Button>
            <button className="skip-link" onClick={() => navigate("/payment")}>
              Bỏ qua combo
            </button>
          </aside>
        </div>
      </section>
    </main>
  )
}

function PaymentPage() {
  const navigate = useNavigate()
  const [method, setMethod] = useState("momo")
  const methods = [
    ["momo", "MoMo", "M"],
    ["zalopay", "ZaloPay", "Z"],
    ["vnpay", "VNPay", "V"],
    ["card", "Thẻ ngân hàng", "C"],
  ]
  return (
    <main className="page-main">
      <section className="container booking-page">
        <BookingSteps current={4} />
        <div className="page-header compact">
          <span className="eyebrow">Bước 4 / 5</span>
          <h1>Thanh toán</h1>
          <p>Kiểm tra thông tin trước khi hoàn tất đặt vé.</p>
        </div>
        <div className="payment-layout">
          <div className="payment-card">
            <h3>Phương thức thanh toán</h3>
            {methods.map(([id, label, icon]) => (
              <label
                key={id}
                className={cn("payment-method", method === id && "selected")}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={method === id}
                  onChange={() => setMethod(id)}
                />
                <span className={cn("pay-logo", id)}>{icon}</span>
                <b>{label}</b>
                <i>{method === id && <Check size={14} />}</i>
              </label>
            ))}
            <div className="secure-note">
              <CreditCard size={19} />
              <div>
                <b>Thanh toán an toàn</b>
                <span>Thông tin của bạn được mã hóa và bảo vệ.</span>
              </div>
            </div>
          </div>
          <aside className="order-card">
            <h3>Thông tin đặt vé</h3>
            <div className="order-movie">
              <img src={photos.giant} alt="" />
              <div>
                <b>Avengers: Secret Wars</b>
                <span>5TOP CINEMA Biên Hòa</span>
                <span>28/09/2026 · 19:30</span>
              </div>
            </div>
            <dl>
              <div>
                <dt>Phòng / Ghế</dt>
                <dd>04 / D5, D6</dd>
              </div>
              <div>
                <dt>Tiền vé</dt>
                <dd>150.000đ</dd>
              </div>
              <div>
                <dt>Combo Couple</dt>
                <dd>120.000đ</dd>
              </div>
              <div>
                <dt>Phí dịch vụ</dt>
                <dd>10.000đ</dd>
              </div>
            </dl>
            <div className="grand-total">
              <span>Tổng thanh toán</span>
              <b>280.000đ</b>
            </div>
            <Button
              className="full-button"
              onClick={() => navigate("/success")}
            >
              <CreditCard size={18} /> Thanh toán 280.000đ
            </Button>
            <p>Bằng việc thanh toán, bạn đồng ý với điều khoản dịch vụ.</p>
          </aside>
        </div>
      </section>
    </main>
  )
}

function SuccessPage() {
  return (
    <main className="success-page">
      <div className="success-wrap">
        <BookingSteps current={5} />
        <div className="success-check">
          <Check size={34} strokeWidth={2.5} />
        </div>
        <span className="eyebrow">Thanh toán thành công</span>
        <h1>Đặt vé thành công!</h1>
        <p>Vé điện tử đã được gửi tới email của bạn.</p>
        <div className="ticket">
          <div className="ticket-main">
            <div className="ticket-brand">
              <Brand />
              <span>VÉ ĐIỆN TỬ</span>
            </div>
            <div className="ticket-movie">
              <img src={photos.giant} alt="" />
              <div>
                <span>AVENGERS</span>
                <h2>Secret Wars</h2>
                <p>5TOP CINEMA Biên Hòa · Phòng 04</p>
              </div>
            </div>
            <div className="ticket-info">
              <div>
                <span>Ngày</span>
                <b>28/09/2026</b>
              </div>
              <div>
                <span>Giờ</span>
                <b>19:30</b>
              </div>
              <div>
                <span>Ghế</span>
                <b>D5, D6</b>
              </div>
            </div>
          </div>
          <div className="ticket-cut">
            <i />
            <i />
          </div>
          <div className="ticket-code">
            <div className="fake-qr">
              <QrCode size={112} strokeWidth={1.4} />
            </div>
            <span>Mã đặt vé</span>
            <b>CHB-82931</b>
            <small>Quét mã tại cổng soát vé</small>
          </div>
        </div>
        <div className="success-actions">
          <Button>
            <QrCode size={17} /> Hiển thị QR
          </Button>
          <Button variant="secondary">
            <Download size={17} /> Tải vé
          </Button>
          <Link to="/" className="back-home">
            <ArrowLeft size={16} /> Về trang chủ
          </Link>
        </div>
      </div>
    </main>
  )
}

function CinemasPage() {
  const cinemas = [
    "5TOP CINEMA Biên Hòa",
    "5TOP CINEMA Thủ Đức",
    "5TOP CINEMA Quận 7",
    "5TOP CINEMA Bình Dương",
  ]
  return (
    <main className="page-main">
      <section className="container">
        <div className="page-header">
          <span className="eyebrow">Hệ thống 5TOP CINEMA</span>
          <h1>Rạp chiếu</h1>
          <p>Không gian điện ảnh chuẩn quốc tế ngay gần bạn.</p>
        </div>
        <div className="cinema-grid">
          {cinemas.map((name, index) => (
            <article className="cinema-card" key={name}>
              <img
                src={index % 2 ? photos.marquee : photos.cinema}
                alt={name}
              />
              <div>
                <span className="distance">{1.2 + index * 2}.2 km</span>
                <h3>{name}</h3>
                <p>
                  <MapPin size={16} />{" "}
                  {index
                    ? "Vincom Plaza, TP. Hồ Chí Minh"
                    : "1096 Phạm Văn Thuận, Đồng Nai"}
                </p>
                <div className="tags">
                  <span>2D</span>
                  <span>3D</span>
                  <span>IMAX</span>
                  <span>Dolby Atmos</span>
                </div>
                <Link to="/showtimes/avengers" className="cinema-link">
                  Xem suất chiếu <ArrowRight size={17} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function PromotionsPage() {
  const promos = [
    [
      "Giảm 20% mỗi thứ Hai",
      "Nạp năng lượng đầu tuần với giá vé ưu đãi.",
      "MONDAY20",
    ],
    ["Combo đôi chỉ 99K", "Hẹn hò trọn vẹn với bắp lớn và 2 nước.", "COUPLE99"],
    [
      "Chào thành viên mới",
      "Nhận ngay voucher 50K cho lần đặt đầu tiên.",
      "HELLO50",
    ],
    [
      "Ưu đãi học sinh sinh viên",
      "Đồng giá 55K từ thứ Hai đến thứ Sáu.",
      "STUDENT",
    ],
  ]
  return (
    <main className="page-main">
      <section className="container">
        <div className="promo-hero">
          <div>
            <span>Ưu đãi tháng 9</span>
            <h1>
              Thêm niềm vui,
              <br />
              nhẹ ví hơn.
            </h1>
            <p>Khám phá những ưu đãi độc quyền tại 5TOP CINEMA.</p>
          </div>
          <Ticket size={128} />
        </div>
        <SectionTitle title="Khuyến mãi nổi bật" />
        <div className="promo-grid">
          {promos.map(([title, copy, code], index) => (
            <article
              className={cn("promo-card", `promo-${index + 1}`)}
              key={title}
            >
              <div className="promo-art">
                <span>{index % 2 ? "SPECIAL" : "5TOP CINEMA"}</span>
                <b>{code}</b>
              </div>
              <div>
                <small>Đến 30.09.2026</small>
                <h3>{title}</h3>
                <p>{copy}</p>
                <Button variant="secondary">
                  Xem chi tiết <ArrowRight size={16} />
                </Button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

function TicketsPage() {
  return (
    <main className="page-main">
      <section className="container">
        <div className="page-header">
          <span className="eyebrow">Tài khoản của tôi</span>
          <h1>Vé của tôi</h1>
        </div>
        <div className="tabs wide">
          <button className="active">
            Sắp xem <span>1</span>
          </button>
          <button>Đã xem</button>
          <button>Đã hủy</button>
        </div>
        <article className="my-ticket">
          <img src={photos.giant} alt="" />
          <div className="my-ticket-main">
            <span className="format-badge">IMAX 2D</span>
            <h2>Avengers: Secret Wars</h2>
            <p>
              <MapPin size={16} /> 5TOP CINEMA Biên Hòa
            </p>
            <div>
              <span>
                <CalendarDays size={16} /> 28/09/2026
              </span>
              <span>
                <Clock3 size={16} /> 19:30
              </span>
              <span>
                <MonitorPlay size={16} /> Phòng 04
              </span>
            </div>
            <b>Ghế D5, D6</b>
          </div>
          <div className="my-ticket-code">
            <QrCode size={80} />
            <span>Mã vé</span>
            <b>CHB-82931</b>
            <Button>Xem vé</Button>
          </div>
        </article>
      </section>
    </main>
  )
}

function AdminPage() {
  const { user } = useAuth()
  const menu = [
    ["Dashboard", LayoutDashboard],
    ["Phim", Film],
    ["Rạp & phòng", MonitorPlay],
    ["Suất chiếu", Clock3],
    ["Đơn đặt vé", Ticket],
    ["Người dùng", Users],
    ["Doanh thu", BarChart3],
  ]
  const stats = [
    ["Tổng doanh thu", "1,28 tỷ", "+12.5%"],
    ["Vé đã bán", "18.429", "+8.2%"],
    ["Vé hôm nay", "642", "+14.1%"],
    ["Người dùng", "24.890", "+6.4%"],
  ]
  return (
    <main className="admin-page">
      <aside className="admin-sidebar">
        <Brand />
        {menu.map(([label, Icon], index) => (
          <button className={cn(index === 0 && "active")} key={label as string}>
            <Icon size={19} /> {label as string}
          </button>
        ))}
        <div className="admin-user">
          <CircleUserRound size={32} />
          <div>
            <b>{user?.fullName || "Quản trị viên"}</b>
            <span>{user?.role === "admin" ? "Quản trị viên" : "Nhân viên rạp"}</span>
          </div>
        </div>
      </aside>
      <section className="admin-main">
        <div className="admin-header">
          <div>
            <span>Thứ Hai, 28 tháng 9</span>
            <h1>Tổng quan hoạt động</h1>
          </div>
          <div>
            <button className="icon-button">
              <Bell size={19} />
            </button>
            <Button>
              <Plus size={17} /> Tạo suất chiếu
            </Button>
          </div>
        </div>
        <div className="stats-grid">
          {stats.map(([label, value, change], index) => (
            <article key={label}>
              <span>{label}</span>
              <h2>{value}</h2>
              <b>{change}</b>
              <i className={`stat-icon stat-${index}`}>
                <Ticket size={20} />
              </i>
            </article>
          ))}
        </div>
        <div className="dashboard-grid">
          <article className="chart-card">
            <div>
              <h3>Doanh thu theo ngày</h3>
              <select>
                <option>7 ngày qua</option>
              </select>
            </div>
            <div className="chart">
              {[48, 63, 44, 78, 66, 92, 74, 88, 71, 98, 82, 106].map(
                (height, index) => (
                  <i key={index} style={{ height: `${height}px` }} />
                ),
              )}
            </div>
            <div className="chart-labels">
              <span>T2</span>
              <span>T3</span>
              <span>T4</span>
              <span>T5</span>
              <span>T6</span>
              <span>T7</span>
              <span>CN</span>
            </div>
          </article>
          <article className="top-movies">
            <h3>Phim được đặt nhiều</h3>
            {movies.slice(0, 4).map((movie, index) => (
              <div key={movie.id}>
                <span>{index + 1}</span>
                <img src={movie.image} alt="" />
                <div>
                  <b>{movie.title}</b>
                  <small>{2410 - index * 327} vé</small>
                </div>
                <strong>{index ? `${83 - index * 8}%` : "100%"}</strong>
              </div>
            ))}
          </article>
        </div>
      </section>
    </main>
  )
}

function Footer() {
  return (
    <footer>
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>
            Trải nghiệm điện ảnh hiện đại,
            <br />
            dễ dàng và trọn vẹn hơn.
          </p>
        </div>
        <div>
          <b>Khám phá</b>
          <Link to="/movies">Phim</Link>
          <Link to="/cinemas">Rạp chiếu</Link>
          <Link to="/showtimes/avengers">Suất chiếu</Link>
          <Link to="/promotions">Khuyến mãi</Link>
        </div>
        <div>
          <b>Hỗ trợ</b>
          <span>Liên hệ</span>
          <span>FAQ</span>
          <span>Điều khoản</span>
          <span>Chính sách bảo mật</span>
        </div>
        <div>
          <b>Nhận tin mới</b>
          <p>Lịch phim và ưu đãi gửi đến bạn mỗi tuần.</p>
          <div className="subscribe">
            <input placeholder="Email của bạn" />
            <button aria-label="Đăng ký">
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 5TOP CINEMA. All rights reserved.</span>
        <span>Điện ảnh trong tầm tay.</span>
      </div>
    </footer>
  )
}

function SiteLayout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loginOpen, setLoginOpen] = useState(false)
  const [pendingShowtime, setPendingShowtime] = useState<ShowtimeSelection | null>(null)
  const [showtime, setShowtime] = useState<ShowtimeSelection>(defaultShowtime)

  const selectShowtime = (selection: ShowtimeSelection) => {
    setShowtime(selection)
    if (user) {
      navigate("/seats")
      return
    }
    setPendingShowtime(selection)
    setLoginOpen(true)
  }

  const handleAuthenticated = () => {
    setLoginOpen(false)
    if (pendingShowtime) {
      setShowtime(pendingShowtime)
      setPendingShowtime(null)
      navigate("/seats")
    }
  }

  return (
    <>
      <Navbar onOpenLogin={() => setLoginOpen(true)} />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/movies" element={<MoviesPage />} />
        <Route path="/movies/:id" element={<MovieDetailPage />} />
        <Route path="/showtimes/:id" element={<ShowtimesPage onSelectShowtime={selectShowtime} />} />
        <Route path="/seats" element={<SeatsPage showtime={showtime} />} />
        <Route path="/combo" element={<ComboPage />} />
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/tickets" element={<TicketsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin", "staff"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Routes>
        <Route path="/admin" element={null} />
        <Route path="/login" element={null} />
        <Route path="*" element={<Footer />} />
      </Routes>
      {loginOpen && (
        <AuthModal
          message={pendingShowtime ? "Vui lòng đăng nhập để tiếp tục đặt vé." : undefined}
          onClose={() => setLoginOpen(false)}
          onAuthenticated={handleAuthenticated}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SiteLayout />
      </BrowserRouter>
    </AuthProvider>
  )
}
