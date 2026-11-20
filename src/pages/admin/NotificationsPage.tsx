import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Grid, Edit, Trash2, Image, Eye, Loader2, ArrowLeft, MoreVertical, CheckCircle, XCircle, Clock, Package, AlertTriangle, MapPin, Store, LogOut, Home, Settings, Users, ShoppingBag, Bell, LayoutDashboard, Send, Mail, Megaphone } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, uploadFile, deleteFile } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, formatRelativeTime } from '@/utils'
import { SkeletonProductGrid, SkeletonCategoryCard } from '@/components/common/Skeletons'
import type { Category } from '@/types'

export function AdminNotificationsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'new_order' | 'order_accepted' | 'order_rejected' | 'order_status_changed' | 'product_approved' | 'product_rejected' | 'admin_announcement' | 'general'>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20
  const [showForm, setShowForm] = useState(false)
  const [editingNotification, setEditingNotification] = useState<any | null>(null)

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['admin-notifications', searchQuery, typeFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('notifications')
        .select(`
          *,
          user:profiles(id, full_name, email, role)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,body.ilike.%${searchQuery}%,user.full_name.ilike.%${searchQuery}%`)
      }
      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return { data: data || [], count: count || 0 }
    },
  })

  const sendNotification = useMutation({
    mutationFn: async (notificationData: { user_id: string | 'all'; title: string; body: string; type: string }) => {
      if (notificationData.user_id === 'all') {
        // Get all user IDs
        const { data: users } = await supabase.from('profiles').select('id')
        const userIds = users?.map(u => u.id) || []

        const notifications = userIds.map(userId => ({
          user_id: userId,
          title: notificationData.title,
          body: notificationData.body,
          type: notificationData.type,
        }))

        const { error } = await supabase
          .from('notifications')
          .insert(notifications)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('notifications')
          .insert(notificationData)
        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      showToast({ type: 'success', title: 'تم الإرسال', message: 'تم إرسال الإشعار بنجاح' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const deleteNotification = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })
      showToast({ type: 'success', title: 'تم الحذف', message: 'تم حذف الإشعار بنجاح' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  if (isLoading) {
    return <SkeletonProductGrid count={6} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-charcoal">الإشعارات</h1>
          <p className="text-body-md text-gray-500 mt-1">{totalCount} إشعار</p>
        </div>
        <button
          onClick={() => { setEditingNotification(null); setShowForm(true) }}
          className="btn-primary"
        >
          <Send className="w-4 h-4" />
          إرسال إشعار
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="ابحث بالعنوان، المحتوى، المستخدم..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              className="input pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as typeof typeFilter); setPage(1) }}
            className="input w-auto"
          >
            <option value="all">جميع الأنواع</option>
            <option value="new_order">طلب جديد</option>
            <option value="order_accepted">تم القبول</option>
            <option value="order_rejected">تم الرفض</option>
            <option value="order_status_changed">تغيير الحالة</option>
            <option value="product_approved">منتج موافق عليه</option>
            <option value="product_rejected">منتج مرفوض</option>
            <option value="admin_announcement">إعلان إداري</option>
            <option value="general">عام</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="card overflow-hidden">
        {notifications?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Bell className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="heading-3 text-charcoal mb-2">لا توجد إشعارات</h3>
            <p className="text-body-md text-gray-500 mb-6">ابدأ بإرسال أول إشعار</p>
            <button
              onClick={() => { setEditingNotification(null); setShowForm(true) }}
              className="btn-primary"
            >
              <Send className="w-4 h-4" />
              إرسال إشعار
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications?.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    notification.type === 'new_order' && 'bg-green-100 text-green-600',
                    notification.type === 'order_accepted' && 'bg-blue-100 text-blue-600',
                    notification.type === 'order_rejected' && 'bg-red-100 text-red-600',
                    notification.type === 'order_status_changed' && 'bg-amber-100 text-amber-600',
                    notification.type === 'product_approved' && 'bg-emerald-100 text-emerald-600',
                    notification.type === 'product_rejected' && 'bg-red-100 text-red-600',
                    notification.type === 'admin_announcement' && 'bg-primary/10 text-primary',
                    notification.type === 'general' && 'bg-gray-100 text-gray-600',
                  )}>
                    {getNotificationIcon(notification.type)}
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
                      {notification.user && (
                        <span className="text-body-xs text-gray-400">لـ {notification.user.full_name}</span>
                      )}
                      <span className={cn('badge badge-outline text-caption', getNotificationBadgeColor(notification.type))}>
                        {getNotificationLabel(notification.type)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { if (confirm('هل أنت متأكد من حذف هذا الإشعار؟')) deleteNotification.mutate(notification.id) }}
                    disabled={deleteNotification.isPending}
                    className="btn-ghost p-2 text-red-600 hover:bg-red-50"
                    aria-label="حذف الإشعار"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Send Notification Modal */}
      {(showForm || editingNotification) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingNotification(null) }}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="heading-4">{editingNotification ? 'تعديل الإشعار' : 'إرسال إشعار جديد'}</h2>
              <button
                onClick={() => { setShowForm(false); setEditingNotification(null) }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <SendNotificationForm
              onClose={() => { setShowForm(false); setEditingNotification(null) }}
              onSuccess={() => { refetch(); setShowForm(false); setEditingNotification(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function SendNotificationForm({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { showToast } = useToast()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [type, setType] = useState<'admin_announcement' | 'general'>('admin_announcement')
  const [targetAudience, setTargetAudience] = useState<'all' | 'representatives' | 'customers'>('all')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) {
      showToast({ type: 'error', title: 'خطأ', message: 'العنوان والمحتوى مطلوبان' })
      return
    }

    setSaving(true)
    try {
      // This would call the Edge Function for push notifications
      // For now, just insert into database
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: targetAudience === 'all' ? 'all' : targetAudience, // This would need proper handling
          title: title.trim(),
          body: body.trim(),
          type,
        })

      if (error) throw error

      showToast({ type: 'success', title: 'تم الإرسال', message: 'تم إرسال الإشعار بنجاح' })
      onSuccess()
    } catch (error) {
      showToast({ type: 'error', title: 'خطأ', message: error instanceof Error ? error.message : 'فشل إرسال الإشعار' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
      <div>
        <label htmlFor="type" className="label">نوع الإشعار</label>
        <select
          id="type"
          value={type}
          onChange={(e) => setType(e.target.value as typeof type)}
          className="input"
        >
          <option value="admin_announcement">إعلان إداري</option>
          <option value="general">عام</option>
        </select>
      </div>

      <div>
        <label htmlFor="target_audience" className="label">الجمهور المستهدف</label>
        <select
          id="target_audience"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value as typeof targetAudience)}
          className="input"
        >
          <option value="all">الكل</option>
          <option value="representatives">المندوبون فقط</option>
          <option value="customers">العملاء فقط</option>
        </select>
      </div>

      <div>
        <label htmlFor="title" className="label">العنوان *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="مثال: عرض خاص للمندوبين"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="body" className="label">المحتوى *</label>
        <textarea
          id="body"
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="input resize-none"
          placeholder="اكتب محتوى الإشعار هنا..."
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="btn-secondary flex-1"
        >
          إلغاء
        </button>
        <button
          type="submit"
          disabled={saving}
          className="btn-primary flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin w-4 h-4" />
              جاري الإرسال...
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              إرسال الإشعار
            </>
          )}
        </button>
      </div>
    </form>
  )
}

function getNotificationIcon(type: string) {
  const icons: Record<string, React.ReactNode> = {
    new_order: <Package className="w-5 h-5" />,
    order_accepted: <CheckCircle className="w-5 h-5" />,
    order_rejected: <XCircle className="w-5 h-5" />,
    order_status_changed: <Clock className="w-5 h-5" />,
    product_approved: <CheckCircle className="w-5 h-5" />,
    product_rejected: <XCircle className="w-5 h-5" />,
    admin_announcement: <Megaphone className="w-5 h-5" />,
    general: <Bell className="w-5 h-5" />,
  }
  return icons[type] || <Bell className="w-5 h-5" />
}

function getNotificationLabel(type: string) {
  const labels: Record<string, string> = {
    new_order: 'طلب جديد',
    order_accepted: 'تم القبول',
    order_rejected: 'تم الرفض',
    order_status_changed: 'تغيير الحالة',
    product_approved: 'منتج موافق عليه',
    product_rejected: 'منتج مرفوض',
    admin_announcement: 'إعلان إداري',
    general: 'عام',
  }
  return labels[type] || type
}

function getNotificationBadgeColor(type: string) {
  const colors: Record<string, string> = {
    new_order: 'text-green-600 border-green-300',
    order_accepted: 'text-blue-600 border-blue-300',
    order_rejected: 'text-red-600 border-red-300',
    order_status_changed: 'text-amber-600 border-amber-300',
    product_approved: 'text-emerald-600 border-emerald-300',
    product_rejected: 'text-red-600 border-red-300',
    admin_announcement: 'text-primary border-primary/30',
    general: 'text-gray-500 border-gray-300',
  }
  return colors[type] || 'text-gray-500 border-gray-300'
}