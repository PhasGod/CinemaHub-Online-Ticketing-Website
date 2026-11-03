import React, { useState, useEffect } from "react"
import {
  Search,
  Filter,
  Ticket,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  Check,
  QrCode,
  Clock,
  Calendar,
  Film,
  MapPin,
  CreditCard,
  User,
  Phone,
  Mail,
  Copy,
  RefreshCw,
} from "lucide-react"
import { staffSearchTickets, staffCheckInTicket } from "../../services/bookingApi"
import { TicketItem } from "../../types/booking"

export default function StaffTicketLookupPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<"ALL" | "VALID" | "USED" | "CANCELLED">("ALL")
  const [tickets, setTickets] = useState<TicketItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Selected ticket for Detail Modal
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null)
  const [checkingInCode, setCheckingInCode] = useState<string | null>(null)
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const fetchTickets = async (query: string = "") => {
    setLoading(true)
    setError(null)
    try {
      const res = await staffSearchTickets(query)
      setTickets(res.tickets || [])
    } catch (err: any) {
      console.error("Failed to load tickets:", err)
      setError(err.message || "Không thể tải danh sách vé")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets("")
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    fetchTickets(searchTerm)
  }

  const handleManualCheckIn = async (ticketCode: string) => {
    if (!window.confirm(`Xác nhận soát vé cho mã ${ticketCode}?`)) return

    setCheckingInCode(ticketCode)
    setActionSuccessMessage(null)
    try {
      const res = await staffCheckInTicket(ticketCode)
      // Update local state
      setTickets((prev) =>
        prev.map((t) => (t.ticketCode === ticketCode ? { ...t, status: "USED", checkedInAt: new Date().toISOString() } : t))
      )
      if (selectedTicket && selectedTicket.ticketCode === ticketCode) {
        setSelectedTicket({ ...selectedTicket, status: "USED", checkedInAt: new Date().toISOString() })
      }
      setActionSuccessMessage(`Đã soát vé thành công: ${ticketCode}`)
      setTimeout(() => setActionSuccessMessage(null), 4000)
    } catch (err: any) {
      alert(err.message || "Không thể soát vé")
    } finally {
      setCheckingInCode(null)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedCode(text)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter === "ALL") return true
    return t.status === statusFilter
  })

  return (
    <div className="container max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center shrink-0 shadow-sm">
            <Search size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-slate-800">Tra cứu đơn đặt & Vé xem phim</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tìm kiếm linh hoạt theo mã vé, mã đơn, số điện thoại hoặc email khách hàng.
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchTickets(searchTerm)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      {actionSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 p-4 rounded-2xl space-y-4 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập mã vé (TKT-...), mã đơn (BK-...), số điện thoại, email hoặc tên khách..."
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/20 transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center gap-2 transition cursor-pointer shadow-md shadow-rose-600/20 disabled:opacity-50"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Tìm kiếm"}
          </button>
        </form>

        {/* Status Filter Badges */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-bold flex items-center gap-1 shrink-0 mr-1">
            <Filter size={13} /> Lọc theo trạng thái:
          </span>
          {(
            [
              { id: "ALL", label: `Tất cả (${tickets.length})` },
              { id: "VALID", label: `Hợp lệ / Chưa soát (${tickets.filter((t) => t.status === "VALID").length})` },
              { id: "USED", label: `Đã soát (${tickets.filter((t) => t.status === "USED").length})` },
              { id: "CANCELLED", label: `Đã hủy (${tickets.filter((t) => t.status === "CANCELLED").length})` },
            ] as const
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setStatusFilter(id)}
              className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === id
                  ? "bg-rose-50 text-rose-600 border border-rose-200 shadow-xs"
                  : "bg-slate-50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="py-20 text-center">
            <div className="w-8 h-8 border-3 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Đang tra cứu dữ liệu vé...</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <Ticket size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm font-bold text-slate-700">Không tìm thấy vé nào phù hợp</p>
            <p className="text-xs text-slate-500 mt-1">Thử thay đổi từ khóa hoặc bộ lọc trạng thái</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Mã đơn / Mã vé</th>
                  <th className="py-3.5 px-4">Phim & Phòng</th>
                  <th className="py-3.5 px-4">Suất chiếu</th>
                  <th className="py-3.5 px-4">Ghế ngồi</th>
                  <th className="py-3.5 px-4">Khách hàng</th>
                  <th className="py-3.5 px-4">Trạng thái vé</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredTickets.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-slate-900 flex items-center gap-1.5">
                          {t.ticketCode}
                          <button
                            type="button"
                            onClick={() => handleCopy(t.ticketCode)}
                            title="Sao chép mã vé"
                            className="text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {copiedCode === t.ticketCode ? (
                              <Check size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          Đơn: {t.booking?.bookingCode || "--"}
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="max-w-[200px]">
                        <p className="font-bold text-slate-900 truncate">{t.showtime?.movie?.title || "--"}</p>
                        <p className="text-[11px] text-slate-500">
                          {t.showtime?.room?.name} ({t.showtime?.room?.format || "2D"})
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.showtime?.startTime ? (
                        <div>
                          <p className="font-bold text-slate-900">
                            {new Date(t.showtime.startTime).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          <p className="text-[11px] text-slate-500">
                            {new Date(t.showtime.startTime).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      ) : (
                        "--"
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono font-bold">
                        {t.seat?.row}
                        {t.seat?.number}
                      </span>
                      <span className="block text-[10px] text-slate-500 uppercase mt-0.5">
                        {t.seat?.type === "vip" ? "VIP" : "Thường"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="max-w-[160px]">
                        <p className="font-semibold text-slate-900 truncate">
                          {t.booking?.user?.fullName || "Khách lẻ"}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {t.booking?.user?.phone || t.booking?.user?.email || "--"}
                        </p>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {t.status === "VALID" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 size={12} /> Hợp lệ
                        </span>
                      )}
                      {t.status === "USED" && (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock size={12} /> Đã soát
                          </span>
                          {t.checkedInAt && (
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {new Date(t.checkedInAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          )}
                        </div>
                      )}
                      {t.status === "CANCELLED" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          <XCircle size={12} /> Đã hủy
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {t.status === "VALID" && (
                          <button
                            type="button"
                            onClick={() => handleManualCheckIn(t.ticketCode)}
                            disabled={checkingInCode === t.ticketCode}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition disabled:opacity-50 flex items-center gap-1 cursor-pointer shadow-xs"
                          >
                            {checkingInCode === t.ticketCode ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Check size={13} />
                            )}
                            Soát vé
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedTicket(t)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-semibold text-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> Chi tiết
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative text-slate-800">
            <button
              onClick={() => setSelectedTicket(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 cursor-pointer transition"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center">
                <Ticket size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Chi tiết vé điện tử</h3>
                <p className="text-xs text-slate-500 font-mono">Mã: {selectedTicket.ticketCode}</p>
              </div>
            </div>

            {/* Movie Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Bộ phim:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {selectedTicket.showtime?.movie?.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rạp & Phòng chiếu:</span>
                <span className="text-slate-700 font-medium">
                  {selectedTicket.showtime?.room?.cinema?.name} — {selectedTicket.showtime?.room?.name} (
                  {selectedTicket.showtime?.room?.format})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Khung giờ:</span>
                <span className="text-slate-800 font-semibold">
                  {new Date(selectedTicket.showtime.startTime).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  — {new Date(selectedTicket.showtime.startTime).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Vị trí ghế:</span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-bold">
                  Ghế {selectedTicket.seat?.row}
                  {selectedTicket.seat?.number} ({selectedTicket.seat?.type === "vip" ? "VIP" : "Thường"})
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Giá vé:</span>
                <span className="font-bold text-rose-600">
                  {Number(selectedTicket.price).toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </div>

            {/* Booking & Customer Info */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-2">
                Thông tin đơn hàng & Người đặt
              </h4>
              <div className="flex justify-between">
                <span className="text-slate-500">Mã đơn đặt:</span>
                <span className="font-mono text-slate-900 font-bold">
                  {selectedTicket.booking?.bookingCode || "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Khách hàng:</span>
                <span className="text-slate-900 font-medium">{selectedTicket.booking?.user?.fullName || "Khách lẻ"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Số điện thoại:</span>
                <span className="text-slate-900">{selectedTicket.booking?.user?.phone || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email:</span>
                <span className="text-slate-900">{selectedTicket.booking?.user?.email || "--"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Thanh toán:</span>
                <span className="text-emerald-700 font-semibold">
                  {selectedTicket.booking?.payment?.method || "MOCK"} — ĐÃ HOÀN TẤT
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
              {selectedTicket.status === "VALID" && (
                <button
                  type="button"
                  onClick={() => handleManualCheckIn(selectedTicket.ticketCode)}
                  disabled={checkingInCode === selectedTicket.ticketCode}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                >
                  <Check size={15} />
                  Xác nhận soát vé
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
