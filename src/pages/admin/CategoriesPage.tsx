import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Filter, Grid, Edit, Trash2, Image, Eye, Loader2, ArrowLeft, MoreVertical, CheckCircle, XCircle, Clock, Package, AlertTriangle, MapPin, Store, LogOut, Home, Settings, Users, ShoppingBag, Bell, LayoutDashboard } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, uploadFile, deleteFile } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, getImageUrl } from '@/utils'
import { SkeletonProductGrid, SkeletonCategoryCard } from '@/components/common/Skeletons'
import type { Category } from '@/types'

export function AdminCategoriesPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  const { data: categories, isLoading, refetch } = useQuery({
    queryKey: ['admin-categories', searchQuery, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('categories')
        .select('*', { count: 'exact' })
        .order('sort_order')

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`)
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active')
      }

      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query
      if (error) throw error

      return { data: data || [], count: count || 0 }
    },
  })

  const deleteCategory = useMutation({
    mutationFn: async (categoryId: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      showToast({ type: 'success', title: 'تم الحذف', message: 'تم حذف القسم بنجاح' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ categoryId, isActive }: { categoryId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: isActive })
        .eq('id', categoryId)
      if (error) throw error
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      showToast({ type: 'success', title: isActive ? 'تم التفعيل' : 'تم الإيقاف', message: isActive ? 'القسم نشط الآن' : 'تم إخفاء القسم' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  if (isLoading) {
    return <SkeletonCategoryGrid count={8} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-charcoal">الأقسام</h1>
          <p className="text-body-md text-gray-500 mt-1">{totalCount} قسم</p>
        </div>
        <button
          onClick={() => { setEditingCategory(null); setShowForm(true) }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          إضافة قسم جديد
        </button>
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
          </select>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="card overflow-hidden">
        {categories?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Grid className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="heading-3 text-charcoal mb-2">لا توجد أقسام</h3>
            <p className="text-body-md text-gray-500 mb-6">ابدأ بإضافة أول قسم</p>
            <button
              onClick={() => { setEditingCategory(null); setShowForm(true) }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              إضافة قسم
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-4">
            {categories?.map((category) => (
              <div key={category.id} className="group relative flex flex-col items-center p-3 rounded-lg border border-gray-100 hover:border-primary/50 hover:bg-gray-50 transition-colors">
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-50 mb-2">
                  {category.image_url ? (
                    <img
                      src={getImageUrl(category.image_url)}
                      alt=""
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <Image className="w-8 h-8" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <button
                      onClick={() => { setEditingCategory(category); setShowForm(true) }}
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-primary hover:bg-white transition-colors touch-manipulation"
                      aria-label="تعديل القسم"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('هل أنت متأكد من حذف هذا القسم؟')) deleteCategory.mutate(category.id) }}
                      disabled={deleteCategory.isPending}
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
                      aria-label="حذف القسم"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <h3 className="text-body-sm font-medium text-charcoal text-center line-clamp-1 w-full">{category.name}</h3>
                <span className={cn('badge badge-outline text-caption', category.is_active ? 'text-green-600 border-green-300' : 'text-gray-500 border-gray-300')}>
                  {category.is_active ? 'نشط' : 'مخفي'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      {(showForm || editingCategory) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingCategory(null) }}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="heading-4">{editingCategory ? 'تعديل القسم' : 'إضافة قسم جديد'}</h2>
              <button
                onClick={() => { setShowForm(false); setEditingCategory(null) }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <CategoryForm
              category={editingCategory}
              onClose={() => { setShowForm(false); setEditingCategory(null) }}
              onSuccess={() => { refetch(); setShowForm(false); setEditingCategory(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function CategoryForm({ category, onClose, onSuccess }: { category: Category | null; onClose: () => void; onSuccess: () => void }) {
  const { showToast } = useToast()
  const [name, setName] = useState(category?.name || '')
  const [slug, setSlug] = useState(category?.slug || '')
  const [sortOrder, setSortOrder] = useState(category?.sort_order || 0)
  const [isActive, setIsActive] = useState(category?.is_active !== false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(category?.image_url || null)
  const [saving, setSaving] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast({ type: 'error', title: 'خطأ', message: 'يجب أن يكون الملف صورة' })
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast({ type: 'error', title: 'خطأ', message: 'حجم الصورة يجب أن يكون أقل من 2 ميجابايت' })
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      showToast({ type: 'error', title: 'خطأ', message: 'اسم القسم مطلوب' })
      return
    }
    if (!slug.trim()) {
      showToast({ type: 'error', title: 'خطأ', message: 'المعرف مطلوب' })
      return
    }

    setSaving(true)
    try {
      let imagePath = category?.image_url

      if (imageFile) {
        const { data: uploadData, error } = await uploadFile('category-images', `categories/${Date.now()}-${imageFile.name}`, imageFile)
        if (error) throw error
        imagePath = uploadData?.path
      }

      const categoryData = {
        name: name.trim(),
        slug: slug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, ''),
        image_url: imagePath,
        sort_order: sortOrder,
        is_active: isActive,
      }

      if (category) {
        const { error } = await supabase
          .from('categories')
          .update(categoryData)
          .eq('id', category.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('categories')
          .insert(categoryData)
        if (error) throw error
      }

      showToast({ type: 'success', title: category ? 'تم التحديث' : 'تم الإنشاء', message: `تم ${category ? 'تحديث' : 'إضافة'} القسم بنجاح` })
      onSuccess()
    } catch (error) {
      showToast({ type: 'error', title: 'خطأ', message: error instanceof Error ? error.message : 'فشل حفظ القسم' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
      <div>
        <label htmlFor="name" className="label">اسم القسم *</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="input"
          placeholder="مثال: إلكترونيات"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="slug" className="label">المعرف (Slug) *</label>
        <input
          id="slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="input"
          placeholder="مثال: electronics"
        />
        <p className="text-body-xs text-gray-500 mt-1">يستخدم في الروابط، أحرف إنجليزية وأرقام وشرطات فقط</p>
      </div>

      <div>
        <label htmlFor="sort_order" className="label">ترتيب العرض</label>
        <input
          id="sort_order"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="input w-24"
          min="0"
        />
      </div>

      <div>
        <label className="label">الصورة</label>
        <div className="relative">
          <div className="aspect-square w-full max-w-xs mx-auto rounded-lg border-2 border-gray-200 overflow-hidden relative bg-gray-50">
            {imagePreview ? (
              <img src={imagePreview} alt="معاينة" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <Image className="w-10 h-10" />
                <span className="text-body-md">اضغط لاختيار صورة</span>
                <span className="text-body-xs">JPG, PNG, WebP - حتى 2 ميجابايت</span>
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <Image className="w-8 h-8 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="اختر صورة القسم"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-md font-medium text-charcoal">حالة القسم</p>
          <p className="text-body-sm text-gray-500">عند التفعيل، سيظهر القسم للعملاء</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="sr-only peer"
          />
          <div className={cn(
            'w-12 h-7 rounded-full transition-colors peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20',
            isActive ? 'bg-primary' : 'bg-gray-300'
          )}>
            <span className={cn(
              'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
              isActive ? 'translate-x-5' : 'translate-x-0'
            )} />
          </div>
        </label>
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
              جاري الحفظ...
            </>
          ) : (
            category ? 'حفظ التغييرات' : 'إضافة القسم'
          )}
        </button>
      </div>
    </form>
  )
}