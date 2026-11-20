import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Filter, ChevronDown, X, Grid, List } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { ProductCard } from '@/components/products/ProductCard'
import { CategoryCard } from '@/components/products/CategoryCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SkeletonProductGrid, SkeletonCategoryGrid } from '@/components/common/Skeletons'
import { cn, formatPrice, getImageUrl } from '@/utils'
import type { Product, Category, ProductFilters } from '@/types'

const SORT_OPTIONS = [
  { value: 'newest', label: 'الأحدث' },
  { value: 'price_asc', label: 'السعر: من الأقل للأعلى' },
  { value: 'price_desc', label: 'السعر: من الأعلى للأقل' },
  { value: 'popular', label: 'الأكثر مبيعاً' },
] as const

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    page_size: 20,
    sort_by: 'newest',
  })
  const [totalCount, setTotalCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const fetchProducts = useCallback(async (reset = false) => {
    const page = reset ? 1 : filters.page
    setLoading(reset ? true : false)
    setLoadingMore(!reset)

    try {
      let query = supabase
        .from('products')
        .select(
          `
          *,
          representative:representatives(id, store_name, store_slug, logo_url, is_visible),
          category:categories(id, name, slug)
        `,
          { count: 'exact' }
        )
        .eq('is_active', true)
        .eq('representative.is_visible', true)

      if (filters.query) {
        query = query.ilike('name', `%${filters.query}%`)
      }
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      if (filters.min_price !== undefined) {
        query = query.gte('price', filters.min_price)
      }
      if (filters.max_price !== undefined) {
        query = query.lte('price', filters.max_price)
      }

      switch (filters.sort_by) {
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

      const from = (page - 1) * (filters.page_size || 20)
      const to = from + (filters.page_size || 20) - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) throw error

      if (reset) {
        setProducts(data || [])
      } else {
        setProducts((prev) => [...prev, ...(data || [])])
      }
      setTotalCount(count || 0)
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [filters])

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
    if (data) setCategories(data)
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts(true)
  }, [filters.query, filters.category_id, filters.min_price, filters.max_price, filters.sort_by])

  const handleFilterChange = (newFilters: Partial<ProductFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }))
  }

  const handleLoadMore = () => {
    setFilters((prev) => ({ ...prev, page: prev.page + 1 }))
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      page_size: 20,
      sort_by: 'newest',
    })
    setSelectedCategory(null)
  }

  const hasActiveFilters = filters.query || filters.category_id || filters.min_price || filters.max_price

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="container-main py-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="heading-2">جميع المنتجات</h1>
              <p className="text-body-sm text-gray-500 mt-1">
                {totalCount} منتج متاح
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'btn-secondary btn-sm gap-2',
                  hasActiveFilters && 'bg-primary/5 border-primary text-primary'
                )}
                aria-expanded={showFilters}
                aria-controls="filters-panel"
              >
                <Filter className="w-4 h-4" />
                <span>تصفية</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 bg-red-500 rounded-full" aria-label="فلاتر نشطة" />
                )}
              </button>
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden" role="group" aria-label="وضع العرض">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'p-2 text-gray-500 hover:text-primary transition-colors touch-manipulation',
                    viewMode === 'grid' && 'text-primary bg-primary/5'
                  )}
                  aria-pressed={viewMode === 'grid'}
                  aria-label="عرض شبكي"
                >
                  <Grid className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'p-2 text-gray-500 hover:text-primary transition-colors touch-manipulation',
                    viewMode === 'list' && 'text-primary bg-primary/5'
                  )}
                  aria-pressed={viewMode === 'list'}
                  aria-label="عرض القائمة"
                >
                  <List className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div
            id="filters-panel"
            className="border-t border-gray-100 pt-4 animate-slide-down"
            role="region"
            aria-label="خيارات التصفية"
          >
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px] relative">
                <label htmlFor="search-input" className="sr-only">البحث</label>
                <input
                  id="search-input"
                  type="search"
                  placeholder="ابحث بالاسم..."
                  value={filters.query || ''}
                  onChange={(e) => handleFilterChange({ query: e.target.value || undefined })}
                  className="input pl-10"
                />
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="relative min-w-[160px]">
                <label htmlFor="category-filter" className="sr-only">القسم</label>
                <select
                  id="category-filter"
                  value={filters.category_id || ''}
                  onChange={(e) => handleFilterChange({ category_id: e.target.value || undefined })}
                  className="input pr-10 appearance-none"
                >
                  <option value="">جميع الأقسام</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative min-w-[160px]">
                <label htmlFor="sort-filter" className="sr-only">الترتيب</label>
                <select
                  id="sort-filter"
                  value={filters.sort_by || 'newest'}
                  onChange={(e) => handleFilterChange({ sort_by: e.target.value as ProductFilters['sort_by'] })}
                  className="input pr-10 appearance-none"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="flex items-center gap-2 min-w-[200px]">
                <label htmlFor="min-price" className="sr-only">الحد الأدنى للسعر</label>
                <input
                  id="min-price"
                  type="number"
                  placeholder="من"
                  value={filters.min_price || ''}
                  onChange={(e) => handleFilterChange({ min_price: e.target.value ? Number(e.target.value) : undefined })}
                  className="input w-24"
                  min="0"
                  step="1"
                />
                <span className="text-gray-400">-</span>
                <label htmlFor="max-price" className="sr-only">الحد الأقصى للسعر</label>
                <input
                  id="max-price"
                  type="number"
                  placeholder="إلى"
                  value={filters.max_price || ''}
                  onChange={(e) => handleFilterChange({ max_price: e.target.value ? Number(e.target.value) : undefined })}
                  className="input w-24"
                  min="0"
                  step="1"
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="btn-ghost text-red-600 hover:bg-red-50"
                  aria-label="مسح جميع الفلاتر"
                >
                  <X className="w-4 h-4" />
                  مسح الفلاتر
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Categories Bar */}
      {categories.length > 0 && (
        <div className="bg-white border-b border-gray-100 sticky top-16 z-30" role="navigation" aria-label="أقسام المنتجات">
          <div className="container-main py-3">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2" role="list">
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  handleFilterChange({ category_id: undefined })
                }}
                className={cn(
                  'px-4 py-2 rounded-full text-body-sm font-medium whitespace-nowrap touch-manipulation transition-colors',
                  !selectedCategory && !filters.category_id
                    ? 'bg-primary text-white'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                )}
                role="listitem"
                aria-pressed={!selectedCategory && !filters.category_id}
              >
                الكل
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => {
                    setSelectedCategory(category.id)
                    handleFilterChange({ category_id: category.id })
                  }}
                  className={cn(
                    'px-4 py-2 rounded-full text-body-sm font-medium whitespace-nowrap touch-manipulation transition-colors',
                    (selectedCategory === category.id || filters.category_id === category.id)
                      ? 'bg-primary text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  )}
                  role="listitem"
                  aria-pressed={selectedCategory === category.id || filters.category_id === category.id}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <main className="container-main py-6">
        {loading ? (
          <SkeletonProductGrid count={8} />
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h2 className="heading-3 text-charcoal mb-2">لا توجد منتجات</h2>
            <p className="text-body-md text-gray-500 mb-6">
              {hasActiveFilters ? 'جرب تعديل الفلاتر لعرض المزيد من المنتجات' : 'لا توجد منتجات متاحة حالياً'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="btn-primary">
                مسح الفلاتر
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={cn(
                'gap-4',
                viewMode === 'grid' ? 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'flex flex-col'
              )}
              role="list"
              aria-label="قائمة المنتجات"
            >
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant={viewMode === 'list' ? 'compact' : 'default'}
                />
              ))}
            </div>

            {(products.length < totalCount || loadingMore) && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
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