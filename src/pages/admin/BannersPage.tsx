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

export function AdminBannersPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 20
  const [showForm, setShowForm] = useState(false)
  const [editingBanner, setEditingBanner] = useState<any | null>(null)

  const { data: banners, isLoading, refetch } = useQuery({
    queryKey: ['admin-banners', searchQuery, statusFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('banners')
        .select('*', { count: 'exact' })
        .order('sort_order')

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`)
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

  const deleteBanner = useMutation({
    mutationFn: async (bannerId: string) => {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', bannerId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
      showToast({ type: 'success', title: 'تم الحذف', message: 'تم حذف البانر بنجاح' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const toggleStatus = useMutation({
    mutationFn: async ({ bannerId, isActive }: { bannerId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('banners')
        .update({ is_active: isActive })
        .eq('id', bannerId)
      if (error) throw error
    },
    onSuccess: (_, { isActive }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] })
      showToast({ type: 'success', title: isActive ? 'تم التفعيل' : 'تم الإيقاف', message: isActive ? 'البانر نشط الآن' : 'تم إخفاء البانر' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  if (isLoading) {
    return <SkeletonProductGrid count={4} />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="heading-2 text-charcoal">البانرات الإعلانية</h1>
          <p className="text-body-md text-gray-500 mt-1">{totalCount} بانر</p>
        </div>
        <button
          onClick={() => { setEditingBanner(null); setShowForm(true) }}
          className="btn-primary"
        >
          <Plus className="w-4 h-4" />
          إضافة بانر جديد
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="search"
              placeholder="ابحث بالعنوان..."
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

      {/* Banners Grid */}
      <div className="card overflow-hidden">
        {banners?.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
              <Image className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="heading-3 text-charcoal mb-2">لا توجد بانرات</h3>
            <p className="text-body-md text-gray-500 mb-6">ابدأ بإضافة أول بانر إعلاني</p>
            <button
              onClick={() => { setEditingBanner(null); setShowForm(true) }}
              className="btn-primary"
            >
              <Plus className="w-4 h-4" />
              إضافة بانر
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {banners?.map((banner) => (
              <div key={banner.id} className="group relative flex flex-col rounded-lg border border-gray-100 overflow-hidden hover:shadow-card-hover transition-shadow">
                <div className="relative aspect-video overflow-hidden bg-gray-50">
                  {banner.image_url ? (
                    <img
                      src={getImageUrl(banner.image_url)}
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
                      onClick={() => { setEditingBanner(banner); setShowForm(true) }}
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-primary hover:bg-white transition-colors touch-manipulation"
                      aria-label="تعديل البانر"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm('هل أنت متأكد من حذف هذا البانر؟')) deleteBanner.mutate(banner.id) }}
                      disabled={deleteBanner.isPending}
                      className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors touch-manipulation"
                      aria-label="حذف البانر"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="text-body-sm font-medium text-charcoal line-clamp-1 mb-1">{banner.title}</h3>
                  <div className="flex items-center gap-2 mt-auto">
                    <span className={cn('badge badge-outline text-caption', banner.is_active ? 'text-green-600 border-green-300' : 'text-gray-500 border-gray-300')}>
                      {banner.is_active ? 'نشط' : 'مخفي'}
                    </span>
                    <span className="text-body-xs text-gray-500">ترتيب: {banner.sort_order}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Banner Form Modal */}
      {(showForm || editingBanner) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingBanner(null) }}>
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="heading-4">{editingBanner ? 'تعديل البانر' : 'إضافة بانر جديد'}</h2>
              <button
                onClick={() => { setShowForm(false); setEditingBanner(null) }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 touch-manipulation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <BannerForm
              banner={editingBanner}
              onClose={() => { setShowForm(false); setEditingBanner(null) }}
              onSuccess={() => { refetch(); setShowForm(false); setEditingBanner(null) }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function BannerForm({ banner, onClose, onSuccess }: { banner: any | null; onClose: () => void; onSuccess: () => void }) {
  const { showToast } = useToast()
  const [title, setTitle] = useState(banner?.title || '')
  const [targetUrl, setTargetUrl] = useState(banner?.target_url || '')
  const [sortOrder, setSortOrder] = useState(banner?.sort_order || 0)
  const [isActive, setIsActive] = useState(banner?.is_active !== false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(banner?.image_url || null)
  const [saving, setSaving] = useState(false)

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast({ type: 'error', title: 'خطأ', message: 'يجب أن يكون الملف صورة' })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast({ type: 'error', title: 'خطأ', message: 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' })
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      showToast({ type: 'error', title: 'خطأ', message: 'عنوان البانر مطلوب' })
      return
    }
    if (!imagePreview && !imageFile) {
      showToast({ type: 'error', title: 'خطأ', message: 'صورة البانر مطلوبة' })
      return
    }

    setSaving(true)
    try {
      let imagePath = banner?.image_url

      if (imageFile) {
        const { data: uploadData, error } = await uploadFile('banner-images', `banners/${Date.now()}-${imageFile.name}`, imageFile)
        if (error) throw error
        imagePath = uploadData?.path
      }

      const bannerData = {
        title: title.trim(),
        image_url: imagePath,
        target_url: targetUrl.trim() || null,
        sort_order: sortOrder,
        is_active: isActive,
      }

      if (banner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', banner.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('banners')
          .insert(bannerData)
        if (error) throw error
      }

      showToast({ type: 'success', title: banner ? 'تم التحديث' : 'تم الإنشاء', message: `تم ${banner ? 'تحديث' : 'إضافة'} البانر بنجاح` })
      onSuccess()
    } catch (error) {
      showToast({ type: 'error', title: 'خطأ', message: error instanceof Error ? error.message : 'فشل حفظ البانر' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4" noValidate>
      <div>
        <label htmlFor="title" className="label">العنوان *</label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="مثال: عروض الصيف الحصرية"
          autoFocus
        />
      </div>

      <div>
        <label htmlFor="target_url" className="label">رابط التوجيه (اختياري)</label>
        <input
          id="target_url"
          type="url"
          value={targetUrl}
          onChange={(e) => setTargetUrl(e.target.value)}
          className="input"
          placeholder="https://mandoubtaiba.sa/products?sale=true"
        />
        <p className="text-body-xs text-gray-500 mt-1">اتركه فارغاً للتوجيه لصفحة المنتجات</p>
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
        <label className="label">الصورة *</label>
        <div className="relative">
          <div className="aspect-video w-full rounded-lg border-2 border-gray-200 overflow-hidden relative bg-gray-50">
            {imagePreview ? (
              <img src={imagePreview} alt="معاينة" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                <Image className="w-10 h-10" />
                <span className="text-body-md">اضغط لاختيار صورة</span>
                <span className="text-body-xs">JPG, PNG, WebP - حتى 5 ميجابايت - نسبة 16:9</span>
              </div>
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
              <Image className="w-8 h-8 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                aria-label="اختر صورة البانر"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-body-md font-medium text-charcoal">حالة البانر</p>
          <p className="text-body-sm text-gray-500">عند التفعيل، سيظهر البانر في الصفحة الرئيسية</p>
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
            banner ? 'حفظ التغييرات' : 'إضافة البانر'
          )}
        </button>
      </div>
    </form>
  )
}