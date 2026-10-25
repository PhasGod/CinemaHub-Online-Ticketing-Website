import React, { useState, useEffect } from "react"
import {
  X,
  Tag,
  Percent,
  Calendar,
  DollarSign,
  Layers,
  Image as ImageIcon,
  FileText,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react"
import { AdminPromotion } from "../../services/adminPromotion.service"

interface PromotionFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: Partial<AdminPromotion>) => Promise<void>
  initialData?: AdminPromotion | null
}

const PRESET_BANNERS = [
  { label: "Combo Hot", url: "/promo/carousel-combo-hot.png" },
  { label: "Đồng Giá Online", url: "/promo/carousel-dong-gia-online.png" },
  { label: "Combo Bắp Nước 20K", url: "/promo/member-combo-20k-detail.png" },
  { label: "Flex Deal 23K", url: "/promo/carousel-flex-deal.png" },
  { label: "Học Sinh Sinh Viên", url: "/promo/student-gift.png" },
  { label: "Thành Viên VIP", url: "/promo/vip-member.png" },
  { label: "Bắp Nước Cực To", url: "/promo/carousel-bap-nuoc-cuc-to.png" },
]

export const PromotionFormModal: React.FC<PromotionFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}) => {
  const isEditing = Boolean(initialData)

  const [title, setTitle] = useState("")
  const [code, setCode] = useState("")
  const [bannerUrl, setBannerUrl] = useState("/promo/carousel-combo-hot.png")
  const [category, setCategory] = useState<"ALL" | "TICKET" | "FNB" | "MEMBER">("ALL")
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED_AMOUNT">("FIXED_AMOUNT")
  const [discountValue, setDiscountValue] = useState<number | string>(30000)
  const [maxDiscount, setMaxDiscount] = useState<number | string>("")
  const [minOrderValue, setMinOrderValue] = useState<number | string>(0)
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [usageLimit, setUsageLimit] = useState<number | string>(100)
  const [description, setDescription] = useState("")
  const [termsText, setTermsText] = useState("")
  const [eligibleAudience, setEligibleAudience] = useState("")

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  // Load initialData when modal opens or changes
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "")
      setCode(initialData.code || "")
      setBannerUrl(initialData.bannerUrl || "/promo/carousel-combo-hot.png")
      setCategory(initialData.category || "ALL")
      setDiscountType(initialData.discountType || "FIXED_AMOUNT")
      setDiscountValue(initialData.discountValue || 0)
      setMaxDiscount(initialData.maxDiscount || "")
      setMinOrderValue(initialData.minOrderValue || 0)
      setStartDate(initialData.startDate || "")
      setEndDate(initialData.endDate || "")
      setUsageLimit(initialData.usageLimit || 0)
      setDescription(initialData.description || "")
      setTermsText(
        initialData.details?.termsAndConditions?.join("\n") ||
          "Áp dụng cho mọi suất chiếu tiêu chuẩn.\nKhông áp dụng đồng thời với ưu đãi khác."
      )
      setEligibleAudience(initialData.details?.eligibleAudience || "Tất cả khách hàng CinemaHub.")
    } else {
      const today = new Date().toISOString().split("T")[0]
      const nextMonth = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
      setTitle("")
      setCode("")
      setBannerUrl("/promo/carousel-combo-hot.png")
      setCategory("ALL")
      setDiscountType("FIXED_AMOUNT")
      setDiscountValue(30000)
      setMaxDiscount("")
      setMinOrderValue(0)
      setStartDate(today)
      setEndDate(nextMonth)
      setUsageLimit(100)
      setDescription("")
      setTermsText("Áp dụng cho mọi suất chiếu tiêu chuẩn.\nKhông áp dụng đồng thời với ưu đãi khác.")
      setEligibleAudience("Tất cả khách hàng mua vé trực tuyến.")
    }
    setError("")
  }, [initialData, isOpen])

  if (!isOpen) return null

  // Handle Code Change: Auto uppercase, no spaces, no special characters
  const handleCodeChange = (val: string) => {
    const cleaned = val
      .toUpperCase()
      .replace(/\s+/g, "")
      .replace(/[^A-Z0-9_]/g, "")
    setCode(cleaned)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề chương trình")
      return
    }

    if (!code.trim()) {
      setError("Vui lòng nhập mã voucher")
      return
    }

    const valNum = Number(discountValue)
    if (isNaN(valNum) || valNum <= 0) {
      setError("Giá trị giảm giá phải lớn hơn 0")
      return
    }

    if (discountType === "PERCENTAGE" && valNum > 100) {
      setError("Giảm giá theo phần trăm không được vượt quá 100%")
      return
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setError("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu")
      return
    }

    const terms = termsText
      .split("\n")
      .map((t) => t.trim())
      .filter(Boolean)

    const payload: Partial<AdminPromotion> = {
      title: title.trim(),
      code: code.trim(),
      bannerUrl: bannerUrl.trim() || "/promo/carousel-combo-hot.png",
      category,
      discountType,
      discountValue: valNum,
      maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
      minOrderValue: Number(minOrderValue) || 0,
      startDate,
      endDate,
      usageLimit: Number(usageLimit) || 0,
      description: description.trim(),
      details: {
        introduction: description.trim() || title.trim(),
        eligibleAudience: eligibleAudience.trim() || "Tất cả khách hàng CinemaHub",
        validTime: `Áp dụng từ ${startDate} đến ${endDate}`,
        applicableCinemas: ["Toàn bộ cụm rạp CinemaHub trên toàn quốc"],
        termsAndConditions: terms.length > 0 ? terms : ["Áp dụng theo quy định của CinemaHub."],
        usageSteps: [
          "Chọn phim và ghế mong muốn.",
          `Tại bước Thanh toán, áp dụng mã ${code.trim()}.`,
          "Kiểm tra số tiền giảm và thanh toán.",
        ],
      },
    }

    setIsSubmitting(true)
    try {
      await onSubmit(payload)
      onClose()
    } catch (err: any) {
      setError(err.message || "Có lỗi xảy ra khi lưu khuyến mãi")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div
        className="relative bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 flex flex-col text-slate-800"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Tag size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {isEditing ? "Cập nhật chương trình khuyến mãi" : "Thêm mới chương trình khuyến mãi"}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? `Đang chỉnh sửa mã: ${initialData?.code}` : "Tạo mã voucher mới cho khách hàng áp dụng khi đặt vé"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* NHÓM 1: THÔNG TIN CHUNG */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FileText size={15} className="text-teal-600" /> Thông tin cơ bản
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tiêu đề chương trình <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Thứ 4 Vui Vẻ - Đồng giá 50k Toàn Quốc"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Mã Voucher (Code) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="CINEMA50K"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 font-mono font-bold text-sm tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Tự động viết hoa, không dấu, không khoảng trắng</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Danh mục áp dụng
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                >
                  <option value="ALL">Toàn bộ đơn hàng (Tất cả)</option>
                  <option value="TICKET">Chỉ áp dụng Vé xem phim</option>
                  <option value="FNB">Chỉ áp dụng Bắp nước (F&B)</option>
                  <option value="MEMBER">Đặc quyền Thành viên</option>
                </select>
              </div>
            </div>

            {/* Banner Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                <span>Ảnh bìa Banner</span>
                <span className="text-[11px] text-slate-400 font-normal">Chọn ảnh mẫu có sẵn hoặc nhập link</span>
              </label>
              <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
                {PRESET_BANNERS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setBannerUrl(preset.url)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold shrink-0 border transition ${
                      bannerUrl === preset.url
                        ? "bg-teal-50 border-teal-500 text-teal-800"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                placeholder="/promo/carousel-combo-hot.png hoặc https://..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* NHÓM 2: CẤU HÌNH GIẢM GIÁ */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <DollarSign size={15} className="text-teal-600" /> Cấu hình giảm giá
            </h3>

            {/* Loại giảm giá */}
            <div className="grid grid-cols-2 gap-3">
              <label
                onClick={() => setDiscountType("FIXED_AMOUNT")}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  discountType === "FIXED_AMOUNT"
                    ? "bg-teal-50/70 border-teal-500 text-teal-900 ring-1 ring-teal-500"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="discountType"
                  checked={discountType === "FIXED_AMOUNT"}
                  onChange={() => setDiscountType("FIXED_AMOUNT")}
                  className="sr-only"
                />
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-teal-600">
                  {discountType === "FIXED_AMOUNT" && <div className="w-2 h-2 rounded-full bg-teal-600" />}
                </div>
                <div>
                  <p className="text-xs font-bold">Số tiền cố định (VNĐ)</p>
                  <p className="text-[11px] text-slate-400">Ví dụ: Giảm 30.000 ₫</p>
                </div>
              </label>

              <label
                onClick={() => setDiscountType("PERCENTAGE")}
                className={`flex items-center gap-3 p-3.5 rounded-2xl border cursor-pointer transition ${
                  discountType === "PERCENTAGE"
                    ? "bg-teal-50/70 border-teal-500 text-teal-900 ring-1 ring-teal-500"
                    : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <input
                  type="radio"
                  name="discountType"
                  checked={discountType === "PERCENTAGE"}
                  onChange={() => setDiscountType("PERCENTAGE")}
                  className="sr-only"
                />
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center border-teal-600">
                  {discountType === "PERCENTAGE" && <div className="w-2 h-2 rounded-full bg-teal-600" />}
                </div>
                <div>
                  <p className="text-xs font-bold">Phần trăm (%)</p>
                  <p className="text-[11px] text-slate-400">Ví dụ: Giảm 20%</p>
                </div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Giá trị giảm <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    required
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === "PERCENTAGE" ? "20" : "30000"}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    {discountType === "PERCENTAGE" ? "%" : "₫"}
                  </span>
                </div>
              </div>

              {discountType === "PERCENTAGE" && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                    placeholder="Ví dụ: 50000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Đơn hàng tối thiểu (VNĐ)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrderValue}
                  onChange={(e) => setMinOrderValue(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* NHÓM 3: THỜI GIAN & GIỚI HẠN */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Calendar size={15} className="text-teal-600" /> Thời gian & Giới hạn
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ngày bắt đầu
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Ngày kết thúc
                </label>
                <input
                  type="date"
                  required
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Lượt dùng tối đa (0 = Vô hạn)
                </label>
                <input
                  type="number"
                  min="0"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
              </div>
            </div>
          </div>

          {/* NHÓM 4: NỘI DUNG & THỂ LỆ */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-800 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <Layers size={15} className="text-teal-600" /> Nội dung & Thể lệ áp dụng
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mô tả ngắn chương trình
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ví dụ: Giảm ngay 20.000đ khi đặt trước combo bắp nước online qua ứng dụng hoặc website CinemaHub."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Đối tượng khách hàng áp dụng
              </label>
              <input
                type="text"
                value={eligibleAudience}
                onChange={(e) => setEligibleAudience(e.target.value)}
                placeholder="Ví dụ: Tất cả thành viên CinemaHub, Học sinh sinh viên..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Điều kiện & Thể lệ chi tiết (mỗi điều kiện 1 dòng)
              </label>
              <textarea
                rows={3}
                value={termsText}
                onChange={(e) => setTermsText(e.target.value)}
                placeholder="Áp dụng cho mọi suất chiếu tiêu chuẩn.&#10;Mỗi khách hàng được áp dụng 01 lần.&#10;Không quy đổi thành tiền mặt."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-sans focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-100 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Đang lưu...
                </>
              ) : (
                <>
                  <Check size={16} /> {isEditing ? "Cập nhật khuyến mãi" : "Lưu chương trình"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
