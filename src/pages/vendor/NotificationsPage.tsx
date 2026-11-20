import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useNotifications } from '@/hooks/useNotifications'
import { cn, formatRelativeTime } from '@/utils'
import { Bell, Check, Mail, Truck, Package, AlertCircle, CheckCircle, XCircle, Loader2, Filter } from 'lucide-react'
import type { Notification, NotificationType } from '@/types'

const NOTIFICATION_TYPES: { value: NotificationType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'new_order', label: 'طلب جديد', icon: Package },
  { value: 'order_accepted', label: 'تم القبول', icon: CheckCircle },
  { value: 'order_rejected', label: 'تم الرفض', icon: XCircle },
  { value: 'order_status_changed', label: 'تغيير الحالة', icon: Truck },
  { value: 'product_approved', label: 'منتج موافق عليه', icon: CheckCircle },
  { value: 'product_rejected', label: 'منتج مرفوض', icon: XCircle },
  { value: 'admin_announcement', label: 'إعلان إداري', icon: AlertCircle },
  { value: 'general', label: 'عام', icon: Bell },
]

export function VendorNotificationsPage() {
  const { user } = useAuth()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification, fetchNotifications } = useNotifications()
  const [typeFilter, setTypeFilter] = useState<'all' | NotificationType>('all')
  const [showUnreadOnly, setShowUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Mark all as read
  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  // Filter notifications
  const filteredNotifications = notifications.filter((n) => {
    const typeMatch = typeFilter === 'all' || n.type === typeFilter
    const readMatch = !showUnreadOnly || !n.is_read
    return typeMatch && readMatch
  })

  // Load more
  const loadMore = () => {
    setPage(p => p + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-charcoal">الإشعارات</h1>
          <p className="text-body-md text-gray-500 mt-1">
            {unreadCount > 0 ? `لديك ${unreadCount} إشعار غير مقروء` : 'جميع الإشعارات مقروءة'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="btn-secondary"
          >
            <Check className="w-4 h-4" />
            تمييز الكل كمقروء
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
              className="input pl-10 pr-10 appearance-none"
            >
              <option value="all">جميع الأنواع</option>
              {NOTIFICATION_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
            <input
              type="checkbox"
              checked={showUnreadOnly}
              onChange={(e) => setShowUnreadOnly(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-body-sm text-gray-600">غير المقروءة فقط</span>
          </label>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card overflow-hidden">
        {loading && filteredNotifications.length === 0 ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="heading-3 text-charcoal mb-2">لا توجد إشعارات</h3>
            <p className="text-body-md text-gray-500">
              {typeFilter !== 'all' ? 'جرب تغيير الفلتر' : 'ستظهر الإشعارات الجديدة هنا'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className={cn(
                  'p-4 flex gap-3 hover:bg-gray-50 transition-colors',
                  !notification.is_read && 'bg-primary/5'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    notification.type === 'new_order' && 'bg-green-100 text-green-600',
                    notification.type === 'order_accepted' && 'bg-blue-100 text-blue-600',
                    notification.type === 'order_rejected' && 'bg-red-100 text-red-600',
                    notification.type === 'order_status_changed' && 'bg-amber-100 text-amber-600',
                    notification.type === 'product_approved' && 'bg-emerald-100 text-emerald-600',
                    notification.type === 'product_rejected' && 'bg-red-100 text-red-600',
                    notification.type === 'admin_announcement' && 'bg-primary/10 text-primary',
                    notification.type === 'general' && 'bg-gray-100 text-gray-600',
                  )}
                >
                  {NOTIFICATION_TYPES.find(t => t.value === notification.type)?.icon ?? Bell}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className={cn('text-body-md font-medium text-charcoal', !notification.is_read && 'font-semibold')}>
                      {notification.title}
                    </h4>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" aria-label="غير مقروء" />
                    )}
                  </div>
                  <p className="text-body-sm text-gray-600 mt-1 line-clamp-2">{notification.body}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-body-xs text-gray-400">{formatRelativeTime(notification.created_at)}</span>
                    <span className={cn('badge badge-outline', notification.type)}>
                      {NOTIFICATION_TYPES.find(t => t.value === notification.type)?.label || notification.type}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!notification.is_read && (
                    <button
                      onClick={() => markAsRead(notification.id)}
                      className="btn-ghost p-2 text-green-600 hover:bg-green-50"
                      aria-label="تمييز كمقروء"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.id)}
                    className="btn-ghost p-2 text-red-600 hover:bg-red-50"
                    aria-label="حذف الإشعار"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

          {/* Load More */}
          {filteredNotifications.length >= page * pageSize && (
            <div className="p-4 border-t border-gray-100">
              <button
                onClick={loadMore}
                className="btn-secondary w-full"
              >
                تحميل المزيد
              </button>
            </div>
          )}
      </div>
    </div>
  )
}