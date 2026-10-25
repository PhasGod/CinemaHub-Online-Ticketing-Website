import { Router, Request, Response } from "express"

const router = Router()

// Dữ liệu khuyến mãi phía backend
const promotions = [
  {
    id: "promo-thu-4-vui-ve",
    slug: "thu-4-vui-ve-dong-gia-50k",
    title: "Thứ 4 Vui Vẻ - Đồng giá 50k Toàn Quốc",
    code: "CINEMA50K",
    bannerUrl: "/promo/carousel-dong-gia-online.png",
    discountType: "FIXED_AMOUNT",
    discountValue: 40000,
    minOrderValue: 90000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    description: "Đồng giá vé 50.000đ cho tất cả các suất chiếu vào ngày thứ Tư hàng tuần trên toàn hệ thống CinemaHub.",
    category: "TICKET",
    status: "ACTIVE",
    badge: "HOT",
    details: {
      introduction:
        "Chương trình 'Thứ 4 Vui Vẻ' là sự kiện tri ân định kỳ lớn nhất tuần tại CinemaHub. Tất cả các mọt phim khi đặt vé trực tuyến vào ngày thứ Tư sẽ được hưởng mức giá ưu đãi đồng giá chỉ 50.000đ/vé tiêu chuẩn (giảm ngay 40.000đ cho đơn từ 90.000đ). Trải nghiệm những siêu phẩm điện ảnh đỉnh cao với chi phí siêu tiết kiệm!",
      eligibleAudience:
        "Tất cả khách hàng mua vé trực tuyến qua website hoặc ứng dụng CinemaHub và khách hàng thành viên CinemaHub Rewards.",
      validTime:
        "Áp dụng vào tất cả các ngày Thứ Tư trong tuần, từ 08:00 đến 23:59. Hạn chương trình đến hết ngày 31/12/2026.",
      applicableCinemas: [
        "CinemaHub Vincom Mega Mall Thảo Điền",
        "CinemaHub Landmark 81",
        "CinemaHub Royal City Hà Nội",
        "CinemaHub Phan Xích Long",
        "CinemaHub Biên Hòa Square",
      ],
      termsAndConditions: [
        "Áp dụng cho định dạng phim 2D tiêu chuẩn (Standard Seats).",
        "Phụ thu 10.000đ/ghế đối với ghế VIP và 15.000đ cho suất chiếu sau 21:00.",
        "Không áp dụng đồng thời với các chương trình khuyến mãi hoặc phiếu quà tặng khác.",
        "Không áp dụng cho các suất chiếu sớm (Sneak Show) và các ngày lễ Tết theo quy định nhà nước.",
        "Mỗi khách hàng được mua tối đa 04 vé khuyến mãi cho mỗi giao dịch.",
      ],
      usageSteps: [
        "Bước 1: Chọn bộ phim bạn muốn xem và suất chiếu vào ngày Thứ Tư.",
        "Bước 2: Chọn vị trí ghế ngồi yêu thích trong phòng chiếu.",
        "Bước 3: Tại bước Tóm tắt & Thanh toán, mã CINEMA50K sẽ được tự động điền sẵn hoặc nhập mã vào ô Khuyến mãi.",
        "Bước 4: Kiểm tra số tiền được giảm trừ và tiến hành thanh toán qua VietQR hoặc MoMo.",
      ],
    },
  },
  {
    id: "promo-combo-bap-nuoc-20k",
    slug: "combo-bap-nuoc-sieu-tiet-kiem-20k",
    title: "Combo Bắp Nước Siêu Tiết Kiệm - Giảm Ngay 20K",
    code: "FNB20",
    bannerUrl: "/promo/member-combo-20k-detail.png",
    discountType: "FIXED_AMOUNT",
    discountValue: 20000,
    minOrderValue: 60000,
    startDate: "2026-02-01",
    endDate: "2026-11-30",
    description: "Giảm ngay 20.000đ khi đặt các combo bắp rang bơ giòn rụm và nước ngọt mát lạnh trực tuyến.",
    category: "FNB",
    status: "ACTIVE",
    badge: "HAPPENING",
    details: {
      introduction:
        "Xem phim không thể thiếu bắp nước! CinemaHub mang đến ưu đãi giảm trực tiếp 20.000đ cho tất cả combo bắp ngọt/phô mai/caramel kèm nước ngọt có ga kích thước lớn. Thưởng thức hương vị bắp rang bơ chuẩn rạp chiếu với mức giá vô cùng hấp dẫn.",
      eligibleAudience:
        "Toàn bộ khách hàng đặt vé xem phim hoặc mua combo bắp nước online qua hệ thống CinemaHub.",
      validTime:
        "Tất cả các khung giờ trong ngày, từ thứ Hai đến Chủ Nhật. Hạn dùng đến ngày 30/11/2026.",
      applicableCinemas: [
        "Áp dụng tại quầy Concession của tất cả các cụm rạp CinemaHub trên toàn quốc.",
      ],
      termsAndConditions: [
        "Áp dụng cho đơn hàng có giá trị từ 60.000đ trở lên.",
        "Khách hàng nhận bắp nước trực tiếp tại quầy Fast & Food bằng cách quét mã QR trên vé điện tử.",
        "Mỗi tài khoản được sử dụng mã tối đa 03 lần trong một tuần.",
        "Không quy đổi thành tiền mặt hoặc hoàn lại tiền thừa nếu giá trị combo thấp hơn mức ưu đãi.",
      ],
      usageSteps: [
        "Bước 1: Chọn suất chiếu phim và đặt vé.",
        "Bước 2: Tại bước chọn Bắp Nước hoặc giỏ hàng, chọn Combo yêu thích.",
        "Bước 3: Nhập mã voucher FNB20 tại bước thanh toán để được giảm ngay 20.000đ.",
        "Bước 4: Đến rạp, đưa mã vé điện tử tại quầy để nhân viên phục vụ bắp nước nóng hổi.",
      ],
    },
  },
  {
    id: "promo-hoc-sinh-sinh-vien",
    slug: "uu-dai-hoc-sinh-sinh-vien",
    title: "Ưu Đãi Học Sinh - Sinh Viên: Giảm 25% Giá Vé",
    code: "STUDENTVOUCHER",
    bannerUrl: "/promo/student-gift.png",
    discountType: "PERCENTAGE",
    discountValue: 25,
    minOrderValue: 80000,
    maxDiscount: 45000,
    startDate: "2026-01-15",
    endDate: "2026-12-31",
    description: "Giảm ngay 25% tối đa 45.000đ cho các bạn học sinh, sinh viên và giảng viên từ thứ Hai đến thứ Sáu.",
    category: "TICKET",
    status: "ACTIVE",
    badge: "HAPPENING",
    details: {
      introduction:
        "CinemaHub luôn đồng hành cùng thế hệ trẻ! Giờ đây, chỉ cần là học sinh hoặc sinh viên, bạn sẽ nhận ngay ưu đãi giảm 25% trên tổng giá vé (giảm tối đa 45.000đ) khi đặt vé các suất chiếu trong tuần. Tự do tụ tập bạn bè cùng lớp xem những tựa phim bom tấn đỉnh cao mà không lo cháy túi.",
      eligibleAudience:
        "Khách hàng là Học sinh, Sinh viên dưới 23 tuổi có thẻ HSSV hoặc ứng dụng VNeID/thẻ CCCD còn hiệu lực.",
      validTime:
        "Áp dụng cho các suất chiếu từ Thứ Hai đến Thứ Sáu (không bao gồm Thứ Bảy, Chủ Nhật và ngày nghỉ lễ).",
      applicableCinemas: [
        "Toàn bộ các rạp CinemaHub tại TP.HCM, Hà Nội và Đồng Nai.",
      ],
      termsAndConditions: [
        "Vui lòng xuất trình thẻ Học sinh / Sinh viên gốc hoặc ứng dụng tài khoản sinh viên khi nhân viên soát vé quét QR.",
        "Mỗi thẻ HSSV hợp lệ được áp dụng cho tối đa 02 vé trong cùng một suất chiếu.",
        "Không áp dụng đồng thời với các voucher ưu đãi khác.",
        "Áp dụng cho cả định dạng 2D Tiêu chuẩn và 2D Phụ đề.",
      ],
      usageSteps: [
        "Bước 1: Bấm 'Dùng ngay' hoặc sao chép mã STUDENTVOUCHER.",
        "Bước 2: Chọn suất chiếu từ thứ Hai đến thứ Sáu.",
        "Bước 3: Tại bước Tóm tắt & Thanh toán, hệ thống sẽ tự động trừ 25% giá trị đơn hàng.",
        "Bước 4: Xuất trình mã vé điện tử kèm thẻ HSSV tại cửa soát vé để vào rạp.",
      ],
    },
  },
  {
    id: "promo-thanh-vien-moi-50k",
    slug: "chao-don-thanh-vien-moi-50k",
    title: "Chào Đón Thành Viên Mới - Tặng Voucher 50.000đ",
    code: "HELLO50",
    bannerUrl: "/promo/vip-member.png",
    discountType: "FIXED_AMOUNT",
    discountValue: 50000,
    minOrderValue: 120000,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    description: "Món quà chào mừng dành riêng cho tài khoản đăng ký mới tại CinemaHub. Giảm ngay 50.000đ cho đơn đầu tiên.",
    category: "MEMBER",
    status: "ACTIVE",
    badge: "HOT",
    details: {
      introduction:
        "Chào mừng bạn gia nhập cộng đồng yêu điện ảnh CinemaHub! Nhằm gửi lời cảm ơn và giúp bạn có trải nghiệm xem phim trọn vẹn nhất, CinemaHub gửi tặng voucher giảm trực tiếp 50.000đ cho đơn hàng đặt vé xem phim đầu tiên của tài khoản mới.",
      eligibleAudience:
        "Áp dụng cho các tài khoản CinemaHub tạo mới trong năm 2026 và chưa từng phát sinh giao dịch đặt vé trước đó.",
      validTime:
        "Voucher có hiệu lực trong vòng 30 ngày kể từ ngày đăng ký tài khoản thành công.",
      applicableCinemas: [
        "Toàn bộ hệ thống rạp chiếu CinemaHub trên cả nước.",
      ],
      termsAndConditions: [
        "Áp dụng cho đơn hàng từ 120.000đ trở lên (khoảng từ 1 đến 2 vé).",
        "Mỗi số điện thoại và email đăng ký chỉ nhận được 01 lần voucher duy nhất.",
        "Voucher không thể quy đổi ra tiền mặt hoặc chuyển nhượng cho tài khoản khác.",
        "Hệ thống sẽ tự động vô hiệu mã nếu phát hiện hành vi gian lận hoặc tạo nhiều tài khoản giả lập.",
      ],
      usageSteps: [
        "Bước 1: Đăng ký tài khoản CinemaHub nhanh chóng bằng Email hoặc Số điện thoại.",
        "Bước 2: Đăng nhập vào hệ thống và chọn phim, suất chiếu bạn mong muốn.",
        "Bước 3: Áp dụng mã HELLO50 tại màn hình Thanh toán để giảm ngay 50.000đ.",
        "Bước 4: Nhận vé điện tử có mã QR ngay lập tức.",
      ],
    },
  },
  {
    id: "promo-happy-monday-20",
    slug: "happy-monday-giam-20-phan-tram",
    title: "Happy Monday - Giảm 20% Giá Vé Đầu Tuần",
    code: "MONDAY20",
    bannerUrl: "/promo/hero-popcorn.png",
    discountType: "PERCENTAGE",
    discountValue: 20,
    minOrderValue: 90000,
    maxDiscount: 35000,
    startDate: "2026-03-01",
    endDate: "2026-09-30",
    description: "Khởi động tuần mới đầy năng lượng với giá vé giảm 20% cho mọi suất chiếu ngày thứ Hai.",
    category: "TICKET",
    status: "ACTIVE",
    badge: "ENDING_SOON",
    details: {
      introduction:
        "Đập tan uể oải ngày đầu tuần bằng một bộ phim kịch tính, lãng mạn hoặc hài hước! Ưu đãi Happy Monday mang đến mức giảm giá 20% (tối đa 35.000đ) cho tất cả vé xem phim vào các ngày thứ Hai.",
      eligibleAudience:
        "Tất cả khách hàng thành viên CinemaHub từ hạng Thường đến VIP.",
      validTime:
        "Áp dụng cho toàn bộ các suất chiếu diễn ra trong ngày Thứ Hai hàng tuần.",
      applicableCinemas: [
        "Áp dụng tại toàn bộ hệ thống rạp CinemaHub.",
      ],
      termsAndConditions: [
        "Áp dụng cho mọi loại ghế (Standard, VIP) của các phòng chiếu 2D.",
        "Chỉ áp dụng khi đặt trực tuyến qua website CinemaHub.",
        "Chương trình có số lượng mã ưu đãi có hạn mỗi tuần.",
      ],
      usageSteps: [
        "Bước 1: Nhấn 'Dùng ngay' để lưu mã MONDAY20.",
        "Bước 2: Chọn suất chiếu ngày thứ Hai của phim bạn mong muốn.",
        "Bước 3: Hệ thống tự động áp dụng mã và giảm 20% ở bước thanh toán.",
        "Bước 4: Hoàn tất thanh toán an toàn và thưởng thức phim.",
      ],
    },
  },
  {
    id: "promo-tri-an-2025-expired",
    slug: "tri-an-khach-hang-2025-expired",
    title: "Tri Ân Khách Hàng Thân Thiết (Chương trình đã kết thúc)",
    code: "THANKS2025",
    bannerUrl: "/promo/carousel-bap-nuoc-cuc-to.png",
    discountType: "PERCENTAGE",
    discountValue: 30,
    minOrderValue: 100000,
    maxDiscount: 50000,
    startDate: "2025-11-01",
    endDate: "2025-12-31",
    description: "Chương trình tri ân cuối năm 2025 đã kết thúc thời gian áp dụng.",
    category: "MEMBER",
    status: "EXPIRED",
    badge: "ENDING_SOON",
    details: {
      introduction: "Chương trình đã kết thúc thời gian áp dụng.",
      eligibleAudience: "Hội viên CinemaHub 2025.",
      validTime: "Hết hạn 31/12/2025.",
      applicableCinemas: ["Tất cả rạp CinemaHub."],
      termsAndConditions: ["Mã voucher đã hết hạn sử dụng."],
      usageSteps: ["Vui lòng chọn các chương trình khuyến mãi hiện hành."],
    },
  },
]

