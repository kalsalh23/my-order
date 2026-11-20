import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Star, MapPin, Store, Truck, Shield, Heart, Share2, Minus, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/products/ProductCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SkeletonProductCard } from '@/components/common/Skeletons'
import { useCart } from '@/hooks/useCart'
import { useToast } from '@/components/common/Toast'
import { cn, formatPrice, getImageUrl } from '@/utils'
import type { Product } from '@/types'

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const [product, setProduct] = useState<Product | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [showImageModal, setShowImageModal] = useState(false)

  useEffect(() => {
    if (!slug) return

    const fetchProduct = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select(
            `
            *,
            representative:representatives(
              id, store_name, store_slug, logo_url, cover_url, description, phone, location, is_visible,
              user:profiles(id, full_name, avatar_url, phone)
            ),
            category:categories(id, name, slug),
            images:product_images(*)
          `
          )
          .eq('slug', slug)
          .eq('is_active', true)
          .eq('representative.is_visible', true)
          .single()

        if (error) throw error
        if (!data) throw new Error('Product not found')

        setProduct(data)

        // Fetch related products
        const { data: related } = await supabase
          .from('products')
          .select(
            `
            *,
            representative:representatives(id, store_name, store_slug, logo_url),
            category:categories(id, name, slug)
          `
          )
          .eq('category_id', data.category_id)
          .eq('is_active', true)
          .eq('representative.is_visible', true)
          .neq('id', data.id)
          .limit(4)

        if (related) setRelatedProducts(related)
      } catch (error) {
        console.error('Error fetching product:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [slug])

  const allImages = product
    ? [
        product.main_image,
        ...(product.images || []).map((img) => img.image_url).filter(Boolean),
      ].filter(Boolean)
    : []

  const effectivePrice = product?.discount_price ?? product?.price ?? 0
  const hasDiscount = product && product.discount_price && product.discount_price < product.price
  const discountPercent = hasDiscount
    ? Math.round(((product.price - product.discount_price!) / product.price) * 100)
    : 0

  const handleAddToCart = () => {
    if (!product) return
    if (product.stock_quantity === 0) {
      showToast({
        type: 'warning',
        title: 'غير متوفر',
        message: 'هذا المنتج غير متوفر حالياً',
      })
      return
    }
    if (quantity > product.stock_quantity) {
      showToast({
        type: 'warning',
        title: 'كمية غير متاحة',
        message: `الكمية المتاحة: ${product.stock_quantity}`,
      })
      return
    }
    addItem(product, quantity)
    showToast({
      type: 'success',
      title: 'تم إضافة المنتج',
      message: `تم إضافة ${quantity} من ${product.name} إلى السلة`,
      action: {
        label: 'عرض السلة',
        onClick: () => window.location.href = '/cart',
      },
    })
  }

  if (loading) {
    return (
      <div className="container-main py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="skeleton aspect-square w-full rounded-lg" />
          <div className="space-y-4">
            <div className="skeleton h-5 w-3/4" />
            <div className="skeleton h-4 w-1/2" />
            <div className="skeleton h-8 w-40" />
            <div className="skeleton h-12 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-12 w-full" />
          </div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container-main py-16 text-center">
        <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="heading-2 text-charcoal mb-2">المنتج غير موجود</h1>
        <p className="text-body-md text-gray-500 mb-6">المنتج الذي تبحث عنه غير متاح أو تم إزالته</p>
        <Link to="/products" className="btn-primary">
          تصفح المنتجات
        </Link>
      </div>
    )
  }

  const handleImageClick = () => {
    setShowImageModal(true)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)
    } else if (e.key === 'ArrowRight') {
      setCurrentImageIndex((prev) => (prev + 1) % allImages.length)
    } else if (e.key === 'Escape') {
      setShowImageModal(false)
    }
  }

  return (
    <div className="min-h-screen" onKeyDown={handleKeyDown}>
      {/* Breadcrumb */}
      <nav className="bg-white border-b border-gray-100" aria-label="مسار التنقل">
        <div className="container-main py-3">
          <ol className="flex items-center gap-2 text-body-sm text-gray-500 flex-wrap" role="list">
            <li>
              <Link to="/" className="hover:text-primary transition-colors">الرئيسية</Link>
            </li>
            <li aria-hidden="true">/</li>
            <li>
              <Link to="/products" className="hover:text-primary transition-colors">المنتجات</Link>
            </li>
            <li aria-hidden="true">/</li>
            {product.category && (
              <>
                <li>
                  <Link to={`/categories/${product.category.slug}`} className="hover:text-primary transition-colors">
                    {product.category.name}
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
              </>
            )}
            <li className="text-charcoal font-medium truncate max-w-[200px]" aria-current="page">
              {product.name}
            </li>
          </ol>
        </div>
      </nav>

      {/* Product Details */}
      <main className="container-main py-6">
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Image Gallery */}
          <div className="space-y-3">
            <div
              className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 cursor-zoom-in touch-manipulation"
              onClick={handleImageClick}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleImageClick()}
              aria-label="تكبير صورة المنتج"
            >
              <img
                src={getImageUrl(allImages[currentImageIndex])}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              />
              {allImages.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all touch-manipulation',
                        index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
                      )}
                      aria-label={`عرض الصورة ${index + 1}`}
                      aria-current={index === currentImageIndex ? 'true' : 'false'}
                    />
                  ))}
                </div>
              )}
              {hasDiscount && (
                <span className="absolute top-3 right-3 discount-badge px-3 py-1">
                  -{discountPercent}%
                </span>
              )}
            </div>

            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-hide" role="group" aria-label="صور المنتج">
                {allImages.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      'flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors touch-manipulation',
                      index === currentImageIndex ? 'border-primary' : 'border-transparent hover:border-gray-300'
                    )}
                    aria-label={`الصورة ${index + 1}`}
                    aria-current={index === currentImageIndex ? 'true' : 'false'}
                  >
                    <img
                      src={getImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {product.representative && (
              <Link
                to={`/stores/${product.representative.store_slug}`}
                className="flex items-center gap-2 text-body-sm text-gray-500 hover:text-primary transition-colors touch-manipulation"
              >
                <Store className="w-4 h-4" />
                <span>{product.representative.store_name}</span>
              </Link>
            )}

            <h1 className="heading-2 text-charcoal">{product.name}</h1>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="price-lg">{formatPrice(effectivePrice)}</span>
              {hasDiscount && (
                <span className="old-price text-body-lg">{formatPrice(product.price)}</span>
              )}
            </div>

            <div className="flex items-center gap-4 text-body-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                4.8 (124 تقييم)
              </span>
              <span className="flex items-center gap-1">
                <Truck className="w-4 h-4" />
                توصيل سريع
              </span>
            </div>

            {product.description && (
              <div className="prose prose-rtl max-w-none text-body-md text-gray-700">
                <p className="whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <div>
                <label htmlFor="quantity" className="label">الكمية</label>
                <div className="quantity-selector w-fit">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="quantity-btn"
                    aria-label="تقليل الكمية"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Math.min(Number(e.target.value) || 1, product.stock_quantity)))}
                    className="quantity-value border-0 focus:outline-none focus:ring-0 text-center w-16"
                    min="1"
                    max={product.stock_quantity}
                    aria-label="الكمية"
                  />
                  <button
                    onClick={() => setQuantity((q) => Math.min(product.stock_quantity, q + 1))}
                    className="quantity-btn"
                    aria-label="زيادة الكمية"
                    disabled={quantity >= product.stock_quantity}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-body-xs text-gray-500 mt-1">
                  متوفر: {product.stock_quantity} قطعة
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleAddToCart}
                  className="btn-primary flex-1 justify-center py-3 text-body-lg"
                  disabled={product.stock_quantity === 0}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  أضف للسلة
                </button>
                <button
                  className="btn-secondary p-3"
                  aria-label="إضافة للمفضلة"
                >
                  <Heart className="w-5 h-5" />
                </button>
                <button
                  className="btn-secondary p-3"
                  aria-label="مشاركة المنتج"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Store Info */}
            {product.representative && (
              <div className="card p-4 border-t border-gray-100">
                <div className="flex items-center gap-3">
                  <img
                    src={getImageUrl(product.representative.logo_url) || `https://ui-avatars.com/api/?name=${encodeURIComponent(product.representative.store_name)}&background=243C32&color=fff&size=128&format=svg`}
                    alt=""
                    className="w-12 h-12 rounded-xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-body-md font-semibold text-charcoal">{product.representative.store_name}</h3>
                    {product.representative.location && (
                      <p className="text-body-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {product.representative.location}
                      </p>
                    )}
                  </div>
                  <Link
                    to={`/stores/${product.representative.store_slug}`}
                    className="btn-secondary btn-sm"
                  >
                    زيارة المتجر
                  </Link>
                </div>
              </div>
            )}

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-gray-50 touch-manipulation">
                <Truck className="w-6 h-6 mx-auto text-primary mb-1" />
                <p className="text-body-xs text-gray-600">توصيل سريع</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 touch-manipulation">
                <Shield className="w-6 h-6 mx-auto text-primary mb-1" />
                <p className="text-body-xs text-gray-600">دفع آمن</p>
              </div>
              <div className="p-3 rounded-lg bg-gray-50 touch-manipulation">
                <svg className="w-6 h-6 mx-auto text-primary mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-body-xs text-gray-600">ضمان الجودة</p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12" aria-labelledby="related-heading">
            <SectionHeader title="منتجات ذات صلة" id="related-heading" action={{ label: 'عرض الكل', href: `/categories/${product.category?.slug}` }} />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="list">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Image Modal */}
      {showImageModal && (
        <div
          className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center"
          onClick={() => setShowImageModal(false)}
          role="dialog"
          aria-modal="true"
          aria-label="معرض الصور"
        >
          <button
            onClick={() => setShowImageModal(false)}
            className="absolute top-4 left-4 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors touch-manipulation"
            aria-label="إغلاق المعرض"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length) }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors touch-manipulation"
            aria-label="الصورة السابقة"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <img
            src={getImageUrl(allImages[currentImageIndex])}
            alt={product.name}
            className="max-h-[85vh] max-w-[90vw] object-contain"
          />

          <button
            onClick={(e) => { e.stopPropagation(); setCurrentImageIndex((prev) => (prev + 1) % allImages.length) }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors touch-manipulation"
            aria-label="الصورة التالية"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2" role="tablist">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(index) }}
                className={cn(
                  'w-2 h-2 rounded-full transition-all touch-manipulation',
                  index === currentImageIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/75'
                )}
                role="tab"
                aria-selected={index === currentImageIndex}
                aria-label={`الصورة ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}