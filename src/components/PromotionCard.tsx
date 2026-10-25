import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { Calendar, Copy, Check, Ticket, ArrowRight, Zap, Clock, ShieldAlert } from "lucide-react"
import { Promotion } from "../types/promotion"
import { useToast } from "./Toast"
import { saveSelectedVoucher } from "../services/promotion.service"

interface PromotionCardProps {
  promotion: Promotion
  onViewDetail?: (promotion: Promotion) => void
}

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onViewDetail }) => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)

  const isExpired = promotion.status === "EXPIRED"
  const isUpcoming = promotion.status === "UPCOMING"

  const handleCopyCode = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isExpired) return

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
      // Fallback
      showToast(`Mã ưu đãi của bạn: ${promotion.code}`, "info")
    }
  }

  const handleUseNow = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isExpired) return

    saveSelectedVoucher(promotion)
    showToast(
      `Đã lưu mã ${promotion.code}! Mã sẽ tự động được áp dụng khi bạn thanh toán.`,
      "info",
      "Voucher đã được kích hoạt"
    )
    navigate("/movies")
  }

  const handleCardClick = () => {
    if (onViewDetail) {
      onViewDetail(promotion)
    } else {
      navigate(`/promotions/${promotion.slug || promotion.id}`)
    }
  }

  // Format discount tag
  const discountLabel =
    promotion.discountType === "PERCENTAGE"
      ? `Giảm ${promotion.discountValue}%`
      : `Giảm ${promotion.discountValue.toLocaleString("vi-VN")}đ`

  return (
    <article
      onClick={handleCardClick}
      className="group bg-white rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-xl hover:border-teal-300 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer relative"
    >
      {/* Banner Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-900">
        <img
          src={promotion.bannerUrl}
          alt={promotion.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            ;(e.currentTarget as HTMLImageElement).src = "/promo/carousel-dong-gia-online.png"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-black/20" />

        {/* Status Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 items-center">
          {promotion.badge === "HOT" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-rose-500 text-white shadow-md">
              <Zap size={12} className="fill-current" /> Hot
            </span>
          )}
          {promotion.badge === "ENDING_SOON" && !isExpired && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500 text-white shadow-md">
              <Clock size={12} /> Sắp kết thúc
            </span>
          )}
          {promotion.status === "ACTIVE" && promotion.badge !== "HOT" && promotion.badge !== "ENDING_SOON" && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-600 text-white shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Đang diễn ra
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-700 text-slate-200 shadow-md">
              <ShieldAlert size={12} /> Đã hết hạn
            </span>
          )}
          {isUpcoming && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-600 text-white shadow-md">
              <Clock size={12} /> Sắp diễn ra
            </span>
          )}
        </div>

        {/* Discount Amount Pill in top right */}
        <div className="absolute top-3 right-3">
          <span className="px-3 py-1 rounded-xl text-xs font-black bg-white/95 text-teal-700 shadow-md backdrop-blur-sm border border-teal-100">
            {discountLabel}
          </span>
        </div>

        {/* Expiry Date on bottom of banner */}
        <div className="absolute bottom-2.5 left-3 text-[11px] font-medium text-slate-200 flex items-center gap-1.5 drop-shadow">
          <Calendar size={13} className="text-teal-400" />
          <span>HSD: {new Date(promotion.endDate).toLocaleDateString("vi-VN")}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-5 flex-1 flex flex-col justify-between gap-4">
        <div>
          <h3 className="font-bold text-slate-900 text-base sm:text-lg line-clamp-2 leading-snug group-hover:text-teal-600 transition-colors">
            {promotion.title}
          </h3>
          <p className="mt-2 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {promotion.description}
          </p>
        </div>

        {/* Voucher Badge Area (Perforated ticket cutout box) */}
        <div
          className={`p-3 rounded-2xl border-2 border-dashed transition-colors flex items-center justify-between gap-3 ${
            isExpired
              ? "bg-slate-100/70 border-slate-300 text-slate-400"
              : "bg-teal-50/60 border-teal-300 text-slate-800 hover:bg-teal-50"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                isExpired ? "bg-slate-200 text-slate-500" : "bg-teal-600 text-white shadow-sm"
              }`}
            >
              <Ticket size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Mã ưu đãi
              </p>
              <p
                className={`font-mono font-extrabold text-sm tracking-wider truncate ${
                  isExpired ? "text-slate-400 line-through" : "text-teal-900"
                }`}
              >
                {promotion.code}
              </p>
            </div>
          </div>

          {/* Copy Button */}
          <button
            type="button"
            disabled={isExpired}
            onClick={handleCopyCode}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              isExpired
                ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                : copied
                ? "bg-emerald-600 text-white shadow-sm"
                : "bg-white hover:bg-teal-600 hover:text-white text-teal-700 border border-teal-200 shadow-sm"
            }`}
          >
            {copied ? (
              <>
                <Check size={14} className="animate-bounce" /> Đã chép
              </>
            ) : (
              <>
                <Copy size={13} /> {isExpired ? "Hết hạn" : "Sao chép mã"}
              </>
            )}
          </button>
        </div>

        {/* Bottom Actions */}
        <div className="pt-2 flex items-center gap-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleCardClick}
            className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-100/80 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1.5"
          >
            <span>Xem chi tiết</span>
            <ArrowRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </button>

          {!isExpired && (
            <button
              type="button"
              onClick={handleUseNow}
              className="py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1"
            >
              <Zap size={14} /> Dùng ngay
            </button>
          )}
        </div>
      </div>
    </article>
  )
}
