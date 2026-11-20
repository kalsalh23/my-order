import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Grid, List, MapPin, Search, Filter } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StoreCard } from '@/components/products/StoreCard'
import { SectionHeader } from '@/components/common/SectionHeader'
import { SkeletonStoreCard } from '@/components/common/Skeletons'
import { cn } from '@/utils'
import type { Representative } from '@/types'

export function StoresPage() {
  const [stores, setStores] = useState<Representative[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [locations, setLocations] = useState<string[]>([])

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true)
      try {
        let query = supabase
          .from('representatives')
          .select(
            `
            *,
            user:profiles(id, full_name, avatar_url)
          `,
            { count: 'exact' }
          )
          .eq('is_visible', true)

        if (searchQuery) {
          query = query.ilike('store_name', `%${searchQuery}%`)
        }

        const { data, count } = await query
          .order('created_at', { ascending: false })
          .range((page - 1) * 12, page * 12 - 1)

        if (data) {
          if (page === 1) setStores(data)
          else setStores((prev) => [...prev, ...data])
        }
        if (count !== null) setTotalCount(count)

        // Fetch unique locations
        const { data: locData } = await supabase
          .from('representatives')
          .select('location')
          .eq('is_visible', true)
          .not('location', 'is', null)
        if (locData) {
          const uniqueLocations = [...new Set(locData.map((l) => l.location).filter(Boolean))]
          setLocations(uniqueLocations as string[])
        }
      } catch (error) {
        console.error('Error fetching stores:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStores()
  }, [page, searchQuery])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
  }

  const loadMore = () => {
    setPage((p) => p + 1)
  }

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="container-main py-6">
          <h1 className="heading-2">المتاجر</h1>
          <p className="text-body-md text-gray-500 mt-1">{totalCount} متجر متاح</p>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="container-main py-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <label htmlFor="store-search" className="sr-only">البحث عن متجر</label>
              <input
                id="store-search"
                type="search"
                placeholder="ابحث عن متجر بالاسم..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>

            <div className="relative min-w-[160px]">
              <label htmlFor="location-filter" className="sr-only">الموقع</label>
              <select
                id="location-filter"
                value={selectedLocation || ''}
                onChange={(e) => setSelectedLocation(e.target.value || null)}
                className="input pr-10 appearance-none"
              >
                <option value="">جميع المواقع</option>
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
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
          </form>
        </div>
      </div>

      {/* Stores Grid */}
      <main className="container-main py-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonStoreCard key={i} />)
        ) : stores.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-20 h-20 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h2 className="heading-3 text-charcoal mb-2">لا توجد متاجر</h2>
            <p className="text-body-md text-gray-500 mb-6">
              {searchQuery ? 'جرب البحث بكلمات مختلفة' : 'لا توجد متاجر متاحة حالياً'}
            </p>
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="btn-primary">
                مسح البحث
              </button>
            )}
          </div>
        ) : (
          <>
            <div
              className={cn(
                'gap-4',
                viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-col'
              )}
              role="list"
              aria-label="قائمة المتاجر"
            >
              {stores.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>

            {stores.length < totalCount && (
              <div className="text-center mt-8">
                <button
                  onClick={loadMore}
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
                    `عرض المزيد (${stores.length} من ${totalCount})`
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