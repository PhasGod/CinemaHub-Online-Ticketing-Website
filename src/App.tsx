import { AdminDashboard } from "./pages/admin/AdminDashboard"
import { AdminUsersPage } from "./pages/admin/AdminUsersPage"
import { AdminGenresPage } from "./pages/admin/AdminGenresPage"
import { AdminMoviesPage } from "./pages/admin/AdminMoviesPage"
import { AdminRoomsPage } from "./pages/admin/AdminRoomsPage"
import { AdminSeatsPage } from "./pages/admin/AdminSeatsPage"
import { type FormEvent, useState, useEffect } from "react"
import MoviesFromDatabasePage from "./pages/MoviesPage"
import MovieDetailFromDatabasePage from "./pages/MovieDetailPage"
import HomeFromDatabasePage from "./pages/HomePage"
import BookingUnavailablePage from "./pages/BookingUnavailablePage"
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
  useParams,
} from "react-router-dom"
import { AuthProvider, useAuth } from "./context/AuthContext"
import { Navbar } from "./components/Navbar"
import { AuthModal } from "./components/AuthModal"
import { ProfilePage } from "./pages/ProfilePage"
import { LoginPage } from "./pages/LoginPage"
import { ProtectedRoute } from "./components/ProtectedRoute"

const photos = {
  hero: "https://media.themoviedb.org/t/p/w780/eZ239CUp1d6OryZEBPnO2n87gMG.jpg",
  giant: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
  city: "https://media.themoviedb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
  galaxy: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
  scooter: "https://upload.wikimedia.org/wikipedia/vi/d/d4/%C3%81p_ph%C3%ADch_ch%C3%ADnh_th%E1%BB%A9c_L%E1%BA%ADt_m%E1%BA%B7t_7.jpg",
  cinema: "https://upload.wikimedia.org/wikipedia/vi/3/36/Mai_2024_poster.jpg",
  marquee: "https://image.tmdb.org/t/p/w500/1DTP1Ph4uzNO6ofRUm7eAimWoKD.jpg",
}

const movies = [
  {
    id: "avengers-doomsday",
    title: "Avengers: Doomsday (2026)",
    genre: "Hành động, Siêu anh hùng",
    runtime: "2h 40m",
    rating: 9.3,
    image: "https://image.tmdb.org/t/p/w500/jjD5dcWFusnlrz8HzlZQIPM1Xal.jpg",
    format: "IMAX",
    description: "Sự trở lại chấn động của Robert Downey Jr. trong vai phản diện Doctor Doom, dẫn đầu cuộc chiến đa vũ trụ chống lại biệt đội Avengers thế hệ mới.",
  },
  {
    id: "the-mandalorian-and-grogu",
    title: "The Mandalorian & Grogu (2026)",
    genre: "Khoa học viễn tưởng, Phiêu lưu",
    runtime: "2h 15m",
    rating: 9.0,
    image: "https://image.tmdb.org/t/p/w500/iBokRdkd1jcBeU0fASO8Vtk25TO.jpg",
    format: "IMAX",
    description: "Bộ phim điện ảnh hoành tráng của vũ trụ Star Wars theo chân Din Djarin và chú nhóc Grogu trong nhiệm vụ giải cứu dải ngân hà năm 2026.",
  },
  {
    id: "lat-mat-8",
    title: "Lật Mặt 8: Vòng Xoáy Định Mệnh (2026)",
    genre: "Hành động, Gia đình",
    runtime: "2h 20m",
    rating: 9.1,
    image: "https://upload.wikimedia.org/wikipedia/vi/d/d4/%C3%81p_ph%C3%ADch_ch%C3%ADnh_th%E1%BB%A9c_L%E1%BA%ADt_m%E1%BA%B7t_7.jpg",
    format: "2D",
    description: "Phần phim thứ 8 trong chuỗi thương hiệu bom tấn ăn khách nhất lịch sử điện ảnh Việt Nam của đạo diễn Lý Hải ra mắt năm 2026.",
  },
  {
    id: "deadpool-and-wolverine",
    title: "Deadpool & Wolverine (IMAX 2026)",
    genre: "Hành động, Hài hước",
    runtime: "2h 08m",
    rating: 8.9,
    image: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
    format: "IMAX",
    description: "Phiên bản đặc biệt tái xuất rạp chiếu 2026 của bộ đôi dị nhân lầy lội nhất vũ trụ điện ảnh Marvel.",
  },
  {
    id: "dune-part-two",
    title: "Dune: Hành Tinh Cát 2",
    genre: "Khoa học viễn tưởng",
    runtime: "2h 46m",
    rating: 9.2,
    image: "https://media.themoviedb.org/t/p/w500/6izwz7rsy95ARzTR3poZ8H6c5pp.jpg",
    format: "IMAX",
    description: "Paul Atreides hợp lực cùng Chani và tộc người Fremen để trả thù những kẻ đã hủy diệt gia tộc mình, đối mặt với sự lựa chọn định mệnh của vũ trụ.",
  },
  {
    id: "mai-tran-thanh",
    title: "Mai (Bản Tri Ân 2026)",
    genre: "Tâm lý, Tình cảm",
    runtime: "2h 11m",
    rating: 8.7,
    image: "https://upload.wikimedia.org/wikipedia/vi/3/36/Mai_2024_poster.jpg",
    format: "2D",
    description: "Tác phẩm điện ảnh kỷ lục 500 tỷ của Trấn Thành xoay quanh số phận của Mai và mối tình nhiều trắc trở với Dương.",
  },
  {
    id: "inside-out-2",
    title: "Inside Out 2 (3D 2026)",
    genre: "Hoạt hình, Hài hước",
    runtime: "1h 36m",
    rating: 9.0,
    image: "https://image.tmdb.org/t/p/w500/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg",
    format: "3D",
    description: "Riley bước vào tuổi dậy thì với những cảm xúc mới: Lo Âu (Anxiety), Ganh Tị, Xấu Hổ và Chán Nản.",
  },
  {
    id: "godzilla-x-kong-the-new-empire",
    title: "Godzilla x Kong: Đế Chế Mới",
    genre: "Hành động, Viễn tưởng",
    runtime: "1h 55m",
    rating: 8.6,
    image: "https://image.tmdb.org/t/p/w500/1DTP1Ph4uzNO6ofRUm7eAimWoKD.jpg",
    format: "IMAX",
    description: "Hai quái thú huyền thoại Godzilla và Kong phải hợp sức chống lại mối đe dọa khổng lồ ẩn sâu dưới Trái Đất.",
  },
]

