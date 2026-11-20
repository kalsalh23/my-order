import { cn } from '@/utils'

export function SkeletonProductCard() {
  return (
    <article className="card overflow-hidden" role="listitem" aria-label="جاري تحميل المنتج">
      <div className="skeleton-image" aria-hidden="true" />
      <div className="p-3 space-y-2">
        <div className="skeleton-text w-3/4" aria-hidden="true" />
        <div className="skeleton-text w-1/2" aria-hidden="true" />
        <div className="flex items-center gap-2">
          <div className="skeleton h-5 w-20 rounded" aria-hidden="true" />
          <div className="skeleton h-5 w-16 rounded" aria-hidden="true" />
        </div>
      </div>
      <div className="p-3 border-t border-gray-100">
        <div className="skeleton h-10 w-full rounded-md" aria-hidden="true" />
      </div>
    </article>
  )
}

export function SkeletonCategoryCard() {
  return (
    <div className="flex flex-col items-center gap-2 p-3 rounded-lg bg-white border border-gray-100" role="listitem" aria-label="جاري تحميل القسم">
      <div className="skeleton aspect-square w-full rounded-lg" aria-hidden="true" />
      <div className="skeleton h-4 w-20 rounded" aria-hidden="true" />
    </div>
  )
}

export function SkeletonStoreCard() {
  return (
    <div className="card card-hover overflow-hidden" role="listitem" aria-label="جاري تحميل المتجر">
      <div className="skeleton h-32 w-full" aria-hidden="true" />
      <div className="p-4 relative -mt-6">
        <div className="flex items-start gap-3">
          <div className="skeleton w-16 h-16 rounded-xl" aria-hidden="true" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-5 w-32 rounded" aria-hidden="true" />
            <div className="skeleton h-4 w-24 rounded" aria-hidden="true" />
            <div className="skeleton h-3 w-20 rounded" aria-hidden="true" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonBanner() {
  return (
    <div className="skeleton aspect-[16/9] w-full rounded-lg" aria-hidden="true" />
  )
}

export function SkeletonProductGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4" role="list" aria-label="جاري تحميل المنتجات">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonCategoryGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3" role="list" aria-label="جاري تحميل الأقسام">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCategoryCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonStoreGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4" role="list" aria-label="جاري تحميل المتاجر">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStoreCard key={i} />
      ))}
    </div>
  )
}

export function SkeletonPage({ title = true, content = true }: { title?: boolean; content?: boolean }) {
  return (
    <div className="container-main py-8 space-y-6" role="status" aria-label="جاري تحميل الصفحة">
      {title && (
        <div className="flex items-center justify-between">
          <div className="skeleton h-7 w-48 rounded" aria-hidden="true" />
          <div className="skeleton h-8 w-24 rounded" aria-hidden="true" />
        </div>
      )}
      {content && (
        <SkeletonProductGrid count={8} />
      )}
    </div>
  )
}