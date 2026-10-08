import React, { useState, useEffect } from "react"
import { Users, Film, Tag, MonitorPlay, Building2, Armchair, Loader2, TrendingUp } from "lucide-react"
import { adminGetStats, AdminStats } from "../../services/admin.service"

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
}

function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  )
}

export function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let active = true

    setIsLoading(true)
    setError("")

    adminGetStats()
      .then((res) => {
        if (active) setStats(res.stats)
      })
      .catch((err: unknown) => {
        if (!active) return

        setStats(null)
        setError(
          err instanceof Error
            ? err.message
            : "Không thể tải số liệu tổng quan",
        )
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    return () => {
      active = false
    }
  }, [reload])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <TrendingUp size={24} className="text-blue-600" /> Dashboard
        </h1>
        <p className="text-sm text-slate-500 mt-1">Tổng quan hệ thống CinemaHub</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={36} />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <p role="alert" className="mb-4 text-red-700">
            {error}
          </p>

          <button
            className="button button-primary"
            onClick={() => setReload((value) => value + 1)}
          >
            Thử lại
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <StatCard
            icon={<Users size={22} className="text-violet-600" />}
            label="Tổng tài khoản"
            value={stats?.totalUsers ?? "—"}
            color="bg-violet-100"
          />
          <StatCard
            icon={<Users size={22} className="text-blue-600" />}
            label="Nhân viên & Admin"
            value={stats?.totalStaff ?? "—"}
            color="bg-blue-100"
          />
          <StatCard
            icon={<Film size={22} className="text-rose-600" />}
            label="Bộ phim"
            value={stats?.totalMovies ?? "—"}
            color="bg-rose-100"
          />
          <StatCard
            icon={<Tag size={22} className="text-amber-600" />}
            label="Thể loại phim"
            value={stats?.totalGenres ?? "—"}
            color="bg-amber-100"
          />
          <StatCard
            icon={<Building2 size={22} className="text-emerald-600" />}
            label="Rạp chiếu"
            value={stats?.totalCinemas ?? "—"}
            color="bg-emerald-100"
          />
          <StatCard
            icon={<MonitorPlay size={22} className="text-cyan-600" />}
            label="Phòng chiếu"
            value={stats?.totalRooms ?? "—"}
            color="bg-cyan-100"
          />
          <StatCard
            icon={<Armchair size={22} className="text-indigo-600" />}
            label="Tổng số ghế"
            value={stats?.totalSeats ?? "—"}
            color="bg-indigo-100"
          />
        </div>
      )}
    </div>
  )
}