const upcoming = [
  {
    id: "avengers-secret-wars",
    title: "Avengers: Secret Wars (2026)",
    genre: "Hành động, Siêu anh hùng",
    runtime: "2h 45m",
    rating: 9.4,
    image: "https://image.tmdb.org/t/p/w500/jjD5dcWFusnlrz8HzlZQIPM1Xal.jpg",
    format: "IMAX",
    date: "18.12.2026",
    description: "Trận chiến đa vũ trụ lớn nhất trong lịch sử điện ảnh Marvel, quy tụ tất cả các siêu anh hùng qua mọi thời đại.",
  },
  {
    id: "gladiator-2",
    title: "Võ Sĩ Giác Đấu 2 (Gladiator II)",
    genre: "Hành động, Sử thi",
    runtime: "2h 28m",
    rating: 8.8,
    image: "https://image.tmdb.org/t/p/w500/2cxhvwyEwRlysAmRH4iodkvo0z5.jpg",
    format: "IMAX",
    date: "22.10.2026",
    description: "Sau nhiều năm chứng kiến Maximus gục ngã, Lucius phải bước vào đấu trường La Mã để tìm lại danh dự và vận mệnh.",
  },
  {
    id: "moana-2",
    title: "Hành Trình Của Moana 2",
    genre: "Hoạt hình, Âm nhạc",
    runtime: "1h 40m",
    rating: 8.7,
    image: "https://image.tmdb.org/t/p/w500/aLVkiINlIeCkcZIzb7XHzPYgO6L.jpg",
    format: "3D",
    date: "27.11.2026",
    description: "Moana nhận được lời kêu gọi bất ngờ từ tổ tiên và dấn thân vào chuyến hải trình nguy hiểm đến vùng biển xa xôi.",
  },
]

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
      <img className="hero-backdrop" src="https://media.themoviedb.org/t/p/w780/eZ239CUp1d6OryZEBPnO2n87gMG.jpg" alt="Avengers: Doomsday (2026)" />
      <div className="hero-overlay" />
      <div className="hero-content">
        <div className="hero-copy">
          <span className="hero-label">
            <span className="live-dot" /> Bom tấn chiếu rạp 2026
          </span>
          <h1>
            Avengers:
            <br />
            <em>Doomsday (2026)</em>
          </h1>
          <div className="hero-meta">
            <span>2026</span>
            <i /> <span>2h 40m</span>
            <i /> <span>Hành động, Siêu anh hùng</span>
            <i /> <span>IMAX 2D</span>
          </div>
          <div className="hero-rating">
            <Star size={18} fill="currentColor" /> <b>9.3</b>
            <span>/10</span>
            <small>52.8K đánh giá · Siêu bom tấn 2026</small>
          </div>
          <p>
            Sự trở lại chấn động của Robert Downey Jr. trong vai phản diện tối thượng Doctor Doom, mở ra trận chiến đa vũ trụ lớn nhất năm 2026 cùng biệt đội Avengers.
          </p>
          <div className="hero-buttons">
            <Button onClick={() => navigate("/showtimes/avengers-doomsday")}>
              <Ticket size={18} /> Đặt vé ngay
            </Button>
            <Button
              variant="secondary"
              onClick={() => navigate("/movies/avengers-doomsday")}
            >
              <Play size={17} fill="currentColor" /> Xem chi tiết
            </Button>
          </div>
        </div>
        <div className="hero-poster">
          <img src="https://image.tmdb.org/t/p/w500/jjD5dcWFusnlrz8HzlZQIPM1Xal.jpg" alt="Avengers: Doomsday (2026)" />
          <span className="poster-chip">
            <Zap size={15} fill="currentColor" /> IMAX 2026
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
  const [selectedMovie, setSelectedMovie] = useState("avengers-doomsday")
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
        <select value={selectedMovie} onChange={(e) => setSelectedMovie(e.target.value)}>
          {movies.map((m) => (
            <option key={m.id} value={m.id}>{m.title}</option>
          ))}
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
        onClick={() => navigate(`/showtimes/${selectedMovie}`)}
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
  const { id } = useParams()
  const navigate = useNavigate()
  const allMovies = [...movies, ...upcoming]
  const movie = allMovies.find((m) => m.id === id) || movies[0]
  const isUpcoming = upcoming.some((u) => u.id === movie.id)

  return (
    <main className="detail-page">
      <div
        className="detail-backdrop"
        style={{ backgroundImage: `url(${photos.hero})` }}
      />
      <div className="container detail-content">
        <img
          className="detail-poster"
          src={movie.image}
          alt={`Poster ${movie.title}`}
        />
        <div className="detail-copy">
          <span className="hero-label">
            {isUpcoming ? "Sắp chiếu rạp" : "Phim đang chiếu rạp"}
          </span>
          <h1>{movie.title}</h1>
          <p className="english-title">{movie.title}</p>
          <div className="detail-rating">
            <span>
              <Star size={18} fill="currentColor" />
              <b>{movie.rating}</b>/10
            </span>
            <span>2026</span>
            <span>{movie.runtime}</span>
            <span>{movie.format}</span>
          </div>
          <div className="tags">
            {movie.genre.split(",").map((g) => (
              <span key={g.trim()}>{g.trim()}</span>
            ))}
          </div>
          <p className="synopsis">
            {(movie as any).description ||
              "Bộ phim bom tấn chất lượng cao với cốt truyện lôi cuốn, kỹ xảo đỉnh cao và dàn diễn viên xuất sắc."}
          </p>
          <dl className="details-list">
            <div>
              <dt>Định dạng</dt>
              <dd>{movie.format} · Âm thanh Dolby Atmos</dd>
            </div>
            <div>
              <dt>Thời lượng</dt>
              <dd>{movie.runtime}</dd>
            </div>
            <div>
              <dt>Ngôn ngữ</dt>
              <dd>Phụ đề Tiếng Việt · Lồng tiếng</dd>
            </div>
          </dl>
          <div className="hero-buttons">
            <Button onClick={() => navigate(`/showtimes/${movie.id}`)}>
              <Ticket size={18} /> Đặt vé ngay
            </Button>
            <Button
              variant="secondary"
              onClick={() => alert(`Xem trailer phim ${movie.title}`)}
            >
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
  const { id } = useParams()
  const allMovies = [...movies, ...upcoming]
  const currentMovie = allMovies.find((m) => m.id === id) || movies[0]

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
          <p>{currentMovie.title} · 5TOP CINEMA Biên Hòa</p>
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
                          movie: currentMovie.title,
                          cinema: "5TOP CINEMA Biên Hòa",
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
            <img src={currentMovie.image} alt={currentMovie.title} />
            <div>
              <span className="format-badge">{currentMovie.format}</span>
              <h3>{currentMovie.title}</h3>
              <p>{currentMovie.runtime} · {currentMovie.genre}</p>
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
                    (seat, idx) => (
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
                        {idx + 1}
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
                <Link to="/showtimes" className="cinema-link">
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

function TicketDetailModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate()
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Ticket size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-base">Chi tiết vé điện tử</h3>
              <p className="text-xs text-slate-500">Mã vé: CHB-82931</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-200 text-slate-500 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Movie Card */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-3 mb-4">
              <span className="text-xs font-bold tracking-widest text-blue-400">
                5TOP CINEMA · E-TICKET
              </span>
              <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-500/30">
                Đã thanh toán
              </span>
            </div>

            <div className="flex gap-4">
              <img
                src={photos.giant}
                alt="Avengers: Secret Wars"
                className="w-20 h-28 object-cover rounded-xl shadow-md border border-slate-700 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-blue-600/40 text-blue-300 border border-blue-500/30 mb-1.5">
                  IMAX 2D
                </span>
                <h4 className="text-lg font-bold text-white leading-tight">
                  Avengers: Secret Wars
                </h4>
                <p className="text-xs text-slate-300 mt-2 flex items-center gap-1.5">
                  <MapPin size={13} className="text-blue-400 shrink-0" /> 5TOP CINEMA Biên Hòa
                </p>
                <p className="text-xs text-slate-300 mt-1 flex items-center gap-1.5">
                  <MonitorPlay size={13} className="text-blue-400 shrink-0" /> Phòng chiếu: Phòng 04
                </p>
              </div>
            </div>

            {/* Ticket Info Row */}
            <div className="grid grid-cols-3 gap-2 text-center bg-slate-800/80 rounded-xl p-3 border border-slate-700/60 mt-4">
              <div>
                <span className="block text-[11px] text-slate-400 mb-0.5">Ngày chiếu</span>
                <b className="text-sm font-semibold text-white">28/09/2026</b>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 mb-0.5">Suất chiếu</span>
                <b className="text-sm font-semibold text-blue-300">19:30</b>
              </div>
              <div>
                <span className="block text-[11px] text-slate-400 mb-0.5">Ghế ngồi</span>
                <b className="text-sm font-bold text-amber-300">D5, D6</b>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200 mb-2">
              <QrCode size={130} className="text-slate-900" strokeWidth={1.4} />
            </div>
            <span className="text-[11px] text-slate-500 uppercase tracking-widest font-semibold mt-1">
              Mã đặt vé
            </span>
            <b className="text-2xl font-mono font-extrabold text-blue-600 tracking-wider">
              CHB-82931
            </b>
            <p className="text-xs text-slate-500 mt-1.5 max-w-xs">
              Quét mã này tại quầy vé hoặc cổng vào phòng chiếu trước giờ phim chiếu 15 phút.
            </p>
          </div>

          {/* Detailed breakdown */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50 space-y-2 text-sm text-slate-600">
            <h5 className="font-bold text-slate-800 text-sm border-b border-slate-200/80 pb-2">
              Chi tiết đơn hàng & Thanh toán
            </h5>
            <div className="flex justify-between py-1">
              <span>Vé xem phim (2 vé · Ghế D5, D6)</span>
              <span className="font-semibold text-slate-800">150.000đ</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Combo Couple (1 bắp + 2 nước)</span>
              <span className="font-semibold text-slate-800">120.000đ</span>
            </div>
            <div className="flex justify-between py-1">
              <span>Phí tiện ích trực tuyến</span>
              <span className="font-semibold text-slate-800">10.000đ</span>
            </div>
            <div className="flex justify-between py-2 border-t border-slate-200 font-bold text-base text-slate-900">
              <span>Tổng thanh toán</span>
              <span className="text-blue-600">280.000đ</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 pt-1">
              <CreditCard size={14} className="text-emerald-500" />
              <span>Đã thanh toán qua Ví MoMo · Giao dịch #MM280926</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => {
              navigate("/success")
            }}
            className="flex-1 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Ticket size={16} /> Xem trang vé đầy đủ
          </button>
          <button
            type="button"
            onClick={() => {
              alert("Đã lưu vé điện tử CHB-82931 về thiết bị của bạn!")
            }}
            className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download size={16} /> Tải vé
          </button>
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-semibold text-sm transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

function TicketsPage() {
  const [tab, setTab] = useState<"upcoming" | "watched" | "cancelled">("upcoming")
  const [showDetail, setShowDetail] = useState(false)

  return (
    <main className="page-main">
      <section className="container">
        <div className="page-header">
          <span className="eyebrow">Tài khoản của tôi</span>
          <h1>Vé của tôi</h1>
        </div>
        <div className="tabs wide">
          <button
            type="button"
            className={cn(tab === "upcoming" && "active")}
            onClick={() => setTab("upcoming")}
          >
            Sắp xem <span>1</span>
          </button>
          <button
            type="button"
            className={cn(tab === "watched" && "active")}
            onClick={() => setTab("watched")}
          >
            Đã xem
          </button>
          <button
            type="button"
            className={cn(tab === "cancelled" && "active")}
            onClick={() => setTab("cancelled")}
          >
            Đã hủy
          </button>
        </div>

        {tab === "upcoming" ? (
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
              <Button onClick={() => setShowDetail(true)}>Xem vé</Button>
            </div>
          </article>
        ) : (
          <div className="empty-state py-16 text-center text-slate-500 bg-white rounded-2xl border border-slate-100 my-6">
            <Ticket size={48} className="mx-auto text-slate-300 mb-3" />
            <h3 className="font-semibold text-slate-700 text-lg mb-1">
              {tab === "watched" ? "Chưa có vé đã xem" : "Không có vé nào bị hủy"}
            </h3>
            <p className="text-sm text-slate-400">
              {tab === "watched"
                ? "Những bộ phim bạn đã xem xong sẽ xuất hiện ở đây."
                : "Bạn chưa có đơn đặt vé nào bị hủy."}
            </p>
          </div>
        )}

        {showDetail && <TicketDetailModal onClose={() => setShowDetail(false)} />}
      </section>
    </main>
  )
}

function AdminPage() {
  const { user } = useAuth()

  const menu = [
    { label: "Tổng quan", path: "/admin", icon: LayoutDashboard },
    { label: "Tài khoản", path: "/admin/users", icon: Users },
    { label: "Thể loại", path: "/admin/genres", icon: Film },
    { label: "Phim", path: "/admin/movies", icon: Film },
    { label: "Phòng & ghế", path: "/admin/rooms", icon: MonitorPlay },
  ]

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-10">
      <div className="container">
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5">
          <h1 className="text-xl font-bold text-slate-800">
            Quản trị CinemaHub
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Xin chào, {user?.fullName}
          </p>

          <nav className="mt-4 flex flex-wrap gap-2">
            {menu.map(({ label, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === "/admin"}
                className={({ isActive }) =>
                  `flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${isActive
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-blue-50"
                  }`
                }
              >
                <Icon size={18} />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="genres" element={<AdminGenresPage />} />
          <Route path="movies" element={<AdminMoviesPage />} />
          <Route path="rooms" element={<AdminRoomsPage />} />
          <Route
            path="rooms/:roomId/seats"
            element={<AdminSeatsPage />}
          />
          <Route
            path="*"
            element={
              <p className="p-6 text-center">
                Không tìm thấy trang quản trị.
              </p>
            }
          />
        </Routes>
      </div>
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
          <Link to="/showtimes">Suất chiếu</Link>
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
        <Route path="/" element={<HomeFromDatabasePage />} />
        <Route path="/movies" element={<MoviesFromDatabasePage />} />
        <Route
          path="/movies/:id"
          element={<MovieDetailFromDatabasePage />}
        />
        <Route path="/showtimes" element={<BookingUnavailablePage />} />
        <Route path="/showtimes/:id" element={<BookingUnavailablePage />} />
        <Route path="/seats" element={<BookingUnavailablePage />} />
        <Route path="/combo" element={<BookingUnavailablePage />} />
        <Route path="/payment" element={<BookingUnavailablePage />} />
        <Route path="/success" element={<BookingUnavailablePage />} />
        <Route path="/cinemas" element={<CinemasPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/tickets" element={<BookingUnavailablePage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
      <Routes>
        <Route path="/admin/*" element={null} />
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
