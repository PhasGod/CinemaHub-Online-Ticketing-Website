import { FloatingPromotionBanners } from "../components/FloatingPromotionBanners"
import { MovieTabs } from "../components/MovieTabs"
import { MovieEventBannerSlider } from "../components/MovieEventBannerSlider"

export default function CinemaHomePage() {
  return (
    <>
      <main className="cinema-home-page">
        <section className="cinema-home-promotions pt-2 sm:pt-4">
          <MovieEventBannerSlider />
        </section>
        <section className="cinema-home-movies max-w-7xl mx-auto px-4 xl:px-36 2xl:px-44">
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
