import React from "react"
import { CreditCard, CheckCircle2, Clock, XCircle, User, ArrowRight } from "lucide-react"
import { RecentTransactionItem } from "../../../types/dashboard"
import { formatVND } from "../../../services/dashboardData"

interface RecentTransactionsTableProps {
  transactions: RecentTransactionItem[]
}

export default function RecentTransactionsTable({ transactions }: RecentTransactionsTableProps) {
  // Helper to format payment method badge
  const renderPaymentBadge = (method: RecentTransactionItem["paymentMethod"]) => {
    switch (method) {
      case "MOMO":
        return (
          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-pink-50 text-pink-700 border border-pink-200">
            MoMo
          </span>
        )
      case "ZALOPAY":
        return (
          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
            ZaloPay
          </span>
        )
      case "VIETQR":
        return (
          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
            VietQR
          </span>
        )
      case "VNPAY":
        return (
          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-red-50 text-red-700 border border-red-200">
            VNPAY
          </span>
        )
      case "VISA":
        return (
          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200">
            Visa / Master
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-100 text-slate-700 border border-slate-200">
            {method}
          </span>
        )
    }
  }

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-bold shadow-2xs">
            <CreditCard size={18} />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
              Giao Dịch Đặt Vé Mới Nhất
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dòng tiền và các đơn thanh toán trực tuyến phát sinh gần đây
            </p>
          </div>
        </div>

        <span className="text-xs font-semibold text-slate-400">
          Cập nhật tức thì
        </span>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
            <tr>
              <th className="py-3.5 px-4">Mã đơn đặt</th>
              <th className="py-3.5 px-4">Khách hàng</th>
              <th className="py-3.5 px-4">Bộ phim & Suất</th>
              <th className="py-3.5 px-4">Số tiền</th>
              <th className="py-3.5 px-4">Cổng TT</th>
              <th className="py-3.5 px-4">Trạng thái</th>
              <th className="py-3.5 px-4 text-right">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-slate-50/70 transition">
                {/* Booking Code & Ticket count */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div>
                    <span className="font-mono font-bold text-slate-900">{tx.bookingCode}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      {tx.ticketCount} vé xem phim
                    </p>
                  </div>
                </td>

                {/* Customer Info */}
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center justify-center font-bold text-[11px] shrink-0">
                      {tx.customerName.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{tx.customerName}</p>
                      <p className="text-[11px] text-slate-400 truncate">{tx.customerPhone}</p>
                    </div>
                  </div>
                </td>

                {/* Movie & Showtime */}
                <td className="py-3.5 px-4">
                  <div className="max-w-[200px]">
                    <p className="font-semibold text-slate-900 truncate">{tx.movieTitle}</p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {tx.roomName} • {tx.showtime}
                    </p>
                  </div>
                </td>

                {/* Amount */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="font-black text-slate-900 text-sm">
                    {formatVND(tx.amount)}
                  </span>
                </td>

                {/* Payment Method */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {renderPaymentBadge(tx.paymentMethod)}
                </td>

                {/* Payment Status */}
                <td className="py-3.5 px-4 whitespace-nowrap">
                  {tx.paymentStatus === "COMPLETED" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle2 size={12} /> Hoàn tất
                    </span>
                  )}
                  {tx.paymentStatus === "HOLDING" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      <Clock size={12} /> Giữ chỗ
                    </span>
                  )}
                  {tx.paymentStatus === "CANCELLED" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle size={12} /> Đã hủy
                    </span>
                  )}
                </td>

                {/* Time Ago */}
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <span className="text-[11px] font-semibold text-slate-400">
                    {tx.timeAgo}
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
