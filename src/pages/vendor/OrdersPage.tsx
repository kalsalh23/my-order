import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatPrice, formatRelativeTime, getOrderStatusLabel, getOrderStatusColor } from '@/utils'
import { Truck, Clock, CheckCircle, AlertTriangle, XCircle, Package, Filter, Search } from 'lucide-react'
import type { VendorOrder, OrderStatus } from '@/types'

const STATUS_ORDER: OrderStatus[] = [
  'pending',
  'accepted',
  'preparing',
  'ready',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'rejected',
]

export function VendorOrdersPage() {
  const { user } = useAuth()
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  const { data: orders, isLoading, refetch } = useQuery({
    queryKey: ['vendor-orders', user?.id, statusFilter, searchQuery, page],
    queryFn: async () => {
      if (!user) return { data: [], count: 0 }

      const { data: rep } = await supabase
        .from('representatives')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!rep) return { data: [], count: 0 }

      let query = supabase
        .from('vendor_orders')
        .select(
          `
          *,
          order:orders(order_number, customer_name, customer_phone, delivery_address, created_at),
          items:order_items(*, product:products(name, main_image))
        `,
          { count: 'exact' }
        )
        .eq('representative_id', rep.id)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (searchQuery) {
        query = query.ilike('order.order_number', `%${searchQuery}%`)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return { data: data || [], count: count || 0 }
    },
    enabled: !!user,
  })

  const statusTabs = [
    { value: 'all', label: 'الكل', icon: Package },
    { value: 'pending', label: 'قيد الانتظار', icon: Clock },
    { value: 'accepted', label: 'مقبول', icon: CheckCircle },
    { value: 'preparing', label: 'قيد التحضير', icon: Package },
    { value: 'ready', label: 'جاهز', icon: CheckCircle },
    { value: 'out_for_delivery', label: 'قيد التوصيل', icon: Truck },
    { value: 'delivered', label: 'مكتمل', icon: CheckCircle },
    { value: 'cancelled', label: 'ملغي', icon: XCircle },
    { value: 'rejected', label: 'مرفوض', icon: AlertTriangle },
  ] as const

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="skeleton w-12 h-12 rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-4 w-1/2" />
                <div className="skeleton h-3 w-1/3" />
              </div>
              <div className="skeleton h-6 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  const { data: ordersData = [], count: total = 0 } = orders || { data: [], count: 0 }
  setTotalCount(total)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-charcoal">الطلبات</h1>
          <p className="text-body-md text-gray-500 mt-1">{total} طلب إجمالي</p>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="card overflow-hidden">
        <nav className="flex overflow-x-auto scrollbar-hide p-1" role="tablist" aria-label="تصفية الطلبات حسب الحالة">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.value
            return (
              <button
                key={tab.value}
                role="tab"
                aria-selected={isActive}
                onClick={() => { setStatusFilter(tab.value as typeof statusFilter); setPage(1) }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 text-body-sm font-medium whitespace-nowrap rounded-lg transition-colors touch-manipulation',
                  isActive
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Search */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="ابحث برقم الطلب..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="card overflow-hidden">
        {ordersData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Package className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="heading-3 text-charcoal mb-2">لا توجد طلبات</h3>
            <p className="text-body-md text-gray-500">
              {statusFilter !== 'all' ? 'لا توجد طلبات بهذه الحالة' : 'ستظهر الطلبات الجديدة هنا'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {ordersData.map((vendorOrder) => (
              <Link
                key={vendorOrder.id}
                to={`/vendor/orders/${vendorOrder.id}`}
                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors touch-manipulation"
              >
                <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Package className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-body-md font-medium text-charcoal truncate">
                      طلب #{vendorOrder.order?.order_number}
                    </p>
                    <span className={cn('badge', getOrderStatusColor(vendorOrder.status as OrderStatus))}>
                      {getOrderStatusLabel(vendorOrder.status)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-body-sm text-gray-500">
                    <span>{vendorOrder.order?.customer_name}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(vendorOrder.created_at)}</span>
                    <span className="ml-auto font-medium text-primary">{formatPrice(vendorOrder.total)}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {ordersData.length > 0 && totalCount > pageSize && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-body-sm text-gray-500">
              عرض {Math.min(page * pageSize, totalCount)} من {totalCount}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-secondary btn-sm"
              >
                السابق
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page * pageSize >= totalCount}
                className="btn-secondary btn-sm"
              >
                التالي
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}