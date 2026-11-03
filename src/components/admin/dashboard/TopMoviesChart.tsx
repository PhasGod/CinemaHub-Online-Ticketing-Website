import React from "react"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts"
import { Film, Award } from "lucide-react"
import { TopMovieDataPoint } from "../../../types/dashboard"
import { formatVND } from "../../../services/dashboardData"

interface TopMoviesChartProps {
  movies: TopMovieDataPoint[]
}

const BAR_COLORS = ["#2563eb", "#0ea5e9", "#10b981", "#f59e0b", "#8b5cf6"]

export default function TopMoviesChart({ movies }: TopMoviesChartProps) {
  // Custom Tooltip for Top Movies
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const movie = payload[0].payload as TopMovieDataPoint
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs space-y-1 min-w-[180px]">
          <p className="font-black text-slate-900 border-b border-slate-100 pb-1">{movie.title}</p>
          <div className="flex justify-between text-slate-600">
            <span>Doanh thu:</span>
            <span className="font-bold text-blue-600">{formatVND(movie.revenue)}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Vé đã bán:</span>
            <span className="font-bold text-emerald-600">{movie.ticketsSold.toLocaleString("vi-VN")} vé</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>Tỷ trọng doanh thu:</span>
            <span className="font-bold text-slate-900">{movie.sharePercent}%</span>
          </div>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Header */}
      <div className="mb-3">
        <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
          <Award size={18} className="text-amber-500" />
          Top 5 Phim Doanh Thu Cao Nhất
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">Xếp hạng theo tổng doanh thu phòng vé</p>
      </div>

      {/* Mini Horizontal Bar Chart */}
      <div className="w-full h-44 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={movies}
            layout="vertical"
            margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              stroke="#94a3b8"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `${(v / 1000000).toFixed(0)}Tr`}
            />
            <YAxis
              type="category"
              dataKey="title"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              width={100}
              tickFormatter={(val) => (val.length > 12 ? `${val.substring(0, 12)}...` : val)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={16}>
              {movies.map((_, index) => (
                <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Ranked Movie List Details */}
      <div className="space-y-2 border-t border-slate-100 pt-3">
        {movies.map((m, idx) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-slate-50 transition text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[11px] shrink-0 ${
                  idx === 0
                    ? "bg-amber-100 text-amber-800 font-bold"
                    : idx === 1
                    ? "bg-slate-200 text-slate-700"
                    : idx === 2
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                {idx + 1}
              </span>

              <img
                src={m.poster}
                alt={m.title}
                className="w-7 h-10 object-cover rounded-md border border-slate-200 shrink-0 shadow-2xs"
              />

              <div className="min-w-0">
                <p className="font-bold text-slate-800 truncate">{m.title}</p>
                <p className="text-[11px] text-slate-400">{m.ticketsSold.toLocaleString("vi-VN")} vé</p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <p className="font-black text-slate-900">{formatVND(m.revenue)}</p>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                {m.sharePercent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
