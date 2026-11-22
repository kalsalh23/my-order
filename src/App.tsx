import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { VendorLayout } from '@/components/layout/VendorLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { SplashScreen } from '@/components/common/SplashScreen'
import { HomePage } from '@/pages/public/HomePage'
import { ProductsPage } from '@/pages/public/ProductsPage'
import { ProductDetailPage } from '@/pages/public/ProductDetailPage'
import { CategoryPage } from '@/pages/public/CategoryPage'
import { StoresPage } from '@/pages/public/StoresPage'
import { StoreDetailPage } from '@/pages/public/StoreDetailPage'
import { CartPage } from '@/pages/public/CartPage'
import { CheckoutPage } from '@/pages/public/CheckoutPage'
import { OrderSuccessPage } from '@/pages/public/OrderSuccessPage'
import { TrackOrderPage } from '@/pages/public/TrackOrderPage'
import { LoginPage } from '@/pages/public/LoginPage'
import { PrivacyPage } from '@/pages/public/PrivacyPage'
import { TermsPage } from '@/pages/public/TermsPage'
import { VendorDashboardPage } from '@/pages/vendor/DashboardPage'
import { VendorProfilePage } from '@/pages/vendor/ProfilePage'
import { VendorProductsPage } from '@/pages/vendor/ProductsPage'
import { VendorProductFormPage } from '@/pages/vendor/ProductFormPage'
import { VendorOrdersPage } from '@/pages/vendor/OrdersPage'
import { VendorOrderDetailPage } from '@/pages/vendor/OrderDetailPage'
import { VendorNotificationsPage } from '@/pages/vendor/NotificationsPage'
import { VendorSettingsPage } from '@/pages/vendor/SettingsPage'
import { AdminDashboardPage } from '@/pages/admin/DashboardPage'
import { AdminRepresentativesPage } from '@/pages/admin/RepresentativesPage'
import { AdminRepresentativeFormPage } from '@/pages/admin/RepresentativeFormPage'
import { AdminRepresentativeDetailPage } from '@/pages/admin/RepresentativeDetailPage'
import { AdminProductsPage } from '@/pages/admin/ProductsPage'
import { AdminOrdersPage } from '@/pages/admin/OrdersPage'
import { AdminCategoriesPage } from '@/pages/admin/CategoriesPage'
import { AdminBannersPage } from '@/pages/admin/BannersPage'
import { AdminNotificationsPage } from '@/pages/admin/NotificationsPage'
import { AdminSettingsPage } from '@/pages/admin/SettingsPage'
import { NotFoundPage } from '@/pages/public/NotFoundPage'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || loading) {
    return <SplashScreen />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailPage />} />
        <Route path="categories/:slug" element={<CategoryPage />} />
        <Route path="stores" element={<StoresPage />} />
        <Route path="stores/:slug" element={<StoreDetailPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order-success/:orderNumber" element={<OrderSuccessPage />} />
        <Route path="track-order" element={<TrackOrderPage />} />
        <Route path="login" element={<AuthLayout><LoginPage /></AuthLayout>} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="terms" element={<TermsPage />} />
      </Route>

      <Route
        path="vendor/*"
        element={
          <ProtectedRoute allowedRoles={['representative', 'admin']}>
            <VendorLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<VendorDashboardPage />} />
        <Route path="profile" element={<VendorProfilePage />} />
        <Route path="products" element={<VendorProductsPage />} />
        <Route path="products/new" element={<VendorProductFormPage />} />
        <Route path="products/:id/edit" element={<VendorProductFormPage />} />
        <Route path="orders" element={<VendorOrdersPage />} />
        <Route path="orders/:id" element={<VendorOrderDetailPage />} />
        <Route path="notifications" element={<VendorNotificationsPage />} />
        <Route path="settings" element={<VendorSettingsPage />} />
      </Route>

      <Route
        path="admin/*"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="representatives" element={<AdminRepresentativesPage />} />
        <Route path="representatives/new" element={<AdminRepresentativeFormPage />} />
        <Route path="representatives/:id" element={<AdminRepresentativeDetailPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="banners" element={<AdminBannersPage />} />
        <Route path="notifications" element={<AdminNotificationsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  )
}