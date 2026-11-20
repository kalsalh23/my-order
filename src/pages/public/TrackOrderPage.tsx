import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Search, Truck, CheckCircle, Clock, XCircle, ArrowLeft, MapPin, Phone, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn, formatPrice, formatDateTime, getOrderStatusLabel, getOrderStatusColor } from '@/utils'
import type { Order, VendorOrder, OrderStatus } from '@/types'

const trackSchema = z.object({
  order_number: z.string().min(5, 'رقم الطلب غير صحيح'),
  customer_phone: z.string().min(10, 'رقم الهاتف غير صحيح').regex(/^(\+966|0)?5\d{8}$/, 'رقم هاتف سعودي غير صحيح'),
})

type TrackFormData = z.infer<typeof trackSchema>

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

export function TrackOrderPage() {
  const [order, setOrder] = useState<{ order: Order; vendorOrders: VendorOrder[] } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TrackFormData>({
    resolver: zodResolver(trackSchema),
  })

  const handleTrack = async (data: TrackFormData) => {
    setLoading(true)
    setError(null)
    setOrder(null)

    try {
      const normalizedPhone = data.customer_phone.startsWith('+966')
        ? data.customer_phone
        : data.customer_phone.startsWith('0')
        ? `+966${data.customer_phone.slice(1)}`
        : `+966${data.customer_phone}`

      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select(
          `
          *,
          vendor_orders(
            *,
            representative:representatives(id, store_name, store_slug, logo_url, phone, location),
            items:order_items(
              *,
              product:products(id, name, main_image)
            )
          )
        `
        )
        .eq('order_number', data.order_number)
        .eq('customer_phone', normalizedPhone)
        .single()

      if (orderError || !orderData) {
        setError('رقم الطلب أو رقم الجوال غير صحيح')
        return
      }

      setOrder({ order: orderData, vendorOrders: orderData.vendor_orders || [] })
    } catch (err) {
      console.error('Error tracking order:', err)
      setError('حدث خطأ أثناء البحث عن الطلب')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'bg-amber-100 text-amber-700',
      accepted: 'bg-blue-100 text-blue-700',
      rejected: 'bg-red-100 text-red-700',
      preparing: 'bg-blue-100 text-blue-700',
      ready: 'bg-amber-100 text-amber-700',
      out_for_delivery: 'bg-primary/10 text-primary',
      delivered: 'bg-green-100 text-green-700',
      cancelled: 'bg-gray-100 text-gray-700',
    }
    return colors[status] || 'bg-gray-100 text-gray-700'
  }

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'rejected' || status === 'cancelled') return -1
    return STATUS_ORDER.indexOf(status)
  }

  const renderTimeline = (vendorOrder: VendorOrder) => {
    const currentIndex = getStepIndex(vendorOrder.status)
    const isCancelled = vendorOrder.status === 'cancelled'
    const isRejected = vendorOrder.status === 'rejected'

    return (
      <div className="relative pl-6 pb-8" role="list" aria-label={`تسلسل حالة طلب ${vendorOrder.representative?.store_name}`}>
        <div className="absolute right-5 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true" />
        {STATUS_ORDER.map((status, index) => {
          const isCompleted = index < currentIndex
          const isCurrent = index === currentIndex && !isCancelled && !isRejected
          const Icon = STATUS_ICONS[status]

          return (
            <div key={status} className="relative flex items-start gap-4 mb-6">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 transition-all',
                  isCompleted ? 'bg-primary text-white' :
                  isCurrent ? 'bg-primary text-white ring-4 ring-primary/20' :
                  'bg-gray-100 text-gray-400'
                )}
              >
                <Icon className={cn('w-5 h-5', isCompleted || isCurrent ? 'text-white' : 'text-gray-400')} />
              </div>
              <div className="flex-1 pt-1">
                <p className={cn('text-body-sm font-medium', isCompleted || isCurrent ? 'text-charcoal' : 'text-gray-500')}>
                  {STATUS_LABELS[status]}
                </p>
                <p className="text-body-xs text-gray-400">
                  {isCompleted ? 'مكتمل' : isCurrent ? 'الحالة الحالية' : 'في الانتظار'}
                </p>
              </div>
            </div>
          )
        })}

        {(isCancelled || isRejected) && (
          <div className="relative flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 z-10">
              <XCircle className="w-5 h-5" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-body-sm font-medium text-red-600">
                {isCancelled ? 'ملغي' : 'مرفوض'}
              </p>
              <p className="text-body-xs text-gray-400">تم إلغاء هذا الطلب</p>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen">
        <div className="container-main py-12 max-w-2xl">
          <Link to="/" className="inline-flex items-center gap-1.5 text-body-sm text-gray-500 hover:text-primary mb-6 touch-manipulation">
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Link>

          <div className="card p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                <Search className="w-8 h-8 text-primary" />
              </div>
              <h1 className="heading-2 text-charcoal mb-2">تتبع طلبك</h1>
              <p className="text-body-md text-gray-500">أدخل رقم الطلب ورقم الجوال لمعرفة حالة طلبك</p>
            </div>

            <form onSubmit={handleSubmit(handleTrack)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="order_number" className="label">رقم الطلب *</label>
                <input
                  id="order_number"
                  type="text"
                  placeholder="MT-241215-ABC123"
                  {...register('order_number')}
                  className={cn('input', errors.order_number && 'input-error')}
                  autoComplete="off"
                />
                {errors.order_number && <p className="form-error" role="alert">{errors.order_number.message}</p>}
              </div>

              <div>
                <label htmlFor="customer_phone" className="label">رقم الجوال *</label>
                <div className="relative">
                  <input
                    id="customer_phone"
                    type="tel"
                    placeholder="05XXXXXXXX"
                    {...register('customer_phone')}
                    className={cn('input pl-10', errors.customer_phone && 'input-error')}
                    autoComplete="tel"
                    inputMode="tel"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">+966</span>
                </div>
                {errors.customer_phone && <p className="form-error" role="alert">{errors.customer_phone.message}</p>}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-body-sm flex items-center gap-2" role="alert">
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    جاري البحث...
                  </>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    تتبع الطلب
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  const { order: orderData, vendorOrders } = order

  return (
    <div className="min-h-screen">
      <div className="container-main py-8 max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-body-sm text-gray-500 hover:text-primary mb-6 touch-manipulation">
          <ArrowLeft className="w-4 h-4" />
          العودة للرئيسية
        </Link>

        {/* Order Header */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h1 className="heading-3 text-charcoal">طلب #{orderData.order_number}</h1>
              <p className="text-body-sm text-gray-500 mt-1">{formatDateTime(orderData.created_at)}</p>
            </div>
            <div className={cn('px-4 py-2 rounded-lg text-body-sm font-medium', getStatusColor(orderData.status as OrderStatus))}>
              {getOrderStatusLabel(orderData.status)}
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-body-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>{orderData.delivery_address}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone className="w-4 h-4" />
              <span>{orderData.customer_phone}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Package className="w-4 h-4" />
              <span>{orderData.vendor_orders?.length || 0} متجر</span>
            </div>
          </div>

          <div className="divider my-4" />

          <div className="flex justify-between items-baseline">
            <span className="text-body-md text-gray-600">الإجمالي</span>
            <span className="price-lg">{formatPrice(orderData.total)}</span>
          </div>
        </div>

        {/* Vendor Orders */}
        <div className="space-y-6">
          {vendorOrders.map((vendorOrder) => (
            <section key={vendorOrder.id} className="card overflow-hidden" aria-labelledby={`vendor-${vendorOrder.id}`}>
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <img
                    src={vendorOrder.representative?.logo_url || '/images/placeholder-product.svg'}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                  <div>
                    <h2 id={`vendor-${vendorOrder.id}`} className="text-body-md font-semibold text-charcoal">
                      {vendorOrder.representative?.store_name}
                    </h2>
                    <p className="text-body-xs text-gray-500">
                      {vendorOrder.representative?.phone}
                    </p>
                  </div>
                  <div className="flex-1 text-left">
                    <span className={cn('badge', getStatusColor(vendorOrder.status as OrderStatus))}>
                      {getOrderStatusLabel(vendorOrder.status)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4">
                {/* Order Items */}
                <div className="space-y-3 mb-4">
                  {vendorOrder.items?.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.product?.main_image || '/images/placeholder-product.svg'}
                        alt=""
                        className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-body-sm font-medium text-charcoal line-clamp-1">
                          {item.product_name_snapshot}
                        </p>
                        <p className="text-body-xs text-gray-500">الكمية: {item.quantity}</p>
                        <p className="text-body-sm font-medium text-primary">{formatPrice(item.total)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Timeline */}
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-body-sm font-medium text-charcoal mb-3">تسلسل الحالة</h3>
                  {renderTimeline(vendorOrder)}
                </div>
              </div>
            </section>
          ))}
        </div>

        {/* Help */}
        <div className="card p-6 mt-6 bg-primary/5 border-primary/20">
          <h3 className="heading-4 text-primary mb-2">هل تحتاج مساعدة؟</h3>
          <p className="text-body-md text-gray-600 mb-4">
            للتواصل بخصوص طلبك، يمكنك الاتصال بالمندوب مباشرة أو التواصل مع خدمة العملاء
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="tel:920000000" className="btn-secondary flex items-center gap-2">
              <Phone className="w-4 h-4" />
              خدمة العملاء
            </a>
            <a href="/contact" className="btn-outline flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              تواصل معنا
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}