// GET /api/promotions (hỗ trợ filter category, status)
router.get("/", (req: Request, res: Response) => {
  const { category, status } = req.query

  let result = [...promotions]
  if (category && category !== "ALL") {
    result = result.filter((p) => p.category.toLowerCase() === String(category).toLowerCase())
  }
  if (status) {
    result = result.filter((p) => p.status.toLowerCase() === String(status).toLowerCase())
  }

  res.json({ success: true, count: result.length, promotions: result })
})

// GET /api/promotions/:id (hoặc slug)
router.get("/:id", (req: Request, res: Response) => {
  const targetId = String(req.params.id || "").toLowerCase()
  const promo = promotions.find(
    (p) =>
      p.id.toLowerCase() === targetId ||
      p.slug.toLowerCase() === targetId ||
      p.code.toLowerCase() === targetId ||
      (targetId.includes("combo") && p.code === "FNB20") ||
      (targetId.includes("20k") && p.code === "FNB20")
  )

  if (!promo) {
    res.status(404).json({ success: false, message: "Không tìm thấy chương trình khuyến mãi" })
    return
  }

  res.json({ success: true, promotion: promo })
})

// POST /api/promotions/verify-voucher (kiểm tra mã voucher và tính số tiền giảm)
router.post("/verify-voucher", (req: Request, res: Response) => {
  const { code, orderAmount } = req.body

  if (!code) {
    res.status(400).json({ valid: false, message: "Mã voucher không được để trống" })
    return
  }

  const cleanCode = String(code).trim().toUpperCase()
  const promo = promotions.find((p) => p.code.toUpperCase() === cleanCode)

  if (!promo) {
    res.status(404).json({ valid: false, message: `Mã ưu đãi "${cleanCode}" không tồn tại` })
    return
  }

  if (promo.status === "EXPIRED") {
    res.status(400).json({ valid: false, message: "Mã ưu đãi này đã hết hạn sử dụng" })
    return
  }

  const amount = Number(orderAmount) || 0
  if (promo.minOrderValue && amount < promo.minOrderValue) {
    res.status(400).json({
      valid: false,
      message: `Đơn hàng tối thiểu ${promo.minOrderValue.toLocaleString("vi-VN")}đ để áp dụng voucher này`,
    })
    return
  }

  let discount = 0
  if (promo.discountType === "PERCENTAGE") {
    discount = Math.round((amount * promo.discountValue) / 100)
    if (promo.maxDiscount && discount > promo.maxDiscount) {
      discount = promo.maxDiscount
    }
  } else {
    discount = promo.discountValue
  }

  discount = Math.min(amount, discount)
  const finalTotal = Math.max(0, amount - discount)

  res.json({
    valid: true,
    message: `Áp dụng thành công mã ${promo.code}! Tiết kiệm ${discount.toLocaleString("vi-VN")}đ`,
    discountAmount: discount,
    finalTotal,
    promotion: promo,
  })
})

export default router
