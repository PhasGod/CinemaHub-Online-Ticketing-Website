import React, { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import {
  Ticket,
  Search,
  Sparkles,
  Filter,
  CheckCircle2,
  X,
  Zap,
  ArrowRight,
  SlidersHorizontal,
} from "lucide-react"
import { Promotion, PromotionCategory, PromotionStatus } from "../types/promotion"
import { getPromotions, getSelectedVoucher, clearSelectedVoucher, StoredVoucher } from "../services/promotion.service"
import { PromotionCard } from "../components/PromotionCard"
import { PromotionDetailModal } from "../components/PromotionDetailModal"
import { useToast } from "../components/Toast"

export default function PromotionsPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState<PromotionCategory>("ALL")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE">("ALL")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null)
  const [activeStoredVoucher, setActiveStoredVoucher] = useState<StoredVoucher | null>(null)

  // Tải danh sách ưu đãi
  useEffect(() => {
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

    // Kiểm tra voucher lưu trong sessionStorage
    setActiveStoredVoucher(getSelectedVoucher())

    return () => {
      active = false
    }
  }, [])

  // Xóa voucher đang lưu
  const handleClearStoredVoucher = () => {
    clearSelectedVoucher()
    setActiveStoredVoucher(null)
    showToast("Đã bỏ lưu mã khuyến mãi", "info")
  }

  // Danh mục tabs
  const categories: Array<{ id: PromotionCategory; label: string }> = [
    { id: "ALL", label: "Tất cả" },
    { id: "TICKET", label: "Ưu đãi Vé" },
    { id: "FNB", label: "Ưu đãi Bắp nước" },
    { id: "MEMBER", label: "Thành viên" },
  ]

  // Filter promotions
  const filteredPromotions = useMemo(() => {
    return promotions.filter((promo) => {
      // Filter Category
      if (activeCategory !== "ALL" && promo.category !== activeCategory) {
        return false
      }
      // Filter Status
      if (statusFilter === "ACTIVE" && promo.status !== "ACTIVE") {
        return false
      }
      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = promo.title.toLowerCase().includes(q)
        const matchCode = promo.code.toLowerCase().includes(q)
        const matchDesc = promo.description.toLowerCase().includes(q)
        if (!matchTitle && !matchCode && !matchDesc) {
          return false
        }
      }
      return true
    })
  }, [promotions, activeCategory, statusFilter, searchQuery])

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Active Stored Voucher Banner (nếu đã lưu từ trước) */}
        {activeStoredVoucher && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-teal-500/10 border border-teal-200 flex flex-wrap items-center justify-between gap-3 text-sm animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0">
                <Ticket size={18} />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-xs sm:text-sm">
                  Bạn đang có mã ưu đãi <span className="font-mono text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">{activeStoredVoucher.code}</span> sẵn sàng trong phiên!
                </p>
                <p className="text-xs text-slate-500">Mã này sẽ tự động được điền và áp dụng ngay khi bạn thanh toán vé.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/movies")}
                className="py-1.5 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1"
              >
                <span>Đặt vé ngay</span>
                <ArrowRight size={14} />
              </button>
              <button
                onClick={handleClearStoredVoucher}
                className="p-1.5 rounded-xl hover:bg-slate-200/80 text-slate-400 hover:text-slate-600 transition"
                title="Bỏ chọn mã này"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        {/* Hero Banner Header */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-teal-900 via-slate-900 to-sky-950 text-white p-8 sm:p-12 shadow-xl border border-teal-900/50">
          <div className="absolute -right-10 -bottom-10 opacity-10 pointer-events-none">
            <Ticket size={280} />
          </div>

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold tracking-wider uppercase backdrop-blur-sm border border-teal-500/30">
              <Sparkles size={14} />
              <span>Khuyến mãi đặc quyền 2026</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Thêm niềm vui, <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-sky-300">
                nhẹ ví hơn cùng CinemaHub.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Khám phá danh sách các chương trình ưu đãi độc quyền, săn mã voucher giảm giá vé và combo bắp nước để trải nghiệm điện ảnh đỉnh cao mỗi ngày.
            </p>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Category Tabs */}
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {categories.map((cat) => {
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`py-2 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all shrink-0 ${
                      isActive
                        ? "bg-teal-600 text-white shadow-md shadow-teal-600/20"
                        : "bg-slate-100 hover:bg-slate-200/70 text-slate-600"
                    }`}
                  >
                    {cat.label}
                  </button>
                )
              })}
            </div>

            {/* Search Input & Status Filter */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Search box */}
              <div className="relative flex-1 sm:w-64">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã hoặc chương trình..."
                  className="w-full pl-9 pr-8 py-2 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl text-xs font-bold shrink-0">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`py-1.5 px-3 rounded-xl transition ${
                    statusFilter === "ALL"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Tất cả
                </button>
                <button
                  onClick={() => setStatusFilter("ACTIVE")}
                  className={`py-1.5 px-3 rounded-xl transition ${
                    statusFilter === "ACTIVE"
                      ? "bg-teal-600 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Đang diễn ra
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Promotions Grid */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-500">
            <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium">Đang tải danh sách ưu đãi...</p>
          </div>
        ) : filteredPromotions.length === 0 ? (
          <div className="py-16 px-4 bg-white rounded-3xl border border-slate-200/80 text-center max-w-md mx-auto space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Ticket size={28} />
            </div>
            <h3 className="font-bold text-slate-800 text-base">Không tìm thấy khuyến mãi phù hợp</h3>
            <p className="text-xs text-slate-500">
              Hãy thử thay đổi danh mục hoặc từ khóa tìm kiếm để khám phá các ưu đãi khác.
            </p>
            <button
              onClick={() => {
                setActiveCategory("ALL")
                setStatusFilter("ALL")
                setSearchQuery("")
              }}
              className="py-2 px-4 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 transition"
            >
              Xem tất cả khuyến mãi
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {filteredPromotions.map((promo) => (
              <PromotionCard
                key={promo.id}
                promotion={promo}
                onViewDetail={(item) => setSelectedPromotion(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Promotion Detail Modal */}
      {selectedPromotion && (
        <PromotionDetailModal
          promotion={selectedPromotion}
          onClose={() => setSelectedPromotion(null)}
        />
      )}
    </main>
  )
}
