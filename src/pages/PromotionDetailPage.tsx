import React, { useEffect, useState } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Calendar,
  Ticket,
  Copy,
  Check,
  Zap,
  Clock,
  ShieldCheck,
  MapPin,
  HelpCircle,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Share2,
} from "lucide-react"
import { Promotion } from "../types/promotion"
import { getPromotionByIdOrSlug, getPromotions, saveSelectedVoucher } from "../services/promotion.service"
import { useToast } from "../components/Toast"

export default function PromotionDetailPage() {
  const { id, slug } = useParams<{ id?: string; slug?: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [relatedPromotions, setRelatedPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  const targetParam = id || slug || ""

  useEffect(() => {
    let active = true
    setIsLoading(true)

    getPromotionByIdOrSlug(targetParam).then((promo) => {
      if (active) {
        setPromotion(promo)
        setIsLoading(false)
      }
    })

    getPromotions().then((all) => {
      if (active) {
        setRelatedPromotions(all.filter((p) => p.id !== targetParam && p.slug !== targetParam).slice(0, 3))
      }
    })

    return () => {
      active = false
    }
  }, [targetParam])

  const isExpired = promotion?.status === "EXPIRED"

  const handleCopyCode = async () => {
    if (!promotion || isExpired) return
    try {
      await navigator.clipboard.writeText(promotion.code)
      setCopied(true)
      showToast(
        `Đã sao chép mã ${promotion.code} thành công!`,
        "success",
        "Sao chép thành công"
      )
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast(`Mã ưu đãi của bạn: ${promotion.code}`, "info")
    }
  }

  const handleUseNow = () => {
    if (!promotion || isExpired) return
    saveSelectedVoucher(promotion)
    showToast(
      `Đã lưu mã ${promotion.code}! Mã sẽ tự động được áp dụng khi bạn thanh toán.`,
      "info",
      "Voucher đã được kích hoạt"
    )
    navigate("/movies")
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28 pb-16 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Đang tải chi tiết chương trình ưu đãi...</p>
        </div>
      </main>
    )
  }

  if (!promotion) {
    return (
      <main className="min-h-screen bg-slate-50 pt-28 pb-16 px-4">
        <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={32} />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Không tìm thấy chương trình khuyến mãi</h1>
          <p className="text-sm text-slate-500 mb-6">
            Ưu đãi này không còn khả dụng hoặc đường dẫn liên kết chưa chính xác.
          </p>
          <Link
            to="/promotions"
            className="inline-flex items-center gap-2 py-3 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-md transition"
          >
            <ArrowLeft size={16} /> Xem tất cả khuyến mãi
          </Link>
        </div>
      </main>
    )
  }

  const discountFormatted =
    promotion.discountType === "PERCENTAGE"
      ? `Giảm ${promotion.discountValue}%`
      : `Giảm ${promotion.discountValue.toLocaleString("vi-VN")}đ`

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Breadcrumb & Back */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs sm:text-sm">
          <nav className="flex items-center gap-2 text-slate-500" aria-label="Điều hướng">
            <Link to="/" className="hover:text-teal-600 transition">Trang chủ</Link>
            <span>/</span>
            <Link to="/promotions" className="hover:text-teal-600 transition">Khuyến mãi</Link>
            <span>/</span>
            <span className="text-slate-900 font-bold truncate max-w-[200px] sm:max-w-md">{promotion.title}</span>
          </nav>

          <Link
            to="/promotions"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 py-1.5 px-3 rounded-xl transition"
          >
            <ArrowLeft size={14} /> Tất cả ưu đãi
          </Link>
        </div>

        {/* Main Content Grid: 8 cols article + 4 cols sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Article (8 cols) */}
          <article className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
            {/* Top Tag & Title */}
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {promotion.badge === "HOT" && (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500 text-white shadow-sm flex items-center gap-1">
                    <Zap size={13} className="fill-current" /> Hot
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-100 text-teal-800 border border-teal-200">
                  {promotion.category === "TICKET" && "Ưu đãi Vé"}
                  {promotion.category === "FNB" && "Ưu đãi Bắp nước"}
                  {promotion.category === "MEMBER" && "Đặc quyền Thành viên"}
                </span>
                {isExpired && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-200">
                    Đã hết hạn
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 leading-tight">
                {promotion.title}
              </h1>

              <div className="mt-4 flex items-center gap-2 text-xs sm:text-sm text-slate-500 font-medium bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
                <Calendar size={17} className="text-teal-600 shrink-0" />
                <span>
                  Thời gian diễn ra:{" "}
                  <strong className="text-slate-900">
                    {new Date(promotion.startDate).toLocaleDateString("vi-VN")} - {new Date(promotion.endDate).toLocaleDateString("vi-VN")}
                  </strong>
                </span>
              </div>
            </div>

            {/* Large Banner Image */}
            <div className="rounded-2xl overflow-hidden aspect-[16/9] bg-slate-900 shadow-inner">
              <img
                src={promotion.bannerUrl}
                alt={promotion.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  ;(e.currentTarget as HTMLImageElement).src = "/promo/carousel-dong-gia-online.png"
                }}
              />
            </div>

            {/* Voucher Action Box (Hộp nhận mã ưu đãi - Ticket stub format) */}
            <div className="relative rounded-3xl border-2 border-dashed border-teal-400 bg-gradient-to-br from-teal-50/90 via-emerald-50/50 to-white p-6 sm:p-7 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="text-center sm:text-left space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-teal-800">
                    <Ticket size={15} /> Nhận mã ưu đãi
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-3 flex-wrap">
                    <span className="font-mono font-black text-2xl sm:text-3xl tracking-widest text-teal-950">
                      {promotion.code}
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs font-black bg-teal-600 text-white shadow-sm">
                      {discountFormatted}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {promotion.minOrderValue
                      ? `Đơn tối thiểu ${promotion.minOrderValue.toLocaleString("vi-VN")}đ`
                      : "Áp dụng cho mọi giá trị đơn"}
                    {promotion.maxDiscount
                      ? ` · Giảm tối đa ${promotion.maxDiscount.toLocaleString("vi-VN")}đ`
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    disabled={isExpired}
                    onClick={handleCopyCode}
                    className={`flex-1 sm:flex-initial py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 shadow-sm ${
                      isExpired
                        ? "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed"
                        : copied
                        ? "bg-emerald-600 border-emerald-600 text-white"
                        : "bg-white hover:bg-teal-50 text-teal-700 border-teal-300"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check size={16} /> Đã sao chép
                      </>
                    ) : (
                      <>
                        <Copy size={16} /> {isExpired ? "Hết hạn" : "Sao chép mã"}
                      </>
                    )}
                  </button>

                  {!isExpired && (
                    <button
                      type="button"
                      onClick={handleUseNow}
                      className="flex-1 sm:flex-initial py-3 px-6 rounded-2xl font-extrabold text-xs sm:text-sm bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2"
                    >
                      <Zap size={16} /> Dùng ngay
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 1. Giới thiệu chương trình */}
            <section className="space-y-3 pt-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles size={20} className="text-teal-600" /> Giới thiệu chương trình
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed bg-slate-50/70 p-5 rounded-2xl border border-slate-100">
                {promotion.details.introduction}
              </p>
            </section>

            {/* 2. Đối tượng & Khung giờ áp dụng */}
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <ShieldCheck size={17} className="text-teal-600" /> Đối tượng khách hàng
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {promotion.details.eligibleAudience}
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                  <Clock size={17} className="text-teal-600" /> Khung giờ / Ngày hợp lệ
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {promotion.details.validTime}
                </p>
              </div>
            </section>

            {/* 3. Danh sách rạp áp dụng */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <MapPin size={20} className="text-teal-600" /> Danh sách rạp áp dụng
              </h2>
              <div className="flex flex-wrap gap-2.5">
                {promotion.details.applicableCinemas.map((cinema, idx) => (
                  <span
                    key={idx}
                    className="px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                  >
                    {cinema}
                  </span>
                ))}
              </div>
            </section>

            {/* 4. Điều kiện & Thể lệ áp dụng */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <AlertCircle size={20} className="text-teal-600" /> Thể lệ & Điều kiện tham gia
              </h2>
              <ul className="space-y-2.5 bg-slate-50/80 p-5 rounded-2xl border border-slate-100">
                {promotion.details.termsAndConditions.map((term, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                    <span>{term}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* 5. Hướng dẫn áp dụng khi thanh toán vé */}
            <section className="space-y-3">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <HelpCircle size={20} className="text-teal-600" /> Các bước áp dụng khi thanh toán
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {promotion.details.usageSteps.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-teal-100 bg-teal-50/40 text-xs sm:text-sm text-slate-700 leading-relaxed flex items-start gap-3"
                  >
                    <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom cta bar */}
            {!isExpired && (
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-500">
                  Nhấn <strong>Dùng ngay</strong> để hệ thống tự động lưu mã vào giỏ hàng và áp dụng khi bạn thanh toán.
                </p>
                <button
                  type="button"
                  onClick={handleUseNow}
                  className="w-full sm:w-auto py-3.5 px-8 rounded-2xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-extrabold text-sm shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2"
                >
                  <Zap size={16} /> Dùng ngay mã này
                </button>
              </div>
            )}
          </article>

          {/* Aside / Related Promotions (4 cols) */}
          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-extrabold text-slate-900 text-base">Ưu đãi nổi bật khác</h3>
                <Link to="/promotions" className="text-xs font-bold text-teal-600 hover:text-teal-700">
                  Xem tất cả
                </Link>
              </div>

              <div className="space-y-4">
                {relatedPromotions.map((item) => (
                  <Link
                    key={item.id}
                    to={`/promotions/${item.slug || item.id}`}
                    className="group block rounded-2xl border border-slate-200/80 hover:border-teal-300 p-3 hover:shadow-md transition bg-white"
                  >
                    <div className="aspect-[16/9] rounded-xl overflow-hidden mb-3 bg-slate-900">
                      <img
                        src={item.bannerUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          ;(e.currentTarget as HTMLImageElement).src = "/promo/carousel-dong-gia-online.png"
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>HSD: {new Date(item.endDate).toLocaleDateString("vi-VN")}</span>
                        <span className="font-mono font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">
                          {item.code}
                        </span>
                      </div>
                      <h4 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-teal-600 transition">
                        {item.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-1">{item.description}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Helper Box */}
            <div className="bg-gradient-to-br from-teal-600 to-sky-700 text-white rounded-3xl p-6 shadow-md space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                <Ticket size={20} />
              </div>
              <h4 className="font-extrabold text-base">Bạn cần trợ giúp áp dụng mã?</h4>
              <p className="text-xs text-teal-100 leading-relaxed">
                Khi bấm <strong>Dùng ngay</strong>, voucher sẽ được ghi nhớ tạm thời trên trình duyệt của bạn và tự động điền tại bước Thanh toán vé xem phim.
              </p>
              <button
                type="button"
                onClick={() => navigate("/movies")}
                className="w-full py-2.5 rounded-xl bg-white text-teal-900 font-extrabold text-xs shadow-sm hover:bg-teal-50 transition"
              >
                Khám phá phim đang chiếu
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}
