import { Link } from 'react-router-dom'
import { ShoppingCart, Plus, Minus, Tag, MapPin, Store } from 'lucide-react'
import { useCart } from '@/hooks/useCart'
import { cn, formatPrice, getImageUrl } from '@/utils'
import type { Product } from '@/types'

interface ProductCardProps {
  product: Product
  variant?: 'default' | 'compact' | 'featured'
  showStore?: boolean
  onAddToCart?: () => void
}

export function ProductCard({ product, variant = 'default', showStore = true, onAddToCart }: ProductCardProps) {
  const { addItem, items } = useCart()
  const cartItem = items.find((item) => item.product.id === product.id)
  const quantity = cartItem?.quantity || 0
  const inCart = quantity > 0
  const effectivePrice = product.discount_price ?? product.price
  const hasDiscount = product.discount_price && product.discount_price < product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    addItem(product, 1)
    onAddToCart?.()
  }

  const handleQuantityChange = (e: React.MouseEvent, delta: number) => {
    e.preventDefault()
    e.stopPropagation()
    const newQuantity = quantity + delta
    if (newQuantity <= 0) {
      // Remove from cart would be handled by the cart itself
    }
  }

  const imageUrl = getImageUrl(product.main_image)

  if (variant === 'compact') {
    return (
      <Link
        to={`/products/${product.slug}`}
        className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors touch-manipulation"
        aria-label={`${product.name} - ${formatPrice(effectivePrice)}`}
      >
        <img
          src={imageUrl}
          alt=""
          className="w-16 h-16 rounded-md object-cover flex-shrink-0"
          loading="lazy"
        />
        <div className="flex-1 min-w-0 text-right">
          <h4 className="text-body-sm font-medium text-charcoal line-clamp-1">{product.name}</h4>
          <p className="text-price text-primary">{formatPrice(effectivePrice)}</p>
        </div>
        {inCart ? (
          <div className="quantity-selector">
            <button
              onClick={(e) => handleQuantityChange(e, -1)}
              className="quantity-btn"
              aria-label="تقليل الكمية"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="quantity-value">{quantity}</span>
            <button
              onClick={(e) => handleQuantityChange(e, 1)}
              className="quantity-btn"
              aria-label="زيادة الكمية"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="btn-primary btn-sm px-3"
            aria-label={`أضف ${product.name} إلى السلة`}
          >
            <ShoppingCart className="w-4 h-4" />
          </button>
        )}
      </Link>
    )
  }

  return (
    <article className={cn('product-card', variant === 'featured' && 'md:flex-row')} role="listitem">
      <Link
        to={`/products/${product.slug}`}
        className="product-card-image block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={`عرض تفاصيل ${product.name}`}
      >
        <img
          src={imageUrl}
          alt=""
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        {hasDiscount && (
          <span className="absolute top-1 right-1 discount-badge px-1.5 py-0.5 text-[10px]">
            -{discountPercent}%
          </span>
        )}
        {product.stock_quantity === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-medium text-body-xs px-2 py-1 bg-red-600 rounded-md">
              غير متوفر
            </span>
          </div>
        )}
      </Link>

      <div className="product-card-content">
        <Link
          to={`/products/${product.slug}`}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
          aria-label={`${product.name} - ${formatPrice(effectivePrice)}`}
        >
          <h3 className="text-body-xs font-medium text-charcoal line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-baseline gap-1 mt-auto">
          <span className="text-body-sm font-semibold text-primary">{formatPrice(effectivePrice)}</span>
          {hasDiscount && (
            <span className="text-[10px] text-gray-400 line-through">{formatPrice(product.price)}</span>
          )}
        </div>
      </div>

      <div className="product-card-footer">
        {inCart ? (
          <div className="quantity-selector flex-1">
            <button
              onClick={(e) => handleQuantityChange(e, -1)}
              className="quantity-btn"
              aria-label="تقليل الكمية"
              disabled={quantity <= 1}
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="quantity-value text-body-sm">{quantity}</span>
            <button
              onClick={(e) => handleQuantityChange(e, 1)}
              className="quantity-btn"
              aria-label="زيادة الكمية"
              disabled={quantity >= product.stock_quantity}
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            className="btn-primary flex-1 justify-center py-1.5 text-body-xs"
            disabled={product.stock_quantity === 0}
            aria-label={`أضف ${product.name} إلى السلة`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </article>
  )
}