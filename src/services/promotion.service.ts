import { Promotion, PromotionCategory, PromotionStatus, VoucherApplyResult } from "../types/promotion"
import { promotionsMockData } from "../data/promotionsMockData"
import { apiFetch } from "./api"

const SESSION_VOUCHER_KEY = "cinemahub_active_voucher"

export interface StoredVoucher {
  code: string
  title: string
  discountType: "PERCENTAGE" | "FIXED_AMOUNT"
  discountValue: number
  minOrderValue?: number
  maxDiscount?: number
  bannerUrl?: string
}

/**
 * Lấy danh sách khuyến mãi (gọi backend API, nếu lỗi fallback mock data)
 */
export async function getPromotions(filters?: {
  category?: PromotionCategory
  status?: PromotionStatus
}): Promise<Promotion[]> {
  try {
    const params = new URLSearchParams()
    if (filters?.category && filters.category !== "ALL") {
      params.append("category", filters.category)
    }
    if (filters?.status) {
      params.append("status", filters.status)
    }

    const query = params.toString() ? `?${params.toString()}` : ""
    const response = await apiFetch<{ promotions: Promotion[] }>(`/promotions${query}`)
    if (response && Array.isArray(response.promotions)) {
      return response.promotions
    }
  } catch {
    // API backend chưa bật hoặc endpoint chưa sẵn sàng -> Sử dụng mock data
  }

  // Fallback lọc từ mock data
  let result = [...promotionsMockData]
  if (filters?.category && filters.category !== "ALL") {
    result = result.filter((p) => p.category === filters.category)
  }
  if (filters?.status) {
    result = result.filter((p) => p.status === filters.status)
  }
  return result
}

/**
 * Lấy chi tiết một bài viết khuyến mãi theo id hoặc slug
 */
export async function getPromotionByIdOrSlug(idOrSlug: string): Promise<Promotion | null> {
  try {
    const response = await apiFetch<{ promotion: Promotion }>(`/promotions/${idOrSlug}`)
    if (response && response.promotion) {
      return response.promotion
    }
  } catch {
    // Fallback sang mock data
  }

  const clean = (idOrSlug || "").toLowerCase()
  const found = promotionsMockData.find(
    (p) =>
      p.id.toLowerCase() === clean ||
      p.slug.toLowerCase() === clean ||
      p.code.toLowerCase() === clean ||
      (clean.includes("combo") && p.code === "FNB20") ||
      (clean.includes("20k") && p.code === "FNB20")
  )
  return found || null
}

/**
 * Xác thực và tính toán giá trị giảm giá cho một voucher code với tổng đơn hàng
 */
export function verifyVoucher(code: string, orderAmount: number): VoucherApplyResult {
  const cleanCode = (code || "").trim().toUpperCase()
  if (!cleanCode) {
    return {
      valid: false,
      message: "Vui lòng nhập mã khuyến mãi",
      discountAmount: 0,
      finalTotal: orderAmount,
    }
  }

  const promo = promotionsMockData.find((p) => p.code.toUpperCase() === cleanCode)
  if (!promo) {
    return {
      valid: false,
      message: `Mã ưu đãi "${cleanCode}" không tồn tại hoặc đã hết hạn`,
      discountAmount: 0,
      finalTotal: orderAmount,
    }
  }

  if (promo.status === "EXPIRED") {
    return {
      valid: false,
      message: `Chương trình "${promo.title}" đã kết thúc thời gian áp dụng`,
      discountAmount: 0,
      finalTotal: orderAmount,
      promotion: promo,
    }
  }

  if (promo.status === "UPCOMING") {
    return {
      valid: false,
      message: `Chương trình "${promo.title}" chưa đến thời gian áp dụng`,
      discountAmount: 0,
      finalTotal: orderAmount,
      promotion: promo,
    }
  }

  if (promo.minOrderValue && orderAmount < promo.minOrderValue) {
    return {
      valid: false,
      message: `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString("vi-VN")}đ để áp dụng mã này (Hiện tại: ${orderAmount.toLocaleString("vi-VN")}đ)`,
      discountAmount: 0,
      finalTotal: orderAmount,
      promotion: promo,
    }
  }

  let discount = 0
  if (promo.discountType === "PERCENTAGE") {
    discount = Math.round((orderAmount * promo.discountValue) / 100)
    if (promo.maxDiscount && discount > promo.maxDiscount) {
      discount = promo.maxDiscount
    }
  } else {
    discount = promo.discountValue
  }

  // Đảm bảo không giảm vượt quá số tiền đơn hàng
  discount = Math.min(orderAmount, discount)
  const finalTotal = Math.max(0, orderAmount - discount)

  return {
    valid: true,
    message: `Áp dụng thành công mã ${promo.code}! Tiết kiệm ${discount.toLocaleString("vi-VN")}đ`,
    discountAmount: discount,
    finalTotal,
    promotion: promo,
  }
}

/**
 * Lưu mã voucher tạm thời vào sessionStorage khi người dùng bấm "Dùng ngay"
 */
export function saveSelectedVoucher(promo: Promotion): void {
  try {
    const data: StoredVoucher = {
      code: promo.code,
      title: promo.title,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minOrderValue: promo.minOrderValue,
      maxDiscount: promo.maxDiscount,
      bannerUrl: promo.bannerUrl,
    }
    sessionStorage.setItem(SESSION_VOUCHER_KEY, JSON.stringify(data))
  } catch (err) {
    console.error("Failed to save voucher to sessionStorage", err)
  }
}

/**
 * Lấy mã voucher đã lưu từ sessionStorage
 */
export function getSelectedVoucher(): StoredVoucher | null {
  try {
    const raw = sessionStorage.getItem(SESSION_VOUCHER_KEY)
    if (!raw) return null
    return JSON.parse(raw) as StoredVoucher
  } catch {
    return null
  }
}

/**
 * Xóa mã voucher trong sessionStorage
 */
export function clearSelectedVoucher(): void {
  try {
    sessionStorage.removeItem(SESSION_VOUCHER_KEY)
  } catch (err) {
    console.error("Failed to clear voucher from sessionStorage", err)
  }
}
