import React from "react"
import { Users, Film, Tag, Building2, MonitorPlay, Armchair, ShieldCheck, Database } from "lucide-react"
import { AdminStats } from "../../../services/admin.service"

interface SystemInventoryBarProps {
  stats: AdminStats | null
  isLoading?: boolean
}

export default function SystemInventoryBar({ stats, isLoading }: SystemInventoryBarProps) {
  const items = [
    {
      label: "Tổng tài khoản",
      value: stats?.totalUsers ?? "—",
      icon: <Users size={16} className="text-violet-600" />,
      bg: "bg-violet-50 text-violet-700 border-violet-100",
    },
    {
      label: "Nhân viên & Admin",
      value: stats?.totalStaff ?? "—",
      icon: <ShieldCheck size={16} className="text-blue-600" />,
      bg: "bg-blue-50 text-blue-700 border-blue-100",
    },
    {
      label: "Bộ phim",
      value: stats?.totalMovies ?? "—",
      icon: <Film size={16} className="text-rose-600" />,
      bg: "bg-rose-50 text-rose-700 border-rose-100",
    },
    {
      label: "Thể loại",
      value: stats?.totalGenres ?? "—",
      icon: <Tag size={16} className="text-amber-600" />,
      bg: "bg-amber-50 text-amber-700 border-amber-100",
    },
    {
      label: "Cụm rạp",
      value: stats?.totalCinemas ?? "—",
      icon: <Building2 size={16} className="text-emerald-600" />,
      bg: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    {
      label: "Phòng chiếu",
      value: stats?.totalRooms ?? "—",
      icon: <MonitorPlay size={16} className="text-cyan-600" />,
      bg: "bg-cyan-50 text-cyan-700 border-cyan-100",
    },
    {
      label: "Tổng ghế ngồi",
      value: stats?.totalSeats ?? "—",
      icon: <Armchair size={16} className="text-indigo-600" />,
      bg: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
  ]

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
          <Database size={15} className="text-slate-400" />
          <span>Tổng Quan Hạ Tầng & Dữ Liệu Hệ Thống CinemaHub</span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">Cơ sở dữ liệu quản trị</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col justify-between hover:bg-slate-100/70 transition"
          >
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-[11px] text-slate-500 font-medium truncate">{item.label}</span>
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 border ${item.bg}`}
              >
                {item.icon}
              </div>
            </div>
            <p className="text-xl font-black text-slate-800">
              {isLoading ? (
                <span className="inline-block w-8 h-5 bg-slate-200 rounded animate-pulse" />
              ) : (
                item.value
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
