import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase, uploadFile } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, formatPrice, getImageUrl } from '@/utils'
import { Camera, MapPin, Phone, Globe, Link2, Trash2, Save, Loader2, Eye, EyeOff } from 'lucide-react'
import type { Representative } from '@/types'

const profileSchema = z.object({
  store_name: z.string().min(2, 'اسم المتجر يجب أن يكون حرفين على الأقل').max(100),
  description: z.string().max(500).optional(),
  phone: z.string().regex(/^(\+966|0)?5\d{8}$/, 'رقم هاتف سعودي غير صحيح').optional().or(z.literal('')),
  location: z.string().max(200).optional(),
  social_twitter: z.string().url('رابط تويتر غير صحيح').optional().or(z.literal('')),
  social_instagram: z.string().url('رابط انستقرام غير صحيح').optional().or(z.literal('')),
  social_snapchat: z.string().url('رابط سناب شات غير صحيح').optional().or(z.literal('')),
  social_website: z.string().url('رابط الموقع غير صحيح').optional().or(z.literal('')),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function VendorProfilePage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)

  const { data: representative } = useQuery({
    queryKey: ['vendor-profile', user?.id],
    queryFn: async () => {
      if (!user) return null
      const { data, error } = await supabase
        .from('representatives')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (error) throw error
      return data as Representative
    },
    enabled: !!user,
  })

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      store_name: '',
      description: '',
      phone: '',
      location: '',
      social_twitter: '',
      social_instagram: '',
      social_snapchat: '',
      social_website: '',
    },
  })

  const updateProfile = useMutation({
    mutationFn: async (data: ProfileFormData & { logo_url?: string; cover_url?: string }) => {
      if (!user) throw new Error('Not authenticated')

      const { data: rep } = await supabase
        .from('representatives')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!rep) throw new Error('Representative not found')

      const { error } = await supabase
        .from('representatives')
        .update(data)
        .eq('id', rep.id)

      if (error) throw error
      return rep.id
    },
    onSuccess: () => {
      showToast({ type: 'success', title: 'تم الحفظ', message: 'تم تحديث ملف المتجر بنجاح' })
    },
    onError: (error) => {
      showToast({ type: 'error', title: 'خطأ', message: error.message })
    },
  })

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmitForm = async (data: ProfileFormData) => {
    setSaving(true)
    try {
      let logoUrl = representative?.logo_url
      let coverUrl = representative?.cover_url

      if (logoFile) {
        const { data: uploadData, error } = await uploadFile('store-assets', `logos/${user?.id}/${Date.now()}-${logoFile.name}`, logoFile)
        if (error) throw error
        logoUrl = uploadData?.path
      }

      if (coverFile) {
        const { data: uploadData, error } = await uploadFile('store-assets', `covers/${user?.id}/${Date.now()}-${coverFile.name}`, coverFile)
        if (error) throw error
        coverUrl = uploadData?.path
      }

      await updateProfile.mutateAsync({ ...data, logo_url: logoUrl, cover_url: coverUrl })
    } catch (error) {
      console.error('Error updating profile:', error)
    } finally {
      setSaving(false)
    }
  }

  // Initialize form with existing data
  if (representative) {
    reset({
      store_name: representative.store_name,
      description: representative.description || '',
      phone: representative.phone || '',
      location: representative.location || '',
      social_twitter: '',
      social_instagram: '',
      social_snapchat: '',
      social_website: '',
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="heading-2 text-charcoal">ملف المتجر</h1>
          <p className="text-body-md text-gray-500 mt-1">إدارة معلومات متجر وملف المندوب</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-6" noValidate>
        {/* Logo & Cover */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4">الشعار والصورة الرئيسية</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="label">شعار المتجر</label>
              <div className="relative">
                <div className="w-24 h-24 rounded-xl border-2 border-gray-200 overflow-hidden relative bg-gray-50">
                  {logoPreview || representative?.logo_url ? (
                    <img
                      src={logoPreview || getImageUrl(representative?.logo_url)}
                      alt="شعار المتجر"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="اختر شعار المتجر"
                    />
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="label">الصورة الرئيسية (الغطاء)</label>
              <div className="relative">
                <div className="aspect-video rounded-xl border-2 border-gray-200 overflow-hidden relative bg-gray-50">
                  {coverPreview || representative?.cover_url ? (
                    <img
                      src={coverPreview || getImageUrl(representative?.cover_url)}
                      alt="صورة الغلاف"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Camera className="w-8 h-8" />
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                    <Camera className="w-6 h-6 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="اختر صورة الغلاف"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Basic Info */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4">المعلومات الأساسية</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="store_name" className="label">اسم المتجر *</label>
              <input
                id="store_name"
                type="text"
                placeholder="اسم متجرك"
                {...register('store_name')}
                className={cn('input', errors.store_name && 'input-error')}
              />
              {errors.store_name && <p className="form-error" role="alert">{errors.store_name.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="label">وصف المتجر</label>
              <textarea
                id="description"
                rows={3}
                placeholder="وصف مختصر عن متجرك ومنتجاتك..."
                {...register('description')}
                className="input resize-none"
              />
            </div>

            <div>
              <label htmlFor="phone" className="label">رقم الهاتف</label>
              <div className="relative">
                <input
                  id="phone"
                  type="tel"
                  placeholder="05XXXXXXXX"
                  {...register('phone')}
                  className={cn('input pl-10', errors.phone && 'input-error')}
                  inputMode="tel"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">+966</span>
              </div>
              {errors.phone && <p className="form-error" role="alert">{errors.phone.message}</p>}
            </div>

            <div>
              <label htmlFor="location" className="label">الموقع</label>
              <div className="relative">
                <input
                  id="location"
                  type="text"
                  placeholder="المدينة، الحي، الشارع..."
                  {...register('location')}
                  className="input"
                />
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4">روابط التواصل الاجتماعي</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { field: 'social_twitter', label: 'تويتر', icon: Globe },
              { field: 'social_instagram', label: 'انستقرام', icon: Camera },
              { field: 'social_snapchat', label: 'سناب شات', icon: Eye },
              { field: 'social_website', label: 'الموقع الإلكتروني', icon: Link2 },
            ].map(({ field, label, icon: Icon }) => (
              <div key={field}>
                <label htmlFor={field} className="label">{label}</label>
                <div className="relative">
                  <input
                    id={field}
                    type="url"
                    placeholder={`https://${label.toLowerCase()}.com/...`}
                    {...register(field)}
                    className={cn('input pl-10', errors[field as keyof ProfileFormData] && 'input-error')}
                  />
                  <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
                {errors[field as keyof ProfileFormData] && (
                  <p className="form-error" role="alert">{errors[field as keyof ProfileFormData]?.message}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Visibility Toggle */}
        <div className="card p-6">
          <h2 className="heading-4 mb-4">الرؤية</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-md font-medium text-charcoal">إظهار المتجر للعملاء</p>
              <p className="text-body-sm text-gray-500">عند التفعيل، سيظهر متجرك في قائمة المتاجر ويمكن للعملاء تصفح منتجاتك</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={representative?.is_visible}
              onClick={() => setValue('is_visible', !representative?.is_visible)}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors touch-manipulation',
                representative?.is_visible ? 'bg-primary' : 'bg-gray-300'
              )}
              aria-label={representative?.is_visible ? 'إخفاء المتجر' : 'إظهار المتجر'}
            >
              <span
                className={cn(
                  'absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-md transition-transform',
                  representative?.is_visible ? 'translate-x-5' : 'translate-x-0.5'
                )}
              />
            </button>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-3">
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
                حفظ التغييرات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}