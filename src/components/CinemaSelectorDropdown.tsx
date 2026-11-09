import React, { useState, useRef, useEffect, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  ChevronDown,
  ChevronRight,
  Check,
  Building2,
} from "lucide-react"
import {
  useCinemaLocation,
  ALL_CINEMAS_OPTION,
  type CinemaLocation,
} from "../context/CinemaLocationContext"
import { useToast } from "./Toast"

function cn(...names: Array<string | false | null | undefined>) {
  return names.filter(Boolean).join(" ")
}

export default function CinemaSelectorDropdown() {
  const { selectedCinema, changeCinema, cinemas, isAllCinemasSelected } =
    useCinemaLocation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  // Chuẩn hóa nhóm rạp theo Khu vực / Tỉnh Thành phố (Theo phong cách cascade 2 cột)
  const normalizedGroups = useMemo(() => {
    const groups: Record<string, CinemaLocation[]> = {
      "Hà Nội": [],
      "TP. Hồ Chí Minh": [],
      "Đồng Nai": [],
      "Bình Dương": [],
    }

    cinemas.forEach((c) => {
      const city = c.city || ""
      const addr = c.address || ""
      const name = c.name || ""

      if (city.includes("Hà Nội") || addr.includes("Hà Nội")) {
        groups["Hà Nội"].push(c)
      } else if (
        city.includes("Hồ Chí Minh") ||
        city.includes("TP.HCM") ||
        addr.includes("Hồ Chí Minh") ||
        addr.includes("TP. HCM") ||
        addr.includes("Quận") ||
        addr.includes("Thủ Đức") ||
        addr.includes("Gò Vấp")
      ) {
        groups["TP. Hồ Chí Minh"].push(c)
      } else if (
        city.includes("Đồng Nai") ||
        city.includes("Biên Hòa") ||
        addr.includes("Đồng Nai") ||
        addr.includes("Biên Hòa") ||
        name.includes("Biên Hòa") ||
        name.includes("Long Thành")
      ) {
        groups["Đồng Nai"].push(c)
      } else if (
        city.includes("Bình Dương") ||
        addr.includes("Bình Dương") ||
        addr.includes("Dĩ An") ||
        addr.includes("Thủ Dầu Một") ||
        name.includes("Dĩ An") ||
        name.includes("Thủ Dầu Một")
      ) {
        groups["Bình Dương"].push(c)
      } else {
        const otherCity = c.city || "Khác"
        if (!groups[otherCity]) groups[otherCity] = []
        groups[otherCity].push(c)
      }
    })

    const finalGroups: Record<string, CinemaLocation[]> = {}
    Object.entries(groups).forEach(([key, list]) => {
      if (list.length > 0) finalGroups[key] = list
    })
    return finalGroups
  }, [cinemas])

  const cityList = useMemo(() => {
    return Object.keys(normalizedGroups)
  }, [normalizedGroups])

  // Thành phố đang được active ở cột trái (mặc định lấy theo rạp đang chọn)
  const [activeCity, setActiveCity] = useState<string>("Đồng Nai")

  // Đồng bộ activeCity khi mở dropdown hoặc khi selectedCinema thay đổi
  useEffect(() => {
    if (isOpen) {
      const currentCity = selectedCinema.city || ""
      const currentName = selectedCinema.name || ""
      if (
        currentCity.includes("Biên Hòa") ||
        currentCity.includes("Đồng Nai") ||
        currentName.includes("Biên Hòa") ||
        currentName.includes("Long Thành")
      ) {
        setActiveCity("Đồng Nai")
      } else if (
        currentCity.includes("Hồ Chí Minh") ||
        currentCity.includes("TP.HCM") ||
        currentName.includes("Thủ Đức") ||
        currentName.includes("Quận")
      ) {
        setActiveCity("TP. Hồ Chí Minh")
      } else if (currentCity.includes("Hà Nội") || currentName.includes("Ba Đình") || currentName.includes("Hà Đông")) {
        setActiveCity("Hà Nội")
      } else if (currentCity.includes("Bình Dương") || currentName.includes("Dĩ An") || currentName.includes("Thủ Dầu Một")) {
        setActiveCity("Bình Dương")
      } else if (cityList.length > 0) {
        setActiveCity(cityList[0])
      }
    }
  }, [isOpen, selectedCinema, cityList])

  // Đóng dropdown khi click bên ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const handleSelectCinema = (cinema: CinemaLocation) => {
    changeCinema(cinema)
    setIsOpen(false)

    showToast(
      cinema.id === ALL_CINEMAS_OPTION.id
        ? "Đã chọn xem tất cả rạp trên toàn quốc"
        : `Đã chọn rạp: ${cinema.name}`,
      "info",
      "Đổi rạp thành công"
    )

    if (
      location.pathname.startsWith("/showtimes") ||
      location.pathname.startsWith("/booking")
    ) {
      const searchParams = new URLSearchParams(location.search)
      if (cinema.id === ALL_CINEMAS_OPTION.id) {
        searchParams.delete("cinemaId")
      } else {
        searchParams.set("cinemaId", cinema.id)
      }
      const newQuery = searchParams.toString()
      navigate(`${location.pathname}${newQuery ? `?${newQuery}` : ""}`, {
        replace: true,
      })
    }
  }

  // Tên hiển thị trên nút Header
  const displayLabel = isAllCinemasSelected
    ? "Tất cả rạp"
    : selectedCinema.name

  const cinemasInActiveCity = normalizedGroups[activeCity] || []

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Nút bấm Chọn Rạp dạng Viên Thuốc (Pill button như ảnh 1) */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border bg-white transition-all duration-150 select-none cursor-pointer shadow-2xs",
          isOpen
            ? "border-[#005baa] ring-2 ring-[#005baa]/15 text-[#005baa]"
            : "border-slate-300 hover:border-[#005baa] text-[#005baa]"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Chọn cụm rạp chiếu phim"
      >
        <span className="font-semibold text-xs sm:text-sm max-w-[130px] sm:max-w-[170px] truncate">
          {displayLabel}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-[#005baa] transition-transform duration-200 shrink-0",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {/* Flyout 2 Cột chuẩn như ảnh 1 */}
      {isOpen && (
        <div
          className="absolute left-0 mt-2 z-50 flex shadow-2xl rounded-none md:rounded-b-lg border border-slate-200 bg-white animate-in fade-in duration-100 max-w-[95vw]"
          role="menu"
        >
          {/* Mũi tên nhỏ trỏ lên nút chọn (Pointer triangle giống ảnh 1) */}
          <div className="absolute -top-1.5 left-6 w-3 h-3 bg-[#005baa] rotate-45 pointer-events-none" />

          {/* CỘT 1 (BÊN TRÁI): DANH SÁCH TỈNH / THÀNH PHỐ */}
          <div className="w-36 sm:w-44 bg-white border-r border-slate-200 flex flex-col py-0 shrink-0 select-none">
            {cityList.map((city) => {
              const isActive = activeCity === city
              return (
                <div
                  key={city}
                  onMouseEnter={() => setActiveCity(city)}
                  onClick={() => setActiveCity(city)}
                  className={cn(
                    "flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-medium cursor-pointer transition-colors border-b border-slate-100 last:border-b-0",
                    isActive
                      ? "bg-[#005baa] text-white"
                      : "text-slate-700 hover:bg-slate-50 hover:text-[#005baa]"
                  )}
                >
                  <span className="truncate">{city}</span>
                  <ChevronRight
                    size={14}
                    className={cn(
                      "shrink-0 ml-1 transition-transform",
                      isActive ? "text-white" : "text-slate-400"
                    )}
                  />
                </div>
              )
            })}

            {/* Mục Toàn quốc ở cuối cột trái */}
            <div
              onMouseEnter={() => setActiveCity("Toàn quốc")}
              onClick={() => setActiveCity("Toàn quốc")}
              className={cn(
                "flex items-center justify-between px-3.5 py-2.5 text-xs sm:text-sm font-medium cursor-pointer transition-colors border-t border-slate-200 select-none",
                activeCity === "Toàn quốc"
                  ? "bg-[#005baa] text-white"
                  : "text-slate-700 hover:bg-slate-50 hover:text-[#005baa]"
              )}
            >
              <span>Toàn quốc</span>
              <ChevronRight
                size={14}
                className={activeCity === "Toàn quốc" ? "text-white" : "text-slate-400"}
              />
            </div>
          </div>

          {/* CỘT 2 (BÊN PHẢI): DANH SÁCH RẠP TRỰC THUỘC TỈNH/THÀNH ĐANG CHỌN */}
          <div className="w-52 sm:w-64 bg-white flex flex-col py-0 max-h-[380px] overflow-y-auto shrink-0">
            {activeCity === "Toàn quốc" ? (
              <div className="p-3">
                <button
                  type="button"
                  onClick={() => handleSelectCinema(ALL_CINEMAS_OPTION)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between group cursor-pointer",
                    isAllCinemasSelected
                      ? "bg-blue-50 border-blue-200 text-[#005baa]"
                      : "border-slate-200 hover:border-blue-300 hover:bg-slate-50 text-slate-700"
                  )}
                >
                  <div>
                    <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                      <Building2 size={15} />
                      Tất cả cụm rạp
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Xem lịch chiếu trên toàn hệ thống
                    </div>
                  </div>
                  {isAllCinemasSelected && (
                    <Check size={16} className="text-[#005baa] shrink-0 ml-2" />
                  )}
                </button>
              </div>
            ) : cinemasInActiveCity.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Chưa có rạp chiếu tại khu vực này
              </div>
            ) : (
              cinemasInActiveCity.map((cinema) => {
                const isCurrent = selectedCinema.id === cinema.id
                return (
                  <button
                    key={cinema.id}
                    type="button"
                    onClick={() => handleSelectCinema(cinema)}
                    className={cn(
                      "w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors border-b border-slate-100 last:border-b-0 flex items-center justify-between group cursor-pointer",
                      isCurrent
                        ? "text-[#005baa] font-bold bg-blue-50/60"
                        : "text-slate-600 hover:text-[#005baa] hover:bg-slate-50"
                    )}
                  >
                    <span className="truncate pr-2">{cinema.name}</span>
                    {isCurrent && (
                      <Check size={15} className="text-[#005baa] shrink-0" />
                    )}
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
