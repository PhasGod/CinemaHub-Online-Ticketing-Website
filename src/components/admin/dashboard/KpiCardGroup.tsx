import React from "react"
import {
  TrendingUp,
  Ticket,
  MonitorPlay,
  UtensilsCrossed,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
} from "lucide-react"
import { DashboardKpi } from "../../../types/dashboard"
import { formatVND } from "../../../services/dashboardData"

interface KpiCardGroupProps {
  kpi: DashboardKpi
}

export default function KpiCardGroup({ kpi }: KpiCardGroupProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng doanh thu */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Tổng Doanh Thu
          </span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition">
            <DollarSign size={20} />
          </div>
        </div>

        <div className="mt-3">
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {formatVND(kpi.totalRevenue)}
          </p>

          <div className="mt-2 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md font-bold ${
                kpi.revenueGrowthPercent >= 0
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {kpi.revenueGrowthPercent >= 0 ? (
                <ArrowUpRight size={13} strokeWidth={2.5} />
              ) : (
                <ArrowDownRight size={13} strokeWidth={2.5} />
              )}
              {Math.abs(kpi.revenueGrowthPercent)}%
            </span>
            <span className="text-slate-500">so với kỳ trước</span>
          </div>
        </div>
      </div>

      {/* 2. Vé đã bán & Tỷ lệ lấp đầy */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Vé Bán & Tỷ Lệ Lấp Đầy
          </span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition">
            <Ticket size={20} />
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between">
            <p className="text-2xl font-black text-slate-900 tracking-tight">
              {kpi.ticketsSold.toLocaleString("vi-VN")}{" "}
              <span className="text-sm font-bold text-slate-500">vé</span>
            </p>
            <span className="text-xs font-black text-emerald-600 flex items-center gap-0.5">
              <Percent size={12} />
              {kpi.averageOccupancyRate}% lấp đầy
            </span>
          </div>

          {/* Progress bar lấp đầy */}
          <div className="mt-2.5">
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, kpi.averageOccupancyRate)}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>Tăng trưởng: +{kpi.ticketsGrowthPercent}%</span>
              <span>Mục tiêu: 80%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Suất chiếu trong kỳ */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Suất Chiếu Vận Hành
          </span>
          <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition">
            <MonitorPlay size={20} />
          </div>
        </div>

        <div className="mt-3">
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {kpi.totalShowtimes}{" "}
            <span className="text-sm font-bold text-slate-500">suất</span>
          </p>

          {/* Breakdown tags */}
          <div className="mt-2.5 flex items-center gap-2 text-[11px] font-semibold flex-wrap">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {kpi.showtimesPlaying} Đang chiếu
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {kpi.showtimesUpcoming} Sắp chiếu
            </span>
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              {kpi.showtimesFinished} Đã xong
            </span>
          </div>
        </div>
      </div>

      {/* 4. Doanh thu Dịch vụ / F&B */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs hover:shadow-md transition group">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Dịch Vụ Bắp Nước (F&B)
          </span>
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition">
            <UtensilsCrossed size={20} />
          </div>
        </div>

        <div className="mt-3">
          <p className="text-2xl font-black text-slate-900 tracking-tight">
            {formatVND(kpi.fnbRevenue)}
          </p>

          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
              Chiếm {kpi.fnbSharePercent}%
            </span>
            <span className="text-slate-500 text-[11px]">Tổng doanh thu rạp</span>
          </div>
        </div>
      </div>
    </div>
  )
}
