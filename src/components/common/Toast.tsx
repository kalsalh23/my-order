import { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/utils'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: { label: string; onClick: () => void }
}

interface ToastContextType {
  toasts: Toast[]
  showToast: (toast: Omit<Toast, 'id'>) => string
  hideToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...toast, id }
    setToasts((prev) => [...prev, newToast])

    if (toast.duration !== 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
      }, toast.duration || 5000)
    }

    return id
  }, [])

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (!toasts || toasts.length === 0) return null

  const getIcon = (type: Toast['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error': return <AlertCircle className="w-5 h-5 text-red-500" />
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />
      case 'info': return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getBgColor = (type: Toast['type']) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200'
      case 'error': return 'bg-red-50 border-red-200'
      case 'warning': return 'bg-amber-50 border-amber-200'
      case 'info': return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-toast space-y-2" role="region" aria-label="الإشعارات" aria-live="polite">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'animate-slide-up rounded-lg border shadow-lg p-4 flex items-start gap-3',
            getBgColor(toast.type)
          )}
          role="alert"
        >
          <div className="flex-shrink-0 mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-body-md font-medium text-gray-900">{toast.title}</h4>
            {toast.message && (
              <p className="text-body-sm text-gray-600 mt-0.5">{toast.message}</p>
            )}
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick()
                  onClose(toast.id)
                }}
                className="mt-2 text-body-sm font-medium text-primary hover:underline touch-manipulation"
              >
                {toast.action.label}
              </button>
            )}
          </div>
          <button
            onClick={() => onClose(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 touch-manipulation p-1"
            aria-label="إغلاق الإشعار"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}