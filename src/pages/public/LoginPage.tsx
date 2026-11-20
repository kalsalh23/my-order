import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Store, User, Mail, Lock, AlertCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/components/common/Toast'
import { cn, normalizePhone } from '@/utils'

const loginSchema = z.object({
  login: z.string().min(3, 'أدخل البريد الإلكتروني أو رقم الجوال'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { signIn } = useAuth()
  const { showToast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVendorLogin, setIsVendorLogin] = useState(true)

  const redirectTo = searchParams.get('redirect') || '/vendor/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      let email = data.login
      if (data.login.includes('@')) {
        email = data.login
      } else if (/^(\+966|0)?5\d{8}$/.test(data.login.replace(/\s/g, ''))) {
        // Phone login - we'd need to look up the email first
        // For now, show error
        showToast({ type: 'error', title: 'غير مدعوم', message: 'تسجيل الدخول برقم الجوال غير متاح حالياً. يرجى استخدام البريد الإلكتروني.' })
        setIsLoading(false)
        return
      }

      const { error } = await signIn(email, data.password)
      if (error) {
        showToast({ type: 'error', title: 'فشل تسجيل الدخول', message: error.message })
        return
      }

      showToast({ type: 'success', title: 'مرحباً بك', message: 'تم تسجيل الدخول بنجاح' })
      navigate(redirectTo, { replace: true })
    } catch (err) {
      console.error('Login error:', err)
      showToast({ type: 'error', title: 'خطأ', message: 'حدث خطأ غير متوقع' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 touch-manipulation">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Store className="w-7 h-7 text-white" />
            </div>
            <span className="text-display-sm font-semibold text-charcoal">مندوب طيبة</span>
          </Link>
          <h1 className="heading-2 text-charcoal mb-2">{isVendorLogin ? 'دخول المندوب' : 'دخول المدير'}</h1>
          <p className="text-body-md text-gray-500">أدخل بياناتك للوصول إلى لوحة التحكم</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit(handleLogin)} className="space-y-5" noValidate>
            <div>
              <label htmlFor="login" className="label">البريد الإلكتروني *</label>
              <div className="relative">
                <input
                  id="login"
                  type="email"
                  placeholder="example@email.com"
                  {...register('login')}
                  className={cn('input pl-10', errors.login && 'input-error')}
                  autoComplete="email"
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              </div>
              {errors.login && <p className="form-error" role="alert">{errors.login.message}</p>}
            </div>

            <div>
              <label htmlFor="password" className="label">كلمة المرور *</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  {...register('password')}
                  className={cn('input pl-10 pr-12', errors.password && 'input-error')}
                  autoComplete="current-password"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 touch-manipulation"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="form-error" role="alert">{errors.password.message}</p>}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer touch-manipulation">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="text-body-sm text-gray-600">تذكرني</span>
              </label>
              <Link to="/forgot-password" className="text-body-sm text-primary hover:underline">
                نسيت كلمة المرور؟
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3 text-body-lg"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري الدخول...
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  دخول
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-body-sm text-gray-500 mb-4">أو سجل الدخول كـ</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsVendorLogin(true)}
                className={cn(
                  'btn flex-1 py-2.5',
                  isVendorLogin ? 'btn-primary' : 'btn-outline'
                )}
              >
                <Store className="w-4 h-4" />
                مندوب
              </button>
              <button
                type="button"
                onClick={() => setIsVendorLogin(false)}
                className={cn(
                  'btn flex-1 py-2.5',
                  !isVendorLogin ? 'btn-primary' : 'btn-outline'
                )}
              >
                <User className="w-4 h-4" />
                مدير
              </button>
            </div>
          </div>

          <p className="text-center text-body-sm text-gray-500 mt-6">
            ليس لديك حساب؟ <Link to="/vendor/register" className="text-primary font-medium hover:underline">تواصل معنا للانضمام</Link>
          </p>
        </div>

        <div className="mt-6 text-center text-body-xs text-gray-400">
          <p>باستخدام مندوب طيبة، أنت توافق على <Link to="/terms" className="underline">شروط الاستخدام</Link> و <Link to="/privacy" className="underline">سياسة الخصوصية</Link></p>
        </div>
      </div>
    </div>
  )
}