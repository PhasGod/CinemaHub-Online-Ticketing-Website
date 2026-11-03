import React from "react"
import { Check } from "lucide-react"

export interface BookingHeaderStepperProps {
  currentStep: 1 | 2 | 3 | 4 | 5
  selectedCinemaName?: string | null
  selectedMovieTitle?: string | null
  selectedShowtimeInfo?: string | null
  selectedSeatsSummary?: string | null
  onStepClick?: (step: 1 | 2 | 3 | 4 | 5) => void
  className?: string
}

export function BookingHeaderStepper({
  currentStep,
  selectedCinemaName,
  selectedMovieTitle,
  selectedShowtimeInfo,
  selectedSeatsSummary,
  onStepClick,
  className = "",
}: BookingHeaderStepperProps) {
  const stepsConfig = [
    {
      step: 1 as const,
      label: "Bước 1",
      title: "Chọn Cụm Rạp",
      activeTitle: "BƯỚC 1: Chọn Cụm Rạp",
      summary: selectedCinemaName,
      isCompleted: currentStep > 1 || Boolean(selectedCinemaName && currentStep >= 1),
    },
    {
      step: 2 as const,
      label: "Bước 2",
      title: "Chọn Phim",
      activeTitle: "BƯỚC 2: Chọn Phim",
      summary: selectedMovieTitle,
      isCompleted: currentStep > 2 || Boolean(selectedMovieTitle && currentStep >= 2),
    },
    {
      step: 3 as const,
      label: "Bước 3",
      title: "Chọn Suất Chiếu",
      activeTitle: "BƯỚC 3: Chọn Suất Chiếu",
      summary: selectedShowtimeInfo,
      isCompleted: currentStep > 3 || Boolean(selectedShowtimeInfo && currentStep >= 3),
    },
    {
      step: 4 as const,
      label: "Bước 4",
      title: "Chọn Ghế Ngồi & Chọn Bắp Nước",
      activeTitle: "BƯỚC 4: Chọn Ghế Ngồi & Chọn Bắp Nước",
      summary: selectedSeatsSummary,
      isCompleted: currentStep > 4 || Boolean(selectedSeatsSummary && currentStep >= 4),
    },
    {
      step: 5 as const,
      label: "Bước 5",
      title: "Thanh Toán",
      activeTitle: "BƯỚC 5: Thanh Toán",
      summary: currentStep === 5 ? "Quét mã QR / Chuyển khoản" : undefined,
      isCompleted: currentStep > 5,
    },
  ]

  return (
    <div
      className={`bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 mb-8 shadow-sm ${className}`}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {stepsConfig.map((item) => {
          const isActive = currentStep === item.step
          const isCompleted = !isActive && item.step < currentStep
          const canClick = onStepClick && (item.step < currentStep || (item.step === 1 && currentStep <= 3))

          const content = (
            <>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-all ${
                  isActive
                    ? "bg-rose-500 text-white shadow-xs"
                    : isCompleted
                      ? "bg-emerald-500 text-white shadow-2xs"
                      : "bg-slate-100 text-slate-400"
                }`}
              >
                {isCompleted ? <Check size={16} strokeWidth={2.5} /> : item.step}
              </div>

              <div className="min-w-0 flex-1">
                <span
                  className={`text-[11px] block font-semibold uppercase tracking-wider ${
                    isActive
                      ? "text-rose-600 font-bold"
                      : isCompleted
                        ? "text-emerald-700"
                        : "text-slate-400"
                  }`}
                >
                  {item.label}
                </span>

                <span
                  className={`text-xs sm:text-[13px] font-semibold truncate block leading-tight mt-0.5 ${
                    isActive
                      ? "text-slate-900 font-bold"
                      : isCompleted
                        ? "text-slate-800"
                        : "text-slate-400"
                  }`}
                  title={item.summary || item.title}
                >
                  {item.summary || item.title}
                </span>
              </div>
            </>
          )

          const baseClasses = `flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
            isActive
              ? "bg-rose-50/80 border-2 border-rose-500 text-slate-900 shadow-xs"
              : isCompleted
                ? "bg-emerald-50/70 border border-emerald-300 text-slate-800 hover:border-emerald-400 hover:bg-emerald-50 cursor-pointer"
                : "bg-slate-50 border border-slate-200 text-slate-400 hover:border-slate-300 cursor-default"
          }`

          if (canClick) {
            return (
              <button
                key={item.step}
                type="button"
                onClick={() => onStepClick?.(item.step)}
                className={baseClasses}
              >
                {content}
              </button>
            )
          }

          return (
            <div key={item.step} className={baseClasses}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default BookingHeaderStepper
