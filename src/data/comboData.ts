export interface ComboItem {
  id: string
  name: string
  price: number
  originalPrice: number
  image: string
  description: string
  category: "COMBO" | "DRINK" | "SNACK"
  tag?: string
  popular?: boolean
}

export interface SelectedComboItem extends ComboItem {
  quantity: number
}

export const POPULAR_COMBOS: ComboItem[] = [
  {
    id: "beta-combo",
    name: "Beta Combo",
    price: 68000,
    originalPrice: 88000,
    image: "/promo/member-combo-20k-detail.png",
    description: "1 Bắp ngọt lớn (64oz) + 1 Nước ngọt có ga mát lạnh (32oz). Tiết kiệm ngay 20.000đ.",
    category: "COMBO",
    tag: "Bán chạy nhất",
    popular: true,
  },
  {
    id: "sweet-combo",
    name: "Sweet Combo",
    price: 88000,
    originalPrice: 108000,
    image: "/promo/combo-popcorn.png",
    description: "1 Bắp lớn 64oz (tùy chọn Caramel/Phô mai) + 2 Nước ngọt có ga 32oz. Trọn vị cho cặp đôi.",
    category: "COMBO",
    tag: "Hot Deal",
    popular: true,
  },
  {
    id: "couple-combo-99k",
    name: "Combo Đôi Hẹn Hò",
    price: 99000,
    originalPrice: 125000,
    image: "/promo/carousel-combo-hot.png",
    description: "1 Bắp phô mai lớn + 2 Pepsi đá lạnh 32oz + 1 Kẹo dẻo ngọt ngào.",
    category: "COMBO",
    tag: "Cặp đôi",
    popular: true,
  },
  {
    id: "family-combo",
    name: "Family Combo",
    price: 213000,
    originalPrice: 233000,
    image: "/promo/carousel-bap-nuoc-cuc-to.png",
    description: "2 Bắp ngọt lớn 64oz + 4 Nước ngọt lớn 32oz + 1 Snack giòn rụm. Trọn vẹn cho gia đình.",
    category: "COMBO",
    tag: "Tiết kiệm 20K",
  },
  {
    id: "solo-combo",
    name: "Combo Solo Độc Hành",
    price: 49000,
    originalPrice: 65000,
    image: "/promo/hero-popcorn.png",
    description: "1 Bắp rang thơm bơ vừa (44oz) + 1 Nước ngọt 22oz. Nhanh gọn cho 1 người xem phim.",
    category: "COMBO",
    tag: "Tiện lợi",
  },
  {
    id: "popcorn-snack",
    name: "Bắp Rang Bơ Phô Mai / Caramel",
    price: 45000,
    originalPrice: 55000,
    image: "/promo/hero-popcorn.png",
    description: "1 Hộp bắp nổ giòn tan lắc đều bột phô mai béo ngậy hoặc caramel thơm nức mũi.",
    category: "SNACK",
    tag: "Ăn vặt",
  },
  {
    id: "drink-soft-32oz",
    name: "Nước Ngọt Có Ga Lớn (32oz)",
    price: 25000,
    originalPrice: 32000,
    image: "/promo/floating-member-combo-blue.png",
    description: "Ly 32oz đá lạnh sảng khoái (Pepsi / 7Up / Mirinda Cam / Mirinda Xá Xị).",
    category: "DRINK",
    tag: "Giải khát",
  },
]
