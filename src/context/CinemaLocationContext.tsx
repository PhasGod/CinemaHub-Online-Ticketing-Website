import React, { createContext, useContext, useEffect, useState, useMemo } from "react"
import { adminGetCinemas, type Cinema } from "../services/admin.service"

export interface CinemaLocation {
  id: string
  name: string
  city: string
  address?: string
}

export const ALL_CINEMAS_OPTION: CinemaLocation = {
  id: "all",
  name: "Tất cả rạp",
  city: "Toàn quốc",
  address: "Hệ thống cụm rạp 5TOP Cinema trên toàn quốc",
}

export const DEFAULT_CINEMA: CinemaLocation = {
  id: "bien-hoa",
  name: "5TOP Cinema Biên Hòa",
  city: "Đồng Nai",
  address: "1096 Phạm Văn Thuận, P. Tân Mai, TP. Biên Hòa, Đồng Nai",
}

export const MOCK_CINEMAS: CinemaLocation[] = [
  // Đồng Nai
  {
    id: "bien-hoa",
    name: "5TOP Cinema Biên Hòa",
    city: "Đồng Nai",
    address: "1096 Phạm Văn Thuận, P. Tân Mai, TP. Biên Hòa, Đồng Nai",
  },
  {
    id: "long-thanh",
    name: "5TOP Cinema Long Thành",
    city: "Đồng Nai",
    address: "Tầng 3 TTTM Vincom Plaza Long Thành, Đồng Nai",
  },
  // TP. Hồ Chí Minh
  {
    id: "quan-1",
    name: "5TOP Cinema Quận 1 (Đồng Khởi)",
    city: "TP. Hồ Chí Minh",
    address: "Tầng 4 Vincom Center Đồng Khởi, 72 Lê Thánh Tôn, Bến Nghé, Quận 1",
  },
  {
    id: "thu-duc",
    name: "5TOP Cinema Thủ Đức",
    city: "TP. Hồ Chí Minh",
    address: "216 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP. HCM",
  },
  {
    id: "quan-7",
    name: "5TOP Cinema Quận 7 (Crescent Mall)",
    city: "TP. Hồ Chí Minh",
    address: "Tầng 5 Crescent Mall, 101 Tôn Dật Tiên, Tân Phú, Quận 7, TP. HCM",
  },
  {
    id: "go-vap",
    name: "5TOP Cinema Gò Vấp",
    city: "TP. Hồ Chí Minh",
    address: "Phan Văn Trị, Phường 7, Quận Gò Vấp, TP. HCM",
  },
  // Bình Dương
  {
    id: "binh-duong",
    name: "5TOP Cinema Dĩ An",
    city: "Bình Dương",
    address: "Số 01 Đại lộ Bình Dương, Dĩ An, Bình Dương",
  },
  {
    id: "thu-dau-mot",
    name: "5TOP Cinema Thủ Dầu Một",
    city: "Bình Dương",
    address: "230 Đại lộ Bình Dương, P. Phú Hòa, TP. Thủ Dầu Một, Bình Dương",
  },
  // Hà Nội
  {
    id: "ba-dinh",
    name: "5TOP Cinema Ba Đình (Liễu Giai)",
    city: "Hà Nội",
    address: "29 Liễu Giai, P. Ngọc Khánh, Ba Đình, Hà Nội",
  },
  {
    id: "ha-dong",
    name: "5TOP Cinema Hà Đông",
    city: "Hà Nội",
    address: "Tầng 4 TTTM Aeon Mall Hà Đông, P. Dương Nội, Hà Đông, Hà Nội",
  },
]

interface CinemaLocationContextType {
  selectedCinema: CinemaLocation
  changeCinema: (cinema: CinemaLocation) => void
  cinemas: CinemaLocation[]
  groupedCinemas: Record<string, CinemaLocation[]>
  isAllCinemasSelected: boolean
}

const STORAGE_KEY = "selected_cinema"

const CinemaLocationContext = createContext<CinemaLocationContextType | undefined>(undefined)

function getInitialCinema(): CinemaLocation {
  if (typeof window === "undefined") return DEFAULT_CINEMA
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && typeof parsed === "object" && parsed.id && parsed.name) {
        return parsed as CinemaLocation
      }
    }
  } catch (error) {
    console.error("Lỗi khi đọc rạp từ localStorage:", error)
  }
  return DEFAULT_CINEMA
}

export const CinemaLocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedCinema, setSelectedCinema] = useState<CinemaLocation>(getInitialCinema)
  const [cinemasList, setCinemasList] = useState<CinemaLocation[]>(MOCK_CINEMAS)

  // Đồng bộ với API backend nếu có
  useEffect(() => {
    let active = true
    adminGetCinemas()
      .then((res) => {
        if (!active || !res?.cinemas || res.cinemas.length === 0) return
        
        // Chuyển đổi Cinema từ API thành CinemaLocation
        const apiCinemas: CinemaLocation[] = res.cinemas.map((c: Cinema) => ({
          id: c.id,
          name: c.name,
          city: c.city || c.location || "Khác",
          address: c.address || undefined,
        }))

        // Ghép thêm mock cinemas nếu thiếu
        const existingNames = new Set(apiCinemas.map((c) => c.name.toLowerCase()))
        const combined = [...apiCinemas]
        MOCK_CINEMAS.forEach((mock) => {
          if (!existingNames.has(mock.name.toLowerCase())) {
            combined.push(mock)
          }
        })

        setCinemasList(combined)

        // Kiểm tra xem selectedCinema hiện tại có ID trùng rạp API không
        const currentSaved = localStorage.getItem(STORAGE_KEY)
        if (currentSaved) {
          try {
            const parsed = JSON.parse(currentSaved)
            const matched = combined.find(
              (c) => c.id === parsed.id || c.name.toLowerCase() === parsed.name?.toLowerCase()
            )
            if (matched && matched.id !== parsed.id) {
              setSelectedCinema(matched)
              localStorage.setItem(STORAGE_KEY, JSON.stringify(matched))
            }
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // Sử dụng mock data mặc định
      })

    return () => {
      active = false
    }
  }, [])

  const changeCinema = (cinema: CinemaLocation) => {
    setSelectedCinema(cinema)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cinema))
    } catch (e) {
      console.error("Lỗi lưu localStorage:", e)
    }

    // Phát sự kiện toàn cục để các component phản ứng ngay nếu cần
    window.dispatchEvent(
      new CustomEvent("selected_cinema_changed", {
        detail: cinema,
      })
    )
  }

  // Nhóm danh sách rạp theo Tỉnh / Thành phố
  const groupedCinemas = useMemo(() => {
    const groups: Record<string, CinemaLocation[]> = {}
    cinemasList.forEach((c) => {
      const city = c.city || "Khác"
      if (!groups[city]) {
        groups[city] = []
      }
      groups[city].push(c)
    })
    return groups
  }, [cinemasList])

  const isAllCinemasSelected = selectedCinema.id === ALL_CINEMAS_OPTION.id

  return (
    <CinemaLocationContext.Provider
      value={{
        selectedCinema,
        changeCinema,
        cinemas: cinemasList,
        groupedCinemas,
        isAllCinemasSelected,
      }}
    >
      {children}
    </CinemaLocationContext.Provider>
  )
}

export function useCinemaLocation(): CinemaLocationContextType {
  const context = useContext(CinemaLocationContext)
  if (!context) {
    throw new Error("useCinemaLocation must be used within a CinemaLocationProvider")
  }
  return context
}
