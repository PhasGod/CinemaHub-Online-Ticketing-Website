import { apiFetch } from "./api"

export interface AdminPromotion {
  id: string
  title: string
  code: string
  bannerUrl: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number
  maxDiscount?: number
  minOrderValue: number
  startDate: string
  endDate: string
  category: "ALL" | "TICKET" | "FNB" | "MEMBER"
  status: "ACTIVE" | "EXPIRED" | "UPCOMING"
  isActive: boolean
  usedCount: number
  usageLimit: number
  description: string
  details?: {
    introduction?: string
    eligibleAudience?: string
    validTime?: string
    applicableCinemas?: string[]
    termsAndConditions?: string[]
    usageSteps?: string[]
  }
  createdAt?: string
  updatedAt?: string
}

export interface AdminPromotionPagination {
  total: number
  page: number
  limit: number
  totalPages: number
}

// Bộ mock data ban đầu chuẩn bị sẵn
const INITIAL_MOCK_PROMOTIONS: AdminPromotion[] = [
  {
    id: "promo-admin-1",
    title: "Chào Đón Thế Hệ Khán Giả 2026 - Giảm 50K",
    code: "CHAOHETHE2026",
    bannerUrl: "/promo/carousel-combo-hot.png",
    discountType: "FIXED_AMOUNT",
    discountValue: 50000,
    minOrderValue: 100000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    category: "ALL",
    status: "ACTIVE",
    isActive: true,
    usedCount: 86,
    usageLimit: 200,
    description: "Tặng voucher 50.000đ cho đơn hàng từ 100.000đ áp dụng toàn bộ hệ thống rạp CinemaHub trong năm 2026.",
    details: {
      introduction: "Chương trình chào mừng năm mới 2026 dành riêng cho khán giả yêu mến CinemaHub.",
      eligibleAudience: "Tất cả khách hàng thành viên CinemaHub.",
      validTime: "Tất cả các ngày trong tuần trong năm 2026.",
      applicableCinemas: ["Toàn bộ cụm rạp CinemaHub trên toàn quốc"],
      termsAndConditions: [
        "Áp dụng cho đơn hàng từ 100.000đ trở lên.",
        "Mỗi khách hàng được áp dụng 01 lần duy nhất.",
        "Không áp dụng đồng thời với các chương trình khuyến mãi khác.",
      ],
      usageSteps: [
        "Chọn suất chiếu và ghế ngồi.",
        "Nhập mã CHAOHETHE2026 tại bước Thanh toán.",
        "Hệ thống tự động trừ 50.000đ vào tổng thanh toán.",
      ],
    },
    createdAt: "2026-01-01T08:00:00.000Z",
    updatedAt: "2026-01-01T08:00:00.000Z",
  },
  {
    id: "promo-admin-2",
    title: "Bắp Nước Thả Ga - Giảm 20.000đ Combo Online",
    code: "BAPNUOCVUI",
    bannerUrl: "/promo/member-combo-20k-detail.png",
    discountType: "FIXED_AMOUNT",
    discountValue: 20000,
    minOrderValue: 60000,
    startDate: "2026-02-01",
    endDate: "2026-11-30",
    category: "FNB",
    status: "ACTIVE",
    isActive: true,
    usedCount: 142,
    usageLimit: 300,
    description: "Giảm trực tiếp 20.000đ khi đặt trước combo bắp nước qua website hoặc ứng dụng rạp.",
    details: {
      introduction: "Thưởng thức bắp giòn rụm và nước ngọt mát lạnh với mức giá siêu ưu đãi.",
      eligibleAudience: "Khách hàng mua combo bắp nước online.",
      validTime: "Từ 08:00 đến 23:30 hàng ngày đến hết 30/11/2026.",
      applicableCinemas: ["Tất cả quầy Concession CinemaHub"],
      termsAndConditions: ["Áp dụng cho đơn hàng bắp nước từ 60.000đ."],
    },
    createdAt: "2026-02-01T09:00:00.000Z",
    updatedAt: "2026-02-01T09:00:00.000Z",
  },
  {
    id: "promo-admin-3",
    title: "Thứ 4 Vui Vẻ - Đồng Giá Vé 50K Toàn Quốc",
    code: "THU4VANSUTRUYEN",
    bannerUrl: "/promo/carousel-dong-gia-online.png",
    discountType: "FIXED_AMOUNT",
    discountValue: 40000,
    minOrderValue: 90000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    category: "TICKET",
    status: "ACTIVE",
    isActive: true,
    usedCount: 450,
    usageLimit: 500,
    description: "Đồng giá vé xem phim chỉ 50.000đ vào mỗi ngày thứ Tư hàng tuần.",
    details: {
      introduction: "Sự kiện tri ân ngày thứ Tư hàng tuần tại rạp CinemaHub.",
      eligibleAudience: "Mọi khách hàng mua vé qua website hoặc ứng dụng.",
      validTime: "Các ngày Thứ Tư trong tuần.",
      applicableCinemas: ["Toàn bộ rạp CinemaHub"],
      termsAndConditions: ["Áp dụng cho vé 2D tiêu chuẩn.", "Tối đa 4 vé mỗi giao dịch."],
    },
    createdAt: "2026-01-01T08:30:00.000Z",
    updatedAt: "2026-01-01T08:30:00.000Z",
  },
  {
    id: "promo-admin-4",
    title: "Đồng Giá Học Sinh - Sinh Viên 50K (Giảm 25%)",
    code: "STUDENT50K",
    bannerUrl: "/promo/student-gift.png",
    discountType: "PERCENTAGE",
    discountValue: 25,
    maxDiscount: 45000,
    minOrderValue: 80000,
    startDate: "2026-02-15",
    endDate: "2026-12-31",
    category: "TICKET",
    status: "ACTIVE",
    isActive: true,
    usedCount: 65,
    usageLimit: 150,
    description: "Giảm 25% tối đa 45.000đ cho học sinh, sinh viên xuất trình thẻ hợp lệ.",
    details: {
      introduction: "Đồng hành cùng học sinh sinh viên thưởng thức điện ảnh giá sinh viên.",
      eligibleAudience: "Học sinh, sinh viên dưới 23 tuổi.",
      validTime: "Thứ Hai đến Thứ Sáu hàng tuần.",
      applicableCinemas: ["Tất cả cụm rạp CinemaHub"],
      termsAndConditions: ["Xuất trình thẻ HSSV tại cửa soát vé."],
    },
    createdAt: "2026-02-15T10:00:00.000Z",
    updatedAt: "2026-02-15T10:00:00.000Z",
  },
  {
    id: "promo-admin-5",
    title: "Đặc Quyền Hội Viên Cuối Tuần - Giảm 15%",
    code: "WEEKENDVIP",
    bannerUrl: "/promo/vip-member.png",
    discountType: "PERCENTAGE",
    discountValue: 15,
    maxDiscount: 30000,
    minOrderValue: 150000,
    startDate: "2026-03-01",
    endDate: "2026-10-31",
    category: "MEMBER",
    status: "ACTIVE",
    isActive: false, // Tạm ngưng để admin test toggle switch
    usedCount: 28,
    usageLimit: 100,
    description: "Chương trình đặc quyền dành cho thành viên VIP vào Thứ 7 và Chủ Nhật (Đang tạm ngưng).",
    details: {
      introduction: "Ưu đãi cuối tuần bùng nổ cho thành viên thân thiết CinemaHub.",
      eligibleAudience: "Hội viên CinemaHub VIP.",
      validTime: "Thứ Bảy và Chủ Nhật.",
      applicableCinemas: ["Tất cả rạp CinemaHub"],
      termsAndConditions: ["Chỉ áp dụng khi đăng nhập tài khoản VIP."],
    },
    createdAt: "2026-03-01T08:00:00.000Z",
    updatedAt: "2026-03-01T08:00:00.000Z",
  },
  {
    id: "promo-admin-6",
    title: "Flex Deal Giờ Vàng - Giảm 15K Khi Mua Vé",
    code: "FLEXDEAL2026",
    bannerUrl: "/promo/carousel-flex-deal.png",
    discountType: "FIXED_AMOUNT",
    discountValue: 15000,
    minOrderValue: 70000,
    startDate: "2025-09-01",
    endDate: "2025-12-31",
    category: "ALL",
    status: "EXPIRED",
    isActive: false,
    usedCount: 200,
    usageLimit: 200,
    description: "Ưu đãi giờ vàng cuối năm 2025 (Chương trình đã kết thúc thời gian áp dụng).",
    details: {
      introduction: "Chương trình giờ vàng năm 2025 đã kết thúc.",
      eligibleAudience: "Tất cả khách hàng.",
      validTime: "Hết hạn 31/12/2025.",
      applicableCinemas: ["Toàn hệ thống"],
      termsAndConditions: ["Chương trình đã kết thúc."],
    },
    createdAt: "2025-09-01T08:00:00.000Z",
    updatedAt: "2025-12-31T23:59:59.000Z",
  },
]

