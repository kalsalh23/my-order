import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, updateOrderStatus } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, formatPrice, formatRelativeTime, formatDateTime, getOrderStatusLabel, getOrderStatusColor } from '@/utils'
import { ArrowLeft, Truck, MapPin, Phone, Clock, CheckCircle, AlertTriangle, XCircle, Package, Loader2, User, MessageSquare, MoreVertical } from 'lucide-react'
import type { VendorOrder, OrderStatus, OrderItem } from '@/types'

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
]

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'قيد الانتظار',
  accepted: 'مقبول',
  rejected: 'مرفوض',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  out_for_delivery: 'قيد التوصيل',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
}

const STATUS_ICONS: Record<OrderStatus, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  accepted: CheckCircle,
  rejected: XCircle,
  preparing: Package,
  ready: CheckCircle,
  out_for_delivery: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
}

const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['accepted', 'rejected', 'cancelled'],
  accepted: ['preparing', 'rejected', 'cancelled'],
  preparing: ['ready', 'cancelled'],
  ready: ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered: [],
  cancelled: [],
  rejected: [],
}

export function VendorOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null)

  const { data: vendorOrder, isLoading, refetch } = useQuery({
    queryKey: ['vendor-order-detail', id],
    queryFn: async () => {
      if (!id) return null
      const { data, error } = await supabase
        .from('vendor_orders')
        .select(`
          *,
          order:orders(*),
          representative:representatives(id, store_name, store_slug, logo_url, phone, location),
          items:order_items(*, product:products(id, name, main_image))
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data as VendorOrder & { order: any; representative: any; items: (OrderItem & { product: any })[] }
    },
    enabled: !!id,
  })

  const updateStatus = useMutation({
    mutationFn: async (newStatus: OrderStatus) => {
      if (!id) throw new Error('Missing order ID')
      return updateOrderStatus(id, newStatus, user?.id || '', rejectReason || undefined)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-order-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['vendor-orders'] })
      showToast({ type: 'success', title: 'تم التحديث', message: 'تم تحديث حالة الطلب بنجاح' })
      setShowRejectModal(false)
      setRejectReason('')
      refetch()
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const handleStatusChange = (newStatus: OrderStatus) => {
    if (newStatus === 'rejected') {
      setShowRejectModal(true)
    } else {
      updateStatus.mutate(newStatus)
    }
  }

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      showToast({ type: 'warning', title: 'مطلوب', message: 'يجب إدخال سبب الرفض' })
      return
    }
    updateStatus.mutate('rejected')
  }

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="card p-6 animate-pulse">
          <div className="skeleton h-6 w-1/4 mb-4" />
          <div className="grid md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-8 w-3/4" />
              </div>
            ))}
          </div>
        </div>
        <div className="card p-6 animate-pulse">
          <div className="skeleton h-6 w-1/4 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton w-14 h-14 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/2" />
                  <div className="skeleton h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!vendorOrder) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="card p-12 text-center">
          <AlertTriangle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h2 className="heading-2 text-charcoal mb-2">الطلب غير موجود</h2>
          <Link to="/vendor/orders" className="btn-primary inline-flex items-center gap-2 mt-4">
            <ArrowLeft className="w-4 h-4" />
            العودة للطلبات
          </Link>
        </div>
      </div>
    )
  }

  const order = vendorOrder.order
  const currentStatus = vendorOrder.status as OrderStatus
  const currentIndex = STATUS_ORDER.indexOf(currentStatus)
  const allowedTransitions = VALID_TRANSITIONS[currentStatus] || []
  const isFinalStatus = ['delivered', 'cancelled', 'rejected'].includes(currentStatus)

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <Link to="/vendor/orders" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="heading-2 text-charcoal">طلب #{order?.order_number}</h1>
            <span className={cn('badge', getOrderStatusColor(currentStatus))}>
              {getOrderStatusLabel(currentStatus)}
            </span>
          </div>
          <p className="text-body-sm text-gray-500 mt-1">
            تم الإنشاء: {formatDateTime(order?.created_at)} • {formatRelativeTime(order?.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to={`/vendor/orders/${vendorOrder.id}`} className="btn-secondary">
            تحديث
          </Link>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="card p-6">
        <h2 className="heading-4 mb-6">تسلسل الحالة</h2>
        <div className="relative pl-6 pb-8">
          <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true" />
          {STATUS_ORDER.map((status, index) => {
            const isCompleted = index < currentIndex
            const isCurrent = index === currentIndex && !isFinalStatus
            const isRejected = currentStatus === 'rejected' && status === 'rejected'
            const isCancelled = currentStatus === 'cancelled' && status === 'cancelled'
            const Icon = STATUS_ICONS[status]

            return (
              <div key={status} className="relative flex items-start gap-4 mb-6">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all',
                    isCompleted || isRejected || isCancelled
                      ? 'bg-primary text-white'
                      : isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary/20'
                      : 'bg-gray-100 text-gray-400'
                  )}
                >
                  <Icon className={cn('w-5 h-5', isCompleted || isCurrent || isRejected || isCancelled ? 'text-white' : 'text-gray-400')} />
                </div>
                <div className="flex-1 pt-1">
                  <p className={cn('text-body-sm font-medium', isCompleted || isCurrent || isRejected || isCancelled ? 'text-charcoal' : 'text-gray-500')}>
                    {STATUS_LABELS[status]}
                  </p>
                  <p className="text-body-xs text-gray-400">
                    {isCompleted ? 'مكتمل' : isCurrent || isRejected || isCancelled ? 'الحالة الحالية' : 'في الانتظار'}
                  </p>
                </div>
              </div>
            )
          })}
          {(currentStatus === 'cancelled' || currentStatus === 'rejected') && (
            <div className="relative flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 z-10">
                <XCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 pt-1">
                <p className="text-body-sm font-medium text-red-600">
                  {currentStatus === 'cancelled' ? 'ملغي' : 'مرفوض'}
                </p>
                <p className="text-body-xs text-gray-400">تم إلغاء هذا الطلب</p>
              </div>
            </div>
          )}
        </div>

        {/* Status Actions */}
        {!isFinalStatus && allowedTransitions.length > 0 && (
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="heading-4 mb-4">تغيير الحالة</h3>
            <div className="flex flex-wrap gap-3">
              {allowedTransitions.map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={updatingStatus === status}
                  className={cn(
                    'btn px-4 py-2.5',
                    status === 'accepted' ? 'btn-primary' :
                    status === 'rejected' ? 'btn-danger' :
                    'btn-secondary'
                  )}
                >
                  {updatingStatus === status ? (
                    <Loader2 className="animate-spin w-4 h-4" />
                  ) : (
                    STATUS_LABELS[status]
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Order Details Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Customer & Store Info */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="heading-4 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              بيانات العميل
            </h2>
            <dl className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <dt className="text-body-xs text-gray-500">الاسم</dt>
                  <dd className="text-body-md font-medium text-charcoal">{order?.customer_name}</dd>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <dt className="text-body-xs text-gray-500">الهاتف</dt>
                  <dd className="text-body-md font-medium text-charcoal">
                    <a href={`tel:${order?.customer_phone}`} className="hover:text-primary transition-colors">{order?.customer_phone}</a>
                    {order?.customer_phone_verified && (
                      <span className="badge-success ml-2">محقق</span>
                    )}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          <div className="card p-6">
            <h2 className="heading-4 mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              عنوان التوصيل
            </h2>
            <address className="text-body-md text-gray-700 whitespace-pre-wrap">{order?.delivery_address}</address>
          </div>

          {order?.notes && (
            <div className="card p-6">
              <h2 className="heading-4 mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                ملاحظات العميل
              </h2>
              <p className="text-body-md text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Order Items & Totals */}
        <div className="space-y-6">
          <div className="card p-6">
            <h2 className="heading-4 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" />
              منتجات الطلب ({vendorOrder.items?.length || 0})
            </h2>
            <div className="space-y-3">
              {vendorOrder.items?.map((item) => (
                <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                  <img
                    src={item.product?.main_image || '/images/placeholder-product.svg'}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-charcoal line-clamp-1">{item.product_name_snapshot}</p>
                    <p className="text-body-xs text-gray-500">الكمية: {item.quantity}</p>
                    <p className="text-body-sm font-medium text-primary">{formatPrice(item.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="heading-4 mb-4">ملخص المبلغ</h2>
            <dl className="space-y-3 text-body-md">
              <div className="flex justify-between">
                <dt className="text-gray-600">المجموع الفرعي</dt>
                <dd className="font-medium text-charcoal">{formatPrice(vendorOrder.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600">رسوم التوصيل</dt>
                <dd className="font-medium text-charcoal">{formatPrice(vendorOrder.delivery_fee)}</dd>
              </div>
              <div className="divider" />
              <div className="flex justify-between text-lg">
                <dt className="font-semibold text-charcoal">الإجمالي</dt>
                <dd className="font-bold text-primary">{formatPrice(vendorOrder.total)}</dd>
              </div>
            </dl>
          </div>

          {/* Store Info */}
          {vendorOrder.representative && (
            <div className="card p-6">
              <h2 className="heading-4 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-primary" />
                متجرك
              </h2>
              <div className="flex items-center gap-3">
                <img
                  src={vendorOrder.representative.logo_url || '/images/placeholder-product.svg'}
                  alt=""
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div>
                  <h3 className="text-body-md font-semibold text-charcoal">{vendorOrder.representative.store_name}</h3>
                  <p className="text-body-xs text-gray-500">{vendorOrder.representative.location}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}