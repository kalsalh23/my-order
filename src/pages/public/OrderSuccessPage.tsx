import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Truck, MapPin, Phone, Clock, ArrowLeft, Package } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { formatPrice, formatDateTime } from '@/utils'
import type { Order } from '@/types'

export function OrderSuccessPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>()

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="card p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="heading-2 text-green-700 mb-2">تم طلبك بنجاح!</h1>
          <p className="text-body-md text-gray-500 mb-6">
            شكراً لتسوقك مع مندوب طيبة. تم استلام طلبك وسيتم معالجته قريباً.
          </p>

          <div className="bg-gray-50 rounded-xl p-6 mb-6 text-right">
            <p className="text-body-sm text-gray-500 mb-1">رقم الطلب</p>
            <p className="text-display-sm font-bold text-primary font-mono">{orderNumber}</p>
          </div>

          <div className="space-y-3 mb-6 text-body-sm text-gray-600">
            <div className="flex items-center justify-center gap-2 text-green-600">
              <Clock className="w-4 h-4" />
              <span>قيد المعالجة</span>
            </div>
            <p>سيتواصل معك المندوب خلال 24 ساعة لتأكيد الطلب</p>
          </div>

          <div className="flex gap-3">
            <Link to="/track-order" className="btn-primary flex-1">
              تتبع الطلب
            </Link>
            <Link to="/products" className="btn-secondary flex-1">
              مواصلة التسوق
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="card p-4">
            <Truck className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-body-xs text-gray-500">توصيل سريع</p>
          </div>
          <div className="card p-4">
            <Shield className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-body-xs text-gray-500">دفع آمن</p>
          </div>
          <div className="card p-4">
            <Phone className="w-6 h-6 mx-auto text-primary mb-2" />
            <p className="text-body-xs text-gray-500">دعم 24/7</p>
          </div>
        </div>
      </div>
    </div>
  )
}