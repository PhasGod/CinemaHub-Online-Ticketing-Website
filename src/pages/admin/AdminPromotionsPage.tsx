import React, { useState, useEffect, useCallback } from "react"
import {
  Tag,
  Plus,
  Search,
  Filter,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Trash2,
  X,
  Layers,
} from "lucide-react"
import {
  AdminPromotion,
  AdminPromotionPagination,
  adminGetPromotions,
  adminCreatePromotion,
  adminUpdatePromotion,
  adminTogglePromotionStatus,
  adminDeletePromotion,
} from "../../services/adminPromotion.service"
import { PromotionTable } from "../../components/admin/PromotionTable"
import { PromotionFormModal } from "../../components/admin/PromotionFormModal"
import { useToast } from "../../components/Toast"

export default function AdminPromotionsPage() {
  const { showToast } = useToast()

  const [promotions, setPromotions] = useState<AdminPromotion[]>([])
  const [pagination, setPagination] = useState<AdminPromotionPagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  })
  const [isLoading, setIsLoading] = useState(true)

  // Filters state
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("ALL")
  const [categoryFilter, setCategoryFilter] = useState("ALL")
  const [currentPage, setCurrentPage] = useState(1)

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<AdminPromotion | null>(null)
  const [deletingPromotion, setDeletingPromotion] = useState<AdminPromotion | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await adminGetPromotions({
        search: searchQuery,
        status: statusFilter,
        category: categoryFilter,
        page: currentPage,
        limit: 10,
      })
      setPromotions(res.promotions)
      setPagination(res.pagination)
    } catch (err: any) {
      showToast(err.message || "Không thể tải danh sách khuyến mãi", "error")
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, categoryFilter, currentPage, showToast])

  useEffect(() => {
    loadData()
  }, [loadData])

  // KPI Counts (derived from current view or global stats)
  const totalCount = pagination.total
  const activeCount = promotions.filter((p) => p.isActive && p.status === "ACTIVE").length
  const inactiveCount = promotions.filter((p) => !p.isActive).length
  const expiredCount = promotions.filter(
    (p) => p.status === "EXPIRED" || (p.usageLimit > 0 && p.usedCount >= p.usageLimit)
  ).length

  // Quick Toggle Status
  const handleToggleStatus = async (promo: AdminPromotion) => {
    try {
      const res = await adminTogglePromotionStatus(promo.id)
      showToast(res.message, "success")
      loadData()
    } catch (err: any) {
      showToast(err.message || "Không thể thay đổi trạng thái", "error")
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (promo: AdminPromotion) => {
    setEditingPromotion(promo)
    setIsFormModalOpen(true)
  }

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingPromotion(null)
    setIsFormModalOpen(true)
  }

  // Submit Add or Edit
  const handleFormSubmit = async (data: Partial<AdminPromotion>) => {
    if (editingPromotion) {
      const res = await adminUpdatePromotion(editingPromotion.id, data)
      showToast(res.message, "success")
    } else {
      const res = await adminCreatePromotion(data)
      showToast(res.message, "success")
    }
    loadData()
  }

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingPromotion) return
    setIsDeleting(true)
    try {
      const res = await adminDeletePromotion(deletingPromotion.id)
      showToast(res.message, "success")
      setDeletingPromotion(null)
      loadData()
    } catch (err: any) {
      showToast(err.message || "Xóa khuyến mãi thất bại", "error")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200/60 text-teal-600 flex items-center justify-center shrink-0">
            <Tag size={24} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Quản lý Khuyến mãi & Voucher
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Toàn quyền Thêm, Sửa, Xóa và Tạm ngưng các mã voucher giảm giá vé và combo bắp nước
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-teal-600/20 transition shrink-0"
        >
          <Plus size={18} />
          <span>Thêm chương trình mới</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tổng chương trình</span>
            <Layers size={18} className="text-teal-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{totalCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Đã cấu hình trong hệ thống</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Đang chạy</span>
            <CheckCircle2 size={18} className="text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-600">{activeCount}</p>
          <p className="text-[11px] text-emerald-700/80 mt-1">Khách hàng có thể áp dụng</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Tạm ngưng</span>
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <p className="text-2xl font-black text-amber-600">{inactiveCount}</p>
          <p className="text-[11px] text-amber-700/80 mt-1">Đang tắt bởi Admin</p>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Hết hạn / Hết lượt</span>
            <Clock size={18} className="text-rose-500" />
          </div>
          <p className="text-2xl font-black text-rose-600">{expiredCount}</p>
          <p className="text-[11px] text-rose-700/80 mt-1">Đã đạt giới hạn hoặc quá hạn</p>
        </div>
      </div>

      {/* Toolbar: Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Ô tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              placeholder="Tìm theo Mã voucher hoặc Tên chương trình..."
              className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
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

          {/* Bộ lọc trạng thái & danh mục */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Lọc trạng thái */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang diễn ra (Active)</option>
              <option value="UPCOMING">Sắp diễn ra (Upcoming)</option>
              <option value="EXPIRED">Đã kết thúc / Hết lượt</option>
              <option value="INACTIVE">Đang tạm ngưng</option>
            </select>

            {/* Lọc danh mục */}
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setCurrentPage(1)
              }}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition"
            >
              <option value="ALL">Tất cả danh mục</option>
              <option value="TICKET">Giảm giá Vé</option>
              <option value="FNB">Giảm giá Bắp nước (F&B)</option>
              <option value="MEMBER">Đặc quyền Thành viên</option>
            </select>

            {/* Nút Refresh */}
            <button
              onClick={loadData}
              title="Làm mới dữ liệu"
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
            >
              <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Main DataTable */}
      <PromotionTable
        promotions={promotions}
        isLoading={isLoading}
        onEdit={handleOpenEdit}
        onDelete={(promo) => setDeletingPromotion(promo)}
        onToggleStatus={handleToggleStatus}
      />

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-2xl border border-slate-200 text-xs text-slate-600">
          <span>
            Hiển thị trang <strong>{pagination.page}</strong> trên <strong>{pagination.totalPages}</strong> (Tổng cộng {pagination.total} khuyến mãi)
          </span>

          <div className="flex items-center gap-1.5">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                className={`w-8 h-8 rounded-lg font-bold transition text-xs ${
                  currentPage === num
                    ? "bg-teal-600 text-white shadow-sm"
                    : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {num}
              </button>
            ))}

            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setCurrentPage((p) => Math.min(pagination.totalPages, p + 1))}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      <PromotionFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingPromotion}
      />

      {/* Delete Confirmation Modal */}
      {deletingPromotion && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
              <Trash2 size={24} />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">Xác nhận xóa khuyến mãi</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Bạn có chắc chắn muốn xóa chương trình khuyến mãi{" "}
                <strong className="text-slate-800">"{deletingPromotion.title}"</strong> (Mã:{" "}
                <strong className="font-mono text-rose-600">{deletingPromotion.code}</strong>)?
              </p>
              <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-xl border border-amber-200 text-left">
                ⚠️ Hành động này sẽ gỡ bỏ hoàn toàn mã ưu đãi khỏi hệ thống và khách hàng sẽ không thể sử dụng mã này được nữa.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeletingPromotion(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-100 transition"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs sm:text-sm shadow-md transition"
              >
                {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
