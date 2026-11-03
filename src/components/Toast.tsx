import React, { createContext, useContext, useState, useCallback } from "react"
import { CheckCircle2, AlertCircle, Info, XCircle, X, Sparkles } from "lucide-react"

export type ToastType = "success" | "info" | "warning" | "error"

export interface ToastItem {
  id: string
  message: string
  type: ToastType
  title?: string
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback((message: string, type: ToastType = "success", title?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const newToast: ToastItem = { id, message, type, title }

    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {/* Toast Render Container */}
      <div
        className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          let bgClasses = "bg-white border-emerald-200 text-gray-800 shadow-xl shadow-emerald-500/10"
          let iconColor = "text-emerald-500"
          let defaultTitle = "Thành công"

          if (toast.type === "info") {
            bgClasses = "bg-white border-sky-200 text-gray-800 shadow-xl shadow-sky-500/10"
            iconColor = "text-sky-500"
            defaultTitle = "Thông báo"
          } else if (toast.type === "warning") {
            bgClasses = "bg-white border-amber-200 text-gray-800 shadow-xl shadow-amber-500/10"
            iconColor = "text-amber-500"
            defaultTitle = "Lưu ý"
          } else if (toast.type === "error") {
            bgClasses = "bg-white border-rose-200 text-gray-800 shadow-xl shadow-rose-500/10"
            iconColor = "text-rose-500"
            defaultTitle = "Thất bại"
          }

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border ${bgClasses} transition-all duration-300 transform translate-y-0 animate-in fade-in slide-in-from-bottom-3`}
            >
              <div className="shrink-0 mt-0.5">
                {toast.type === "success" && <CheckCircle2 className={iconColor} size={20} />}
                {toast.type === "info" && <Info className={iconColor} size={20} />}
                {toast.type === "warning" && <AlertCircle className={iconColor} size={20} />}
                {toast.type === "error" && <XCircle className={iconColor} size={20} />}
              </div>

              <div className="flex-1 text-sm min-w-0">
                <p className="font-bold text-gray-900 text-xs flex items-center gap-1.5 mb-0.5">
                  {toast.title || defaultTitle}
                  {toast.type === "success" && <Sparkles size={13} className="text-amber-500" />}
                </p>
                <p className="text-gray-600 text-xs leading-relaxed break-words">{toast.message}</p>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                aria-label="Đóng thông báo"
              >
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider")
  }
  return context
}
