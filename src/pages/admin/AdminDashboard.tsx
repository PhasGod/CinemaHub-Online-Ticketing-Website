import React, { useState, useEffect, useCallback } from "react"
import { Loader2, AlertCircle, RefreshCw } from "lucide-react"
import { adminGetStats, adminGetDashboardStats, AdminStats } from "../../services/admin.service"
import { DashboardFilterState, DashboardData } from "../../types/dashboard"
import { createEmptyDashboardData } from "../../services/dashboardData"
import DashboardHeader from "../../components/admin/dashboard/DashboardHeader"
import KpiCardGroup from "../../components/admin/dashboard/KpiCardGroup"
import RevenueChart from "../../components/admin/dashboard/RevenueChart"
import TopMoviesChart from "../../components/admin/dashboard/TopMoviesChart"
import LiveShowtimesTable from "../../components/admin/dashboard/LiveShowtimesTable"
import RecentTransactionsTable from "../../components/admin/dashboard/RecentTransactionsTable"
import SystemInventoryBar from "../../components/admin/dashboard/SystemInventoryBar"

export function AdminDashboard() {
  const todayStr = new Date().toISOString().split("T")[0]

  // Filter state
  const [filters, setFilters] = useState<DashboardFilterState>({
    timeRange: "today",
    startDate: todayStr,
    endDate: todayStr,
    cinemaId: "ALL",
  })

  // Executive dashboard data from real backend
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true)
  const [dashboardError, setDashboardError] = useState<string | null>(null)

  // Real backend system stats
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch real backend system inventory counts
  const loadSystemStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const res = await adminGetStats()
      setAdminStats(res.stats)
    } catch (err) {
      console.warn("Could not load backend system stats:", err)
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  // Fetch real backend executive dashboard stats
  const loadDashboardData = useCallback(async (currentFilters: DashboardFilterState) => {
    setIsLoadingDashboard(true)
    setDashboardError(null)
    try {
      const res = await adminGetDashboardStats(currentFilters)
      if (res?.data) {
        setDashboardData(res.data)
      } else {
        setDashboardData(createEmptyDashboardData())
      }
    } catch (err: any) {
      console.error("Could not load real dashboard stats:", err)
      setDashboardError(err?.message || "Không thể kết nối đến máy chủ để lấy số liệu thực tế.")
    } finally {
      setIsLoadingDashboard(false)
    }
  }, [])

  useEffect(() => {
    loadSystemStats()
  }, [loadSystemStats])

  useEffect(() => {
    loadDashboardData(filters)
  }, [filters, loadDashboardData])

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      loadSystemStats(),
      loadDashboardData(filters),
    ])
    setIsRefreshing(false)
  }

  // Label for time range in chart
  const timeRangeLabel =
    filters.timeRange === "today"
      ? "Khung Giờ Hôm Nay"
      : filters.timeRange === "last7days"
      ? "7 Ngày Qua"
      : "Tháng Này"

  const activeData = dashboardData || createEmptyDashboardData()

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Filter Toolbar */}
      <DashboardHeader
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        dashboardData={activeData}
      />

      {/* Loading Skeleton / Spinner State */}
      {isLoadingDashboard && !dashboardData ? (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-16 text-center space-y-3 shadow-xs">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="font-bold text-slate-800 text-sm">Đang truy vấn dữ liệu vận hành từ máy chủ...</p>
          <p className="text-xs text-slate-400">Hệ thống đang tổng hợp doanh thu, lượng vé và suất chiếu thời gian thực.</p>
        </div>
      ) : dashboardError && !dashboardData ? (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center space-y-3 shadow-xs">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <p className="font-bold text-rose-800 text-sm">{dashboardError}</p>
          <button
            type="button"
            onClick={() => loadDashboardData(filters)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw size={14} /> Thử lại
          </button>
        </div>
      ) : (
        <>
          {/* 2. Top Business & Operations KPI Cards */}
          <KpiCardGroup kpi={activeData.kpi} />

          {/* 3. Visual Analytics Charts Grid (65% / 35%) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            <div className="lg:col-span-8">
              <RevenueChart data={activeData.revenueChart} timeRangeLabel={timeRangeLabel} />
            </div>
            <div className="lg:col-span-4">
              <TopMoviesChart movies={activeData.topMovies} />
            </div>
          </div>

          {/* 4. Operational Tables */}
          <div className="space-y-6">
            {/* Live Showtimes Table */}
            <LiveShowtimesTable showtimes={activeData.liveShowtimes} />

            {/* Recent Transactions Table */}
            <RecentTransactionsTable transactions={activeData.recentTransactions} />
          </div>
        </>
      )}

      {/* 5. System Inventory & Infrastructure Compact Bar */}
      <SystemInventoryBar stats={adminStats} isLoading={isLoadingStats} />
    </div>
  )
}

export default AdminDashboard
