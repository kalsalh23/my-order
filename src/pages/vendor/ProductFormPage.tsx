import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase, uploadFile, deleteFile } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, getImageUrl } from '@/utils'
import { Camera, X, Loader2, Save, ArrowLeft, Tag, DollarSign, Package, Image } from 'lucide-react'
import type { Product, Category } from '@/types'

const productSchema = z.object({
  name: z.string().min(2, 'اسم المنتج يجب أن يكون حرفين على الأقل').max(100),
  description: z.string().max(2000).optional(),
  price: z.number().min(0.01, 'السعر يجب أن يكون أكبر من صفر'),
  discount_price: z.number().min(0).optional().nullable(),
  stock_quantity: z.number().int().min(0, 'الكمية يجب أن تكون صفر أو أكثر'),
  category_id: z.string().uuid('اختر قسماً صحيحاً'),
  is_active: z.boolean().default(true),
})

type ProductFormData = z.infer<typeof productSchema>

export function VendorProductFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = !!id
  const navigate = useNavigate()
  const { user } = useAuth()
  const { showToast } = useToast()
  const queryClient = useQueryClient()
  const [mainImageFile, setMainImageFile] = useState<File | null>(null)
  const [mainImagePreview, setMainImagePreview] = useState<string | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      discount_price: null,
      stock_quantity: 0,
      category_id: '',
      is_active: true,
    },
  })

  const discountPrice = watch('discount_price')
  const price = watch('price')

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .eq('is_active', true)
        .order('sort_order')
      if (!error && data) setCategories(data)
    }
    fetchCategories()
  }, [])

  // Fetch product if editing
  useEffect(() => {
    if (!isEditing || !id) return

    const fetchProduct = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, images:product_images(image_url)')
        .eq('id', id)
        .single()

      if (error || !data) {
        showToast({ type: 'error', title: 'خطأ', message: 'المنتج غير موجود' })
        navigate('/vendor/products')
        return
      }

      reset({
        name: data.name,
        description: data.description || '',
        price: data.price,
        discount_price: data.discount_price,
        stock_quantity: data.stock_quantity,
        category_id: data.category_id,
        is_active: data.is_active,
      })

      if (data.main_image) {
        setMainImagePreview(getImageUrl(data.main_image))
      }

      if (data.images?.length) {
        setExistingImages(data.images.map((img: any) => getImageUrl(img.image_url)))
        setAdditionalPreviews(data.images.map((img: any) => getImageUrl(img.image_url)))
      }
    }

    fetchProduct()
  }, [id, isEditing, navigate, reset, showToast])

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setMainImageFile(file)
      setMainImagePreview(URL.createObjectURL(file))
    }
  }

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (additionalImages.length + files.length > 5) {
      showToast({ type: 'error', title: 'خطأ', message: 'الحد الأقصى 5 صور إضافية' })
      return
    }

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        showToast({ type: 'error', title: 'خطأ', message: 'يجب أن تكون جميع الملفات صوراً' })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast({ type: 'error', title: 'خطأ', message: 'حجم كل صورة يجب أن يكون أقل من 5 ميجابايت' })
        return
      }
    })

    const newImages = [...additionalImages, ...files]
    const newPreviews = [...additionalPreviews, ...files.map(f => URL.createObjectURL(f))]
    setAdditionalImages(newImages)
    setAdditionalPreviews(newPreviews)
  }

  const removeAdditionalImage = (index: number) => {
    setAdditionalImages(additionalImages.filter((_, i) => i !== index))
    setAdditionalPreviews(additionalPreviews.filter((_, i) => i !== index))
  }

  const removeExistingImage = async (imageUrl: string) => {
    setDeleting(imageUrl)
    try {
      const path = imageUrl.replace(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`, '')
      await deleteFile('product-images', [path])
      setExistingImages(existingImages.filter(url => url !== imageUrl))
      setAdditionalPreviews(additionalPreviews.filter(url => url !== imageUrl))
      showToast({ type: 'success', title: 'تم الحذف', message: 'تم حذف الصورة' })
    } catch (error) {
      showToast({ type: 'error', title: 'خطأ', message: 'فشل حذف الصورة' })
    } finally {
      setDeleting(null)
    }
  }

  const onSubmit = async (data: ProductFormData) => {
    setSaving(true)
    try {
      let mainImagePath: string | null = null
      let repId: string

      // Get representative ID
      const { data: rep } = await supabase
        .from('representatives')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (!rep) throw new Error('مندوب غير موجود')
      repId = rep.id

      // Upload main image if new
      if (mainImageFile) {
        const { data: uploadData, error } = await uploadFile(
          'product-images',
          `products/${repId}/${Date.now()}-${mainImageFile.name}`,
          mainImageFile
        )
        if (error) throw error
        mainImagePath = uploadData?.path || null
      } else if (isEditing && mainImagePreview && !mainImagePreview.startsWith('blob:')) {
        // Keep existing main image
        mainImagePath = mainImagePreview.replace(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`, '')
      }

      const productData = {
        representative_id: repId,
        category_id: data.category_id,
        name: data.name,
        slug: data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w\-]/g, ''),
        description: data.description,
        price: data.price,
        discount_price: data.discount_price && data.discount_price < data.price ? data.discount_price : null,
        stock_quantity: data.stock_quantity,
        main_image: mainImagePath,
        is_active: data.is_active,
      }

      let productId: string

      if (isEditing) {
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', id)
        if (error) throw error
        productId = id!

        // Delete removed existing images
        const currentImages = [...existingImages]
        const keptImages = additionalPreviews.filter(p => currentImages.includes(p))
        const removedImages = currentImages.filter(url => !keptImages.includes(url))
        for (const img of removedImages) {
          const path = img.replace(`${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/`, '')
          await deleteFile('product-images', [path])
        }
      } else {
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert(productData)
          .select('id')
          .single()
        if (error) throw error
        productId = newProduct.id
      }

      // Upload additional images
      for (let i = 0; i < additionalImages.length; i++) {
        const file = additionalImages[i]
        const { data: uploadData, error } = await uploadFile(
          'product-images',
          `products/${repId}/${productId}/${Date.now()}-${file.name}`,
          file
        )
        if (error) throw error

        if (uploadData?.path) {
          await supabase
            .from('product_images')
            .insert({
              product_id: productId,
              image_url: uploadData.path,
              sort_order: i,
            })
        }
      }

      showToast({
        type: 'success',
        title: isEditing ? 'تم التحديث' : 'تم الإنشاء',
        message: `تم ${isEditing ? 'تحديث' : 'إضافة'} المنتج بنجاح`,
      })

      queryClient.invalidateQueries({ queryKey: ['vendor-products'] })
      navigate('/vendor/products')
    } catch (error) {
      console.error('Error saving product:', error)
      showToast({ type: 'error', title: 'خطأ', message: error instanceof Error ? error.message : 'فشل حفظ المنتج' })
    } finally {
      setSaving(false)
    }
  }

  const hasDiscount = discountPrice && price && discountPrice < price
  const discountPercent = hasDiscount ? Math.round(((price - discountPrice) / price) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/vendor/products" className="btn-ghost p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="heading-2 text-charcoal">{isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}</h1>
          <p className="text-body-md text-gray-500 mt-1">{isEditing ? 'تعديل بيانات المنتج' : 'أدخل بيانات المنتج الجديد'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
        {/* Main Image */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            الصورة الرئيسية
          </h2>
          <div className="relative">
            <div className="aspect-square max-w-xs mx-auto rounded-xl border-2 border-gray-200 overflow-hidden relative bg-gray-50">
              {mainImagePreview ? (
                <img src={mainImagePreview} alt="معاينة" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <Camera className="w-10 h-10" />
                  <span className="text-body-md">اضغط لاختيار صورة</span>
                  <span className="text-body-xs">JPG, PNG, WebP - حتى 5 ميجابايت</span>
                </div>
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="w-8 h-8 text-white" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleMainImageChange}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="اختر الصورة الرئيسية"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-primary" />
            المعلومات الأساسية
          </h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label">اسم المنتج *</label>
              <input
                id="name"
                type="text"
                placeholder="مثال: آيفون 15 برو 256 جيجا"
                {...register('name')}
                className={cn('input', errors.name && 'input-error')}
              />
              {errors.name && <p className="form-error" role="alert">{errors.name.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="label">الوصف</label>
              <textarea
                id="description"
                rows={4}
                placeholder="وصف تفصيلي للمنتج، المميزات، المواصفات..."
                {...register('description')}
                className="input resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category_id" className="label">القسم *</label>
                <select
                  id="category_id"
                  {...register('category_id')}
                  className={cn('input', errors.category_id && 'input-error')}
                >
                  <option value="">اختر القسم</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {errors.category_id && <p className="form-error" role="alert">{errors.category_id.message}</p>}
              </div>

              <div>
                <label htmlFor="stock_quantity" className="label">الكمية المتاحة *</label>
                <input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  step="1"
                  {...register('stock_quantity', { valueAsNumber: true })}
                  className={cn('input', errors.stock_quantity && 'input-error')}
                />
                {errors.stock_quantity && <p className="form-error" role="alert">{errors.stock_quantity.message}</p>}
              </div>
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            التسعير
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="label">السعر الأساسي *</label>
              <div className="relative">
                <input
                  id="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  {...register('price', { valueAsNumber: true })}
                  className={cn('input pl-8', errors.price && 'input-error')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">ر.س</span>
              </div>
              {errors.price && <p className="form-error" role="alert">{errors.price.message}</p>}
            </div>

            <div>
              <label htmlFor="discount_price" className="label">سعر الخصم (اختياري)</label>
              <div className="relative">
                <input
                  id="discount_price"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...register('discount_price', { valueAsNumber: true })}
                  className="input pl-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">ر.س</span>
              </div>
              {hasDiscount && (
                <p className="text-body-xs text-green-600 mt-1 flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  خصم {discountPercent}%
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Additional Images */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4 flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" />
            صور إضافية (حد أقصى 5)
          </h2>
          <div className="space-y-4">
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleAdditionalImagesChange}
                className="sr-only"
                aria-label="اختر صور إضافية"
              />
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                <Camera className="w-10 h-10 mx-auto text-gray-400 mb-2" />
                <p className="text-body-md text-gray-600">اضغط أو اسحب الصور هنا</p>
                <p className="text-body-xs text-gray-400 mt-1">JPG, PNG, WebP - حتى 5 ميجابايت للصورة</p>
              </div>
            </label>

            {(additionalPreviews.length > 0 || existingImages.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(url)}
                      disabled={deleting === url}
                      className="absolute top-1 left-1 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      aria-label="حذف الصورة"
                    >
                      {deleting === url ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                ))}
                {additionalPreviews.slice(existingImages.length).map((url, index) => (
                  <div key={`new-${index}`} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeAdditionalImage(index + existingImages.length)}
                      className="absolute top-1 left-1 w-7 h-7 rounded-full bg-red-500/90 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                      aria-label="حذف الصورة"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4">الحالة</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md font-medium text-charcoal">منتج نشط</p>
              <p className="text-body-sm text-gray-500">عند التفعيل، سيظهر المنتج في متجرك ويمكن للعملاء شراؤه</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                {...register('is_active')}
                className="sr-only peer"
              />
              <div className="w-12 h-7 rounded-full bg-gray-300 peer-checked:bg-primary transition-colors">
                <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm peer-checked:translate-x-5 transition-transform" />
              </div>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm py-4 border-t border-gray-100">
          <Link to="/vendor/products" className="btn-secondary flex-1">
            إلغاء
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || saving}
            className="btn-primary flex-1 py-3"
          >
            {isSubmitting || saving ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                {isEditing ? 'حفظ التغييرات' : 'إضافة المنتج'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}