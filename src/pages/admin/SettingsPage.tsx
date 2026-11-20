import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, uploadFile, deleteFile } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, getImageUrl } from '@/utils'
import { Loader2, Save, Image, Camera, X, MapPin, Phone, Mail, Globe, Link2, Shield, Bell, Eye, Palette, Database, CreditCard, Truck, Settings, Users, Store, Package, LayoutDashboard } from 'lucide-react'

interface SettingsData {
  marketplace_name: string
  marketplace_tagline: string
  currency: string
  currency_symbol: string
  delivery_fee: number
  free_delivery_threshold: number
  contact_phone: string
  contact_email: string
  address: string
  social_facebook: string
  social_twitter: string
  social_instagram: string
  social_snapchat: string
  maintenance_mode: boolean
  registration_enabled: boolean
  guest_checkout_enabled: boolean
  phone_verification_required: boolean
  max_images_per_product: number
  max_file_size_mb: number
  allowed_image_types: string[]
  default_product_status: string
  auto_approve_products: boolean
  order_auto_cancel_hours: number
  review_enabled: boolean
  wishlist_enabled: boolean
  logo_url: string | null
  favicon_url: string | null
}

export function AdminSettingsPage() {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [settings, setSettings] = useState<SettingsData>({
    marketplace_name: 'مندوب طيبة',
    marketplace_tagline: 'متجرك المحلي.. أقرب إليك',
    currency: 'SAR',
    currency_symbol: 'ر.س',
    delivery_fee: 15,
    free_delivery_threshold: 200,
    contact_phone: '920000000',
    contact_email: 'support@mandoubtaiba.sa',
    address: 'المملكة العربية السعودية',
    social_facebook: '',
    social_twitter: '',
    social_instagram: '',
    social_snapchat: '',
    maintenance_mode: false,
    registration_enabled: true,
    guest_checkout_enabled: true,
    phone_verification_required: true,
    max_images_per_product: 5,
    max_file_size_mb: 5,
    allowed_image_types: ['image/jpeg', 'image/png', 'image/webp'],
    default_product_status: 'active',
    auto_approve_products: true,
    order_auto_cancel_hours: 24,
    review_enabled: true,
    wishlist_enabled: true,
    logo_url: null,
    favicon_url: null,
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [faviconFile, setFaviconFile] = useState<File | null>(null)
  const [faviconPreview, setFaviconPreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'general' | 'delivery' | 'social' | 'features' | 'appearance' | 'advanced'>('general')

  const { data: storedSettings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('key, value')
      if (error) throw error

      const settingsMap: Record<string, string> = {}
      data?.forEach((item: any) => {
        settingsMap[item.key] = item.value
      })
      return settingsMap
    },
  })

  useEffect(() => {
    if (storedSettings) {
      setSettings(prev => ({
        ...prev,
        marketplace_name: storedSettings.marketplace_name || prev.marketplace_name,
        marketplace_tagline: storedSettings.marketplace_tagline || prev.marketplace_tagline,
        currency: storedSettings.currency || prev.currency,
        currency_symbol: storedSettings.currency_symbol || prev.currency_symbol,
        delivery_fee: Number(storedSettings.delivery_fee) || prev.delivery_fee,
        free_delivery_threshold: Number(storedSettings.free_delivery_threshold) || prev.free_delivery_threshold,
        contact_phone: storedSettings.contact_phone || prev.contact_phone,
        contact_email: storedSettings.contact_email || prev.contact_email,
        address: storedSettings.address || prev.address,
        social_facebook: storedSettings.social_facebook || prev.social_facebook,
        social_twitter: storedSettings.social_twitter || prev.social_twitter,
        social_instagram: storedSettings.social_instagram || prev.social_instagram,
        social_snapchat: storedSettings.social_snapchat || prev.social_snapchat,
        maintenance_mode: storedSettings.maintenance_mode === 'true',
        registration_enabled: storedSettings.registration_enabled === 'true',
        guest_checkout_enabled: storedSettings.guest_checkout_enabled === 'true',
        phone_verification_required: storedSettings.phone_verification_required === 'true',
        max_images_per_product: Number(storedSettings.max_images_per_product) || prev.max_images_per_product,
        max_file_size_mb: Number(storedSettings.max_file_size_mb) || prev.max_file_size_mb,
        allowed_image_types: storedSettings.allowed_image_types ? JSON.parse(storedSettings.allowed_image_types) : prev.allowed_image_types,
        default_product_status: storedSettings.default_product_status || prev.default_product_status,
        auto_approve_products: storedSettings.auto_approve_products === 'true',
        order_auto_cancel_hours: Number(storedSettings.order_auto_cancel_hours) || prev.order_auto_cancel_hours,
        review_enabled: storedSettings.review_enabled === 'true',
        wishlist_enabled: storedSettings.wishlist_enabled === 'true',
        logo_url: storedSettings.logo_url || prev.logo_url,
        favicon_url: storedSettings.favicon_url || prev.favicon_url,
      }))

      if (storedSettings.logo_url) setLogoPreview(getImageUrl(storedSettings.logo_url))
      if (storedSettings.favicon_url) setFaviconPreview(getImageUrl(storedSettings.favicon_url))
    }
  }, [storedSettings])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast({ type: 'error', title: 'خطأ', message: 'يجب أن يكون الملف صورة' })
        return
      }
      if (file.size > 2 * 1024 * 1024) {
        showToast({ type: 'error', title: 'خطأ', message: 'حجم الشعار يجب أن يكون أقل من 2 ميجابايت' })
        return
      }
      setLogoFile(file)
      setLogoPreview(URL.createObjectURL(file))
    }
  }

  const handleFaviconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast({ type: 'error', title: 'خطأ', message: 'يجب أن يكون الملف صورة' })
        return
      }
      if (file.size > 500 * 1024) {
        showToast({ type: 'error', title: 'خطأ', message: 'حجم الأيقونة يجب أن يكون أقل من 500 كيلوبايت' })
        return
      }
      setFaviconFile(file)
      setFaviconPreview(URL.createObjectURL(file))
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const updates: Record<string, string> = {
        marketplace_name: settings.marketplace_name,
        marketplace_tagline: settings.marketplace_tagline,
        currency: settings.currency,
        currency_symbol: settings.currency_symbol,
        delivery_fee: String(settings.delivery_fee),
        free_delivery_threshold: String(settings.free_delivery_threshold),
        contact_phone: settings.contact_phone,
        contact_email: settings.contact_email,
        address: settings.address,
        social_facebook: settings.social_facebook,
        social_twitter: settings.social_twitter,
        social_instagram: settings.social_instagram,
        social_snapchat: settings.social_snapchat,
        maintenance_mode: String(settings.maintenance_mode),
        registration_enabled: String(settings.registration_enabled),
        guest_checkout_enabled: String(settings.guest_checkout_enabled),
        phone_verification_required: String(settings.phone_verification_required),
        max_images_per_product: String(settings.max_images_per_product),
        max_file_size_mb: String(settings.max_file_size_mb),
        allowed_image_types: JSON.stringify(settings.allowed_image_types),
        default_product_status: settings.default_product_status,
        auto_approve_products: String(settings.auto_approve_products),
        order_auto_cancel_hours: String(settings.order_auto_cancel_hours),
        review_enabled: String(settings.review_enabled),
        wishlist_enabled: String(settings.wishlist_enabled),
      }

      // Upload logo if new
      if (logoFile) {
        const { data: uploadData, error } = await uploadFile('store-assets', `branding/logo-${Date.now()}-${logoFile.name}`, logoFile)
        if (error) throw error
        if (uploadData?.path) updates.logo_url = uploadData.path
      } else if (settings.logo_url) {
        updates.logo_url = settings.logo_url
      }

      // Upload favicon if new
      if (faviconFile) {
        const { data: uploadData, error } = await uploadFile('store-assets', `branding/favicon-${Date.now()}-${faviconFile.name}`, faviconFile)
        if (error) throw error
        if (uploadData?.path) updates.favicon_url = uploadData.path
      } else if (settings.favicon_url) {
        updates.favicon_url = settings.favicon_url
      }

      // Upsert settings
      const settingsArray = Object.entries(updates).map(([key, value]) => ({ key, value }))
      const { error } = await supabase
        .from('store_settings')
        .upsert(settingsArray, { onConflict: 'key' })

      if (error) throw error

      showToast({ type: 'success', title: 'تم الحفظ', message: 'تم تحديث الإعدادات بنجاح' })
    } catch (error) {
      showToast({ type: 'error', title: 'خطأ', message: error instanceof Error ? error.message : 'فشل حفظ الإعدادات' })
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'general', label: 'عام', icon: Settings },
    { id: 'delivery', label: 'التوصيل', icon: Truck },
    { id: 'social', label: 'التواصل الاجتماعي', icon: Globe },
    { id: 'features', label: 'المميزات', icon: Bell },
    { id: 'appearance', label: 'المظهر', icon: Palette },
    { id: 'advanced', label: 'متقدم', icon: Database },
  ] as const

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="heading-2 text-charcoal">إعدادات المتجر</h1>
        <p className="text-body-md text-gray-500 mt-1">إدارة إعدادات المنصة والمظهر</p>
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

      <form onSubmit={handleSave} className="space-y-6" noValidate>
        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">معلومات المتجر</h2>

            {/* Logo */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="label">الشعار (Logo)</label>
                <div className="relative">
                  <div className="aspect-square w-full max-w-xs rounded-lg border-2 border-gray-200 overflow-hidden relative bg-gray-50">
                    {logoPreview ? (
                      <img src={logoPreview} alt="الشعار" className="w-full h-full object-contain p-2" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Image className="w-10 h-10" />
                        <span className="text-body-md">اضغط لاختيار الشعار</span>
                        <span className="text-body-xs">JPG, PNG, WebP - حتى 2 ميجابايت - نسبة 1:1</span>
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-8 h-8 text-white" />
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
                <label className="label">أيقونة المتصفح (Favicon)</label>
                <div className="relative">
                  <div className="aspect-square w-full max-w-xs rounded-lg border-2 border-gray-200 overflow-hidden relative bg-gray-50">
                    {faviconPreview ? (
                      <img src={faviconPreview} alt="الأيقونة" className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                        <Image className="w-10 h-10" />
                        <span className="text-body-md">اضغط لاختيار الأيقونة</span>
                        <span className="text-body-xs">ICO, PNG - حتى 500 كيلوبايت - 32x32 أو 16x16</span>
                      </div>
                    )}
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                      <Camera className="w-8 h-8 text-white" />
                      <input
                        type="file"
                        accept="image/*,.ico"
                        onChange={handleFaviconChange}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        aria-label="اختر أيقونة المتجر"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="marketplace_name" className="label">اسم المتجر *</label>
                <input
                  id="marketplace_name"
                  type="text"
                  value={settings.marketplace_name}
                  onChange={(e) => setSettings(s => ({ ...s, marketplace_name: e.target.value }))}
                  className="input"
                  placeholder="مندوب طيبة"
                />
              </div>
              <div>
                <label htmlFor="marketplace_tagline" className="label">الشعار التعريفي</label>
                <input
                  id="marketplace_tagline"
                  type="text"
                  value={settings.marketplace_tagline}
                  onChange={(e) => setSettings(s => ({ ...s, marketplace_tagline: e.target.value }))}
                  className="input"
                  placeholder="متجرك المحلي.. أقرب إليك"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="currency" className="label">العملة</label>
                <select
                  id="currency"
                  value={settings.currency}
                  onChange={(e) => setSettings(s => ({ ...s, currency: e.target.value }))}
                  className="input"
                >
                  <option value="SAR">الريال السعودي (SAR)</option>
                  <option value="USD">الدولار الأمريكي (USD)</option>
                  <option value="EUR">اليورو (EUR)</option>
                  <option value="AED">الدرهم الإماراتي (AED)</option>
                </select>
              </div>
              <div>
                <label htmlFor="currency_symbol" className="label">رمز العملة</label>
                <input
                  id="currency_symbol"
                  type="text"
                  value={settings.currency_symbol}
                  onChange={(e) => setSettings(s => ({ ...s, currency_symbol: e.target.value }))}
                  className="input"
                  placeholder="ر.س"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact_phone" className="label">هاتف الدعم</label>
                <input
                  id="contact_phone"
                  type="tel"
                  value={settings.contact_phone}
                  onChange={(e) => setSettings(s => ({ ...s, contact_phone: e.target.value }))}
                  className="input"
                  placeholder="920000000"
                />
              </div>
              <div>
                <label htmlFor="contact_email" className="label">البريد الإلكتروني</label>
                <input
                  id="contact_email"
                  type="email"
                  value={settings.contact_email}
                  onChange={(e) => setSettings(s => ({ ...s, contact_email: e.target.value }))}
                  className="input"
                  placeholder="support@mandoubtaiba.sa"
                />
              </div>
            </div>

            <div>
              <label htmlFor="address" className="label">العنوان</label>
              <textarea
                id="address"
                rows={2}
                value={settings.address}
                onChange={(e) => setSettings(s => ({ ...s, address: e.target.value }))}
                className="input resize-none"
                placeholder="المملكة العربية السعودية"
              />
            </div>
          </div>
        )}

        {/* Delivery Tab */}
        {activeTab === 'delivery' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">إعدادات التوصيل</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="delivery_fee" className="label">رسوم التوصيل الأساسية</label>
                <input
                  id="delivery_fee"
                  type="number"
                  value={settings.delivery_fee}
                  onChange={(e) => setSettings(s => ({ ...s, delivery_fee: Number(e.target.value) }))}
                  className="input"
                  min="0"
                  step="1"
                />
              </div>
              <div>
                <label htmlFor="free_delivery_threshold" className="label">حد التوصيل المجاني</label>
                <input
                  id="free_delivery_threshold"
                  type="number"
                  value={settings.free_delivery_threshold}
                  onChange={(e) => setSettings(s => ({ ...s, free_delivery_threshold: Number(e.target.value) }))}
                  className="input"
                  min="0"
                  step="1"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-body-sm text-gray-600">
                سيتم تطبيق التوصيل المجاني تلقائياً للطلبات التي تساوي أو تتجاوز {settings.free_delivery_threshold} {settings.currency_symbol}
              </p>
            </div>

            <div>
              <label htmlFor="order_auto_cancel_hours" className="label">ساعات الإلغاء التلقائي للطلبات المعلقة</label>
              <input
                id="order_auto_cancel_hours"
                type="number"
                value={settings.order_auto_cancel_hours}
                onChange={(e) => setSettings(s => ({ ...s, order_auto_cancel_hours: Number(e.target.value) }))}
                className="input w-24"
                min="1"
                max="168"
              />
              <p className="text-body-xs text-gray-500 mt-1">عدد الساعات قبل إلغاء الطلب المعلق تلقائياً (1-168 ساعة)</p>
            </div>
          </div>
        )}

        {/* Social Tab */}
        {activeTab === 'social' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">روابط التواصل الاجتماعي</h2>
            <p className="text-body-md text-gray-500">أضف روابط حسابات المتجر على منصات التواصل الاجتماعي</p>

            <div className="grid md:grid-cols-2 gap-4">
              {[
                { field: 'social_facebook', label: 'فيسبوك', icon: 'facebook' },
                { field: 'social_twitter', label: 'تويتر', icon: 'twitter' },
                { field: 'social_instagram', label: 'انستقرام', icon: 'instagram' },
                { field: 'social_snapchat', label: 'سناب شات', icon: 'snapchat' },
              ].map(({ field, label, icon }) => (
                <div key={field}>
                  <label htmlFor={field} className="label">{label}</label>
                  <div className="relative">
                    <input
                      id={field}
                      type="url"
                      value={settings[field as keyof SettingsData] as string}
                      onChange={(e) => setSettings(s => ({ ...s, [field]: e.target.value }))}
                      className="input pl-10"
                      placeholder={`https://${icon.toLowerCase()}.com/...`}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 capitalize">{icon}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">المميزات والخيارات</h2>

            <div className="space-y-4">
              {[
                { key: 'maintenance_mode' as keyof SettingsData, label: 'وضع الصيانة', desc: 'إخفاء المتجر عن العملاء وإظهار رسالة صيانة' },
                { key: 'registration_enabled', label: 'تفعيل التسجيل', desc: 'السماح للمندوبين الجدد بالتسجيل' },
                { key: 'guest_checkout_enabled', label: 'الدفع كضيف', desc: 'السماح للعملاء بالشراء دون إنشاء حساب' },
                { key: 'phone_verification_required', label: 'التحقق من الهاتف مطلوب', desc: 'إجبار العملاء على التحقق من رقم الهاتف' },
                { key: 'auto_approve_products', label: 'الموافقة التلقائية على المنتجات', desc: 'الموافقة على منتجات المندوبين تلقائياً' },
                { key: 'review_enabled', label: 'تفعيل التقييمات', desc: 'السماح للعملاء بتقييم المنتجات' },
                { key: 'wishlist_enabled', label: 'تفعيل المفضلة', desc: 'السماح للعملاء بحفظ المنتجات في المفضلة' },
              ].map(({ key, label, desc }) => (
                <div key={key} className="flex items-center justify-between">
                  <div>
                    <p className="text-body-md font-medium text-charcoal">{label}</p>
                    <p className="text-body-sm text-gray-500">{desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings[key]}
                      onChange={(e) => setSettings(s => ({ ...s, [key]: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className={cn(
                      'w-12 h-7 rounded-full transition-colors peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary/20',
                      settings[key] ? 'bg-primary' : 'bg-gray-300'
                    )}>
                      <span className={cn(
                        'absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-transform',
                        settings[key] ? 'translate-x-5' : 'translate-x-0'
                      )} />
                    </div>
                  </label>
                </div>
              ))}
            </div>

            <div className="divider" />

            <div>
              <h3 className="heading-sm mb-4">إعدادات المنتجات</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="max_images_per_product" className="label">الحد الأقصى للصور لكل منتج</label>
                  <input
                    id="max_images_per_product"
                    type="number"
                    value={settings.max_images_per_product}
                    onChange={(e) => setSettings(s => ({ ...s, max_images_per_product: Number(e.target.value) }))}
                    className="input w-24"
                    min="1"
                    max="20"
                  />
                </div>
                <div>
                  <label htmlFor="max_file_size_mb" className="label">الحد الأقصى لحجم الملف (ميجابايت)</label>
                  <input
                    id="max_file_size_mb"
                    type="number"
                    value={settings.max_file_size_mb}
                    onChange={(e) => setSettings(s => ({ ...s, max_file_size_mb: Number(e.target.value) }))}
                    className="input w-24"
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label htmlFor="default_product_status" className="label">حالة المنتج الافتراضية</label>
                  <select
                    id="default_product_status"
                    value={settings.default_product_status}
                    onChange={(e) => setSettings(s => ({ ...s, default_product_status: e.target.value }))}
                    className="input"
                  >
                    <option value="active">نشط</option>
                    <option value="inactive">مخفي</option>
                    <option value="pending">قيد المراجعة</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Appearance Tab */}
        {activeTab === 'appearance' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">المظهر والعلامة التجارية</h2>

            <div>
              <h3 className="heading-sm mb-4">الألوان الأساسية</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'اللون الأساسي', value: '#243C32', readonly: true },
                  { label: 'اللون الثانوي', value: '#F5F2EA', readonly: true },
                  { label: 'لون التمييز', value: '#D6A15D', readonly: true },
                  { label: 'لون النص', value: '#30312E', readonly: true },
                ].map(({ label, value, readonly }) => (
                  <div key={label} className="space-y-2">
                    <label className="label">{label}</label>
                    <div className="relative">
                      <input
                        type="color"
                        value={value}
                        disabled={readonly}
                        className="input h-12 w-full cursor-default"
                      />
                      <span className="absolute inset-0 flex items-center justify-center text-white text-body-sm font-medium" style={{ background: value }}>
                        {value}
                      </span>
                    </div>
                    {readonly && <p className="text-body-xs text-gray-500">محدد مسبقاً - غير قابل للتغيير</p>}
                  </div>
                ))}
              </div>
            </div>

            <div className="divider" />

            <div>
              <h3 className="heading-sm mb-4">الخطوط</h3>
              <p className="text-body-md text-gray-500 mb-4">الخط الافتراضي: IBM Plex Sans Arabic (يدعم العربية RTL بشكل مثالي)</p>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="font_primary" className="label">الخط الأساسي</label>
                  <select id="font_primary" className="input" disabled>
                    <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</option>
                    <option value="Tajawal">Tajawal</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Amiri">Amiri</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="font_heading" className="label">خط العناوين</label>
                  <select id="font_heading" className="input" disabled>
                    <option value="IBM Plex Sans Arabic">IBM Plex Sans Arabic</option>
                    <option value="Tajawal">Tajawal</option>
                    <option value="Cairo">Cairo</option>
                    <option value="Amiri">Amiri</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Tab */}
        {activeTab === 'advanced' && (
          <div className="card p-6 space-y-6">
            <h2 className="heading-4">إعدادات متقدمة</h2>

            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="heading-sm text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  تنبيه: إعدادات حساسة
                </h3>
                <p className="text-body-sm text-amber-700">
                  تغيير هذه الإعدادات قد يؤثر على عمل المنصة. يرجى الحذر وتوثيق أي تغييرات.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="allowed_image_types" className="label">أنواع الصور المسموحة</label>
                  <input
                    id="allowed_image_types"
                    type="text"
                    value={settings.allowed_image_types.join(', ')}
                    onChange={(e) => setSettings(s => ({ ...s, allowed_image_types: e.target.value.split(',').map(t => t.trim()) }))}
                    className="input"
                    placeholder="image/jpeg, image/png, image/webp"
                  />
                  <p className="text-body-xs text-gray-500 mt-1">افصل الأنواع بفواصل</p>
                </div>
              </div>

              <div className="divider" />

              <div className="space-y-4">
                <h3 className="heading-sm">معلومات النظام</h3>
                <div className="grid md:grid-cols-2 gap-4 text-body-sm">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">إصدار التطبيق</p>
                    <p className="font-mono text-charcoal">1.0.0</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Supabase URL</p>
                    <p className="font-mono text-charcoal truncate">{import.meta.env.VITE_SUPABASE_URL}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">بيئة التشغيل</p>
                    <p className="font-mono text-charcoal">{import.meta.env.MODE}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">Node Version</p>
                    <p className="font-mono text-charcoal">{process.version}</p>
                  </div>
                </div>
              </div>

              <div className="divider" />

              <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg">
                <div>
                  <h3 className="heading-sm text-red-800">منطقة الخطر</h3>
                  <p className="text-body-sm text-red-600 mt-1">الإجراءات التالية لا يمكن التراجع عنها</p>
                </div>
                <button type="button" className="btn-danger">
                  <Trash2 className="w-4 h-4" />
                  مسح جميع البيانات التجريبية
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex gap-3 sticky bottom-0 bg-white/95 backdrop-blur-sm py-4 border-t border-gray-100">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex-1 py-3 w-full sm:w-auto"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin w-5 h-5" />
                جاري الحفظ...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                حفظ جميع الإعدادات
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}