import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  X,
  Calendar,
  Ticket,
  Copy,
  Check,
  Zap,
  Clock,
  ShieldCheck,
  MapPin,
  HelpCircle,
  Film,
  Sparkles,
  AlertCircle,
  ExternalLink,
} from "lucide-react"
import { Promotion } from "../types/promotion"
import { useToast } from "./Toast"
import { saveSelectedVoucher } from "../services/promotion.service"

interface PromotionDetailModalProps {
  promotion: Promotion | null
  onClose: () => void
}

export const PromotionDetailModal: React.FC<PromotionDetailModalProps> = ({
  promotion,
  onClose,
}) => {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [copied, setCopied] = useState(false)

  if (!promotion) return null

  const isExpired = promotion.status === "EXPIRED"

  const handleCopyCode = async () => {
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
      showToast(`Mã ưu đãi của bạn: ${promotion.code}`, "info")
    }
  }

  const handleUseNow = () => {
    if (isExpired) return
    saveSelectedVoucher(promotion)
    showToast(
      `Đã lưu mã ${promotion.code}! Mã sẽ tự động được áp dụng khi bạn thanh toán.`,
      "info",
      "Voucher đã được kích hoạt"
    )
    onClose()
    navigate("/movies")
  }

  const discountFormatted =
    promotion.discountType === "PERCENTAGE"
      ? `Giảm ${promotion.discountValue}%`
      : `Giảm ${promotion.discountValue.toLocaleString("vi-VN")}đ`

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col text-slate-800"
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-modal-title"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-slate-700 shadow-md flex items-center justify-center transition hover:scale-105"
          aria-label="Đóng cửa sổ"
        >
          <X size={20} />
        </button>

        {/* Header Banner */}
        <div className="relative aspect-[21/9] sm:aspect-[2.4/1] w-full bg-slate-900 shrink-0 overflow-hidden">
          <img
            src={promotion.bannerUrl}
            alt={promotion.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).src = "/promo/carousel-dong-gia-online.png"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30" />

          {/* Badge & Date overlay */}
          <div className="absolute bottom-4 left-6 right-6 flex flex-wrap items-end justify-between gap-3 text-white">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {promotion.badge === "HOT" && (
                  <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500 text-white shadow-md flex items-center gap-1">
                    <Zap size={13} className="fill-current" /> Hot
                  </span>
                )}
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-md text-white border border-white/20">
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
              <h2 id="promo-modal-title" className="text-xl sm:text-2xl font-extrabold text-white leading-tight drop-shadow-md">
                {promotion.title}
              </h2>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Validity Time Bar */}
          <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-600 font-medium bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <Calendar size={18} className="text-teal-600 shrink-0" />
            <span>
              Thời gian áp dụng:{" "}
              <strong className="text-slate-900 font-bold">
                {new Date(promotion.startDate).toLocaleDateString("vi-VN")} - {new Date(promotion.endDate).toLocaleDateString("vi-VN")}
              </strong>
            </span>
          </div>

          {/* Voucher Action Box (Coupon stub format) */}
          <div className="relative rounded-3xl border-2 border-dashed border-teal-400 bg-gradient-to-br from-teal-50/80 via-emerald-50/50 to-white p-6 shadow-sm overflow-hidden">
            {/* Cutout circles on sides for realistic coupon look */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-r-2 border-dashed border-teal-400" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border-l-2 border-dashed border-teal-400" />

            <div className="flex flex-col md:flex-row items-center justify-between gap-5 px-3">
              <div className="text-center md:text-left space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest text-teal-700">
                  <Ticket size={15} /> Mã ưu đãi đặc biệt
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <span className="font-mono font-black text-2xl sm:text-3xl tracking-widest text-teal-900">
                    {promotion.code}
                  </span>
                  <span className="px-3 py-1 rounded-xl text-xs font-black bg-teal-600 text-white shadow-sm">
                    {discountFormatted}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  {promotion.minOrderValue
                    ? `Đơn tối thiểu ${promotion.minOrderValue.toLocaleString("vi-VN")}đ`
                    : "Không giới hạn giá trị đơn hàng"}
                  {promotion.maxDiscount
                    ? ` · Giảm tối đa ${promotion.maxDiscount.toLocaleString("vi-VN")}đ`
                    : ""}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  type="button"
                  disabled={isExpired}
                  onClick={handleCopyCode}
                  className={`flex-1 md:flex-initial py-3 px-5 rounded-2xl font-bold text-xs sm:text-sm border transition-all flex items-center justify-center gap-2 shadow-sm ${
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
                      <Copy size={16} /> {isExpired ? "Đã hết hạn" : "Sao chép mã"}
                    </>
                  )}
                </button>

                {!isExpired && (
                  <button
                    type="button"
                    onClick={handleUseNow}
                    className="flex-1 md:flex-initial py-3 px-6 rounded-2xl font-extrabold text-xs sm:text-sm bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:scale-95 text-white shadow-md shadow-teal-600/30 transition flex items-center justify-center gap-2"
                  >
                    <Zap size={16} /> Dùng ngay
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Section: Giới thiệu chương trình */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-teal-600" /> Giới thiệu chương trình
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50/60 p-4 rounded-2xl border border-slate-100">
              {promotion.details.introduction}
            </p>
          </div>

          {/* Section: Đối tượng & Khung giờ áp dụng */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <ShieldCheck size={16} className="text-teal-600" /> Đối tượng áp dụng
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {promotion.details.eligibleAudience}
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5">
                <Clock size={16} className="text-teal-600" /> Khung giờ & Thời gian
              </h4>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {promotion.details.validTime}
              </p>
            </div>
          </div>

          {/* Section: Danh sách rạp áp dụng */}
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin size={18} className="text-teal-600" /> Danh sách rạp áp dụng
            </h3>
            <div className="flex flex-wrap gap-2">
              {promotion.details.applicableCinemas.map((cinema, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                >
                  {cinema}
                </span>
              ))}
            </div>
          </div>

          {/* Section: Điều kiện & Thể lệ */}
          <div className="space-y-2.5">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <AlertCircle size={18} className="text-teal-600" /> Điều kiện & Thể lệ áp dụng
            </h3>
            <ul className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-100">
              {promotion.details.termsAndConditions.map((term, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 mt-2 shrink-0" />
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section: Hướng dẫn các bước áp dụng khi thanh toán */}
          <div className="space-y-3">
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <HelpCircle size={18} className="text-teal-600" /> Hướng dẫn áp dụng khi đặt vé
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {promotion.details.usageSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-teal-100 bg-teal-50/40 text-xs sm:text-sm text-slate-700 leading-relaxed"
                >
                  {step}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 rounded-b-3xl flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl border border-slate-300 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm transition"
          >
            Đóng
          </button>

          {!isExpired && (
            <button
              type="button"
              onClick={handleUseNow}
              className="py-2.5 px-6 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md transition flex items-center gap-2"
            >
              <Zap size={16} /> Áp dụng và Đặt vé ngay
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
