export type PromotionDetail = {
  slug: string
  title: string
  code: string
  validUntil: string
  cardImageUrl: string
  bannerImageUrl: string
  summary: string
  detailsTitle: string
  details: string
  terms: string[]
  ctaLabel: string
  ctaUrl: string
  priceOptions?: Array<{ label: string; salePrice: string; originalPrice: string }>
}

export const promotionDetailData: PromotionDetail[] = [
  {
    slug: "giam-ngay-20k-combo-online",
    title: "Giảm ngay 20K khi mua combo bắp nước online",
    code: "COMBO20K",
    validUntil: "30.11.2026",
    cardImageUrl: "/promo/member-combo-20k-detail.png",
    bannerImageUrl: "/promo/member-combo-20k-detail.png",
    summary: "Đặc quyền thành viên 5TOP Cinema dành cho đơn hàng combo bắp nước đặt qua website hoặc ứng dụng.",
    detailsTitle: "Đặc quyền thành viên 5TOP Cinema",
    details: "Khách hàng đặt combo bắp nước trực tuyến được giảm trực tiếp 20.000 VNĐ so với giá mua tại quầy cho toàn bộ combo đủ điều kiện. Ưu đãi được hiển thị rõ trước khi bạn xác nhận thanh toán.",
    terms: [
      "Áp dụng cho thành viên 5TOP Cinema đặt combo trực tuyến.",
      "Ưu đãi được tự động áp dụng tại bước thanh toán khi sản phẩm hợp lệ.",
      "Mỗi đơn hàng áp dụng một ưu đãi và không cộng dồn với chương trình khác.",
      "Không quy đổi thành tiền mặt; chương trình có thể kết thúc khi hết số lượng ưu đãi.",
    ],
    ctaLabel: "SĂN ƯU ĐÃI",
    ctaUrl: "/combo",
    priceOptions: [
      { label: "Beta Combo", salePrice: "68.000đ", originalPrice: "88.000đ" },
      { label: "Sweet Combo", salePrice: "88.000đ", originalPrice: "108.000đ" },
      { label: "Family Combo", salePrice: "213.000đ", originalPrice: "233.000đ" },
    ],
  },
  {
    slug: "giam-20-moi-thu-hai",
    title: "Giảm 20% mỗi thứ Hai",
    code: "MONDAY20",
    validUntil: "30.09.2026",
    cardImageUrl: "/promo/hero-popcorn.png",
    bannerImageUrl: "/promo/hero-popcorn.png",
    summary: "Nạp năng lượng đầu tuần với giá vé ưu đãi dành riêng cho các suất chiếu thứ Hai.",
    detailsTitle: "Khởi đầu tuần mới thật rộn ràng",
    details: "Vào mỗi thứ Hai, khách hàng thành viên được giảm 20% giá vé tiêu chuẩn khi đặt vé tại website, ứng dụng hoặc quầy vé 5TOP Cinema. Ưu đãi giúp bạn tận hưởng bộ phim yêu thích với chi phí nhẹ nhàng hơn.",
    terms: ["Áp dụng cho suất chiếu thứ Hai tại các rạp 5TOP Cinema.", "Áp dụng cho vé 2D tiêu chuẩn và phụ thuộc tình trạng ghế.", "Không áp dụng cùng ưu đãi, voucher hoặc mã giảm giá khác.", "Không áp dụng cho ghế đặc biệt, suất chiếu IMAX và ngày lễ."],
    ctaLabel: "ĐẶT VÉ NGAY",
    ctaUrl: "/showtimes",
  },
  {
    slug: "combo-doi-99k",
    title: "Combo đôi chỉ 99K",
    code: "COUPLE99",
    validUntil: "30.09.2026",
    cardImageUrl: "/promo/combo-popcorn.png",
    bannerImageUrl: "/promo/combo-popcorn.png",
    summary: "Hẹn hò trọn vẹn với bắp lớn và hai nước mát lạnh trong một combo tiết kiệm.",
    detailsTitle: "Trọn vị điện ảnh cho hai người",
    details: "Combo đôi 99K bao gồm một bắp lớn và hai nước tự chọn. Đây là lựa chọn vừa đủ cho buổi hẹn xem phim, được phục vụ nhanh tại quầy F&B của rạp.",
    terms: ["Áp dụng khi mua trực tiếp tại quầy F&B hoặc đặt online.", "Số lượng sản phẩm có thể thay đổi theo tồn kho tại từng rạp.", "Không áp dụng cùng ưu đãi combo khác.", "Hình ảnh chỉ mang tính minh họa."],
    ctaLabel: "SĂN ƯU ĐÃI",
    ctaUrl: "/combo",
  },
  {
    slug: "chao-thanh-vien-moi",
    title: "Chào thành viên mới",
    code: "HELLO50",
    validUntil: "30.09.2026",
    cardImageUrl: "/promo/vip-member.png",
    bannerImageUrl: "/promo/vip-member.png",
    summary: "Nhận ngay voucher 50K cho lần đặt vé đầu tiên sau khi đăng ký thành viên.",
    detailsTitle: "Quà chào mừng dành cho bạn",
    details: "Khi tạo tài khoản 5TOP Cinema, bạn sẽ nhận được voucher giảm 50.000 VNĐ cho đơn đặt vé đầu tiên. Voucher được lưu trực tiếp trong tài khoản để sử dụng thuận tiện.",
    terms: ["Chỉ áp dụng cho tài khoản đăng ký mới.", "Mỗi tài khoản được nhận một voucher duy nhất.", "Voucher có thời hạn sử dụng ghi rõ trong mục Ưu đãi của tôi.", "Không quy đổi thành tiền mặt hoặc chuyển nhượng."],
    ctaLabel: "ĐĂNG KÝ NGAY",
    ctaUrl: "/profile",
  },
  {
    slug: "uu-dai-hoc-sinh-sinh-vien",
    title: "Ưu đãi học sinh sinh viên",
    code: "STUDENT",
    validUntil: "30.09.2026",
    cardImageUrl: "/promo/student-gift.png",
    bannerImageUrl: "/promo/student-gift.png",
    summary: "Đồng giá 55K từ thứ Hai đến thứ Sáu, dành cho học sinh và sinh viên.",
    detailsTitle: "Ưu đãi đến rạp dành cho học sinh, sinh viên",
    details: "Xuất trình thẻ học sinh, sinh viên còn hiệu lực để mua vé đồng giá 55.000 VNĐ trong khung thời gian áp dụng. Một lựa chọn hợp lý để bạn cùng bạn bè thưởng thức phim mới.",
    terms: ["Áp dụng từ thứ Hai đến thứ Sáu, không bao gồm ngày lễ.", "Cần xuất trình thẻ học sinh hoặc sinh viên hợp lệ khi nhận vé.", "Mỗi thẻ được mua tối đa hai vé cho một suất chiếu.", "Không áp dụng cho phòng chiếu và ghế đặc biệt."],
    ctaLabel: "ĐẶT VÉ NGAY",
    ctaUrl: "/showtimes",
  },
]

export const findPromotionBySlug = (slug?: string) => promotionDetailData.find((promotion) => promotion.slug === slug)
