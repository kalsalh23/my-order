import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase, uploadFile } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, getImageUrl } from '@/utils'
import { User, Lock, Bell, Shield, Eye, EyeOff, Save, Loader2, Camera, X, MapPin, Phone, Globe, Link2 } from 'lucide-react'
import type { Representative } from '@/types'

const settingsSchema = z.object({
  // Profile
  full_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  email: z.string().email('بريد إلكتروني غير صحيح'),
  phone: z.string().regex(/^(\+966|0)?5\d{8}$/, 'رقم هاتف سعودي غير صحيح').optional().or(z.literal('')),
  // Store
  store_name: z.string().min(2, 'اسم المتجر مطلوب').max(100),
  description: z.string().max(500).optional(),
  store_phone: z.string().regex(/^(\+966|0)?5\d{8}$/, 'رقم هاتف غير صحيح').optional().or(z.literal('')),
  location: z.string().max(200).optional(),
  social_twitter: z.string().url('رابط غير صحيح').optional().or(z.literal('')),
  social_instagram: z.string().url('رابط غير صحيح').optional().or(z.literal('')),
  social_snapchat: z.string().url('رابط غير صحيح').optional().or(z.literal('')),
  social_website: z.string().url('رابط غير صحيح').optional().or(z.literal('')),
  // Password
  current_password: z.string().optional(),
  new_password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل').optional(),
  confirm_password: z.string().optional(),
}).refine((data) => !data.new_password || data.new_password === data.confirm_password, {
  message: 'كلمات المرور غير متطابقة',
  path: ['confirm_password'],
})

type SettingsFormData = z.infer<typeof settingsSchema>

