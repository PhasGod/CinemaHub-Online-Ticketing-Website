import React, { useState } from "react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts"
import { TrendingUp, Layers } from "lucide-react"
import { RevenueChartDataPoint } from "../../../types/dashboard"
import { formatVND } from "../../../services/dashboardData"

interface RevenueChartProps {
  data: RevenueChartDataPoint[]
  timeRangeLabel: string
}

export default function RevenueChart({ data, timeRangeLabel }: RevenueChartProps) {
  const [metricView, setMetricView] = useState<"all" | "revenue" | "tickets">("all")

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pRevenue = payload.find((p: any) => p.dataKey === "revenue")
      const pTickets = payload.find((p: any) => p.dataKey === "tickets")
      const pFnb = payload.find((p: any) => p.dataKey === "fnbRevenue")

      return (
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[200px]">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1">
            Thời điểm: <span className="text-blue-600">{label}</span>
          </p>
          {pRevenue && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
                Doanh thu vé:
              </span>
              <span className="font-black text-slate-900">{formatVND(pRevenue.value)}</span>
            </div>
          )}
          {pFnb && (
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                Doanh thu F&B:
              </span>
              <span className="font-bold text-amber-700">{formatVND(pFnb.value)}</span>
            </div>
          )}
          {pTickets && (
            <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Lượng vé bán:
              </span>
              <span className="font-black text-emerald-600">{pTickets.value} vé</span>
            </div>
          )}
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-600" />
            Xu Hướng Doanh Thu & Lượng Vé
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu thống kê doanh thu bán vé và sản lượng vé theo {timeRangeLabel.toLowerCase()}
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-center">
          <button
            type="button"
            onClick={() => setMetricView("all")}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              metricView === "all"
                ? "bg-white text-blue-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Tổng hợp
          </button>
          <button
            type="button"
            onClick={() => setMetricView("revenue")}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              metricView === "revenue"
                ? "bg-white text-blue-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Doanh thu
          </button>
          <button
            type="button"
            onClick={() => setMetricView("tickets")}
            className={`px-3 py-1 rounded-lg transition cursor-pointer ${
              metricView === "tickets"
                ? "bg-white text-emerald-600 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Lượng vé
          </button>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full h-72 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="fnbGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="label"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) =>
                v >= 1000000 ? `${(v / 1000000).toFixed(0)}Tr` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
              }
            />
            {metricView !== "revenue" && (
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />
            )}
            <Tooltip content={<CustomTooltip />} />

            {/* Revenue Area */}
            {(metricView === "all" || metricView === "revenue") && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="revenue"
                name="Doanh thu vé"
                stroke="#2563eb"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#revenueGradient)"
                activeDot={{ r: 6, fill: "#2563eb", stroke: "#fff", strokeWidth: 2 }}
              />
            )}

            {/* F&B Area */}
            {metricView === "all" && (
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="fnbRevenue"
                name="Doanh thu F&B"
                stroke="#f59e0b"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#fnbGradient)"
                activeDot={{ r: 5, fill: "#f59e0b", stroke: "#fff", strokeWidth: 2 }}
              />
            )}

            {/* Tickets Line */}
            {(metricView === "all" || metricView === "tickets") && (
              <Line
                yAxisId={metricView === "tickets" ? "left" : "right"}
                type="monotone"
                dataKey="tickets"
                name="Lượng vé"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#10b981" }}
                activeDot={{ r: 6, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer Legend */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-6 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-blue-600 inline-block" />
          <span className="font-semibold text-slate-700">Doanh thu vé (VNĐ)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500 inline-block" />
          <span className="font-semibold text-slate-700">Doanh thu F&B (VNĐ)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500 inline-block" />
          <span className="font-semibold text-slate-700">Số lượng vé (Vé)</span>
        </div>
      </div>
    </div>
  )
}
