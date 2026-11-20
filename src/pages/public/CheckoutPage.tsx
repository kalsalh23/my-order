import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Truck, Shield, User, MapPin, Phone, CreditCard, CheckCircle, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/common/Toast'
import { supabase, sendOtp, verifyOtp } from '@/lib/supabase'
import { cn, formatPrice, generateOrderNumber, normalizePhone } from '@/utils'
import type { CartItem } from '@/types'

const checkoutSchema = z.object({
  customer_name: z.string().min(2, 'الاسم يجب أن يكون حرفين على الأقل').max(100),
  customer_phone: z.string().min(10, 'رقم الهاتف غير صحيح').regex(/^(\+966|0)?5\d{8}$/, 'رقم هاتف سعودي غير صحيح'),
  delivery_address: z.string().min(10, 'العنوان يجب أن يكون 10 أحرف على الأقل').max(500),
  notes: z.string().max(500).optional(),
})

type CheckoutFormData = z.infer<typeof checkoutSchema>

const DELIVERY_FEE = 15
const FREE_DELIVERY_THRESHOLD = 200

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, subtotal, clearCart } = useCart()
  const { showToast } = useToast()
  const [step, setStep] = useState<'form' | 'otp' | 'processing' | 'success'>('form')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTimer, setOtpTimer] = useState(60)
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const total = subtotal + deliveryFee

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      delivery_address: '',
      notes: '',
    },
  })

  const watchedPhone = watch('customer_phone')

  useEffect(() => {
    if (otpTimer > 0 && otpSent) {
      const timer = setInterval(() => setOtpTimer((t) => t - 1), 1000)
      return () => clearInterval(timer)
    } else if (otpTimer === 0) {
      setOtpSent(false)
    }
  }, [otpTimer, otpSent])

  const handleSendOtp = async (data: CheckoutFormData) => {
    const phone = normalizePhone(data.customer_phone)
    setValue('customer_phone', phone)

    const { error } = await sendOtp(phone)
    if (error) {
      showToast({ type: 'error', title: 'خطأ', message: 'فشل إرسال رمز التحقق. تأكد من إعداد خدمة الرسائل القصيرة.' })
      return
    }

    setOtpSent(true)
    setOtpTimer(60)
    setStep('otp')
    showToast({ type: 'success', title: 'تم الإرسال', message: `تم إرسال رمز التحقق إلى ${phone}` })
  }

  const handleVerifyOtp = async (otp: string) => {
    const phone = watchedPhone
    if (!phone) return

    const { data, error } = await verifyOtp(phone, otp)
    if (error || !data.session) {
      showToast({ type: 'error', title: 'رمز خاطئ', message: 'رمز التحقق غير صحيح أو منتهي الصلاحية' })
      return
    }

    setVerifiedPhone(phone)
    setStep('processing')
    await processOrder(data.session.user.id)
  }

  const processOrder = async (userId: string | undefined) => {
    setProcessing(true)
    try {
      const cartItems = items.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.discount_price ?? item.product.price,
        representative_id: item.product.representative_id,
      }))

      const { data: orderId, error } = await supabase.rpc('create_order', {
        p_customer_name: watch('customer_name'),
        p_customer_phone: verifiedPhone,
        p_delivery_address: watch('delivery_address'),
        p_notes: watch('notes') || null,
        p_cart_items: cartItems,
      })

      if (error) throw error

      const generatedOrderNumber = generateOrderNumber()
      setOrderNumber(generatedOrderNumber)
      clearCart()
      setStep('success')
      showToast({ type: 'success', title: 'تم إنشاء الطلب', message: `رقم الطلب: ${generatedOrderNumber}` })
    } catch (error) {
      console.error('Error creating order:', error)
      showToast({ type: 'error', title: 'خطأ', message: 'فشل إنشاء الطلب. يرجى المحاولة مرة أخرى.' })
      setStep('form')
    } finally {
      setProcessing(false)
    }
  }

  const handleResendOtp = async () => {
    const phone = watchedPhone
    if (!phone) return

    const { error } = await sendOtp(phone)
    if (error) {
      showToast({ type: 'error', title: 'خطأ', message: 'فشل إعادة إرسال الرمز' })
      return
    }
    setOtpTimer(60)
    showToast({ type: 'success', title: 'تم الإرسال', message: 'تم إعادة إرسال رمز التحقق' })
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center py-16">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h1 className="heading-2 text-charcoal mb-2">سلة التسوق فارغة</h1>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            تصفح المنتجات
          </Link>
        </div>
      </div>
    )
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-between mb-8 relative">
      <div className="absolute top-7 left-0 right-0 h-1 bg-gray-200" aria-hidden="true" />
      {[
        { id: 'form', label: 'المعلومات', icon: User },
        { id: 'otp', label: 'التحقق', icon: Shield },
        { id: 'processing', label: 'المعالجة', icon: Loader2 },
        { id: 'success', label: 'مكتمل', icon: CheckCircle },
      ].map((s, i) => (
        <div key={s.id} className="relative z-10 flex flex-col items-center">
          <div
            className={cn(
              'w-14 h-14 rounded-full flex items-center justify-center text-body-sm font-medium transition-all',
              step === s.id || (['form', 'otp', 'processing'].includes(step) && i < ['form', 'otp', 'processing'].indexOf(step))
                ? 'bg-primary text-white'
                : 'bg-gray-200 text-gray-500'
            )}
          >
            <s.icon className="w-6 h-6" aria-hidden="true" />
          </div>
          <span className={cn('text-body-xs mt-2', step === s.id ? 'text-primary font-medium' : 'text-gray-500')}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen pb-20">
      <div className="container-main py-6">
        {/* Step Indicator */}
        <div className="mb-8" role="navigation" aria-label="خطوات الدفع">
          {renderStepIndicator()}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:hidden mb-6">
          <details className="card">
            <summary className="p-4 flex items-center justify-between cursor-pointer list-none">
              <h2 className="heading-4">ملخص الطلب ({items.length} منتجات)</h2>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4 border-t border-gray-100">
              <OrderSummary items={items} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
            </div>
          </details>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Form Section */}
          <div className="lg:col-span-2">
            {step === 'form' && (
              <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-6" noValidate>
                <div className="card p-6">
                  <h2 className="heading-4 mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-primary" />
                    معلومات العميل
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label htmlFor="customer_name" className="label">الاسم الكامل *</label>
                      <input
                        id="customer_name"
                        type="text"
                        placeholder="أحمد محمد علي"
                        {...register('customer_name')}
                        className={cn('input', errors.customer_name && 'input-error')}
                        autoComplete="name"
                      />
                      {errors.customer_name && (
                        <p className="form-error" role="alert">{errors.customer_name.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="customer_phone" className="label">رقم الجوال *</label>
                      <div className="relative">
                        <input
                          id="customer_phone"
                          type="tel"
                          placeholder="05XXXXXXXX"
                          {...register('customer_phone')}
                          className={cn('input pl-10', errors.customer_phone && 'input-error')}
                          autoComplete="tel"
                          inputMode="tel"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">+966</span>
                      </div>
                      {errors.customer_phone && (
                        <p className="form-error" role="alert">{errors.customer_phone.message}</p>
                      )}
                      <p className="text-body-xs text-gray-500 mt-1">سيتم إرسال رمز تحقق إلى هذا الرقم</p>
                    </div>
                  </div>
                </div>

                <div className="card p-6">
                  <h2 className="heading-4 mb-6 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-primary" />
                    عنوان التوصيل
                  </h2>

                  <div>
                    <label htmlFor="delivery_address" className="label">العنوان الكامل *</label>
                    <textarea
                      id="delivery_address"
                      rows={3}
                      placeholder="حي، شارع، رقم المبنى، شقة/دور، نقطة مرجعية قريبة..."
                      {...register('delivery_address')}
                      className={cn('input resize-none', errors.delivery_address && 'input-error')}
                    />
                    {errors.delivery_address && (
                      <p className="form-error" role="alert">{errors.delivery_address.message}</p>
                    )}
                  </div>

                  <div className="mt-4">
                    <label htmlFor="notes" className="label">ملاحظات إضافية (اختياري)</label>
                    <textarea
                      id="notes"
                      rows={2}
                      placeholder="تعليمات خاصة بالتوصيل، رقم بوابة، كود الدخول، إلخ..."
                      {...register('notes')}
                      className="input resize-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full py-3 text-body-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin w-5 h-5" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      إرسال رمز التحقق
                    </>
                  )}
                </button>
              </form>
            )}

            {step === 'otp' && (
              <div className="card p-6 text-center">
                <Shield className="w-16 h-16 mx-auto text-primary/20 mb-4" />
                <h2 className="heading-3 mb-2">التحقق من رقم الجوال</h2>
                <p className="text-body-md text-gray-500 mb-6">
                  أدخل رمز التحقق المرسل إلى <strong className="text-charcoal">{watchedPhone}</strong>
                </p>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    const formData = new FormData(e.currentTarget)
                    const otp = Array.from(formData.values()).join('')
                    if (otp.length === 6) handleVerifyOtp(otp)
                  }}
                  className="flex justify-center gap-3 mb-6"
                >
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <input
                      key={i}
                      type="text"
                      maxLength={1}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className="w-12 h-14 text-center text-2xl font-bold rounded-lg border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
                      autoComplete="one-time-code"
                      aria-label={`رقم التحقق ${i}`}
                    />
                  ))}
                </form>

                <div className="space-y-3 text-body-sm">
                  <p className="text-gray-500">
                    لم تستلم الرمز؟ <button onClick={handleResendOtp} disabled={otpTimer > 0} className="text-primary hover:underline disabled:text-gray-400">
                    {otpTimer > 0 ? `إعادة الإرسال خلال ${otpTimer}ث` : 'إعادة إرسال الرمز'}
                  </button>
                  </p>
                  <button onClick={() => { setStep('form'); setOtpSent(false) }} className="text-primary hover:underline">
                    تغيير رقم الجوال
                  </button>
                </div>
              </div>
            )}

            {step === 'processing' && (
              <div className="card p-12 text-center">
                <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin mb-4" />
                <h2 className="heading-3 mb-2">جاري معالجة طلبك</h2>
                <p className="text-body-md text-gray-500">يرجى الانتظار بينما نقوم بإنشاء طلبك...</p>
              </div>
            )}

            {step === 'success' && orderNumber && (
              <div className="card p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="heading-2 text-green-700 mb-2">تم إنشاء طلبك بنجاح!</h2>
                <p className="text-body-md text-gray-500 mb-2">رقم الطلب:</p>
                <p className="text-display-md font-bold text-primary mb-6 font-mono">{orderNumber}</p>
                <p className="text-body-md text-gray-500 mb-6">
                  تم إرسال تفاصيل الطلب إلى رقم جوالك. يمكنك تتبع طلبك من صفحة تتبع الطلبات.
                </p>
                <div className="flex gap-3 justify-center">
                  <Link to={`/order-success/${orderNumber}`} className="btn-primary">
                    عرض تفاصيل الطلب
                  </Link>
                  <Link to="/products" className="btn-secondary">
                    مواصلة التسوق
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="hidden lg:block">
            <div className="card p-6 sticky top-24">
              <h2 className="heading-4 mb-4">ملخص الطلب</h2>
              <OrderSummary items={items} subtotal={subtotal} deliveryFee={deliveryFee} total={total} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrderSummary({
  items,
  subtotal,
  deliveryFee,
  total,
}: {
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  total: number
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {items.map((item) => (
          <div key={item.product.id} className="flex gap-3">
            <img
              src={item.product.main_image || '/images/placeholder-product.svg'}
              alt=""
              className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-charcoal line-clamp-1">{item.product.name}</p>
              <p className="text-body-xs text-gray-500">الكمية: {item.quantity}</p>
              <p className="text-body-sm font-medium text-primary">{formatPrice((item.product.discount_price ?? item.product.price) * item.quantity)}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-3">
        <div className="flex justify-between text-body-md">
          <span className="text-gray-600">المجموع الفرعي ({items.length} منتجات)</span>
          <span className="font-medium text-charcoal">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-body-md">
          <span className="text-gray-600 flex items-center gap-1">
            <Truck className="w-4 h-4" />
            التوصيل
          </span>
          <span className="font-medium text-charcoal">
            {deliveryFee > 0 ? formatPrice(deliveryFee) : <span className="text-green-600">مجاني</span>}
          </span>
        </div>
        {deliveryFee > 0 && subtotal < FREE_DELIVERY_THRESHOLD && (
          <p className="text-body-xs text-amber-600 bg-amber-50 p-2 rounded">
            أضف {formatPrice(FREE_DELIVERY_THRESHOLD - subtotal)} للشحن المجاني
          </p>
        )}
        <div className="divider" />
        <div className="flex justify-between text-lg">
          <span className="font-semibold text-charcoal">الإجمالي</span>
          <span className="font-bold text-primary">{formatPrice(total)}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 pt-4 space-y-2 text-body-xs text-gray-500">
        <div className="flex items-center gap-2 text-green-600">
          <Shield className="w-4 h-4" />
          <span>دفع آمن ومشفّر</span>
        </div>
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4" />
          <span>الدفع عند الاستلام متاح</span>
        </div>
      </div>
    </div>
  )
}