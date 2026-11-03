import React, { useState } from "react"
import {
  Copy,
  Check,
  Edit2,
  Trash2,
  Calendar,
  AlertTriangle,
  Zap,
  Tag,
  Clock,
  ShieldAlert,
} from "lucide-react"
import { AdminPromotion } from "../../services/adminPromotion.service"
import { useToast } from "../Toast"

interface PromotionTableProps {
  promotions: AdminPromotion[]
  isLoading: boolean
  onEdit: (promotion: AdminPromotion) => void
  onDelete: (promotion: AdminPromotion) => void
  onToggleStatus: (promotion: AdminPromotion) => void
}

export const PromotionTable: React.FC<PromotionTableProps> = ({
  promotions,
  isLoading,
  onEdit,
  onDelete,
  onToggleStatus,
}) => {
  const { showToast } = useToast()
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const handleCopy = (code: string, e: React.MouseEvent) => {
    e.stopPropagation()
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code)
      showToast(`Đã sao chép mã ${code}`, "success")
      setTimeout(() => setCopiedCode(null), 2000)
    })
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-"
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("vi-VN")
  }

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-2xl border border-slate-200">
        <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-semibold">Đang tải danh sách khuyến mãi...</p>
      </div>
    )
  }

  if (promotions.length === 0) {
    return (
      <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
          <Tag size={24} />
        </div>
        <h4 className="font-bold text-slate-800 text-sm">Không có chương trình khuyến mãi nào</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Chưa có dữ liệu phù hợp với bộ lọc hiện tại. Thử chọn "Tất cả" hoặc tạo thêm chương trình mới.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-600">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Chương trình & Banner</th>
              <th className="py-3.5 px-4">Mã Voucher</th>
              <th className="py-3.5 px-4">Mức giảm & Đơn tối thiểu</th>
              <th className="py-3.5 px-4">Thời gian áp dụng</th>
              <th className="py-3.5 px-4">Lượt dùng</th>
              <th className="py-3.5 px-4 text-center">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Thao tác</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {promotions.map((promo) => {
              const isExpired = promo.status === "EXPIRED" || (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit)
              const isUpcoming = promo.status === "UPCOMING"
              const percentUsed =
                promo.usageLimit > 0
                  ? Math.min(100, Math.round((promo.usedCount / promo.usageLimit) * 100))
                  : 0

              return (
                <tr key={promo.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Cột 1: Banner & Tên chương trình */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-10 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                        <img
                          src={promo.bannerUrl}
                          alt={promo.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            ;(e.currentTarget as HTMLImageElement).src = "/promo/carousel-combo-hot.png"
                          }}
                        />
                      </div>
                      <div className="min-w-0 max-w-xs sm:max-w-sm">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate block">
                            {promo.title}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">{promo.description}</p>
                        <span className="inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {promo.category === "ALL" && "Tất cả đơn"}
                          {promo.category === "TICKET" && "Vé xem phim"}
                          {promo.category === "FNB" && "Bắp nước (F&B)"}
                          {promo.category === "MEMBER" && "Thành viên"}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Cột 2: Mã Voucher (Click to copy) */}
                  <td className="py-3.5 px-4">
                    <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-teal-50 border border-teal-200/80 text-teal-800">
                      <span className="font-mono font-black text-xs sm:text-sm px-2 tracking-wider">
                        {promo.code}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCopy(promo.code, e)}
                        title="Sao chép mã"
                        className="p-1 rounded-lg hover:bg-teal-100 text-teal-700 transition"
                      >
                        {copiedCode === promo.code ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Cột 3: Mức giảm */}
                  <td className="py-3.5 px-4">
                    <div>
                      <span className="font-black text-xs sm:text-sm text-teal-900 block">
                        {promo.discountType === "PERCENTAGE"
                          ? `Giảm ${promo.discountValue}%`
                          : `-${formatPrice(promo.discountValue)}`}
                      </span>
                      {promo.discountType === "PERCENTAGE" && promo.maxDiscount ? (
                        <p className="text-[11px] text-slate-400">
                          Tối đa: {formatPrice(promo.maxDiscount)}
                        </p>
                      ) : null}
                      <p className="text-[11px] text-slate-500 font-medium">
                        {promo.minOrderValue > 0
                          ? `Đơn từ ${formatPrice(promo.minOrderValue)}`
                          : "Không giới hạn tối thiểu"}
                      </p>
                    </div>
                  </td>

                  {/* Cột 4: Thời gian áp dụng */}
                  <td className="py-3.5 px-4">
                    <div className="text-xs text-slate-600 flex flex-col gap-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={13} className="text-slate-400 shrink-0" />
                        {formatDate(promo.startDate)}
                      </span>
                      <span className="text-[11px] text-slate-400 pl-4">đến</span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Clock size={13} className="text-slate-400 shrink-0" />
                        {formatDate(promo.endDate)}
                      </span>
                    </div>
                  </td>

                  {/* Cột 5: Lượt sử dụng (Progress bar) */}
                  <td className="py-3.5 px-4">
                    <div className="w-28 sm:w-32">
                      <div className="flex justify-between items-center text-[11px] font-bold text-slate-700 mb-1">
                        <span>
                          {promo.usedCount}
                          <span className="text-slate-400 font-normal">
                            {" "}/ {promo.usageLimit > 0 ? promo.usageLimit : "∞"}
                          </span>
                        </span>
                        {promo.usageLimit > 0 && (
                          <span className="text-[10px] text-slate-500">{percentUsed}%</span>
                        )}
                      </div>
                      {promo.usageLimit > 0 ? (
                        <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              percentUsed >= 100
                                ? "bg-rose-500"
                                : percentUsed > 75
                                ? "bg-amber-500"
                                : "bg-teal-500"
                            }`}
                            style={{ width: `${percentUsed}%` }}
                          />
                        </div>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-semibold">Vô hạn lượt</span>
                      )}
                    </div>
                  </td>

                  {/* Cột 6: Trạng thái & Toggle Switch */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex flex-col items-center gap-1.5">
                      {/* Trạng thái Badge */}
                      {isExpired ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          Hết hạn
                        </span>
                      ) : !promo.isActive ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Tạm ngưng
                        </span>
                      ) : isUpcoming ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                          Sắp chạy
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Đang chạy
                        </span>
                      )}

                      {/* Quick Toggle Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={promo.isActive}
                        onClick={() => onToggleStatus(promo)}
                        title={promo.isActive ? "Bấm để tạm ngưng" : "Bấm để kích hoạt"}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          promo.isActive ? "bg-teal-600" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            promo.isActive ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </td>

                  {/* Cột 7: Hành động */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(promo)}
                        title="Chỉnh sửa khuyến mãi"
                        className="p-1.5 rounded-xl text-slate-600 hover:text-teal-700 hover:bg-teal-50 transition"
                      >
                        <Edit2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDelete(promo)}
                        title="Xóa khuyến mãi"
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
