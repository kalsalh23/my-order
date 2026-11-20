import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Search, Filter, Trash2, Edit, Eye, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, uploadFile, deleteFile } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, formatPrice, formatRelativeTime, getOrderStatusLabel, getOrderStatusColor } from '@/utils'
import { ProductCard } from '@/components/products/ProductCard'
import { SkeletonProductGrid } from '@/components/common/Skeletons'
import type { Product, Category } from '@/types'

const productSchema = {
  name: { required: 'اسم المنتج مطلوب', minLength: { value: 2, message: 'الاسم يجب أن يكون حرفين على الأقل' } },
  price: { required: 'السعر مطلوب', min: { value: 0, message: 'السعر يجب أن يكون أكبر من صفر' } },
  stock_quantity: { required: 'الكمية مطلوبة', min: { value: 0, message: 'الكمية يجب أن تكون صفر أو أكثر' } },
  category_id: { required: 'القسم مطلوب' },
}

export function VendorProductsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [loading, setLoading] = useState(false)

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['vendor-products', user?.id, searchQuery, statusFilter],
    queryFn: async () => {
      if (!user) return []
      const { data: rep } = await supabase
        .from('representatives')
        .select('id')
        .eq('user_id', user.id)
        .single()
      if (!rep) return []

      let query = supabase
        .from('products')
        .select(`
          *,
          category:categories(id, name, slug)
        `)
        .eq('representative_id', rep.id)
        .order('created_at', { ascending: false })

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }

      const { data, error } = await query
      if (error) throw error
      return data as Product[]
    },
    enabled: !!user,
  })

  const deleteProduct = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      showToast({ type: 'success', title: 'تم الحذف', message: 'تم حذف المنتج بنجاح' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_active: isActive })
        .eq('id', productId)
      if (error) throw error
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      showToast({
        type: 'success',
        title: isActive ? 'تم التفعيل' : 'تم الإيقاف',
        message: isActive ? 'المنتج متاح الآن للعملاء' : 'تم إخفاء المنتج من المتجر'
      })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const handleDelete = (productId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء.')) {
      deleteProduct.mutate(productId)
    }
  }

  if (isLoading) {
    return <SkeletonProductGrid count={6} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-charcoal">منتجاتي</h1>
          <p className="text-body-md text-gray-500 mt-1">إدارة منتجات متجرك</p>
        </div>
        <Link to="/vendor/products/new" className="btn-primary">
          <Plus className="w-4 h-4" />
          إضافة منتج جديد
        </Link>
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="input w-auto"
          >
            <option value="all">الكل</option>
            <option value="active">نشط</option>
            <option value="inactive">مخفي</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        {products?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="heading-3 text-charcoal mb-2">لا توجد منتجات</h3>
            <p className="text-body-md text-gray-500 mb-6">ابدأ بإضافة أول منتج لمتجرك</p>
            <Link to="/vendor/products/new" className="btn-primary">
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
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500">الحالة</th>
                  <th className="px-4 py-3 text-left text-body-sm font-medium text-gray-500">الإجراءات</th>
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
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <p className="text-body-sm font-medium text-charcoal">{product.name}</p>
                          <p className="text-body-xs text-gray-500">SKU: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-left hidden md:table-cell">
                      <span className="text-body-sm text-gray-600">{product.category?.name}</span>
                    </td>
                    <td className="px-4 py-3 text-left hidden lg:table-cell">
                      <span className="price">{formatPrice(product.price)}</span>
                      {product.discount_price && (
                        <span className="old-price ml-2">{formatPrice(product.discount_price)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-left hidden lg:table-cell">
                      <span className={cn('text-body-sm font-medium', product.stock_quantity === 0 ? 'text-red-600' : product.stock_quantity < 10 ? 'text-amber-600' : 'text-gray-600')}>
                        {product.stock_quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <label className={cn('relative inline-flex items-center cursor-pointer', !deleteProduct.isPending && !toggleStatus.isPending ? '' : 'pointer-events-none opacity-50')}>
                        <input
                          type="checkbox"
                          checked={product.is_active}
                          onChange={(e) => toggleStatus.mutate({ productId: product.id, isActive: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className={cn(
                          'w-10 h-6 rounded-full transition-colors peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20',
                          product.is_active ? 'bg-primary' : 'bg-gray-300'
                        )}>
                          <span className={cn(
                            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform',
                            product.is_active ? 'translate-x-4' : 'translate-x-0'
                          )} />
                        </div>
                      </label>
                    </td>
                    <td className="px-4 py-3 text-left">
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/vendor/products/${product.id}/edit`}
                          className="btn-ghost p-2 text-primary hover:bg-primary/5"
                          aria-label="تعديل المنتج"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          disabled={deleteProduct.isPending}
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