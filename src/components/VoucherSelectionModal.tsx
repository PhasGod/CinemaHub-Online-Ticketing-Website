import React, { useState, useEffect } from "react"
import {
  X,
  Ticket,
  Sparkles,
  Tag,
  ShoppingBag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
} from "lucide-react"
import { Promotion, PromotionCategory } from "../types/promotion"
import { getPromotions } from "../services/promotion.service"

interface VoucherSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyVoucher: (promo: Promotion) => void
  currentVoucherCode?: string
  orderAmount: number
  comboTotal?: number
  ticketTotal?: number
}

export const VoucherSelectionModal: React.FC<VoucherSelectionModalProps> = ({
  isOpen,
  onClose,
  onApplyVoucher,
  currentVoucherCode,
  orderAmount,
  comboTotal = 0,
}) => {
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeCategory, setActiveCategory] = useState<PromotionCategory>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (!isOpen) return

    let active = true
    setIsLoading(true)

    getPromotions()
      .then((data) => {
        if (active) {
          setPromotions(data)
          setIsLoading(false)
        }
      })
      .catch(() => {
        if (active) setIsLoading(false)
      })

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      active = false
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  // Lọc theo danh mục & tìm kiếm
  const filteredPromotions = promotions.filter((promo) => {
    if (activeCategory !== "ALL" && promo.category !== activeCategory) {
      return false
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchTitle = promo.title.toLowerCase().includes(q)
      const matchCode = promo.code.toLowerCase().includes(q)
      const matchDesc = promo.description.toLowerCase().includes(q)
      if (!matchTitle && !matchCode && !matchDesc) return false
    }
    return true
  })

  // Định dạng ngày hiển thị (VD: 31/12/2026)
  const formatDate = (dateStr: string) => {
    if (!dateStr) return "31/12/2026"
    try {
      const parts = dateStr.split("-")
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`
      }
      return dateStr
    } catch {
      return dateStr
    }
  }

  // Định dạng mức giảm giá
  const getDiscountLabel = (promo: Promotion) => {
    if (promo.discountType === "PERCENTAGE") {
      return `Giảm ${promo.discountValue}%${
        promo.maxDiscount
          ? ` (tối đa ${promo.maxDiscount.toLocaleString("vi-VN")}đ)`
          : ""
      }`
    }
    return `Giảm ${promo.discountValue.toLocaleString("vi-VN")}đ`
  }

  // Kiểm tra điều kiện áp dụng của từng mã
  const checkEligibility = (promo: Promotion) => {
    if (promo.status === "EXPIRED") {
      return { eligible: false, reason: "Chương trình đã kết thúc" }
    }
    if (promo.status === "UPCOMING") {
      return { eligible: false, reason: "Chương trình chưa bắt đầu" }
    }
    if (promo.category === "FNB" && comboTotal <= 0) {
      return {
        eligible: false,
        reason: "Yêu cầu đơn có combo bắp nước",
      }
    }
    if (promo.minOrderValue && orderAmount < promo.minOrderValue) {
      const missing = promo.minOrderValue - orderAmount
      return {
        eligible: false,
        reason: `Đơn tối thiểu ${promo.minOrderValue.toLocaleString(
          "vi-VN"
        )}đ (còn thiếu ${missing.toLocaleString("vi-VN")}đ)`,
      }
    }
    return { eligible: true, reason: "" }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-modal-title"
    >
      <div
        className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-gray-100 flex flex-col overflow-hidden my-auto max-h-[92vh] sm:max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-teal-50/60 to-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
              <Ticket size={20} />
            </div>
            <div>
              <h2
                id="voucher-modal-title"
                className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2"
              >
                Ưu Đãi & Mã Giảm Giá
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">
                  {promotions.length} mã
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                Chọn mã khuyến mãi để áp dụng trực tiếp vào đơn hàng của bạn
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng popup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thanh tìm kiếm & lọc danh mục */}
        <div className="px-5 py-3 sm:px-6 border-b border-gray-100 bg-gray-50/50 space-y-2.5 shrink-0">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên ưu đãi, mã voucher (VD: CINEMA50K, FNB20...)"
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-400 font-medium text-[11px] flex items-center gap-1 shrink-0">
              <Filter size={11} /> Danh mục:
            </span>
            {(
              [
                { id: "ALL", label: "Tất cả" },
                { id: "TICKET", label: "Vé phim" },
                { id: "FNB", label: "Bắp nước" },
                { id: "MEMBER", label: "Thành viên" },
              ] as Array<{ id: PromotionCategory; label: string }>
            ).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition shrink-0 cursor-pointer ${
                  activeCategory === cat.id
                    ? "bg-teal-600 text-white shadow-xs"
                    : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-100"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Danh sách thẻ Voucher (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3.5 flex-1 min-h-[240px]">
          {isLoading ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500">Đang tải danh sách ưu đãi...</p>
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Tag size={22} />
              </div>
              <p className="text-sm font-bold text-gray-700">
                Không tìm thấy ưu đãi nào phù hợp
              </p>
              <p className="text-xs text-gray-400">
                Hãy thử đổi từ khóa tìm kiếm hoặc chọn danh mục khác.
              </p>
            </div>
          ) : (
            filteredPromotions.map((promo) => {
              const isCurrent =
                Boolean(currentVoucherCode) &&
                promo.code.toUpperCase() === currentVoucherCode?.toUpperCase()
              const { eligible, reason } = checkEligibility(promo)

              return (
                <div
                  key={promo.id || promo.code}
                  className={`relative rounded-2xl border transition-all p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 ${
                    isCurrent
                      ? "border-teal-500 bg-teal-50/40 ring-1 ring-teal-500 shadow-sm"
                      : eligible
                      ? "border-gray-200 bg-white hover:border-teal-300 hover:shadow-md"
                      : "border-gray-200 bg-gray-50/70 opacity-80"
                  }`}
                >
                  {/* Left: Icon / Thumbnail & Info */}
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    {/* Thumbnail hoặc Icon đại diện */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gradient-to-br from-teal-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                      {promo.bannerUrl ? (
                        <img
                          src={promo.bannerUrl}
                          alt={promo.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback sang icon nếu ảnh lỗi
                            e.currentTarget.style.display = "none"
                            if (e.currentTarget.parentElement) {
                              e.currentTarget.parentElement.innerHTML =
                                '<svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"></path></svg>'
                            }
                          }}
                        />
                      ) : promo.category === "FNB" ? (
                        <ShoppingBag size={24} />
                      ) : (
                        <Ticket size={24} />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0 flex-1">
                      {/* Tiêu đề & Badges */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                            promo.category === "FNB"
                              ? "bg-amber-100 text-amber-800"
                              : promo.category === "MEMBER"
                              ? "bg-purple-100 text-purple-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {promo.category === "FNB"
                            ? "Bắp nước"
                            : promo.category === "MEMBER"
                            ? "Thành viên"
                            : "Vé phim"}
                        </span>

                        {promo.badge && (
                          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 flex items-center gap-0.5">
                            <Sparkles size={9} /> {promo.badge}
                          </span>
                        )}

                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-gray-100 text-teal-800 border border-gray-200">
                          {promo.code}
                        </span>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-1">
                        {promo.title}
                      </h3>

                      {/* Mức giảm & mô tả */}
                      <p className="text-[11px] sm:text-xs text-teal-700 font-bold">
                        {getDiscountLabel(promo)}
                      </p>

                      <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                        {promo.description}
                      </p>

                      {/* Hạn sử dụng & Cảnh báo điều kiện */}
                      <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock size={11} className="text-gray-400" /> HSD:{" "}
                          {formatDate(promo.endDate)}
                        </span>

                        {promo.minOrderValue ? (
                          <span>
                            Đơn tối thiểu:{" "}
                            {promo.minOrderValue.toLocaleString("vi-VN")}đ
                          </span>
                        ) : null}

                        {!eligible && reason && (
                          <span className="text-amber-600 font-medium flex items-center gap-0.5 w-full sm:w-auto">
                            <AlertCircle size={11} className="shrink-0" />{" "}
                            {reason}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Nút Áp dụng */}
                  <div className="w-full sm:w-auto flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                    {isCurrent ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-100 text-teal-800 font-bold text-xs">
                        <CheckCircle2 size={14} className="text-teal-600" />
                        Đang áp dụng
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onApplyVoucher(promo)}
                        className={`w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                          eligible
                            ? "bg-teal-600 hover:bg-teal-700 text-white active:scale-95"
                            : "bg-gray-200 hover:bg-amber-100 text-gray-700 hover:text-amber-800"
                        }`}
                      >
                        <Tag size={13} />
                        Áp dụng
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Modal: Ghi chú */}
        <div className="px-5 py-3 sm:px-6 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-500 shrink-0">
          <p className="flex items-center gap-1 text-center sm:text-left">
            💡 Mỗi đơn đặt vé chỉ áp dụng tối đa 1 mã ưu đãi. Số tiền giảm sẽ được trừ trực tiếp vào VietQR/MoMo.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1 rounded-lg hover:bg-gray-200 transition cursor-pointer shrink-0"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default VoucherSelectionModal
