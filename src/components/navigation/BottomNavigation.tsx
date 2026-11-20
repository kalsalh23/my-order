import { Link, useLocation } from 'react-router-dom'
import { Home, Grid, Store, ShoppingCart, User, LayoutDashboard, Package, ShoppingBag, Bell, Settings } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils'

const customerNavItems = [
  { label: 'الرئيسية', href: '/', icon: Home, exact: true },
  { label: 'الأقسام', href: '/products', icon: Grid },
  { label: 'المتاجر', href: '/stores', icon: Store },
  { label: 'السلة', href: '/cart', icon: ShoppingCart },
  { label: 'حسابي', href: '/login', icon: User },
]

const vendorNavItems = [
  { label: 'الرئيسية', href: '/vendor/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'المنتجات', href: '/vendor/products', icon: Package },
  { label: 'الطلبات', href: '/vendor/orders', icon: ShoppingBag },
  { label: 'الإشعارات', href: '/vendor/notifications', icon: Bell },
  { label: 'حسابي', href: '/vendor/settings', icon: Settings },
]

export function BottomNavigation() {
  const location = useLocation()
  const { user } = useAuth()
  const isVendorRoute = location.pathname.startsWith('/vendor')
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (isAdminRoute) return null

  const navItems = isVendorRoute ? vendorNavItems : customerNavItems

  return (
    <nav
      className="nav-bottom"
      role="navigation"
      aria-label="التنقل الرئيسي"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
    >
      <div className="flex items-center justify-around">
        {navItems.map(({ label, href, icon: Icon, exact }) => {
          const isActive = exact
            ? location.pathname === href
            : location.pathname.startsWith(href) && href !== '/'

          return (
            <Link
              key={href}
              to={href}
              className={cn(
                'nav-item',
                isActive && 'nav-item-active'
              )}
              aria-current={isActive ? 'page' : undefined}
              aria-label={label}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}