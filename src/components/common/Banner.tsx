import { Link } from 'react-router-dom'
import { cn, getImageUrl } from '@/utils'
import type { Banner as BannerType } from '@/types'

interface BannerProps {
  banner: BannerType
  className?: string
}

export function Banner({ banner, className }: BannerProps) {
  const imageUrl = getImageUrl(banner.image_url)

  return (
    <Link
      to={banner.target_url || '/products'}
      className={cn('block rounded-lg overflow-hidden', className)}
      aria-label={banner.title}
    >
      <img
        src={imageUrl}
        alt={banner.title}
        className="w-full h-auto object-cover transition-transform duration-300 hover:scale-[1.01]"
        loading="lazy"
      />
    </Link>
  )
}