// Lưu trạng thái in-memory / session fallback
let localAdminPromotions: AdminPromotion[] = [...INITIAL_MOCK_PROMOTIONS]

/**
 * Lấy danh sách khuyến mãi cho Admin (hỗ trợ search, filter, pagination)
 */
export async function adminGetPromotions(params?: {
  search?: string
  status?: string
  category?: string
  page?: number
  limit?: number
}): Promise<{ promotions: AdminPromotion[]; pagination: AdminPromotionPagination }> {
  try {
    const qs = new URLSearchParams()
    if (params?.search) qs.set("search", params.search)
    if (params?.status && params.status !== "ALL") qs.set("status", params.status)
    if (params?.category && params.category !== "ALL") qs.set("category", params.category)
    if (params?.page) qs.set("page", String(params.page))
    if (params?.limit) qs.set("limit", String(params.limit))

    const res = await apiFetch<{ promotions: AdminPromotion[]; pagination: AdminPromotionPagination }>(
      `/admin/promotions?${qs.toString()}`
    )
    if (res && Array.isArray(res.promotions)) {
      return res
    }
  } catch {
    // API backend chưa sẵn sàng hoặc session dev -> Dùng mock data
  }

  // Fallback lọc từ local data
  let result = [...localAdminPromotions]

  if (params?.search) {
    const q = params.search.toLowerCase().trim()
    result = result.filter(
      (p) =>
        p.code.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    )
  }

  if (params?.status && params.status !== "ALL") {
    if (params.status === "ACTIVE") {
      result = result.filter((p) => p.status === "ACTIVE" && p.isActive)
    } else if (params.status === "UPCOMING") {
      result = result.filter((p) => p.status === "UPCOMING")
    } else if (params.status === "EXPIRED") {
      result = result.filter((p) => p.status === "EXPIRED" || (p.usageLimit > 0 && p.usedCount >= p.usageLimit))
    } else if (params.status === "INACTIVE") {
      result = result.filter((p) => !p.isActive)
    }
  }

  if (params?.category && params.category !== "ALL") {
    result = result.filter((p) => p.category === params.category)
  }

  const page = params?.page || 1
  const limit = params?.limit || 10
  const total = result.length
  const totalPages = Math.ceil(total / limit) || 1
  const startIndex = (page - 1) * limit
  const paged = result.slice(startIndex, startIndex + limit)

  return {
    promotions: paged,
    pagination: {
      total,
      page,
      limit,
      totalPages,
    },
  }
}

