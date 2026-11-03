import { MovieTabs } from "../components/MovieTabs"
import { ScrollReveal } from "../components/ScrollReveal"

export default function MovieCardGridPage() {
  return (
    <main className="cinema-movie-page">
      <section className="cinema-movie-page-inner">
        <ScrollReveal className="cinema-movie-heading">
          <span>KHÁM PHÁ ĐIỆN ẢNH</span>
          <h1>Phim đang chiếu</h1>
          <p>Chọn bộ phim yêu thích, xem trailer và đặt vé chỉ trong vài phút.</p>
        </ScrollReveal>

        <MovieTabs />
      </section>
    </main>
  )
}
