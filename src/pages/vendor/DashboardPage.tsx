import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { SectionHeader } from '@/components/common/SectionHeader'
import { ProductCard } from '@/components/products/ProductCard'
import { formatPrice, formatRelativeTime, getOrderStatusLabel, getOrderStatusColor, cn } from '@/utils'
import { Package, ShoppingBag, Clock, CheckCircle, TrendingUp, DollarSign, AlertTriangle } from 'lucide-react'
import type { OrderStatus } from '@/types'

interface VendorStats {
  total_products: number
  active_products: number
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_sales: number
  recent_orders: any[]
  top_products: any[]
}

export function VendorDashboardPage() {
  const { user } = useAuth()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendor-stats', user?.id],
    queryFn: async () => {
      if (!user) throw new Error('Not authenticated')

      const { data: rep } = await supabase
        .from('representatives')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!rep) throw new Error('Representative not found')

      const { data, error } = await supabase.rpc('get_representative_stats', { rep_id: rep.id })
      if (error) throw error
      return data?.[0] as VendorStats
    },
    enabled: !!user,
  })

  const { data: recentOrders } = useQuery({
    queryKey: ['vendor-recent-orders', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data: rep } = await supabase
        .from('representatives')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!rep) return []

      const { data, error } = await supabase
        .from('vendor_orders')
        .select(`
          *,
          order:orders(order_number, customer_name, customer_phone, created_at),
          items:order_items(*, product:products(name, main_image))
        `)
        .eq('representative_id', rep.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error
      return data
    },
    enabled: !!user,
  })

  const statsCards = [
    { label: 'إجمالي المنتجات', value: stats?.total_products || 0, icon: Package, color: 'primary' },
    { label: 'المنتجات النشطة', value: stats?.active_products || 0, icon: CheckCircle, color: 'green' },
    { label: 'إجمالي الطلبات', value: stats?.total_orders || 0, icon: ShoppingBag, color: 'blue' },
    { label: 'الطلبات المعلقة', value: stats?.pending_orders || 0, icon: Clock, color: 'amber' },
    { label: 'الطلبات المكتملة', value: stats?.completed_orders || 0, icon: TrendingUp, color: 'emerald' },
    { label: 'إجمالي المبيعات', value: formatPrice(stats?.total_sales || 0), icon: DollarSign, color: 'primary' },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="skeleton h-8 w-3/4 mb-2" />
              <div className="skeleton h-10 w-1/2" />
            </div>
          ))}
        </div>
        <div className="card p-6 animate-pulse">
          <div className="skeleton h-6 w-1/4 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton w-12 h-12 rounded" />
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

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-charcoal">مرحباً بعودتك، {stats?.recent_orders?.[0]?.order?.customer_name ? 'مندوب' : 'مندوب'}</h1>
          <p className="text-body-md text-gray-500 mt-1">إليك ملخص أداء متجرك اليوم</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statsCards.map((stat) => (
          <div
            key={stat.label}
            className="card p-5 hover:shadow-card-hover transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-body-sm text-gray-500">{stat.label}</p>
                <p className="text-display-sm font-bold text-charcoal mt-1">{stat.value}</p>
              </div>
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center',
                stat.color === 'primary' && 'bg-primary/10 text-primary',
                stat.color === 'green' && 'bg-green-100 text-green-600',
                stat.color === 'blue' && 'bg-blue-100 text-blue-600',
                stat.color === 'amber' && 'bg-amber-100 text-amber-600',
                stat.color === 'emerald' && 'bg-emerald-100 text-emerald-600',
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders & Quick Actions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <SectionHeader title="أحدث الطلبات" action={{ label: 'عرض الكل', href: '/vendor/orders' }} />
          </div>
          <div className="divide-y divide-gray-100">
            {recentOrders?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-body-md">لا توجد طلبات حديثة</p>
                <p className="text-body-sm mt-1">ستظهر الطلبات الجديدة هنا</p>
              </div>
            ) : (
              recentOrders.map((vendorOrder) => (
                <Link
                  key={vendorOrder.id}
                  to={`/vendor/orders/${vendorOrder.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors touch-manipulation"
                >
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-charcoal truncate">
                      طلب #{vendorOrder.order?.order_number}
                    </p>
                    <p className="text-body-xs text-gray-500">
                      {vendorOrder.order?.customer_name} • {formatRelativeTime(vendorOrder.created_at)}
                    </p>
                  </div>
                  <span className={cn('badge', getOrderStatusColor(vendorOrder.status as OrderStatus))}>
                    {getOrderStatusLabel(vendorOrder.status)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/vendor/products/new" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <Package className="w-8 h-8" />
              <span className="text-body-sm">إضافة منتج</span>
            </a>
            <a href="/vendor/orders" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <ShoppingBag className="w-8 h-8" />
              <span className="text-body-sm">إدارة الطلبات</span>
            </a>
            <a href="/vendor/profile" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <Store className="w-8 h-8" />
              <span className="text-body-sm">تعديل المتجر</span>
            </a>
            <a href="/vendor/settings" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <Settings className="w-8 h-8" />
              <span className="text-body-sm">الإعدادات</span>
            </a>
          </div>
        </div>
      </div>

      {/* Top Products */}
      {stats?.top_products?.length > 0 && (
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <SectionHeader title="أكثر المنتجات مبيعاً" action={{ label: 'عرض الكل', href: '/vendor/products' }} />
          </div>
          <div className="p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {stats.top_products.slice(0, 8).map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}