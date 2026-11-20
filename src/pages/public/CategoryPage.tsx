import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, Grid, List, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/products/ProductCard'
import { CategoryCard } from '@/components/products/CategoryCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SkeletonProductGrid, SkeletonCategoryCard } from '@/components/common/Skeletons'
import { cn, getImageUrl } from '@/utils'
import type { Category, Product } from '@/types'

export function CategoryPage() {
  const { slug } = useParams<{ slug: string }>()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [subCategories, setSubCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('newest')

  useEffect(() => {
    if (!slug) return

    const fetchData = async () => {
      try {
        const [catRes, productsRes, subCatsRes] = await Promise.all([
          supabase.from('categories').select('*').eq('slug', slug).single(),
          supabase
            .from('products')
            .select(
              `
              *,
              representative:representatives(id, store_name, store_slug, logo_url),
              category:categories(id, name, slug)
            `
            )
            .eq('category_id', (await supabase.from('categories').select('id').eq('slug', slug).single()).data?.id)
            .eq('is_active', true)
            .eq('representative.is_visible', true)
            .order('created_at', { ascending: false })
            .limit(20),
          supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        ])

        if (catRes.data) setCategory(catRes.data)
        if (productsRes.data) {
          setProducts(productsRes.data)
          setTotalCount(productsRes.count || 0)
        }
        if (subCatsRes.data) setSubCategories(subCatsRes.data.filter((c) => c.id !== catRes.data?.id))
      } catch (error) {
        console.error('Error fetching category:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  const fetchMoreProducts = async () => {
    if (!category || loadingMore) return
    setLoadingMore(true)
    try {
      const { data, count } = await supabase
        .from('products')
        .select(
          `
          *,
          representative:representatives(id, store_name, store_slug, logo_url),
          category:categories(id, name, slug)
        `,
          { count: 'exact' }
        )
        .eq('category_id', category.id)
        .eq('is_active', true)
        .eq('representative.is_visible', true)
        .order('created_at', { ascending: false })
        .range(page * 20, (page + 1) * 20 - 1)

      if (data) setProducts((prev) => [...prev, ...data])
      if (count !== null) setTotalCount(count)
      setPage((p) => p + 1)
    } catch (error) {
      console.error('Error fetching more products:', error)
    } finally {
      setLoadingMore(false)
    }
  }

  if (loading) {
    return (
      <div className="container-main py-8">
        <div className="skeleton h-10 w-64 rounded mb-6" />
        <SkeletonCategoryGrid count={4} />
        <SkeletonProductGrid count={8} />
      </div>
    )
  }

  if (!category) {
    return (
      <div className="container-main py-16 text-center">
        <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h1 className="heading-2 text-charcoal mb-2">القسم غير موجود</h1>
        <Link to="/products" className="btn-primary">تصفح جميع المنتجات</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Category Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container-main py-6">
          <Link to="/products" className="inline-flex items-center gap-1.5 text-body-sm text-gray-500 hover:text-primary mb-4 touch-manipulation">
            <ChevronLeft className="w-4 h-4" />
            جميع المنتجات
          </Link>
          <div className="flex items-start justify-between gap-4">
            <div>
              {category.image_url && (
                <img
                  src={getImageUrl(category.image_url)}
                  alt=""
                  className="w-20 h-20 rounded-xl object-cover mb-3"
                />
              )}
              <h1 className="heading-2 text-charcoal">{category.name}</h1>
              <p className="text-body-md text-gray-500 mt-1">{totalCount} منتج</p>
            </div>
          </div>
        </div>
      </header>

      {/* Subcategories */}
      {subCategories.length > 0 && (
        <div className="bg-white border-b border-gray-100 py-4">
          <div className="container-main">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" role="list" aria-label="الأقسام الفرعية">
              {subCategories.map((subCat) => (
                <Link
                  key={subCat.id}
                  to={`/categories/${subCat.slug}`}
                  className="flex-shrink-0 px-4 py-2 rounded-full bg-gray-50 text-gray-600 hover:bg-gray-100 text-body-sm font-medium whitespace-nowrap touch-manipulation"
                  role="listitem"
                >
                  {subCat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="container-main py-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-body-sm text-gray-500">ترتيب:</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
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

      {/* Products */}
      <main className="container-main py-6">
        {loading ? (
          <SkeletonProductGrid count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="heading-3 text-charcoal mb-2">لا توجد منتجات في هذا القسم</h2>
            <p className="text-body-md text-gray-500">سيتم إضافة منتجات قريباً</p>
          </div>
        ) : (
          <>
            <div
              className={cn(
                'gap-4',
                viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'flex flex-col'
              )}
              role="list"
              aria-label={`منتجات قسم ${category.name}`}
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant={viewMode === 'list' ? 'compact' : 'default'}
                />
              ))}
            </div>

            {products.length < totalCount && (
              <div className="text-center mt-8">
                <button
                  onClick={fetchMoreProducts}
                  disabled={loadingMore}
                  className="btn-secondary w-full sm:w-auto"
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      جاري التحميل...
                    </>
                  ) : (
                    `عرض المزيد (${products.length} من ${totalCount})`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}