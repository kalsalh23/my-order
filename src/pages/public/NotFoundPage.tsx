import { Link } from 'react-router-dom'
import { Home, Search, Store, ArrowLeft } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="text-center max-w-md">
        <div className="mb-8">
          <span className="text-9xl font-bold text-primary/10">404</span>
        </div>

        <h1 className="heading-2 text-charcoal mb-4">الصفحة غير موجودة</h1>
        <p className="text-body-lg text-gray-500 mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>

        <div className="space-y-3 mb-8">
          <Link to="/" className="btn-primary w-full sm:w-auto inline-flex items-center justify-center gap-2">
            <Home className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          <Link to="/products" className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center gap-2">
            <Search className="w-4 h-4" />
            تصفح المنتجات
          </Link>
          <Link to="/stores" className="btn-outline w-full sm:w-auto inline-flex items-center justify-center gap-2">
            <Store className="w-4 h-4" />
            زيارة المتاجر
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="card p-4">
            <Search className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-body-xs text-gray-500">ابحث عن منتجات</p>
          </div>
          <div className="card p-4">
            <Store className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-body-xs text-gray-500">اكتشف المتاجر</p>
          </div>
          <div className="card p-4">
            <ArrowLeft className="w-8 h-8 mx-auto text-primary mb-2" />
            <p className="text-body-xs text-gray-500">العودة للخلف</p>
          </div>
        </div>
      </div>
    </div>
  )
}