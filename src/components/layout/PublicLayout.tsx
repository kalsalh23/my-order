import { Outlet } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { BottomNavigation } from '@/components/navigation/BottomNavigation'
import { ToastContainer } from '@/components/common/Toast'

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        تخطي إلى المحتوى الرئيسي
      </a>
      <Header />
      <main id="main-content" className="flex-1 pt-safe pb-20 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <BottomNavigation />
      <ToastContainer />
    </div>
  )
}