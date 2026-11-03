import { Router, Request, Response } from "express"
import { authenticate, requireRole } from "../middleware/auth.js"

const router = Router()

export interface AdminPromotionItem {
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
  createdAt: string
  updatedAt: string
}

// 5–6 chương trình mẫu cho trang Admin
let adminPromotions: AdminPromotionItem[] = [
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

// GET /api/admin/promotions
router.get("/", (req: Request, res: Response) => {
  const { search, q, status, category, page = "1", limit = "10" } = req.query

  const queryStr = String(search || q || "").trim().toLowerCase()
  const statusStr = String(status || "ALL").toUpperCase()
  const categoryStr = String(category || "ALL").toUpperCase()

  let result = [...adminPromotions]

  // Tìm kiếm
  if (queryStr) {
    result = result.filter(
      (p) =>
        p.code.toLowerCase().includes(queryStr) ||
        p.title.toLowerCase().includes(queryStr) ||
        p.description.toLowerCase().includes(queryStr)
    )
  }

  // Lọc trạng thái
  if (statusStr !== "ALL") {
    if (statusStr === "ACTIVE") {
      result = result.filter((p) => p.status === "ACTIVE" && p.isActive)
    } else if (statusStr === "UPCOMING") {
      result = result.filter((p) => p.status === "UPCOMING")
    } else if (statusStr === "EXPIRED") {
      result = result.filter((p) => p.status === "EXPIRED" || (p.usageLimit > 0 && p.usedCount >= p.usageLimit))
    } else if (statusStr === "INACTIVE") {
      result = result.filter((p) => !p.isActive)
    }
  }

  // Lọc danh mục
  if (categoryStr !== "ALL") {
    result = result.filter((p) => p.category === categoryStr)
  }

  const pageNum = Math.max(1, parseInt(String(page), 10) || 1)
  const limitNum = Math.max(1, parseInt(String(limit), 10) || 10)
  const total = result.length
  const totalPages = Math.ceil(total / limitNum) || 1

  const startIndex = (pageNum - 1) * limitNum
  const pagedItems = result.slice(startIndex, startIndex + limitNum)

  res.json({
    success: true,
    promotions: pagedItems,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages,
    },
  })
})

// POST /api/admin/promotions
router.post("/", (req: Request, res: Response) => {
  const {
    title,
    code,
    bannerUrl,
    discountType,
    discountValue,
    maxDiscount,
    minOrderValue,
    startDate,
    endDate,
    category = "ALL",
    usageLimit = 100,
    description = "",
    details,
  } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Tiêu đề chương trình không được để trống" })
  }

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "Mã voucher không được để trống" })
  }

  // Chuẩn hóa mã code: viết hoa, không khoảng trắng
  const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "")

  // Kiểm tra trùng mã code
  const isDuplicate = adminPromotions.some((p) => p.code === normalizedCode)
  if (isDuplicate) {
    return res.status(400).json({ error: `Mã voucher "${normalizedCode}" đã tồn tại. Vui lòng chọn mã khác.` })
  }

  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu." })
  }

  const now = new Date()
  const start = startDate ? new Date(startDate) : now
  const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), 11, 31)

  let status: "ACTIVE" | "EXPIRED" | "UPCOMING" = "ACTIVE"
  if (now < start) {
    status = "UPCOMING"
  } else if (now > end) {
    status = "EXPIRED"
  }

  const newPromo: AdminPromotionItem = {
    id: `promo-admin-${Date.now()}`,
    title: title.trim(),
    code: normalizedCode,
    bannerUrl: bannerUrl || "/promo/carousel-combo-hot.png",
    discountType: discountType === "PERCENTAGE" ? "PERCENTAGE" : "FIXED_AMOUNT",
    discountValue: Number(discountValue) || 0,
    maxDiscount: maxDiscount ? Number(maxDiscount) : undefined,
    minOrderValue: Number(minOrderValue) || 0,
    startDate: startDate || now.toISOString().split("T")[0],
    endDate: endDate || end.toISOString().split("T")[0],
    category: ["TICKET", "FNB", "MEMBER"].includes(category) ? category : "ALL",
    status,
    isActive: true,
    usedCount: 0,
    usageLimit: Number(usageLimit) || 0,
    description: description.trim(),
    details: details || {
      introduction: description.trim(),
      termsAndConditions: ["Áp dụng theo quy định của CinemaHub."],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  adminPromotions.unshift(newPromo)

  res.status(201).json({
    success: true,
    message: "Tạo chương trình khuyến mãi mới thành công!",
    promotion: newPromo,
  })
})