export function VendorSettingsPage() {
  const { user, signOut, refreshUser } = useAuth()
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState<'profile' | 'store' | 'notifications' | 'security' | 'appearance'>('profile')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
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
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      store_name: '',
      description: '',
      store_phone: '',
      location: '',
      social_twitter: '',
      social_instagram: '',
      social_snapchat: '',
      social_website: '',
      current_password: '',
      new_password: '',
      confirm_password: '',
    },
  })

  // Initialize form
  useEffect(() => {
    if (user && representative) {
      reset({
        full_name: user.full_name,
        email: user.email,
        phone: user.phone || '',
        store_name: representative.store_name,
        description: representative.description || '',
        store_phone: representative.phone || '',
        location: representative.location || '',
        social_twitter: '',
        social_instagram: '',
        social_snapchat: '',
        social_website: '',
        current_password: '',
        new_password: '',
        confirm_password: '',
      })
      if (user.avatar_url) setAvatarPreview(user.avatar_url)
    }
  }, [user, representative, reset])

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setAvatarFile(file)
      setAvatarPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (data: SettingsFormData) => {
    setSaving(true)
    try {
      let avatarUrl = user?.avatar_url

      // Upload avatar if new
      if (avatarFile) {
        const { data: uploadData, error } = await uploadFile(
          'store-assets',
          `avatars/${user?.id}/${Date.now()}-${avatarFile.name}`,
          avatarFile
        )
        if (error) throw error
        avatarUrl = uploadData?.path
      }

      // Update profile
      const profileUpdates: any = {}
      if (data.full_name !== user?.full_name) profileUpdates.full_name = data.full_name
      if (data.phone !== (user?.phone || '')) profileUpdates.phone = data.phone
      if (avatarUrl !== user?.avatar_url) profileUpdates.avatar_url = avatarUrl

      if (Object.keys(profileUpdates).length > 0) {
        const { error } = await supabase.auth.updateUser({ data: profileUpdates })
        if (error) throw error
      }

      // Update representative
      const repUpdates: any = {}
      if (data.store_name !== representative?.store_name) repUpdates.store_name = data.store_name
      if (data.description !== (representative?.description || '')) repUpdates.description = data.description
      if (data.store_phone !== (representative?.phone || '')) repUpdates.phone = data.store_phone
      if (data.location !== (representative?.location || '')) repUpdates.location = data.location

      if (Object.keys(repUpdates).length > 0) {
        const { error } = await supabase
          .from('representatives')
          .update(repUpdates)
          .eq('user_id', user?.id)
        if (error) throw error
      }

      // Update password if provided
      if (data.new_password) {
        const { error } = await supabase.auth.updateUser({ password: data.new_password })
        if (error) throw error
        setValue('current_password', '')
        setValue('new_password', '')
        setValue('confirm_password', '')
      }

      showToast({ type: 'success', title: 'تم الحفظ', message: 'تم تحديث الإعدادات بنجاح' })
      await refreshUser()
    } catch (error) {
      showToast({ type: 'error', title: 'خطأ', message: error instanceof Error ? error.message : 'فشل الحفظ' })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    showToast({ type: 'info', title: 'تم تسجيل الخروج', message: 'إلى اللقاء!' })
  }

  const tabs = [
    { id: 'profile', label: 'الملف الشخصي', icon: User },
    { id: 'store', label: 'المتجر', icon: Shield },
    { id: 'security', label: 'الأمان', icon: Lock },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'appearance', label: 'المظهر', icon: Eye },
  ] as const

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-2 text-charcoal">الإعدادات</h1>
        <p className="text-body-md text-gray-500 mt-1">إدارة حسابك ومتجرك</p>
      </div>

      {/* Tabs */}
      <div className="card overflow-hidden">
        <nav className="flex overflow-x-auto scrollbar-hide p-1" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 text-body-sm font-medium whitespace-nowrap rounded-lg transition-colors touch-manipulation',
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <form onSubmit={handleSubmit(handleSave)} className="space-y-6" noValidate>
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">الملف الشخصي</h2>

            {/* Avatar */}
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-gray-200 relative bg-gray-100">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <User className="w-10 h-10" />
                    </div>
                  )}
                  <label className="absolute bottom-0 left-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white cursor-pointer hover:bg-primary-light transition-colors">
                    <Camera className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      aria-label="تغيير الصورة الشخصية"
                    />
                  </label>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-body-md font-medium text-charcoal">الصورة الشخصية</p>
                <p className="text-body-sm text-gray-500 mt-1">JPG, PNG - حتى 2 ميجابايت</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="full_name" className="label">الاسم الكامل *</label>
                <input
                  id="full_name"
                  type="text"
                  {...register('full_name')}
                  className={cn('input', errors.full_name && 'input-error')}
                />
                {errors.full_name && <p className="form-error">{errors.full_name.message}</p>}
              </div>
              <div>
                <label htmlFor="email" className="label">البريد الإلكتروني *</label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={cn('input', errors.email && 'input-error')}
                  disabled
                />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
                <p className="text-body-xs text-gray-500 mt-1">لا يمكن تغيير البريد الإلكتروني من هنا</p>
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="label">رقم الجوال</label>
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
              {errors.phone && <p className="form-error">{errors.phone.message}</p>}
            </div>
          </div>
        )}

        {/* Store Tab */}
        {activeTab === 'store' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">معلومات المتجر</h2>

            <div>
              <label htmlFor="store_name" className="label">اسم المتجر *</label>
              <input
                id="store_name"
                type="text"
                {...register('store_name')}
                className={cn('input', errors.store_name && 'input-error')}
              />
              {errors.store_name && <p className="form-error">{errors.store_name.message}</p>}
            </div>

            <div>
              <label htmlFor="description" className="label">وصف المتجر</label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="input resize-none"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="store_phone" className="label">هاتف المتجر</label>
                <div className="relative">
                  <input
                    id="store_phone"
                    type="tel"
                    placeholder="05XXXXXXXX"
                    {...register('store_phone')}
                    className={cn('input pl-10', errors.store_phone && 'input-error')}
                    inputMode="tel"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">+966</span>
                </div>
                {errors.store_phone && <p className="form-error">{errors.store_phone.message}</p>}
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

            <div>
              <label className="label">روابط التواصل الاجتماعي</label>
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
                        className={cn('input pl-10', errors[field as keyof SettingsFormData] && 'input-error')}
                      />
                      <Icon className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                    {errors[field as keyof SettingsFormData] && <p className="form-error">{errors[field as keyof SettingsFormData]?.message}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">كلمة المرور</h2>
            <p className="text-body-md text-gray-500">غيّر كلمة المرور الخاصة بك. تأكد من استخدام كلمة مرور قوية.</p>

            <div className="space-y-4">
              <div>
                <label htmlFor="current_password" className="label">كلمة المرور الحالية</label>
                <div className="relative">
                  <input
                    id="current_password"
                    type="password"
                    {...register('current_password')}
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={(e) => { e.preventDefault(); const input = e.currentTarget.previousElementSibling as HTMLInputElement; input.type = input.type === 'password' ? 'text' : 'password' }}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="new_password" className="label">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    id="new_password"
                    type="password"
                    {...register('new_password')}
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={(e) => { e.preventDefault(); const input = e.currentTarget.previousElementSibling as HTMLInputElement; input.type = input.type === 'password' ? 'text' : 'password' }}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
                {errors.new_password && <p className="form-error">{errors.new_password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirm_password" className="label">تأكيد كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    id="confirm_password"
                    type="password"
                    {...register('confirm_password')}
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    onClick={(e) => { e.preventDefault(); const input = e.currentTarget.previousElementSibling as HTMLInputElement; input.type = input.type === 'password' ? 'text' : 'password' }}
                  >
                    <Eye className="w-5 h-5" />
                  </button>
                </div>
                {errors.confirm_password && <p className="form-error">{errors.confirm_password.message}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">تفضيلات الإشعارات</h2>
            <p className="text-body-md text-gray-500">اختر أنواع الإشعارات التي تريد استلامها</p>

            <div className="space-y-4">
              {[
                { id: 'new_orders', label: 'طلبات جديدة', desc: 'إشعار عند استلام طلب جديد' },
                { id: 'order_updates', label: 'تحديثات الطلبات', desc: 'تغيير حالة الطلبات' },
                { id: 'product_approvals', label: 'الموافقة على المنتجات', desc: 'عند قبول أو رفض منتجاتك' },
                { id: 'announcements', label: 'الإعلانات الإدارية', desc: 'إعلانات مهمة من الإدارة' },
                { id: 'marketing', label: 'العروض التسويقية', desc: 'عروض وخصومات خاصة' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-body-md font-medium text-charcoal">{item.label}</p>
                    <p className="text-body-sm text-gray-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 rounded-full bg-gray-300 peer-checked:bg-primary transition-colors">
                      <span className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm peer-checked:translate-x-5 transition-transform" />
                    </div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">المظهر</h2>

            <div>
              <label className="label">الوضع</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'light', label: 'فاتح', icon: '☀️' },
                  { id: 'dark', label: 'داكن', icon: '🌙' },
                  { id: 'system', label: 'النظام', icon: '💻' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    className={cn(
                      'p-4 rounded-lg border-2 transition-colors touch-manipulation',
                      mode.id === 'system'
                        ? 'border-primary bg-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <p className="text-2xl mb-1">{mode.icon}</p>
                    <p className="text-body-sm font-medium text-charcoal">{mode.label}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">حجم الخط</label>
              <div className="flex items-center gap-4">
                <input type="range" min="14" max="20" defaultValue={16} className="flex-1" />
                <span className="text-body-md font-mono text-gray-500 w-12 text-center">16px</span>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleSignOut}
            className="btn-danger flex-1"
          >
            تسجيل الخروج
          </button>
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