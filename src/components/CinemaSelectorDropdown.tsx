import React, { useState, useRef, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
  MapPin,
  ChevronDown,
  Check,
  Building2,
  Search,
  Sparkles,
  X,
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
  const { selectedCinema, changeCinema, groupedCinemas, isAllCinemasSelected } =
    useCinemaLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [searchFilter, setSearchFilter] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()

  // Đóng dropdown khi click bên ngoài (click outside)
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
    setSearchFilter("")

    // Thông báo toast
    showToast(
      cinema.id === ALL_CINEMAS_OPTION.id
        ? "Đã chọn xem tất cả rạp trên toàn quốc"
        : `Đã chọn rạp: ${cinema.name}`,
      "info",
      "Đổi rạp thành công"
    )

    // Nếu đang ở trang Suất chiếu (/showtimes hoặc /booking), tự động reload/filter
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
    : selectedCinema.city || selectedCinema.name

  // Lọc danh sách rạp theo từ khóa tìm kiếm nhanh
  const query = searchFilter.trim().toLowerCase()
  const filteredGroupedCinemas = Object.entries(groupedCinemas).reduce<
    Record<string, CinemaLocation[]>
  >((acc, [city, cinemas]) => {
    if (!query) {
      acc[city] = cinemas
      return acc
    }
    const matched = cinemas.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.city.toLowerCase().includes(query) ||
        (c.address && c.address.toLowerCase().includes(query))
    )
    if (matched.length > 0) {
      acc[city] = matched
    }
    return acc
  }, {})

  const totalFilteredCount = Object.values(filteredGroupedCinemas).reduce(
    (acc, list) => acc + list.length,
    0
  )

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Nút bấm trên Header */}
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "location-button hide-tablet transition-all duration-200 select-none",
          isOpen && "ring-2 ring-blue-500/30 border-blue-500 bg-blue-50/40 text-blue-700"
        )}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Chọn rạp hoặc khu vực"
      >
        <MapPin size={17} className="text-blue-600 shrink-0" />
        <span className="font-semibold text-slate-800 max-w-[130px] truncate">
          {displayLabel}
        </span>
        <ChevronDown
          size={15}
          className={cn(
            "text-slate-500 shrink-0 transition-transform duration-200",
            isOpen && "rotate-180 text-blue-600"
          )}
        />
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          className="absolute right-0 sm:right-auto sm:left-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[500px]"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header của Popover */}
          <div className="p-3.5 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-100 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <MapPin size={15} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Chọn Rạp / Khu Vực
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Xem lịch chiếu và ưu đãi theo cụm rạp
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition-colors"
                aria-label="Đóng bảng chọn"
              >
                <X size={16} />
              </button>
            </div>

            {/* Ô tìm kiếm nhanh rạp */}
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Tìm nhanh rạp, quận, thành phố..."
                className="w-full pl-8.5 pr-8 py-1.5 text-xs rounded-xl border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 transition"
              />
              {searchFilter && (
                <button
                  type="button"
                  onClick={() => setSearchFilter("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Danh sách rạp có thanh cuộn */}
          <div className="overflow-y-auto p-2 space-y-2.5 flex-1 divide-y divide-slate-100">
            {/* Lựa chọn: Tất cả rạp */}
            {(!query ||
              ALL_CINEMAS_OPTION.name.toLowerCase().includes(query)) && (
              <div className="pb-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectCinema(ALL_CINEMAS_OPTION)}
                  className={cn(
                    "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all group",
                    isAllCinemasSelected
                      ? "bg-blue-50/90 text-blue-800 border border-blue-200 shadow-sm"
                      : "hover:bg-slate-50 text-slate-700"
                  )}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        isAllCinemasSelected
                          ? "bg-blue-600 text-white shadow-sm"
                          : "bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-600"
                      )}
                    >
                      <Building2 size={16} />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs sm:text-sm">
                          {ALL_CINEMAS_OPTION.name}
                        </span>
                        <span className="px-1.5 py-0.2 text-[10px] font-semibold rounded bg-amber-100 text-amber-800 shrink-0">
                          Toàn quốc
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {ALL_CINEMAS_OPTION.address}
                      </p>
                    </div>
                  </div>

                  {isAllCinemasSelected && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 ml-2">
                      <Check size={13} strokeWidth={3} />
                    </div>
                  )}
                </button>
              </div>
            )}

            {/* Danh sách rạp theo từng Tỉnh / Thành phố */}
            {totalFilteredCount === 0 && query ? (
              <div className="py-8 text-center text-slate-400 px-4">
                <MapPin size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium text-slate-600">
                  Không tìm thấy rạp nào
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Không có kết quả phù hợp với &ldquo;{searchFilter}&rdquo;
                </p>
              </div>
            ) : (
              Object.entries(filteredGroupedCinemas).map(([city, cinemas]) => (
                <div key={city} className="pt-2">
                  {/* Tiêu đề nhóm Tỉnh / Thành phố */}
                  <div className="flex items-center justify-between px-2.5 py-1 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      {city}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">
                      {cinemas.length} rạp
                    </span>
                  </div>

                  {/* Danh sách rạp con */}
                  <div className="space-y-1">
                    {cinemas.map((cinema) => {
                      const isSelected =
                        !isAllCinemasSelected && selectedCinema.id === cinema.id

                      return (
                        <button
                          key={cinema.id}
                          type="button"
                          onClick={() => handleSelectCinema(cinema)}
                          className={cn(
                            "w-full flex items-start justify-between p-2 rounded-xl text-left transition-all group",
                            isSelected
                              ? "bg-blue-50/90 text-blue-900 border border-blue-200 shadow-sm"
                              : "hover:bg-slate-50 text-slate-700"
                          )}
                          role="menuitem"
                        >
                          <div className="min-w-0 flex-1 pr-2">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={cn(
                                  "text-xs font-semibold truncate",
                                  isSelected
                                    ? "text-blue-700 font-bold"
                                    : "text-slate-800 group-hover:text-blue-600"
                                )}
                              >
                                {cinema.name}
                              </span>
                            </div>
                            {cinema.address && (
                              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 group-hover:text-slate-500">
                                {cinema.address}
                              </p>
                            )}
                          </div>

                          {isSelected ? (
                            <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                              <Check size={12} strokeWidth={3} />
                            </div>
                          ) : (
                            <div className="w-5 h-5 shrink-0 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity flex items-center justify-center mt-0.5">
                              <ChevronDown
                                size={12}
                                className="-rotate-90 text-slate-300 group-hover:text-blue-500"
                              />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer của Popover */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500 flex items-center gap-1">
              <Sparkles size={13} className="text-amber-500" />
              Đang chọn:{" "}
              <b className="text-slate-700 truncate max-w-[170px] inline-block align-bottom">
                {selectedCinema.name}
              </b>
            </span>
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                navigate("/cinemas")
              }}
              className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
            >
              Xem tất cả rạp &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
