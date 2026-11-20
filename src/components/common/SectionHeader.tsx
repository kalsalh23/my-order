import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/utils'

interface SectionHeaderProps {
  title: string
  id?: string
  subtitle?: string
  action?: { label: string; href: string }
  className?: string
}

export function SectionHeader({ title, id, subtitle, action, className }: SectionHeaderProps) {
  return (
    <div className={cn('section-header', className)}>
      <div>
        <h2 id={id} className="heading-3">
          {title}
        </h2>
        {subtitle && <p className="text-body-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action && (
        <Link
          to={action.href}
          className="flex items-center gap-1 text-body-sm font-medium text-primary hover:text-primary-light transition-colors touch-manipulation whitespace-nowrap"
          aria-label={action.label}
        >
          {action.label}
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}