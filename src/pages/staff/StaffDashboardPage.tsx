import React, { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import {
  CalendarDays,
  Ticket,
  CheckCircle2,
  Clock,
  TrendingUp,
  Loader2,
  ArrowRight,
  RefreshCw,
  QrCode,
  Armchair,
  Film,
  Sparkles,
} from "lucide-react"
import { staffGetStats, StaffStatsResponse } from "../../services/bookingApi"

export default function StaffDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<StaffStatsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const loadStats = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const res = await staffGetStats()
      setData(res)
    } catch (err: any) {
      setError(err.message || "Không thể tải số liệu thống kê ca làm việc")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val)
  }

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })
  }

  return (
    <div className="space-y-8">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider mb-1">
            <Sparkles size={14} /> Tổng quan ca làm việc
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800">Bảng điều phối hôm nay</h1>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi lưu lượng khách, tỷ lệ soát vé và các suất chiếu sắp bắt đầu
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/staff/check-in")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition"
          >
            <QrCode size={18} /> Mở trạm soát vé
          </button>

          <button
            onClick={loadStats}
            disabled={isLoading}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition shadow-xs disabled:opacity-50"
            title="Làm mới số liệu"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm">
          {error}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <CalendarDays size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Suất chiếu hôm nay</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {isLoading ? "..." : data?.stats.todayShowtimesCount ?? 0}
            </p>
            <p className="text-[11px] text-blue-600 font-medium">Đang lên lịch rạp</p>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Ticket size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Vé đã bán trong ngày</p>
            <p className="text-2xl font-black text-slate-800 mt-0.5">
              {isLoading ? "..." : data?.stats.ticketsSoldToday ?? 0}
            </p>
            <p className="text-[11px] text-rose-600 font-medium">Vé điện tử thành công</p>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Vé đã qua cửa soát</p>
            <p className="text-2xl font-black text-emerald-600 mt-0.5">
              {isLoading ? "..." : data?.stats.ticketsCheckedInToday ?? 0}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium">Khách đã vào phòng</p>
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex items-center gap-4">
          <div className="w-13 h-13 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <TrendingUp size={26} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">Tỷ lệ vào rạp</p>
            <p className="text-2xl font-black text-amber-600 mt-0.5">
              {isLoading ? "..." : `${data?.stats.checkInRate ?? 0}%`}
            </p>
            <p className="text-[11px] text-amber-600 font-medium">Tiến độ đón khách</p>
          </div>
        </div>
      </div>

      {/* Upcoming Showtimes Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="text-emerald-600" size={20} />
            <h2 className="text-lg font-bold text-slate-800">Suất chiếu sắp diễn ra (Gần nhất)</h2>
          </div>
          <span className="text-xs text-slate-500">
            {data?.upcomingShowtimes?.length ?? 0} suất chiếu cần chuẩn bị đón khách
          </span>
        </div>

        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
            <p className="text-xs">Đang tải lịch chiếu...</p>
          </div>
        ) : !data || data.upcomingShowtimes.length === 0 ? (
          <div className="p-12 text-center text-slate-500 bg-slate-50/50">
            <p className="text-sm font-semibold">Hiện không có suất chiếu nào sắp diễn ra trong 2 giờ tới.</p>
            <p className="text-xs text-slate-400 mt-1">Tất cả các phòng chiếu hiện đang trống hoặc đã kết thúc ca.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-6 py-4">Phim</th>
                  <th className="px-6 py-4">Phòng chiếu</th>
                  <th className="px-6 py-4">Giờ chiếu</th>
                  <th className="px-6 py-4">Giá vé</th>
                  <th className="px-6 py-4">Tình trạng ghế</th>
                  <th className="px-6 py-4 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.upcomingShowtimes.map((st) => {
                  const s = new Date(st.startTime)
                  const e = new Date(st.endTime)

                  return (
                    <tr key={st.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              st.moviePoster ||
                              "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=100&q=80"
                            }
                            alt=""
                            className="w-10 h-14 object-cover rounded-lg shadow-xs border border-slate-200 shrink-0"
                          />
                          <div>
                            <span className="font-bold text-slate-900 block">{st.movieTitle}</span>
                            <span className="text-[10px] font-bold text-emerald-700 uppercase bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {st.format}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800 block">{st.roomName}</span>
                        <span className="text-xs text-slate-400">{st.cinemaName}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800 text-base">
                          {formatTime(st.startTime)}
                        </div>
                        <div className="text-xs text-slate-400">
                          kết thúc ~ {formatTime(st.endTime)}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-bold text-rose-600">
                        {formatPrice(st.price)}
                      </td>

                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200">
                          <Armchair size={13} className="text-emerald-600" />
                          Trống {st.availableSeats ?? "?"} ghế
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => navigate(`/staff/check-in?showtimeId=${st.id}`)}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                        >
                          <QrCode size={14} /> Soát vé nhanh
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
