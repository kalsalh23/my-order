import { Store } from 'lucide-react'
import { cn } from '@/utils'

interface SplashScreenProps {
  className?: string
}

export function SplashScreen({ className }: SplashScreenProps) {
  return (
    <div
      className={cn(
        'fixed inset-0 z-[1000] flex items-center justify-center',
        'bg-ivory',
        className
      )}
      role="status"
      aria-label="جاري التحميل"
      aria-live="polite"
    >
      <div className="text-center px-6">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary flex items-center justify-center animate-scale-in">
          <Store className="w-10 h-10 text-white" aria-hidden="true" />
        </div>
        <h1 className="text-display-md font-semibold text-charcoal mb-2 animate-slide-up" style={{ animationDelay: '100ms' }}>
          مندوب طيبة
        </h1>
        <p className="text-body-lg text-gray-600 mb-8 animate-slide-up" style={{ animationDelay: '200ms' }}>
          متجرك المحلي.. أقرب إليك
        </p>
        <div className="flex items-center justify-center gap-2 animate-pulse" style={{ animationDelay: '300ms' }} aria-hidden="true">
          <div className="w-2 h-2 rounded-full bg-primary/50" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/50" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 rounded-full bg-primary/50" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}