/**
 * Thêm mới chương trình khuyến mãi
 */
export async function adminCreatePromotion(data: Partial<AdminPromotion>): Promise<{ message: string; promotion: AdminPromotion }> {
  try {
    return await apiFetch("/admin/promotions", {
      method: "POST",
      body: JSON.stringify(data),
    })
  } catch (err: any) {
    // Nếu có phản hồi lỗi từ server (như mã trùng), ném lỗi rõ ràng
    if (err?.data?.error || err?.message) {
      if (err.data?.error) throw new Error(err.data.error)
    }
  }

  // Fallback tạo nội bộ
  const cleanCode = (data.code || "").trim().toUpperCase().replace(/\s+/g, "")
  if (!cleanCode) {
    throw new Error("Mã voucher không được để trống")
  }

  const isDuplicate = localAdminPromotions.some((p) => p.code === cleanCode)
  if (isDuplicate) {
    throw new Error(`Mã voucher "${cleanCode}" đã tồn tại trong hệ thống. Vui lòng chọn mã khác.`)
  }

  if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
    throw new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.")
  }

  const now = new Date()
  const start = data.startDate ? new Date(data.startDate) : now
  const end = data.endDate ? new Date(data.endDate) : new Date(now.getFullYear(), 11, 31)

  let status: "ACTIVE" | "EXPIRED" | "UPCOMING" = "ACTIVE"
  if (now < start) {
    status = "UPCOMING"
  } else if (now > end) {
    status = "EXPIRED"
  }

  const newPromo: AdminPromotion = {
    id: `promo-admin-${Date.now()}`,
    title: (data.title || "Ưu đãi mới").trim(),
    code: cleanCode,
    bannerUrl: data.bannerUrl || "/promo/carousel-combo-hot.png",
    discountType: data.discountType || "FIXED_AMOUNT",
    discountValue: Number(data.discountValue) || 0,
    maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
    minOrderValue: Number(data.minOrderValue) || 0,
    startDate: data.startDate || now.toISOString().split("T")[0],
    endDate: data.endDate || end.toISOString().split("T")[0],
    category: data.category || "ALL",
    status,
    isActive: true,
    usedCount: 0,
    usageLimit: Number(data.usageLimit) || 0,
    description: (data.description || "").trim(),
    details: data.details || {
      introduction: (data.description || "").trim(),
      termsAndConditions: ["Áp dụng theo quy định của CinemaHub."],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  localAdminPromotions.unshift(newPromo)
  return { message: "Tạo chương trình khuyến mãi thành công!", promotion: newPromo }
}

/**
 * Cập nhật chương trình khuyến mãi
 */
export async function adminUpdatePromotion(
  id: string,
  data: Partial<AdminPromotion>
): Promise<{ message: string; promotion: AdminPromotion }> {
  try {
    return await apiFetch(`/admin/promotions/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  } catch (err: any) {
    if (err?.data?.error) throw new Error(err.data.error)
  }

  // Fallback update
  const index = localAdminPromotions.findIndex((p) => p.id === id)
  if (index === -1) {
    throw new Error("Không tìm thấy chương trình khuyến mãi cần sửa")
  }

  if (data.code) {
    const cleanCode = data.code.trim().toUpperCase().replace(/\s+/g, "")
    const isDuplicate = localAdminPromotions.some((p) => p.id !== id && p.code === cleanCode)
    if (isDuplicate) {
      throw new Error(`Mã voucher "${cleanCode}" đã tồn tại ở một chương trình khác.`)
    }
    data.code = cleanCode
  }

  if (data.startDate && data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
    throw new Error("Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.")
  }

  const current = localAdminPromotions[index]
  const updated: AdminPromotion = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  }

  localAdminPromotions[index] = updated
  return { message: "Cập nhật khuyến mãi thành công!", promotion: updated }
}

/**
 * Bật/tắt trạng thái kích hoạt (Active / Inactive)
 */
export async function adminTogglePromotionStatus(
  id: string,
  isActive?: boolean
): Promise<{ message: string; promotion: AdminPromotion }> {
  try {
    return await apiFetch(`/admin/promotions/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    })
  } catch {
    // Fallback
  }

  const promo = localAdminPromotions.find((p) => p.id === id)
  if (!promo) {
    throw new Error("Không tìm thấy chương trình khuyến mãi")
  }

  promo.isActive = typeof isActive === "boolean" ? isActive : !promo.isActive
  promo.updatedAt = new Date().toISOString()

  return {
    message: `Đã ${promo.isActive ? "kích hoạt" : "tạm ngưng"} khuyến mãi "${promo.code}" thành công!`,
    promotion: promo,
  }
}

/**
 * Xóa chương trình khuyến mãi
 */
export async function adminDeletePromotion(id: string): Promise<{ message: string }> {
  try {
    return await apiFetch(`/admin/promotions/${id}`, {
      method: "DELETE",
    })
  } catch {
    // Fallback
  }

  const index = localAdminPromotions.findIndex((p) => p.id === id)
  if (index === -1) {
    throw new Error("Không tìm thấy chương trình khuyến mãi cần xóa")
  }

  const deleted = localAdminPromotions.splice(index, 1)[0]
  return { message: `Đã xóa thành công chương trình "${deleted.title}"!` }
}
