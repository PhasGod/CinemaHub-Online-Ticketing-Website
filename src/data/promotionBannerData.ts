export type PromotionBanner = {
  id: string
  imageUrl: string
  title: string
  targetUrl: string
}

export const promotionBannerData: PromotionBanner[] = [
  {
    id: "5top-combo-hot",
    imageUrl: "/promo/carousel-combo-hot.png",
    title: "5TOP Cinema - Combo hot giá hời",
    targetUrl: "/promotions",
  },
  {
    id: "5top-pepsi-bap-nuoc",
    imageUrl: "/promo/carousel-bap-nuoc-cuc-to.png",
    title: "5TOP Cinema - Bắp nước cực to, giá không phải lo",
    targetUrl: "/promotions",
  },
  {
    id: "5top-dong-gia-online",
    imageUrl: "/promo/carousel-dong-gia-online.png",
    title: "5TOP Cinema - Đồng giá online",
    targetUrl: "/promotions",
  },
  {
    id: "5top-flex-deal",
    imageUrl: "/promo/carousel-flex-deal.png",
    title: "5TOP Cinema - Flex Deal chỉ từ 23K",
    targetUrl: "/promotions",
  },
]