// PUT /api/admin/promotions/:id
router.put("/:id", (req: Request, res: Response) => {
  const { id } = req.params
  const index = adminPromotions.findIndex((p) => p.id === id)

  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy chương trình khuyến mãi" })
  }

  const {
    title,
    code,
    bannerUrl,
    discountType,
    discountValue,
    maxDiscount,
    minOrderValue,
    startDate,
    endDate,
    category,
    usageLimit,
    description,
    isActive,
    details,
  } = req.body

  if (!title || !title.trim()) {
    return res.status(400).json({ error: "Tiêu đề chương trình không được để trống" })
  }

  if (!code || !code.trim()) {
    return res.status(400).json({ error: "Mã voucher không được để trống" })
  }

  const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, "")

  // Kiểm tra trùng mã code với các voucher khác
  const isDuplicate = adminPromotions.some((p) => p.id !== id && p.code === normalizedCode)
  if (isDuplicate) {
    return res.status(400).json({ error: `Mã voucher "${normalizedCode}" đã tồn tại trên một chương trình khác.` })
  }

  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    return res.status(400).json({ error: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu." })
  }

  const current = adminPromotions[index]
  const now = new Date()
  const start = startDate ? new Date(startDate) : new Date(current.startDate)
  const end = endDate ? new Date(endDate) : new Date(current.endDate)

  let status: "ACTIVE" | "EXPIRED" | "UPCOMING" = current.status
  if (now < start) {
    status = "UPCOMING"
  } else if (now > end) {
    status = "EXPIRED"
  } else {
    status = "ACTIVE"
  }

  const updated: AdminPromotionItem = {
    ...current,
    title: title.trim(),
    code: normalizedCode,
    bannerUrl: bannerUrl || current.bannerUrl,
    discountType: discountType || current.discountType,
    discountValue: discountValue !== undefined ? Number(discountValue) : current.discountValue,
    maxDiscount: maxDiscount !== undefined ? Number(maxDiscount) : current.maxDiscount,
    minOrderValue: minOrderValue !== undefined ? Number(minOrderValue) : current.minOrderValue,
    startDate: startDate || current.startDate,
    endDate: endDate || current.endDate,
    category: category || current.category,
    status,
    isActive: isActive !== undefined ? Boolean(isActive) : current.isActive,
    usageLimit: usageLimit !== undefined ? Number(usageLimit) : current.usageLimit,
    description: description !== undefined ? description.trim() : current.description,
    details: details || current.details,
    updatedAt: new Date().toISOString(),
  }

  adminPromotions[index] = updated

  res.json({
    success: true,
    message: "Cập nhật chương trình khuyến mãi thành công!",
    promotion: updated,
  })
})

// PATCH /api/admin/promotions/:id/status (Bật/tắt trạng thái isActive nhanh)
router.patch("/:id/status", (req: Request, res: Response) => {
  const { id } = req.params
  const promo = adminPromotions.find((p) => p.id === id)

  if (!promo) {
    return res.status(404).json({ error: "Không tìm thấy chương trình khuyến mãi" })
  }

  const { isActive } = req.body
  if (typeof isActive === "boolean") {
    promo.isActive = isActive
  } else {
    promo.isActive = !promo.isActive
  }
  promo.updatedAt = new Date().toISOString()

  res.json({
    success: true,
    message: `Đã ${promo.isActive ? "kích hoạt" : "tạm ngưng"} chương trình khuyến mãi "${promo.code}" thành công!`,
    promotion: promo,
  })
})

// DELETE /api/admin/promotions/:id
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params
  const index = adminPromotions.findIndex((p) => p.id === id)

  if (index === -1) {
    return res.status(404).json({ error: "Không tìm thấy chương trình khuyến mãi cần xóa" })
  }

  const deleted = adminPromotions.splice(index, 1)[0]

  res.json({
    success: true,
    message: `Đã xóa thành công chương trình khuyến mãi "${deleted.title}" (${deleted.code})!`,
    deletedId: id,
  })
})

export default router
