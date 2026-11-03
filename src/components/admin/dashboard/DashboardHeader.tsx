import React, { useState } from "react"
import {
  Calendar,
  Building2,
  Download,
  RefreshCw,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  ChevronDown,
} from "lucide-react"
import { DashboardFilterState, TimeRangeFilter } from "../../../types/dashboard"
import { CINEMA_OPTIONS, exportDashboardToCsv } from "../../../services/dashboardData"
import { DashboardData } from "../../../types/dashboard"

interface DashboardHeaderProps {
  filters: DashboardFilterState
  onFilterChange: (newFilters: DashboardFilterState) => void
  onRefresh: () => void
  isRefreshing: boolean
  dashboardData: DashboardData
}

export default function DashboardHeader({
  filters,
  onFilterChange,
  onRefresh,
  isRefreshing,
  dashboardData,
}: DashboardHeaderProps) {
  const [showExportToast, setShowExportToast] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)

  const handleTimeRangeClick = (range: TimeRangeFilter) => {
    let startDate = filters.startDate
    let endDate = filters.endDate
    const now = new Date()

    if (range === "today") {
      startDate = now.toISOString().split("T")[0]
      endDate = startDate
    } else if (range === "last7days") {
      const past = new Date()
      past.setDate(now.getDate() - 7)
      startDate = past.toISOString().split("T")[0]
      endDate = now.toISOString().split("T")[0]
    } else if (range === "thisMonth") {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
      startDate = firstDay.toISOString().split("T")[0]
      endDate = now.toISOString().split("T")[0]
    }

    onFilterChange({
      ...filters,
      timeRange: range,
      startDate,
      endDate,
    })
  }

  const handleExport = (type: "excel" | "csv") => {
    setShowExportMenu(false)
    const timeLabel =
      filters.timeRange === "today"
        ? "Hom-nay"
        : filters.timeRange === "last7days"
        ? "7-ngay"
        : "Thang-nay"
    const fileName = `CinemaHub-Bao-cao-doanh-thu-${timeLabel}.csv`
    exportDashboardToCsv(dashboardData, fileName)
    setShowExportToast(true)
    setTimeout(() => setShowExportToast(false), 3500)
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Toast feedback */}
      {showExportToast && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-lg shadow-emerald-600/30 text-xs font-bold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} />
          <span>Đã xuất thành công file báo cáo doanh thu & vận hành!</span>
        </div>
      )}

      {/* Row 1: Title & Main actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center font-bold shadow-xs">
              <TrendingUp size={20} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                Executive Analytics Dashboard
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  Real-time BI
                </span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Bảng điều khiển kinh doanh, doanh thu phòng vé và theo dõi vận hành toàn diện CinemaHub
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2.5 self-start lg:self-center">
          {/* Export dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer shadow-2xs"
            >
              <Download size={14} className="text-blue-600" />
              <span>Xuất báo cáo</span>
              <ChevronDown size={13} className="text-slate-400" />
            </button>

            {showExportMenu && (
              <div className="absolute right-0 mt-1.5 w-48 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-30 text-xs space-y-1">
                <button
                  type="button"
                  onClick={() => handleExport("excel")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="text-emerald-600" />
                  <span>Xuất file Excel / CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport("csv")}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-2 transition cursor-pointer"
                >
                  <Download size={15} className="text-blue-600" />
                  <span>Tải bản tóm tắt nhanh</span>
                </button>
              </div>
            )}
          </div>

          {/* Refresh button */}
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition cursor-pointer shadow-xs shadow-blue-600/20 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            <span>{isRefreshing ? "Đang đồng bộ..." : "Làm mới dữ liệu"}</span>
          </button>
        </div>
      </div>

      {/* Row 2: Filter Toolbar */}
      <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Quick Time Range Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 overflow-x-auto">
          {(
            [
              { id: "today", label: "Hôm nay" },
              { id: "last7days", label: "7 ngày qua" },
              { id: "thisMonth", label: "Tháng này" },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleTimeRangeClick(id)}
              className={`px-3.5 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                filters.timeRange === id
                  ? "bg-white text-blue-700 shadow-xs border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {label}
            </button>
          ))}

          {/* Custom Date Pickers */}
          <div className="hidden sm:flex items-center gap-1 pl-2 border-l border-slate-200 ml-1">
            <Calendar size={13} className="text-slate-400" />
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  timeRange: "custom",
                  startDate: e.target.value,
                })
              }
              className="bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
            />
            <span className="text-slate-400 font-sans">-</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  timeRange: "custom",
                  endDate: e.target.value,
                })
              }
              className="bg-transparent text-[11px] font-semibold text-slate-700 focus:outline-none cursor-pointer"
            />
          </div>
        </div>

        {/* Cinema Branch Dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-bold flex items-center gap-1 shrink-0">
            <Building2 size={14} className="text-slate-400" />
            Chi nhánh:
          </span>
          <select
            value={filters.cinemaId}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                cinemaId: e.target.value,
              })
            }
            className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition cursor-pointer"
          >
            {CINEMA_OPTIONS.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
