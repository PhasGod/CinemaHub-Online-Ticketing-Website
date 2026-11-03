import React, { useState, useEffect, useCallback } from "react"
import { adminGetStats, AdminStats } from "../../services/admin.service"
import { DashboardFilterState, DashboardData } from "../../types/dashboard"
import { getExecutiveDashboardData } from "../../services/dashboardData"
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

  // Executive dashboard data
  const [dashboardData, setDashboardData] = useState<DashboardData>(() =>
    getExecutiveDashboardData({
      timeRange: "today",
      startDate: todayStr,
      endDate: todayStr,
      cinemaId: "ALL",
    })
  )

  // Real backend system stats
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch real backend counts
  const loadSystemStats = useCallback(async () => {
    setIsLoadingStats(true)
    try {
      const res = await adminGetStats()
      setAdminStats(res.stats)
    } catch (err) {
      console.warn("Could not load backend system stats, using fallback:", err)
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  useEffect(() => {
    loadSystemStats()
  }, [loadSystemStats])

  // Update executive analytics data whenever filters change
  useEffect(() => {
    const data = getExecutiveDashboardData(filters)
    setDashboardData(data)
  }, [filters])

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await Promise.all([
      loadSystemStats(),
      new Promise((resolve) => setTimeout(resolve, 600)),
    ])
    // Re-generate fresh data
    const refreshed = getExecutiveDashboardData(filters)
    setDashboardData(refreshed)
    setIsRefreshing(false)
  }

  // Label for time range in chart
  const timeRangeLabel =
    filters.timeRange === "today"
      ? "Khung Giờ Hôm Nay"
      : filters.timeRange === "last7days"
      ? "7 Ngày Qua"
      : "Tháng Này"

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* 1. Header & Filter Toolbar */}
      <DashboardHeader
        filters={filters}
        onFilterChange={setFilters}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        dashboardData={dashboardData}
      />

      {/* 2. Top Business & Operations KPI Cards */}
      <KpiCardGroup kpi={dashboardData.kpi} />

      {/* 3. Visual Analytics Charts Grid (65% / 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-8">
          <RevenueChart data={dashboardData.revenueChart} timeRangeLabel={timeRangeLabel} />
        </div>
        <div className="lg:col-span-4">
          <TopMoviesChart movies={dashboardData.topMovies} />
        </div>
      </div>

      {/* 4. Operational Tables */}
      <div className="space-y-6">
        {/* Live Showtimes Table */}
        <LiveShowtimesTable showtimes={dashboardData.liveShowtimes} />

        {/* Recent Transactions Table */}
        <RecentTransactionsTable transactions={dashboardData.recentTransactions} />
      </div>

      {/* 5. System Inventory & Infrastructure Compact Bar */}
      <SystemInventoryBar stats={adminStats} isLoading={isLoadingStats} />
    </div>
  )
}

export default AdminDashboard
