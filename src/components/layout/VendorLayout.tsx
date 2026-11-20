import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Package, ShoppingBag, Bell, Settings, LogOut, Store, User } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils'

const vendorNavItems = [
  { path: '/vendor/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { path: '/vendor/products', label: 'المنتجات', icon: Package },
  { path: '/vendor/orders', label: 'الطلبات', icon: ShoppingBag },
  { path: '/vendor/notifications', label: 'الإشعارات', icon: Bell },
  { path: '/vendor/settings', label: 'الإعدادات', icon: Settings },
]

export function VendorLayout() {
  const location = useLocation()
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
        <div className="container-main">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/vendor/dashboard" className="flex items-center gap-2 touch-manipulation">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Store className="w-5 h-5 text-white" />
                </div>
                <span className="text-heading-md font-semibold text-charcoal">مندوب طيبة</span>
              </Link>
              <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-body-xs font-medium">
                <User className="w-3.5 h-3.5" />
                لوحة المندوب
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-body-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.full_name}</span>
              </div>
              <button
                onClick={handleSignOut}
                className="btn-ghost p-2"
                aria-label="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Desktop */}
        <aside className="hidden lg:block w-64 bg-white border-l border-gray-100 flex flex-col">
          <nav className="flex-1 p-4 space-y-1" role="navigation" aria-label="التنقل الرئيسي للمندوب">
            {vendorNavItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path)
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-body-sm font-medium transition-colors touch-manipulation',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-charcoal'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {item.label}
                </NavLink>
              )
            })}
          </nav>

          <div className="p-4 border-t border-gray-100">
            <Link to="/" className="btn-secondary w-full justify-center gap-2 touch-manipulation">
              <Store className="w-4 h-4" />
              عرض المتجر
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50" role="navigation" aria-label="التنقل السفلي">
        <div className="flex items-center justify-around h-16 pb-safe">
          {vendorNavItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 text-body-xs font-medium touch-manipulation',
                  isActive ? 'text-primary' : 'text-gray-500'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </nav>
    </div>
  )
}