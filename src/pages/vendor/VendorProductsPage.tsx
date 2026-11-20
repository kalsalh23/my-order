import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, User, Shield, Eye, Edit, Trash2, Loader2, MoreVertical, CheckCircle, XCircle, Clock, Package, AlertTriangle, MapPin, Store, LogOut } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, formatPrice, formatRelativeTime, getOrderStatusLabel, getOrderStatusColor } from '@/utils'
import type { VendorOrder, OrderStatus } from '@/types'

const STATUS_ORDER: OrderStatus[] = [
  'pending', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled', 'rejected',
]

export function AdminProductsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['admin-products', searchQuery, statusFilter, page],
    queryFn: async () => {
      if (!user) return []
      const { data: rep } = await supabase
        .from('representatives')
        .select('id')
        .eq('user_id', user.id)
        .single()

      let query = supabase
        .from('products')
        .select(
          `
            *,
            representative:representatives(id, store_name, store_slug, logo_url),
            category:categories(id, name, slug)
          `
        )
        .eq('representative_id', rep.id)
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : null)
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

  const handleDeleteProduct = useMutation({
    mutationFn: async (productId: string) => {
      // Delete images first
      const { data: images } = await supabase
        .from('product_images')
        .select('image_url')
        .eq('product_id', productId)

      if (images?.length) {
        await deleteFile('product-images', images.map(i => i.image_url))
      }

      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      showToast({ type: 'success', title: 'تم الحذف', message: 'تم حذف المنتج بنجاح' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ productId, newStatus }: { productId: string; newStatus: OrderStatus }) => {
      const { error } = await supabase
        .from('vendor_orders')
        .update({ order_id: productId, status: newStatus })
        .eq('representative_id', user?.id)
      if (error) throw error
    },
    onSuccess: (_, { newStatus }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      showToast({ type: 'success', title: newStatus === 'cancelled' ? 'ملغي' : 'تم التحديث', message: `تم تحديث الطلب ${newStatus}` })
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
          <h1 className="heading-2 text-charcoal">منتجات المتجر</h1>
          <p className="text-body-md text-gray-500 mt-1">إدارة منتجات متجرك</p>
        </div>
        <a href="/admin/products/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          إضافة منتج جديد
        </a>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="ابحث بالاسم..."
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
            <option value="active">نشط</option>
            <option value="inactive">مخفي</option>
            <option value="pending">معلق</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        {products?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Trash2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="heading-3 text-charcoal mb-2">لا توجد منتجات</h3>
            <p className="text-body-md text-gray-500 mb-6">ابدأ بإضافة أول منتج</p>
            <Link to="/admin/products/new" className="btn-primary">
              <Plus className="w-4 h-4" />
              إضافة منتج
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-right text-body-sm font-medium text-gray-500">المنتج</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500 hidden md:table-cell">القسم</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500 hidden lg:table-cell">السعر</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500 hidden lg:table-cell">المخزون</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500 hidden lg:table-cell">الحالة</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500 hidden lg:table-cell">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {products?.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={product.main_image || '/images/placeholder-product.svg'}
                          alt=""
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                        <div>
                          <p className="text-body-sm font-medium text-charcoal">{product.name}</p>
                          <p className="text-body-xs text-gray-500">SKU: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left hidden md:table-cell">
                      <span className={cn('badge', product.is_active ? 'badge-success' : 'badge-warning')}>
                        {product.is_active ? 'مفعل' : 'معطل'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left hidden lg:table-cell">
                      <span className="text-body-sm text-gray-600">{formatPrice(product.price)}</span>
                      {product.discount_price && (
                        <span className="old-price ml-2">{formatPrice(product.discount_price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-left">
                      <span className={cn('text-body-sm font-medium', product.stock_quantity === 0 ? 'text-red-600' : product.stock_quantity < 10 ? 'text-amber-600' : 'text-gray-600')}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/categories/${product.category?.slug}`}
                          className="btn-ghost p-2 text-primary hover:bg-primary/5"
                          aria-label={`قسم ${product.category?.name}`}
                        >
                          <Package className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={product.stock_quantity === 0}
                          className="btn-ghost p-2 text-red-600 hover:bg-red-50"
                          aria-label="حذف المنتج"
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
      </div>
    </div>
  )
}