import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  Clock,
  Film,
  MonitorPlay,
  Armchair,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  QrCode,
  X,
  RefreshCw,
  Eye,
  Percent,
} from "lucide-react"
import { getShowtimes, getShowtimeSeats } from "../../services/bookingApi"
import { ShowtimeItem, ShowtimeSeatsResponse, ShowtimeSeatItem } from "../../types/booking"

export default function StaffShowtimesPage() {
  const navigate = useNavigate()

  // Selected date (format: YYYY-MM-DD)
  const todayStr = new Date().toISOString().split("T")[0]
  const [selectedDate, setSelectedDate] = useState<string>(todayStr)
  const [showtimes, setShowtimes] = useState<ShowtimeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [roomFilter, setRoomFilter] = useState<string>("ALL")

  // Seat Map Modal state
  const [selectedShowtime, setSelectedShowtime] = useState<ShowtimeItem | null>(null)
  const [seatMapData, setSeatMapData] = useState<ShowtimeSeatsResponse | null>(null)
  const [loadingSeats, setLoadingSeats] = useState(false)
  const [seatMapError, setSeatMapError] = useState<string | null>(null)
  const [hoveredSeat, setHoveredSeat] = useState<ShowtimeSeatItem | null>(null)

  // Quick dates (Today, Tomorrow, Day after tomorrow)
  const dateOptions = [0, 1, 2, 3].map((offset) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    const dateStr = d.toISOString().split("T")[0]
    let label = ""
    if (offset === 0) label = "Hôm nay"
    else if (offset === 1) label = "Ngày mai"
    else {
      label = d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit" })
    }
    return { dateStr, label, fullDisplay: d.toLocaleDateString("vi-VN") }
  })

  const fetchShowtimes = async (date: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await getShowtimes({ date })
      setShowtimes(res.showtimes || [])
    } catch (err: any) {
      console.error("Failed to load showtimes:", err)
      setError(err.message || "Không thể tải danh sách suất chiếu")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchShowtimes(selectedDate)
  }, [selectedDate])

  const handleOpenSeatMap = async (st: ShowtimeItem) => {
    setSelectedShowtime(st)
    setLoadingSeats(true)
    setSeatMapError(null)
    setHoveredSeat(null)
    try {
      const res = await getShowtimeSeats(st.id)
      setSeatMapData(res)
    } catch (err: any) {
      console.error("Failed to load seat map:", err)
      setSeatMapError(err.message || "Không thể tải sơ đồ ghế cho suất chiếu này")
    } finally {
      setLoadingSeats(false)
    }
  }

  // Extract unique rooms for filtering
  const availableRooms = Array.from(new Set(showtimes.map((s) => s.roomName))).filter(Boolean)

  const filteredShowtimes = showtimes.filter((st) => {
    const matchesSearch =
      !searchQuery ||
      st.movieTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      st.roomName.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesRoom = roomFilter === "ALL" || st.roomName === roomFilter
    return matchesSearch && matchesRoom
  })

  // Format Helpers
  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
  }

  const formatCurrency = (val: number) => {
    return Number(val).toLocaleString("vi-VN") + " ₫"
  }

  // Calculate seat stats for selected showtime modal
  const totalSeats = seatMapData?.seats.length || 0
  const bookedSeats = seatMapData?.seats.filter((s) => s.status === "BOOKED").length || 0
  const heldSeats = seatMapData?.seats.filter((s) => s.status === "HELD").length || 0
  const availableSeats = seatMapData?.seats.filter((s) => s.status === "AVAILABLE").length || 0
  const occupancyRate = totalSeats > 0 ? Math.round(((bookedSeats + heldSeats) / totalSeats) * 100) : 0

  // Group seats by row
  const rows = seatMapData ? Array.from(new Set(seatMapData.seats.map((s) => s.row))).sort() : []
  const seatsByRow = rows.reduce<Record<string, ShowtimeSeatItem[]>>((acc, row) => {
    if (seatMapData) {
      acc[row] = seatMapData.seats.filter((s) => s.row === row).sort((a, b) => a.number - b.number)
    }
    return acc
  }, {})

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm">
            <CalendarDays size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Điều phối & Giám sát suất chiếu</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi tình trạng lấp đầy phòng chiếu và sơ đồ ghế thời gian thực theo từng suất.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchShowtimes(selectedDate)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới dữ liệu
        </button>
      </div>

      {/* Date Tabs & Search Filter */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4 shadow-xs">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Quick Date Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {dateOptions.map(({ dateStr, label }) => (
              <button
                key={dateStr}
                onClick={() => setSelectedDate(dateStr)}
                className={`px-4 py-2 rounded-xl font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedDate === dateStr
                    ? "bg-rose-600 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200"
                }`}
              >
                {label}
              </button>
            ))}

            <input
              type="date"
              value={selectedDate}
              onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white"
            />
          </div>

          {/* Room Filter Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold flex items-center gap-1 shrink-0">
              <Filter size={14} /> Phòng:
            </span>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 text-xs font-semibold focus:outline-none focus:border-rose-500 focus:bg-white"
            >
              <option value="ALL">Tất cả các phòng ({availableRooms.length})</option>
              {availableRooms.map((room) => (
                <option key={room} value={room}>
                  {room}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search by movie name */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên phim hoặc phòng chiếu..."
            className="w-full h-10 pl-10 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Showtimes Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500">Đang tải danh sách suất chiếu trong ngày...</p>
        </div>
      ) : filteredShowtimes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center text-slate-400 space-y-2 shadow-xs">
          <MonitorPlay size={44} className="mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">Không có suất chiếu nào phù hợp</p>
          <p className="text-xs text-slate-500">Hãy chọn ngày khác hoặc đổi bộ lọc tìm kiếm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShowtimes.map((st) => {
            const now = new Date()
            const start = new Date(st.startTime)
            const end = new Date(st.endTime)
            const isPlaying = now >= start && now <= end
            const isUpcomingSoon = !isPlaying && now < start && start.getTime() - now.getTime() <= 7200000 // 2h

            return (
              <div
                key={st.id}
                className="bg-white border border-slate-200 hover:border-slate-300 rounded-2xl p-4 flex flex-col justify-between gap-4 transition shadow-xs group"
              >
                <div className="space-y-3">
                  {/* Top Bar: Room + Format & Status Badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5">
                      <MonitorPlay size={13} className="text-blue-600" />
                      {st.roomName} • {st.roomFormat || "2D"}
                    </span>

                    {isPlaying ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Đang chiếu
                      </span>
                    ) : isUpcomingSoon ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold">
                        Sắp chiếu (2h)
                      </span>
                    ) : now > end ? (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200 text-[10px] font-semibold">
                        Đã kết thúc
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                        Sắp tới
                      </span>
                    )}
                  </div>

                  {/* Movie Info */}
                  <div className="flex gap-3">
                    {st.moviePoster && (
                      <img
                        src={st.moviePoster}
                        alt={st.movieTitle}
                        className="w-14 h-20 object-cover rounded-xl border border-slate-200 shrink-0 shadow-xs"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-rose-600 transition">
                        {st.movieTitle}
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Clock size={12} />
                        {st.runtime ? `${st.runtime} phút` : "Chưa rõ"} • {formatCurrency(st.price)}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        {st.cinemaName || "5TOP CINEMA"}
                      </p>
                    </div>
                  </div>

                  {/* Time Range */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="font-bold text-slate-900 text-sm">{formatTime(st.startTime)}</span>
                    <span className="text-slate-400 font-sans text-[11px]">đến</span>
                    <span className="font-bold text-slate-600">{formatTime(st.endTime)}</span>
                  </div>
                </div>

                {/* Bottom Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenSeatMap(st)}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Armchair size={14} className="text-rose-500" />
                    Sơ đồ ghế & Lấp đầy
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate("/staff/check-in")}
                    title="Mở trạm soát vé"
                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs transition cursor-pointer"
                  >
                    <QrCode size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Seat Map Inspector Modal */}
      {selectedShowtime && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative text-slate-800 my-auto">
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedShowtime(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer transition"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-rose-600">
                  {selectedShowtime.roomName} • {selectedShowtime.roomFormat || "2D"}
                </span>
                <h2 className="text-xl font-black text-slate-900 mt-0.5">{selectedShowtime.movieTitle}</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Khung giờ: {formatTime(selectedShowtime.startTime)} - {formatTime(selectedShowtime.endTime)} (
                  {new Date(selectedShowtime.startTime).toLocaleDateString("vi-VN")})
                </p>
              </div>

              {/* Occupancy Rate Box */}
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 shrink-0">
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Tỷ lệ lấp đầy</p>
                  <p className="text-xl font-black text-emerald-600">{occupancyRate}%</p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black">
                  <Percent size={18} />
                </div>
              </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block text-[10px]">Tổng ghế</span>
                <span className="text-base font-bold text-slate-800">{totalSeats} ghế</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200">
                <span className="text-rose-600 block text-[10px] font-medium">Đã bán (Booked)</span>
                <span className="text-base font-bold text-rose-700">{bookedSeats} vé</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200">
                <span className="text-amber-700 block text-[10px] font-medium">Đang giữ (Held)</span>
                <span className="text-base font-bold text-amber-800">{heldSeats} ghế</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-emerald-700 block text-[10px] font-medium">Còn trống (Available)</span>
                <span className="text-base font-bold text-emerald-800">{availableSeats} ghế</span>
              </div>
            </div>

            {/* Seat Map Visualizer */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center">
              {loadingSeats ? (
                <div className="py-16 text-center">
                  <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                  <p className="text-xs text-slate-500">Đang tải trạng thái ghế thời gian thực...</p>
                </div>
              ) : seatMapError ? (
                <div className="py-12 text-center text-rose-600 text-xs">
                  <AlertCircle size={32} className="mx-auto mb-2 opacity-80" />
                  <p>{seatMapError}</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  {/* Screen bar */}
                  <div className="w-full max-w-lg mb-8 text-center">
                    <div className="h-1.5 w-full bg-gradient-to-r from-transparent via-rose-500 to-transparent rounded-full shadow-sm" />
                    <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-slate-400 mt-2">
                      Màn hình chiếu
                    </p>
                  </div>

                  {/* Seat Grid */}
                  <div className="w-full overflow-x-auto pb-4 scrollbar-none flex justify-center">
                    <div className="min-w-max space-y-2">
                      {rows.map((rowName) => (
                        <div key={rowName} className="flex items-center gap-2">
                          <span className="w-5 text-center text-xs font-bold text-slate-400">
                            {rowName}
                          </span>

                          <div className="flex gap-1.5">
                            {seatsByRow[rowName]?.map((seat) => {
                              const isBooked = seat.status === "BOOKED"
                              const isHeld = seat.status === "HELD"
                              const isAvailable = seat.status === "AVAILABLE"
                              const isVip = seat.type === "vip"

                              let seatClass =
                                "w-7 h-7 rounded-md text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer "

                              if (isBooked) {
                                seatClass += "bg-rose-100 border border-rose-300 text-rose-700"
                              } else if (isHeld) {
                                seatClass += "bg-amber-100 border border-amber-300 text-amber-800 animate-pulse"
                              } else if (isVip) {
                                seatClass += "bg-purple-100 border border-purple-300 text-purple-700 hover:scale-110"
                              } else {
                                seatClass += "bg-white border border-slate-300 text-slate-700 hover:scale-110 shadow-xs"
                              }

                              return (
                                <button
                                  key={seat.id}
                                  type="button"
                                  onMouseEnter={() => setHoveredSeat(seat)}
                                  onClick={() => setHoveredSeat(seat)}
                                  className={seatClass}
                                  title={`Ghế ${seat.row}${seat.number} (${isVip ? "VIP" : "Thường"}) - ${
                                    isBooked ? "Đã đặt" : isHeld ? "Đang giữ" : "Còn trống"
                                  }`}
                                >
                                  {seat.number}
                                </button>
                              )
                            })}
                          </div>

                          <span className="w-5 text-center text-xs font-bold text-slate-400">
                            {rowName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Seat Status Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-500 mt-6 pt-4 border-t border-slate-200 w-full">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-white border border-slate-300 shadow-xs" />
                      <span>Ghế thường trống</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300 text-purple-700 flex items-center justify-center font-bold text-[9px]">
                        V
                      </div>
                      <span>Ghế VIP trống</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-amber-100 border border-amber-300" />
                      <span>Đang tạm giữ</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-rose-100 border border-rose-300" />
                      <span>Đã thanh toán (Booked)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hovered Seat Inspector */}
            {hoveredSeat && (
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-mono font-bold text-emerald-700 shadow-xs">
                    Ghế {hoveredSeat.row}
                    {hoveredSeat.number}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 uppercase">
                      Hạng: {hoveredSeat.type === "vip" ? "VIP" : "Thường"}
                    </span>
                    <span className="text-slate-500 ml-2">
                      Giá: {formatCurrency(hoveredSeat.price)}
                    </span>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                    hoveredSeat.status === "BOOKED"
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : hoveredSeat.status === "HELD"
                      ? "bg-amber-50 text-amber-800 border border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {hoveredSeat.status === "BOOKED"
                    ? "Đã đặt (Booked)"
                    : hoveredSeat.status === "HELD"
                    ? "Đang tạm giữ (Held)"
                    : "Còn trống (Available)"}
                </span>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedShowtime(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer transition"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedShowtime(null)
                  navigate("/staff/check-in")
                }}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm shadow-rose-600/20"
              >
                <QrCode size={15} />
                Đi tới Soát vé suất này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
