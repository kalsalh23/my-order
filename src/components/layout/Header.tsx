import { Link, useLocation } from 'react-router-dom'
import { Menu, Search, ShoppingCart, Bell, User, LogOut, LayoutDashboard, Store } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn, formatPrice } from '@/utils'
import { useCart } from '@/hooks/useCart'
import { useNotifications } from '@/hooks/useNotifications'

export function Header() {
  const location = useLocation()
  const { user, signOut } = useAuth()
  const { itemCount } = useCart()
  const { unreadCount } = useNotifications()
  const isVendorRoute = location.pathname.startsWith('/vendor')
  const isAdminRoute = location.pathname.startsWith('/admin')

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  return (
    <header className="sticky top-0 z-sticky bg-white border-b border-gray-100">
      <div className="container-main">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link to={isVendorRoute ? '/vendor/dashboard' : isAdminRoute ? '/admin/dashboard' : '/'} className="flex items-center gap-2 shrink-0 touch-manipulation" aria-label="مندوب طيبة - الرئيسية">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Store className="w-5 h-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-heading-md font-semibold text-charcoal hidden sm:block">
              مندوب طيبة
            </span>
          </Link>

          <div className="flex-1 max-w-xl hidden md:block">
            <Link to="/products" className="relative w-full touch-manipulation">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="ابحث عن منتجات، متاجر، علامات تجارية..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg pr-10 pl-4 py-2.5 text-body-md placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-colors duration-fast"
                  aria-label="البحث عن المنتجات"
                  autoComplete="off"
                />
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/cart"
              className="relative p-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors duration-fast touch-manipulation"
              aria-label={`سلة التسوق، ${itemCount} عناصر`}
            >
              <ShoppingCart className="w-5 h-5" aria-hidden="true" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-caption font-bold rounded-full flex items-center justify-center">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>

            {user && (
              <>
                <Link
                  to="/vendor/notifications"
                  className="relative p-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors duration-fast touch-manipulation"
                  aria-label={`الإشعارات، ${unreadCount} غير مقروء`}
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 text-white text-caption font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>

                <div className="relative">
                  <button
                    className="flex items-center gap-2 p-2.5 text-gray-600 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors duration-fast touch-manipulation"
                    aria-expanded="false"
                    aria-haspopup="true"
                    aria-label="قائمة المستخدم"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <User className="w-5 h-5 text-primary" aria-hidden="true" />
                      )}
                    </div>
                    <span className="hidden sm:block text-body-sm font-medium text-charcoal">{user.full_name}</span>
                  </button>
                </div>
              </>
            )}

            {!user && (
              <Link
                to="/login"
                className="btn-primary px-4 py-2 text-body-md hidden sm:flex"
              >
                <User className="w-4 h-4" aria-hidden="true" />
                دخول
              </Link>
            )}
          </div>
        </div>

        <div className="md:hidden border-t border-gray-100 py-2">
          <Link
            to="/products"
            className="flex items-center gap-2 w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 touch-manipulation"
          >
            <Search className="w-5 h-5 text-gray-400" aria-hidden="true" />
            <span className="text-body-md text-gray-500 flex-1 text-right">ابحث عن منتجات...</span>
          </Link>
        </div>
      </div>
    </header>
  )
}