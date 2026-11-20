import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, formatPrice, formatRelativeTime } from '@/utils'
import { Users, Package, ShoppingBag, DollarSign, TrendingUp, Clock, Plus, Search, Loader2, Activity } from 'lucide-react'
import { SkeletonProductGrid } from '@/components/common/Skeletons'

interface AdminStats {
  total_representatives: number
  active_representatives: number
  total_products: number
  total_orders: number
  pending_orders: number
  completed_orders: number
  total_sales: number
  recent_activity: Array<{
    id: string
    type: string
    description: string
    created_at: string
    user?: { full_name: string }
    representative?: { store_name: string }
  }>
}

export function AdminDashboardPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [
        { count: totalReps },
        { count: activeReps },
        { count: totalProducts },
        { count: totalOrders },
        { count: pendingOrders },
        { count: completedOrders },
        { data: salesData },
        { data: activity },
      ] = await Promise.all([
        supabase.from('representatives').select('*', { count: 'exact', head: true }),
        supabase.from('representatives').select('*', { count: 'exact', head: true }).eq('is_visible', true),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'delivered'),
        supabase.from('vendor_orders').select('total').eq('status', 'delivered'),
        supabase
          .from('orders')
          .select('id, order_number, customer_name, created_at, status')
          .order('created_at', { ascending: false })
          .limit(10),
      ])

      const totalSales = salesData?.reduce((sum, v) => sum + (v.total || 0), 0) || 0

      return {
        total_representatives: totalReps || 0,
        active_representatives: activeReps || 0,
        total_products: totalProducts || 0,
        total_orders: totalOrders || 0,
        pending_orders: pendingOrders || 0,
        completed_orders: completedOrders || 0,
        total_sales: totalSales,
        recent_activity: activity?.map((o: any) => ({
          id: o.id,
          type: 'order_created',
          description: `طلب جديد #${o.order_number} من ${o.customer_name}`,
          created_at: o.created_at,
        })) || [],
      } as AdminStats
    },
  })

  const statsCards = [
    { label: 'إجمالي المندوبين', value: stats?.total_representatives || 0, icon: Users, color: 'primary' },
    { label: 'المندوبون النشطون', value: stats?.active_representatives || 0, icon: CheckCircle, color: 'green' },
    { label: 'إجمالي المنتجات', value: stats?.total_products || 0, icon: Package, color: 'blue' },
    { label: 'إجمالي الطلبات', value: stats?.total_orders || 0, icon: ShoppingBag, color: 'amber' },
    { label: 'الطلبات المعلقة', value: stats?.pending_orders || 0, icon: Clock, color: 'orange' },
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
                <div className="skeleton w-10 h-10 rounded" />
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-charcoal">لوحة التحكم</h1>
          <p className="text-body-md text-gray-500 mt-1">مرحباً بك، {user?.full_name}</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary">
            <Activity className="w-4 h-4" />
            تحديث
          </button>
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
                stat.color === 'orange' && 'bg-orange-100 text-orange-600',
              )}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            <a href="/admin/representatives/new" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <Plus className="w-8 h-8" />
              <span className="text-body-sm">مندوب جديد</span>
            </a>
            <a href="/admin/products" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <Package className="w-8 h-8" />
              <span className="text-body-sm">المنتجات</span>
            </a>
            <a href="/admin/orders" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <ShoppingBag className="w-8 h-8" />
              <span className="text-body-sm">الطلبات</span>
            </a>
            <a href="/admin/categories" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <Grid className="w-8 h-8" />
              <span className="text-body-sm">الأقسام</span>
            </a>
            <a href="/admin/banners" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <Image className="w-8 h-8" />
              <span className="text-body-sm">البانرات</span>
            </a>
            <a href="/admin/settings" className="btn-secondary h-24 flex flex-col items-center justify-center gap-2 text-center touch-manipulation">
              <Settings className="w-8 h-8" />
              <span className="text-body-sm">الإعدادات</span>
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="heading-4">النشاط الأخير</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {stats?.recent_activity?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Activity className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-body-md">لا يوجد نشاط حديث</p>
              </div>
            ) : (
              stats?.recent_activity.map((item) => (
                <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-charcoal">{item.description}</p>
                      <p className="text-body-xs text-gray-500 mt-0.5">{formatRelativeTime(item.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}