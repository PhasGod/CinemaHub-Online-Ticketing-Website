import { ArrowLeft, ArrowRight, CalendarDays, Ticket } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { findPromotionBySlug, promotionDetailData } from "../data/promotionDetailData"

export default function PromotionComboDetailPage() {
  const { slug } = useParams()
  const promotion = findPromotionBySlug(slug)

  if (!promotion) {
    return (
      <main className="promotion-detail-page">
        <section className="promotion-detail-inner promotion-detail-not-found">
          <h1>Không tìm thấy ưu đãi</h1>
          <p>Ưu đãi này không còn khả dụng hoặc đường dẫn chưa chính xác.</p>
          <Link to="/promotions" className="promotion-detail-cta"><ArrowLeft size={18} /> Xem tất cả khuyến mãi</Link>
        </section>
      </main>
    )
  }

  const relatedPromotions = promotionDetailData.filter((item) => item.slug !== promotion.slug).slice(0, 3)

  return (
    <main className="promotion-detail-page">
      <section className="promotion-detail-inner">
        <nav className="promotion-detail-breadcrumb" aria-label="Điều hướng">
          <Link to="/">Trang chủ</Link><span>/</span><Link to="/promotions">Khuyến mãi</Link><span>/</span><b>{promotion.title}</b>
        </nav>
        <Link className="promotion-detail-back" to="/promotions"><ArrowLeft size={17} /> Tất cả khuyến mãi</Link>

        <div className="promotion-detail-layout">
          <article className="promotion-detail-article">
            <p className="promotion-detail-kicker">ƯU ĐÃI 5TOP CINEMA</p>
            <h1>{promotion.title}</h1>
            <div className="promotion-detail-date"><CalendarDays size={17} /> Thời gian: Đến hết {promotion.validUntil}</div>
            <img className="promotion-detail-banner" src={promotion.bannerImageUrl} alt={promotion.title} />
            <h2>Chi tiết ưu đãi</h2>
            <p>{promotion.details}</p>

            {promotion.priceOptions && (
              <div className="promotion-detail-prices" aria-label="Mức giá ưu đãi">
                {promotion.priceOptions.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.salePrice}</strong><small>Giá gốc {item.originalPrice}</small></div>)}
              </div>
            )}

            <h2>Điều khoản và điều kiện</h2>
            <ul className="promotion-detail-terms">
              {promotion.terms.map((term) => <li key={term}>{term}</li>)}
            </ul>
            <Link to={promotion.ctaUrl} className="promotion-detail-cta"><Ticket size={18} /> {promotion.ctaLabel}</Link>
          </article>

          <aside className="promotion-related" aria-label="Khuyến mãi liên quan">
            <p>KHÁM PHÁ THÊM</p>
            <h2>Khuyến mãi liên quan</h2>
            <div className="promotion-related-list">
              {relatedPromotions.map((item) => (
                <Link className="promotion-related-card" to={`/khuyen-mai/${item.slug}`} key={item.slug}>
                  <img src={item.cardImageUrl} alt="" />
                  <span><small>Đến {item.validUntil}</small><b>{item.title}</b><em>{item.summary}</em><strong>Xem chi tiết <ArrowRight size={15} /></strong></span>
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </section>
      <Link to={promotion.ctaUrl} className="promotion-mobile-cta"><Ticket size={18} /> {promotion.ctaLabel}</Link>
    </main>
  )
}
