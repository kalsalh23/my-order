import { Link } from 'react-router-dom'
import { cn, getImageUrl } from '@/utils'
import type { Category } from '@/types'

interface CategoryCardProps {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  const imageUrl = getImageUrl(category.image_url)

  return (
    <Link
      to={`/categories/${category.slug}`}
      className="flex flex-col items-center gap-1 p-1.5 rounded-lg bg-white border border-gray-100 hover:border-primary/50 hover:bg-primary/5 transition-colors duration-fast touch-manipulation group"
      aria-label={`قسم ${category.name}`}
    >
      <div className="relative w-full aspect-square rounded-md overflow-hidden bg-gray-50">
        {imageUrl !== '/images/placeholder-product.svg' ? (
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>
      <span className="text-body-xs font-medium text-charcoal text-center line-clamp-1 w-full">
        {category.name}
      </span>
    </Link>
  )
}