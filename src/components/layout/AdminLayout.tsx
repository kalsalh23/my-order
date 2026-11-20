import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Package, ShoppingBag, Grid, Megaphone, Settings, LogOut, Shield, Store } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils'

const adminNavItems = [
  { path: '/admin/dashboard', label: 'الرئيسية', icon: LayoutDashboard },
  { path: '/admin/representatives', label: 'المندوبون', icon: Users },
  { path: '/admin/products', label: 'المنتجات', icon: Package },
  { path: '/admin/orders', label: 'الطلبات', icon: ShoppingBag },
  { path: '/admin/categories', label: 'الأقسام', icon: Grid },
  { path: '/admin/banners', label: 'البانرات', icon: Store },
  { path: '/admin/notifications', label: 'الإشعارات', icon: Megaphone },
  { path: '/admin/settings', label: 'الإعدادات', icon: Settings },
]

export function AdminLayout() {
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
              <Link to="/admin/dashboard" className="flex items-center gap-2 touch-manipulation">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-heading-md font-semibold text-charcoal">مندوب طيبة</span>
                <span className="px-2 py-0.5 text-caption bg-red-100 text-red-700 rounded">إدارة</span>
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 text-body-sm text-gray-600">
                <Shield className="w-4 h-4" />
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
          <nav className="flex-1 p-4 space-y-1" role="navigation" aria-label="التنقل الرئيسي للإدارة">
            {adminNavItems.map((item) => {
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
    </div>
  )
}