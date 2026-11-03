import React, { useState } from "react"
import { MonitorPlay, Clock, Armchair, ChevronRight, Filter } from "lucide-react"
import { LiveShowtimeItem } from "../../../types/dashboard"
import { formatVND } from "../../../services/dashboardData"

interface LiveShowtimesTableProps {
  showtimes: LiveShowtimeItem[]
}

export default function LiveShowtimesTable({ showtimes }: LiveShowtimesTableProps) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | "PLAYING" | "UPCOMING">("ALL")

  const filtered = showtimes.filter((st) => {
    if (statusFilter === "ALL") return true
    return st.status === statusFilter
  })

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      {/* Table Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center font-bold shadow-2xs">
            <MonitorPlay size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              Giám Sát Suất Chiếu Nóng Trong Ngày
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-700 border border-violet-200">
                Live Ops
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi tiến độ lấp đầy ghế và doanh thu thời gian thực từng phòng chiếu
            </p>
          </div>
        </div>

        {/* Filter Badges */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              statusFilter === "ALL"
                ? "bg-slate-800 text-white shadow-2xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Tất cả ({showtimes.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("PLAYING")}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              statusFilter === "PLAYING"
                ? "bg-emerald-600 text-white shadow-2xs"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            }`}
          >
            Đang chiếu ({showtimes.filter((s) => s.status === "PLAYING").length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter("UPCOMING")}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              statusFilter === "UPCOMING"
                ? "bg-blue-600 text-white shadow-2xs"
                : "bg-blue-50 text-blue-700 hover:bg-blue-100"
            }`}
          >
            Sắp chiếu ({showtimes.filter((s) => s.status === "UPCOMING").length})
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Bộ phim</th>
              <th className="py-3.5 px-4">Phòng & Rạp</th>
              <th className="py-3.5 px-4">Khung giờ</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4 min-w-[170px]">Tiến độ bán vé</th>
              <th className="py-3.5 px-4 text-right">Doanh thu tạm tính</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filtered.map((st) => (
              <tr key={st.id} className="hover:bg-slate-50/70 transition">
                {/* Poster & Movie Title */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={st.moviePoster}
                      alt={st.movieTitle}
                      className="w-9 h-12 object-cover rounded-lg border border-slate-200 shrink-0 shadow-2xs"
                    />
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 line-clamp-1">{st.movieTitle}</p>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {st.id}</span>
                    </div>
                  </div>
                </td>

                {/* Room & Cinema */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      {st.roomName}
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {st.roomFormat}
                      </span>
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[160px]">
                      {st.cinemaName}
                    </p>
                  </div>
                </td>

                {/* Showtime Hours */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-slate-800 font-mono font-bold">
                    <Clock size={13} className="text-slate-400" />
                    <span>{st.startTime}</span>
                    <span className="text-slate-400 font-sans text-[11px]">-</span>
                    <span className="text-slate-500">{st.endTime}</span>
                  </div>
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {st.status === "PLAYING" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Đang chiếu
                    </span>
                  )}
                  {st.status === "UPCOMING" && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      Sắp chiếu
                    </span>
                  )}
                  {st.status === "FINISHED" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                      Đã kết thúc
                    </span>
                  )}
                </td>

                {/* Progress bar */}
                <td className="py-3.5 px-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-800">
                        {st.bookedSeats} / {st.totalSeats} ghế
                      </span>
                      <span className="font-black text-emerald-600">{st.occupancyPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          st.occupancyPercent >= 90
                            ? "bg-rose-500"
                            : st.occupancyPercent >= 75
                            ? "bg-emerald-500"
                            : "bg-blue-500"
                        }`}
                        style={{ width: `${st.occupancyPercent}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Estimated Revenue */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <span className="font-black text-slate-900 text-sm">
                    {formatVND(st.estimatedRevenue)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
