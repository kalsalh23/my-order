import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Plus, Minus, ArrowLeft, Gift, Truck } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/common/Toast'
import { cn, formatPrice } from '@/utils'
import type { CartItem } from '@/types'

export function CartPage() {
  const navigate = useNavigate()
  const { items, subtotal, itemCount, updateQuantity, removeItem, clearCart } = useCart()
  const { showToast } = useToast()

  const DELIVERY_FEE = 15
  const FREE_DELIVERY_THRESHOLD = 200
  const deliveryFee = subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE
  const total = subtotal + deliveryFee
  const remainingForFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal)

  const handleQuantityChange = (productId: string, delta: number) => {
    const item = items.find((i) => i.product.id === productId)
    if (!item) return
    const newQuantity = item.quantity + delta
    if (newQuantity < 1) {
      removeItem(productId)
      showToast({ type: 'info', title: 'تم الحذف', message: 'تم إزالة المنتج من السلة' })
    } else if (newQuantity > item.product.stock_quantity) {
      showToast({ type: 'warning', title: 'كمية غير متاحة', message: `الحد الأقصى: ${item.product.stock_quantity}` })
    } else {
      updateQuantity(productId, newQuantity)
    }
  }

  const handleRemove = (productId: string) => {
    removeItem(productId)
    showToast({ type: 'info', title: 'تم الحذف', message: 'تم إزالة المنتج من السلة' })
  }

  const handleClearCart = () => {
    if (confirm('هل تريد تفريغ السلة بالكامل؟')) {
      clearCart()
      showToast({ type: 'info', title: 'تم التفريغ', message: 'تم تفريغ السلة' })
    }
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center py-16">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
          <h1 className="heading-2 text-charcoal mb-2">سلة التسوق فارغة</h1>
          <p className="text-body-md text-gray-500 mb-8">أضف منتجات إلى سلتك لتبدأ التسوق</p>
          <Link to="/products" className="btn-primary inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            تصفح المنتجات
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="container-main py-4">
          <div className="flex items-center justify-between">
            <h1 className="heading-3">سلة التسوق ({itemCount})</h1>
            {items.length > 1 && (
              <button onClick={handleClearCart} className="text-body-sm text-red-600 hover:text-red-700 touch-manipulation">
                تفريغ السلة
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Cart Items */}
      <main className="container-main py-6">
        <div className="space-y-4" role="list" aria-label="منتجات السلة">
          {items.map((item) => (
            <article
              key={item.product.id}
              className="card flex flex-col sm:flex-row gap-4 p-4"
              role="listitem"
            >
              <Link
                to={`/products/${item.product.slug}`}
                className="relative w-full sm:w-24 h-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0"
                aria-label={`${item.product.name} - ${formatPrice(item.product.discount_price ?? item.product.price)}`}
              >
                <img
                  src={item.product.main_image || '/images/placeholder-product.svg'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </Link>

              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <Link
                    to={`/products/${item.product.slug}`}
                    className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                  >
                    <h3 className="text-body-md font-medium text-charcoal line-clamp-2">{item.product.name}</h3>
                  </Link>
                  {item.product.representative && (
                    <p className="text-body-xs text-gray-500 mt-1 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {item.product.representative.store_name}
                    </p>
                  )}

                  <div className="flex items-baseline gap-2 mt-2">
                    <span className="price">{formatPrice(item.product.discount_price ?? item.product.price)}</span>
                    {item.product.discount_price && item.product.discount_price < item.product.price && (
                      <span className="old-price">{formatPrice(item.product.price)}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                  <div className="quantity-selector" role="group" aria-label={`كمية ${item.product.name}`}>
                    <button
                      onClick={() => handleQuantityChange(item.product.id, -1)}
                      className="quantity-btn"
                      aria-label="تقليل الكمية"
                      disabled={item.quantity <= 1}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="quantity-value" aria-live="polite">{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.product.id, 1)}
                      className="quantity-btn"
                      aria-label="زيادة الكمية"
                      disabled={item.quantity >= item.product.stock_quantity}
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleRemove(item.product.id)}
                    className="text-body-sm text-red-600 hover:text-red-700 flex items-center gap-1 touch-manipulation"
                    aria-label={`إزالة ${item.product.name} من السلة`}
                  >
                    <Trash2 className="w-4 h-4" />
                    حذف
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>

        {/* Order Summary */}
        <div className="mt-6">
          <div className="card p-6 sticky top-24">
            <h2 className="heading-4 mb-4">ملخص الطلب</h2>
            <dl className="space-y-3 text-body-md">
              <div className="flex justify-between">
                <dt className="text-gray-600">المجموع الفرعي</dt>
                <dd className="font-medium text-charcoal">{formatPrice(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-600 flex items-center gap-2">
                  التوصيل
                  {deliveryFee > 0 && (
                    <span className="text-body-xs text-primary">({formatPrice(remainingForFreeDelivery)} للشحن المجاني)</span>
                  )}
                </dt>
                <dd className="font-medium text-charcoal">
                  {deliveryFee > 0 ? formatPrice(deliveryFee) : <span className="text-green-600">مجاني</span>}
                </dd>
              </div>
              <div className="divider" />
              <div className="flex justify-between text-lg">
                <dt className="font-semibold text-charcoal">الإجمالي</dt>
                <dd className="font-bold text-primary">{formatPrice(total)}</dd>
              </div>
            </dl>

            {deliveryFee > 0 && (
              <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <div className="flex items-center gap-2 text-body-sm text-amber-800">
                  <Gift className="w-4 h-4 flex-shrink-0" />
                  <span>أضف منتجات بقيمة {formatPrice(remainingForFreeDelivery)} للحصول على توصيل مجاني</span>
                </div>
              </div>
            )}

            <Link
              to="/checkout"
              className="btn-primary w-full justify-center py-3 mt-6 text-body-lg"
            >
              <Truck className="w-5 h-5" />
              المتابعة للدفع
            </Link>

            <p className="text-center text-body-xs text-gray-500 mt-4">
              بالدفع، أنت توافق على <Link to="/terms" className="underline">شروط الاستخدام</Link> و
              <Link to="/privacy" className="underline">سياسة الخصوصية</Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}