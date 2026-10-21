import { FloatingPromotionBanners } from "../components/FloatingPromotionBanners"
import { MovieTabs } from "../components/MovieTabs"
import { PromotionCarousel } from "../components/PromotionCarousel"

export default function CinemaHomePage() {
  return (
    <>
      <main className="cinema-home-page">
        <section className="cinema-home-promotions">
          <PromotionCarousel variant="hero" />
        </section>
        <section className="cinema-home-movies">
          <header className="cinema-home-heading">
            <span>KHÁM PHÁ ĐIỆN ẢNH</span>
            <h1>Phim nổi bật tại rạp</h1>
            <p>Cập nhật lịch chiếu, trailer và ưu đãi mới nhất tại 5TOP CINEMA.</p>
          </header>
          <MovieTabs />
        </section>
      </main>
      <FloatingPromotionBanners />
    </>
  )
}
