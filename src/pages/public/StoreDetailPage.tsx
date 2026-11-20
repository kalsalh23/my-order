import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, MapPin, Phone, Clock, Star, Package, Heart, Share2, Truck, Shield, Grid, List, Filter, Search, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/products/ProductCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SkeletonProductGrid } from '@/components/common/Skeletons'
import { cn, formatPrice, getImageUrl, getAvatarUrl } from '@/utils'
import type { Representative, Product } from '@/types'

export function StoreDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [store, setStore] = useState<Representative | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'products' | 'info' | 'reviews'>('products')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const pageSize = 20

  useEffect(() => {
    if (!slug) return

    const fetchStore = async () => {
      try {
        const { data: storeData, error: storeError } = await supabase
          .from('representatives')
          .select(`
            *,
            user:profiles(id, full_name, avatar_url, phone, email)
          `)
          .eq('store_slug', slug)
          .eq('is_visible', true)
          .single()

        if (storeError) throw storeError
        if (!storeData) throw new Error('Store not found')

        setStore(storeData)
      } catch (error) {
        console.error('Error fetching store:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStore()
  }, [slug])

  const fetchProducts = async (reset = false) => {
    if (!store || loading) return

    const currentPage = reset ? 1 : page
    setLoading(!reset)

    try {
      let query = supabase
        .from('products')
        .select(
          `
          *,
          representative:representatives(id, store_name, store_slug, logo_url),
          category:categories(id, name, slug)
        `
        )
        .eq('representative_id', store.id)
        .eq('is_active', true)

      switch (sortBy) {
        case 'price_asc':
          query = query.order('price', { ascending: true })
          break
        case 'price_desc':
          query = query.order('price', { ascending: false })
          break
        case 'popular':
          query = query.order('created_at', { ascending: false })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const from = (currentPage - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error } = await query

      if (error) throw error

      if (reset) {
        setProducts(data || [])
      } else {
        setProducts(prev => [...prev, ...(data || [])])
      }

      setHasMore((data?.length || 0) === pageSize)
      if (!reset) setPage(p => p + 1)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (store) {
      fetchProducts(true)
    }
  }, [store, sortBy])

  if (loading && !store) {
    return (
      <div className="container-main py-8">
        <div className="skeleton h-48 w-full rounded-lg mb-6" />
        <div className="flex items-center gap-4 mb-6">
          <div className="skeleton w-16 h-16 rounded-xl" />
          <div>
            <div className="skeleton h-6 w-48" />
            <div className="skeleton h-4 w-32" />
          </div>
        </div>
        <SkeletonProductGrid count={4} />
      </div>
    )
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="heading-2 text-charcoal mb-2">المتجر غير موجود</h1>
          <p className="text-body-md text-gray-500 mb-6">المتجر الذي تبحث عنه غير متاح أو تم إخفاؤه</p>
          <Link to="/stores" className="btn-primary">
            تصفح المتاجر
          </Link>
        </div>
      </div>
    )
  }

  const coverUrl = getImageUrl(store.cover_url)
  const logoUrl = getImageUrl(store.logo_url) || getAvatarUrl(store.logo_url, store.store_name)

  return (
    <div className="min-h-screen">
      {/* Store Header */}
      <header className="relative">
        {coverUrl !== '/images/placeholder-product.svg' ? (
          <div className="relative h-64 md:h-80">
            <img
              src={coverUrl}
              alt=""
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>
        ) : (
          <div className="h-64 md:h-80 bg-gradient-to-br from-primary/20 to-accent/20" />
        )}

        <div className="container-main relative -mt-16 pb-6">
          <Link to="/stores" className="inline-flex items-center gap-1.5 text-white/90 hover:text-white mb-4 touch-manipulation">
            <ChevronLeft className="w-4 h-4" />
            المتاجر
          </Link>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <img
              src={logoUrl}
              alt=""
              className="w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 border-white object-cover shadow-xl"
            />
            <div className="flex-1 text-white">
              <h1 className="text-display-sm font-semibold">{store.store_name}</h1>
              <p className="text-body-md text-white/80 mt-1">{store.user?.full_name || 'مندوب طيبة'}</p>
              <div className="flex flex-wrap items-center gap-4 mt-3 text-body-sm">
                {store.location && (
                  <span className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full">
                    <MapPin className="w-4 h-4" />
                    {store.location}
                  </span>
                )}
                {store.phone && (
                  <a href={`tel:${store.phone}`} className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full hover:bg-white/20 transition-colors">
                    <Phone className="w-4 h-4" />
                    {store.phone}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="container-main">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide" role="tablist" aria-label="أقسام المتجر">
            <button
              role="tab"
              aria-selected={activeTab === 'products'}
              aria-controls="products-panel"
              onClick={() => setActiveTab('products')}
              className={cn(
                'px-4 py-3 text-body-sm font-medium whitespace-nowrap rounded-t-lg touch-manipulation transition-colors',
                activeTab === 'products'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Package className="w-4 h-4 inline-block mr-1" />
              المنتجات
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'info'}
              aria-controls="info-panel"
              onClick={() => setActiveTab('info')}
              className={cn(
                'px-4 py-3 text-body-sm font-medium whitespace-nowrap rounded-t-lg touch-manipulation transition-colors',
                activeTab === 'info'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              معلومات
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'reviews'}
              aria-controls="reviews-panel"
              onClick={() => setActiveTab('reviews')}
              className={cn(
                'px-4 py-3 text-body-sm font-medium whitespace-nowrap rounded-t-lg touch-manipulation transition-colors',
                activeTab === 'reviews'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Star className="w-4 h-4 inline-block mr-1 fill-current text-amber-500" />
              التقييمات
            </button>
          </nav>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-20" hidden={activeTab !== 'products'}>
        <div className="container-main py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-body-sm text-gray-500">ترتيب:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as typeof sortBy); fetchProducts(true) }}
                className="input w-auto py-1.5 text-body-sm appearance-none pr-8"
              >
                <option value="newest">الأحدث</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="popular">الأكثر مبيعاً</option>
              </select>
            </div>
            <div className="flex items-center gap-2" role="group" aria-label="وضع العرض">
              <button
                onClick={() => setViewMode('grid')}
                className={cn('p-2 text-gray-500 hover:text-primary', viewMode === 'grid' && 'text-primary bg-primary/5')}
                aria-pressed={viewMode === 'grid'}
                aria-label="عرض شبكي"
              >
                <Grid className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn('p-2 text-gray-500 hover:text-primary', viewMode === 'list' && 'text-primary bg-primary/5')}
                aria-pressed={viewMode === 'list'}
                aria-label="عرض القائمة"
              >
                <List className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Panels */}
      <main className="container-main py-6">
        {/* Products Tab */}
        <div
          id="products-panel"
          role="tabpanel"
          aria-labelledby="products-tab"
          hidden={activeTab !== 'products'}
        >
          {products.length === 0 ? (
            <div className="text-center py-16">
              <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <h2 className="heading-3 text-charcoal mb-2">لا توجد منتجات</h2>
              <p className="text-body-md text-gray-500">هذا المتجر لم يقم بإضافة منتجات بعد</p>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  'gap-4',
                  viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'flex flex-col'
                )}
                role="list"
                aria-label={`منتجات متجر ${store.store_name}`}
              >
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} variant={viewMode === 'list' ? 'compact' : 'default'} showStore={false} />
                ))}
              </div>

              {hasMore && (
                <div className="text-center mt-8">
                  <button
                    onClick={() => fetchProducts(false)}
                    disabled={loading}
                    className="btn-secondary w-full sm:w-auto"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        جاري التحميل...
                      </>
                    ) : (
                      'عرض المزيد'
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Tab */}
        <div
          id="info-panel"
          role="tabpanel"
          aria-labelledby="info-tab"
          hidden={activeTab !== 'info'}
        >
          <div className="max-w-2xl space-y-6">
            {store.description && (
              <div className="card p-6">
                <h2 className="heading-4 mb-3">حول المتجر</h2>
                <p className="text-body-md text-gray-700 whitespace-pre-wrap">{store.description}</p>
              </div>
            )}

            <div className="card p-6">
              <h2 className="heading-4 mb-4">معلومات التواصل</h2>
              <dl className="space-y-4">
                {store.phone && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <dt className="text-body-xs text-gray-500">الهاتف</dt>
                      <dd className="text-body-md text-charcoal">
                        <a href={`tel:${store.phone}`} className="hover:text-primary transition-colors">{store.phone}</a>
                      </dd>
                    </div>
                  </div>
                )}
                {store.user?.email && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <dt className="text-body-xs text-gray-500">البريد الإلكتروني</dt>
                      <dd className="text-body-md text-charcoal">{store.user.email}</dd>
                    </div>
                  </div>
                )}
                {store.location && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <dt className="text-body-xs text-gray-500">الموقع</dt>
                      <dd className="text-body-md text-charcoal">{store.location}</dd>
                    </div>
                  </div>
                )}
              </dl>
            </div>

            <div className="card p-6">
              <h2 className="heading-4 mb-4">سياسات المتجر</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-gray-50">
                  <Truck className="w-6 h-6 text-primary mb-2" />
                  <h3 className="text-body-sm font-medium text-charcoal">التوصيل</h3>
                  <p className="text-body-xs text-gray-500 mt-1">توصيل سريع خلال 24-48 ساعة</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <Shield className="w-6 h-6 text-primary mb-2" />
                  <h3 className="text-body-sm font-medium text-charcoal">الاسترجاع</h3>
                  <p className="text-body-xs text-gray-500 mt-1">إمكانية الاسترجاع خلال 14 يوم</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <svg className="w-6 h-6 text-primary mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <h3 className="text-body-sm font-medium text-charcoal">الضمان</h3>
                  <p className="text-body-xs text-gray-500 mt-1">ضمان جودة على جميع المنتجات</p>
                </div>
                <div className="p-4 rounded-lg bg-gray-50">
                  <Clock className="w-6 h-6 text-primary mb-2" />
                  <h3 className="text-body-sm font-medium text-charcoal">ساعات العمل</h3>
                  <p className="text-body-xs text-gray-500 mt-1">يومياً: 9 صباحاً - 11 مساءً</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Tab */}
        <div
          id="reviews-panel"
          role="tabpanel"
          aria-labelledby="reviews-tab"
          hidden={activeTab !== 'reviews'}
        >
          <div className="max-w-2xl">
            <div className="card p-6 text-center mb-6">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Star className="w-8 h-8 fill-amber-500 text-amber-500" />
                <span className="text-display-md font-bold text-charcoal">4.8</span>
              </div>
              <p className="text-body-md text-gray-500 mb-4">ممتاز - بناءً على 124 تقييم</p>
              <div className="flex justify-center gap-1 mt-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-6 h-6 fill-amber-400 text-amber-400" />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {[
                { name: 'أحمد محمد', date: 'منذ أسبوع', rating: 5, comment: 'متجر ممتاز، منتجات عالية الجودة وتوصيل سريع جداً. أنصح به بشدة.' },
                { name: 'فاطمة علي', date: 'منذ أسبوعين', rating: 5, comment: 'تعامل راقٍ ومنتجات طازجة. السعر مناسب والخدمة ممتازة.' },
                { name: 'محمد سالم', date: 'منذ شهر', rating: 4, comment: 'جيد جداً، لكن التوصيل تأخر يوماً واحداً. بشكل عام تجربة جيدة.' },
              ].map((review, index) => (
                <article key={index} className="card p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {review.name.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-body-md font-medium text-charcoal">{review.name}</h4>
                          <p className="text-body-xs text-gray-500">{review.date}</p>
                        </div>
                        <div className="flex gap-0.5" aria-label={`تقييم ${review.rating} من 5`}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={cn(
                                'w-4 h-4',
                                star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-body-sm text-gray-700 mt-2">{review.comment}</p>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <div className="text-center mt-6">
              <button className="btn-secondary">عرض المزيد من التقييمات</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}