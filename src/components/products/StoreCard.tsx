import { Link } from 'react-router-dom'
import { MapPin, Star, Package } from 'lucide-react'
import { cn, getImageUrl, getAvatarUrl } from '@/utils'
import type { Representative } from '@/types'

interface StoreCardProps {
  store: Representative
}

export function StoreCard({ store }: StoreCardProps) {
  const logoUrl = getImageUrl(store.logo_url) || getAvatarUrl(store.logo_url, store.store_name)
  const coverUrl = getImageUrl(store.cover_url)

  return (
    <Link
      to={`/stores/${store.store_slug}`}
      className="card card-hover overflow-hidden touch-manipulation group"
      aria-label={`متجر ${store.store_name}`}
    >
      {coverUrl !== '/images/placeholder-product.svg' ? (
        <div className="relative h-32 overflow-hidden">
          <img
            src={coverUrl}
            alt=""
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      ) : (
        <div className="relative h-32 bg-gradient-to-br from-primary/10 to-accent/10" />
      )}

      <div className="p-4 relative -mt-6">
        <div className="flex items-start gap-3">
          <div className="relative flex-shrink-0">
            <img
              src={logoUrl}
              alt=""
              className="w-16 h-16 rounded-xl border-3 border-white object-cover shadow-lg"
              loading="lazy"
            />
            {store.is_visible && (
              <span className="absolute bottom-0 left-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full" aria-label="متجر نشط" />
            )}
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <h3 className="text-body-md font-semibold text-charcoal truncate group-hover:text-primary transition-colors">
              {store.store_name}
            </h3>
            {store.description && (
              <p className="text-body-xs text-gray-500 line-clamp-1 mt-0.5">{store.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2 text-body-xs text-gray-400">
              {store.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" aria-hidden="true" />
                  {store.location}
                </span>
              )}
              {store.products_count !== undefined && (
                <span className="flex items-center gap-1">
                  <Package className="w-3 h-3" aria-hidden="true" />
                  {store.products_count} منتج
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}