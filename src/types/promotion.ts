export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT"
export type PromotionCategory = "ALL" | "TICKET" | "FNB" | "MEMBER"
export type PromotionStatus = "ACTIVE" | "EXPIRED" | "UPCOMING"
export type PromotionBadge = "HOT" | "ENDING_SOON" | "HAPPENING" | "NEW"

export interface PromotionDetails {
  introduction: string
  eligibleAudience: string
  validTime: string
  applicableCinemas: string[]
  termsAndConditions: string[]
  usageSteps: string[]
}

export interface Promotion {
  id: string
  slug: string
  title: string
  code: string
  bannerUrl: string
  discountType: DiscountType
  discountValue: number
  minOrderValue?: number
  maxDiscount?: number
  startDate: string
  endDate: string
  description: string
  details: PromotionDetails
  category: "TICKET" | "FNB" | "MEMBER"
  status: PromotionStatus
  badge?: PromotionBadge
  ctaLabel?: string
  ctaUrl?: string
}

export interface VoucherApplyResult {
  valid: boolean
  message: string
  discountAmount: number
  promotion?: Promotion
  finalTotal: number
}
