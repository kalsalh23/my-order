import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, formatRelativeTime, getOrderStatusLabel, getOrderStatusColor } from '@/utils'
import { Plus, Search, Filter, User, Shield, Eye, Edit, Trash2, Loader2, MoreVertical, CheckCircle, XCircle, Clock } from 'lucide-react'
import { SkeletonProductGrid } from '@/components/common/Skeletons'

interface Representative {
  id: string
  user_id: string
  store_name: string
  store_slug: string
  description: string | null
  logo_url: string | null
  cover_url: string | null
  phone: string | null
  location: string | null
  is_visible: boolean
  created_at: string
  updated_at: string
  user: {
    id: string
    full_name: string
    email: string
    phone: string | null
    avatar_url: string | null
    role: string
    is_active: boolean
  }
  products_count?: number
  orders_count?: number
}

export function AdminRepresentativesPage() {
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'pending'>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20

  const { data: reps, isLoading, refetch } = useQuery({
    queryKey: ['admin-representatives', searchQuery, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('representatives')
        .select(`
          *,
          user:profiles(id, full_name, email, phone, avatar_url, role, is_active),
          products:products(count),
          vendor_orders:vendor_orders(count)
        `, { count: 'exact' })
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.or(`store_name.ilike.%${searchQuery}%,store_slug.ilike.%${searchQuery}%,user.full_name.ilike.%${searchQuery}%,user.email.ilike.%${searchQuery}%`)
      }

      if (statusFilter !== 'all') {
        if (statusFilter === 'active') query = query.eq('is_visible', true).eq('user.is_active', true)
        else if (statusFilter === 'inactive') query = query.eq('is_visible', false)
        else if (statusFilter === 'pending') query = query.eq('user.is_active', false)
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return { data: data as Representative[], count: count || 0 }
    },
  })

  const deleteRep = useMutation({
    mutationFn: async (repId: string) => {
      // Get user_id first
      const { data: rep } = await supabase
        .from('representatives')
        .select('user_id')
        .eq('id', repId)
        .single()

      if (rep) {
        // Delete from auth (cascades to profiles)
        const { error: authError } = await supabase.auth.admin.deleteUser(rep.user_id)
        if (authError) throw authError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-representatives'] })
      showToast({ type: 'success', title: 'تم الحذف', message: 'تم حذف المندوب وحسابه' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const toggleVisibility = useMutation({
    mutationFn: async ({ repId, isVisible }: { repId: string; isVisible: boolean }) => {
      const { error } = await supabase
        .from('representatives')
        .update({ is_visible: isVisible })
        .eq('id', repId)
      if (error) throw error
    },
    onSuccess: (_, { isVisible }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-representatives'] })
      showToast({ type: 'success', title: isVisible ? 'تم التفعيل' : 'تم الإيقاف', message: isVisible ? 'المندوب مرئي الآن' : 'تم إخفاء المندوب' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const toggleUserActive = useMutation({
    mutationFn: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId)
      if (error) throw error
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-representatives'] })
      showToast({ type: 'success', title: isActive ? 'تم التفعيل' : 'تم الإيقاف', message: isActive ? 'الحساب مفعل' : 'الحساب معطل' })
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
          <h1 className="heading-2 text-charcoal">المندوبون</h1>
          <p className="text-body-md text-gray-500 mt-1">{totalCount} مندوب</p>
        </div>
        <a href="/admin/representatives/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          مندوب جديد
        </a>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="ابحث بالاسم، الإيميل، المتجر..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1) }}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as typeof statusFilter); setPage(1) }}
            className="input w-auto"
          >
            <option value="all">الكل</option>
            <option value="active">نشط ومرئي</option>
            <option value="inactive">مخفي</option>
            <option value="pending">معلق</option>
          </select>
        </div>
      </div>

      {/* Representatives Table */}
      <div className="card overflow-hidden">
        {reps?.data?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="heading-3 text-charcoal mb-2">لا توجد مندوبين</h3>
            <p className="text-body-md text-gray-500 mb-6">ابدأ بإضافة أول مندوب</p>
            <a href="/admin/representatives/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              إضافة مندوب
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-body-sm font-medium text-gray-500">المندوب</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500 hidden md:table-cell">المتجر</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500 hidden lg:table-cell">الحساب</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500 hidden lg:table-cell">المنتجات</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500 hidden lg:table-cell">الطلبات</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500">الحالة</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500">التاريخ</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reps?.data?.map((rep) => (
                  <tr key={rep.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={rep.user?.avatar_url || `/images/placeholder-product.svg`}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-body-sm font-medium text-charcoal">{rep.user?.full_name}</p>
                          <p className="text-body-xs text-gray-500">{rep.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left hidden md:table-cell">
                      <div>
                        <p className="text-body-sm font-medium text-charcoal">{rep.store_name}</p>
                        <p className="text-body-xs text-gray-500">@{rep.store_slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left hidden lg:table-cell">
                      <span className={cn('badge', rep.user?.is_active ? 'badge-success' : 'badge-warning')}>
                        {rep.user?.is_active ? 'مفعل' : 'معطل'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left hidden lg:table-cell">
                      <span className="text-body-sm text-gray-600">{rep.products?.[0]?.count || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-left hidden lg:table-cell">
                      <span className="text-body-sm text-gray-600">{rep.vendor_orders?.[0]?.count || 0}</span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <label className={cn('relative inline-flex items-center cursor-pointer', !toggleVisibility.isPending ? '' : 'pointer-events-none opacity-50')}>
                          <input
                            type="checkbox"
                            checked={rep.is_visible}
                            onChange={(e) => toggleVisibility.mutate({ repId: rep.id, isVisible: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className={cn(
                            'w-10 h-6 rounded-full transition-colors peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20',
                            rep.is_visible ? 'bg-primary' : 'bg-gray-300'
                          )}>
                            <span className={cn(
                              'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                              rep.is_visible ? 'translate-x-4' : 'translate-x-0'
                            )} />
                          </div>
                        </label>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className="text-body-xs text-gray-500">{formatRelativeTime(rep.created_at)}</span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-1">
                        <a href={`/admin/representatives/${rep.id}`} className="btn-ghost p-2" aria-label="عرض التفاصيل">
                          <Eye className="w-4 h-4" />
                        </a>
                        <a href={`/admin/representatives/${rep.id}/edit`} className="btn-ghost p-2" aria-label="تعديل">
                          <Edit className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => { if (confirm('هل أنت متأكد من حذف هذا المندوب وحسابه؟ لا يمكن التراجع.')) deleteRep.mutate(rep.id) }}
                          disabled={deleteRep.isPending}
                          className="btn-ghost p-2 text-red-600 hover:bg-red-50"
                          aria-label="حذف المندوب"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

          {/* Pagination */}
          {reps?.data?.length > 0 && totalCount > pageSize && (
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