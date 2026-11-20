import { Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Store, Package, TrendingUp, Clock, MapPin, Truck, Shield, Headphones } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/products/ProductCard'
import { CategoryCard } from '@/components/products/CategoryCard'
import { StoreCard } from '@/components/products/StoreCard'
import { Banner } from '@/components/common/Banner'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SkeletonProductCard, SkeletonCategoryCard, SkeletonStoreCard } from '@/components/common/Skeletons'
import { cn, formatPrice, getImageUrl } from '@/utils'
import type { Product, Category, Representative, Banner as BannerType } from '@/types'

export function HomePage() {
  const [banners, setBanners] = useState<BannerType[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [latestProducts, setLatestProducts] = useState<Product[]>([])
  const [popularProducts, setPopularProducts] = useState<Product[]>([])
  const [featuredStores, setFeaturedStores] = useState<Representative[]>([])
  const [loading, setLoading] = useState(true)
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0)

  const fetchData = useCallback(async () => {
    try {
      const [bannersRes, categoriesRes, featuredRes, latestRes, popularRes, storesRes] = await Promise.all([
        supabase.from('banners').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order').limit(8),
        supabase
          .from('products')
          .select(`
            *,
            representative:representatives(id, store_name, store_slug, logo_url),
            category:categories(id, name, slug)
          `)
          .eq('is_active', true)
          .eq('representative.is_visible', true)
          .order('created_at', { ascending: false })
          .limit(8),
        supabase
          .from('products')
          .select(`
            *,
            representative:representatives(id, store_name, store_slug, logo_url),
            category:categories(id, name, slug)
          `)
          .eq('is_active', true)
          .eq('representative.is_visible', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('products')
          .select(`
            *,
            representative:representatives(id, store_name, store_slug, logo_url),
            category:categories(id, name, slug)
          `)
          .eq('is_active', true)
          .eq('representative.is_visible', true)
          .order('created_at', { ascending: false })
          .limit(10),
        supabase
          .from('representatives')
          .select(`
            *,
            user:profiles(id, full_name, avatar_url)
          `)
          .eq('is_visible', true)
          .order('created_at', { ascending: false })
          .limit(6),
      ])

      if (bannersRes.data) setBanners(bannersRes.data)
      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (featuredRes.data) setFeaturedProducts(featuredRes.data)
      if (latestRes.data) setLatestProducts(latestRes.data)
      if (popularRes.data) setPopularProducts(popularRes.data)
      if (storesRes.data) setFeaturedStores(storesRes.data)
    } catch (error) {
      console.error('Error fetching home data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (banners.length <= 1) return
    const interval = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [banners.length])

  const renderProductSection = (
    title: string,
    products: Product[],
    href: string,
    skeletonCount = 4
  ) => {
    if (loading) {
      return (
        <section className="section" aria-labelledby={`${title}-heading`}>
          <SectionHeader title={title} action={{ label: 'عرض الكل', href }} />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="list">
            {Array.from({ length: skeletonCount }).map((_, i) => (
              <SkeletonProductCard key={i} />
            ))}
          </div>
        </section>
      )
    }

    if (products.length === 0) return null

    return (
      <section className="section" aria-labelledby={`${title}-heading`}>
        <SectionHeader title={title} action={{ label: 'عرض الكل', href }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="list">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <section className="relative" aria-label="العروض الرئيسية">
        {loading ? (
          <div className="aspect-[16/9] bg-gray-100 animate-pulse" />
        ) : banners.length > 0 ? (
          <div className="relative overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentBannerIndex * 100}%)` }}
              role="region"
              aria-label="شريط العروض"
              aria-roledescription="carousel"
            >
              {banners.map((banner, index) => (
                <Link
                  key={banner.id}
                  to={banner.target_url || '/products'}
                  className="w-full flex-shrink-0 block"
                  aria-label={banner.title}
                >
                  <img
                    src={getImageUrl(banner.image_url)}
                    alt={banner.title}
                    className="w-full h-48 sm:h-56 md:h-64 object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                  />
                </Link>
              ))}
            </div>

            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-charcoal shadow-lg hover:bg-white transition-colors touch-manipulation"
                  aria-label="العرض السابق"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % banners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-charcoal shadow-lg hover:bg-white transition-colors touch-manipulation"
                  aria-label="العرض التالي"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5" role="tablist" aria-label="مؤشرات العروض">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBannerIndex(index)}
                      className={cn(
                        'w-2 h-2 rounded-full transition-all duration-300 touch-manipulation',
                        index === currentBannerIndex
                          ? 'bg-white w-6'
                          : 'bg-white/50 hover:bg-white/75'
                      )}
                      role="tab"
                      aria-selected={index === currentBannerIndex}
                      aria-label={`الذهاب للعرض ${index + 1}`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="aspect-[16/9] bg-gradient-to-r from-primary/10 to-accent/10 flex items-center justify-center">
            <div className="text-center px-6">
              <Store className="w-16 h-16 mx-auto text-primary/50 mb-4" />
              <h2 className="text-heading-lg font-semibold text-charcoal">لا توجد عروض حالياً</h2>
              <p className="text-body-md text-gray-500 mt-2">تصفح منتجاتنا المميزة أدناه</p>
            </div>
          </div>
        )}
      </section>

      {/* Categories */}
      <section className="section bg-white" aria-labelledby="categories-heading">
        <SectionHeader title="الأقسام" id="categories-heading" action={{ label: 'كل الأقسام', href: '/products' }} />
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3" role="list">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCategoryCard key={i} />)
            : categories.map((category) => (
                <CategoryCard key={category.id} category={category} />
              ))}
        </div>
      </section>

      {/* Featured Products */}
      {renderProductSection('المميزة', featuredProducts, '/products?featured=true')}

      {/* Latest Products */}
      {renderProductSection('الأحدث', latestProducts, '/products?sort=newest')}

      {/* Popular Products */}
      {renderProductSection('الأكثر مبيعاً', popularProducts, '/products?sort=popular')}

      {/* Featured Stores */}
      <section className="section" aria-labelledby="stores-heading">
        <SectionHeader title="متاجر مميزة" id="stores-heading" action={{ label: 'كل المتاجر', href: '/stores' }} />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" role="list">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonStoreCard key={i} />)
            : featuredStores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
        </div>
      </section>

      {/* Trust Signals */}
      <section className="section bg-white border-y border-gray-100" aria-label="مزايا مندوب طيبة">
        <div className="container-main">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4 touch-manipulation">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <Truck className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-heading-sm font-semibold text-charcoal">توصيل سريع</h3>
              <p className="text-body-xs text-gray-500 mt-1">وصول طلبك في وقت قياسي</p>
            </div>
            <div className="p-4 touch-manipulation">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-heading-sm font-semibold text-charcoal">دفع آمن</h3>
              <p className="text-body-xs text-gray-500 mt-1">حماية كاملة لبياناتك</p>
            </div>
            <div className="p-4 touch-manipulation">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <MapPin className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-heading-sm font-semibold text-charcoal">متاجر محلية</h3>
              <p className="text-body-xs text-gray-500 mt-1">منتجات من منطقتك</p>
            </div>
            <div className="p-4 touch-manipulation">
              <div className="w-14 h-14 mx-auto mb-3 rounded-xl bg-primary/10 flex items-center justify-center">
                <Headphones className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-heading-sm font-semibold text-charcoal">دعم 24/7</h3>
              <p className="text-body-xs text-gray-500 mt-1">فريق دعم متاح دائماً</p>
            </div>
          </div>
        </div>
      </section>

      {/* App Download CTA */}
      <section className="section" aria-label="تحميل التطبيق">
        <div className="container-main">
          <div className="bg-primary rounded-2xl p-6 md:p-10 text-center text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-accent/20 rounded-full blur-3xl" />
            <div className="relative z-10">
              <h2 className="text-heading-lg md:text-heading-xl font-semibold mb-3">
                حمل تطبيق مندوب طيبة
              </h2>
              <p className="text-body-md text-white/80 mb-6 max-w-md mx-auto">
                تجربة تسوق أفضل، إشعارات فورية، وعروض حصرية للمستخدمين
              </p>
              <div className="flex items-center justify-center gap-4">
                <a
                  href="#"
                  className="btn-secondary bg-white text-primary hover:bg-gray-100 px-6 py-3"
                  aria-label="تحميل من متجر أبل"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M18.71 17.21c.35-.08.68-.21 1-.37.09-.05.18-.1.26-.16-.82-.57-1.43-1.42-1.79-2.44-.18-.5-.23-1.07-.23-1.61 0-.74.16-1.38.47-1.93C15.9 10 13.54 8.9 11 8.9c-1.76 0-3.39.62-4.56 1.67-.24-.35-.49-.73-.75-1.13C7.58 7.54 9.46 7 11.5 7c3.04 0 5.54 2.27 5.95 5.21-.2.98-.63 1.84-1.29 2.53-.48.5-1.08.87-1.77 1.06-.56.16-1.07.14-1.58-.03zm-11.63-4.66c.59 1.53 2.12 2.53 4.13 2.53 1.94 0 3.5-1.05 4.26-2.47-.29-.52-.61-.99-.95-1.4l-.4-.5-.41.5c-.36.43-.68.9-.96 1.43-.77 1.4-2.3 2.44-4.24 2.44-1.88 0-3.35-.94-4.12-2.33-.27-.49-.41-1.04-.41-1.62 0-.76.18-1.4.5-1.98.14-.25.29-.5.45-.75.27-.43.6-.81 1-.1.23-.26.46-.48.7-.71.2-.18.4-.35.6-.53z" />
                  </svg>
                  App Store
                </a>
                <a
                  href="#"
                  className="btn-outline border-white text-white hover:bg-white/10 px-6 py-3"
                  aria-label="تحميل من متجر جوجل"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12.54 5.3c.7-.83 1.47-1.55 2.24-2.16C11.56 2.3 8 3.33 8 6.53V11h-3V8.57c0-1.68 1.1-2.95 2.54-3.27zM7.5 17.37v2.12c2.86-.56 5.25-2.16 6.11-4.63h2.82c-1.17 3.24-4.32 5.4-7.93 5.4-5.13 0-9.27-4.14-9.27-9.27 0-1.53.44-2.95 1.2-4.15H1.66C.34 9.12 0 10.75 0 12.53c0 5.52 4.48 10 10 10 2.88 0 5.38-1.02 7.2-2.65-.12-.18-.23-.36-.35-.55H7.5z" />
                  </svg>
                  Google Play
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}