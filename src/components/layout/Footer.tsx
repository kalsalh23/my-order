import { Link } from 'react-router-dom'
import { Store, Truck, Shield, Headphones, Facebook, Twitter, Instagram } from 'lucide-react'

export function Footer() {
  const footerLinks = {
    company: [
      { label: 'عن مندوب طيبة', href: '/about' },
      { label: 'فرص عمل', href: '/careers' },
      { label: 'الصحافة', href: '/press' },
      { label: 'المدونة', href: '/blog' },
    ],
    support: [
      { label: 'مركز المساعدة', href: '/help' },
      { label: 'تواصل معنا', href: '/contact' },
      { label: 'سياسة الاسترجاع', href: '/returns' },
      { label: 'الشحن والتوصيل', href: '/shipping' },
    ],
    legal: [
      { label: 'سياسة الخصوصية', href: '/privacy' },
      { label: 'شروط الاستخدام', href: '/terms' },
      { label: 'سياسة الكوكيز', href: '/cookies' },
      { label: 'إمكانية الوصول', href: '/accessibility' },
    ],
    vendor: [
      { label: 'بيع معنا', href: '/vendor/register' },
      { label: 'لوحة المندوب', href: '/vendor/dashboard' },
      { label: 'شروط المندوبين', href: '/vendor/terms' },
      { label: 'الدعم الفني', href: '/vendor/support' },
    ],
  }

  const socialLinks = [
    { icon: Facebook, href: 'https://facebook.com', label: 'فيسبوك' },
    { icon: Twitter, href: 'https://twitter.com', label: 'تويتر' },
    { icon: Instagram, href: 'https://instagram.com', label: 'انستقرام' },
  ]

  const features = [
    { icon: Store, title: 'متاجر محلية', desc: 'منتجات من متاجر في منطقتك' },
    { icon: Truck, title: 'توصيل سريع', desc: 'وصول طلبك في وقت قياسي' },
    { icon: Shield, title: 'دفع آمن', desc: 'حماية كاملة لبياناتك المالية' },
    { icon: Headphones, title: 'دعم 24/7', desc: 'فريق دعم متاح دائماً' },
  ]

  return (
    <footer className="bg-white border-t border-gray-100" role="contentinfo">
      <div className="container-main py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4 touch-manipulation" aria-label="مندوب طيبة - الرئيسية">
              <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                <Store className="w-6 h-6 text-white" aria-hidden="true" />
              </div>
              <span className="text-heading-lg font-semibold text-charcoal">مندوب طيبة</span>
            </Link>
            <p className="text-body-sm text-gray-500 mb-6 line-clamp-2">
              متجرك المحلي.. أقرب إليك. منصة تجارة إلكترونية تربطك بأفضل المتاجر والمنتجات في منطقتك.
            </p>
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:text-primary hover:bg-gray-200 transition-colors duration-fast touch-manipulation"
                  aria-label={label}
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="روابط الشركة">
            <h3 className="text-heading-sm font-semibold text-charcoal mb-4">الشركة</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.company.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-body-sm text-gray-600 hover:text-primary transition-colors duration-fast touch-manipulation">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="روابط الدعم">
            <h3 className="text-heading-sm font-semibold text-charcoal mb-4">الدعم</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.support.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-body-sm text-gray-600 hover:text-primary transition-colors duration-fast touch-manipulation">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="روابط قانونية">
            <h3 className="text-heading-sm font-semibold text-charcoal mb-4">القانونية</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.legal.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-body-sm text-gray-600 hover:text-primary transition-colors duration-fast touch-manipulation">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="روابط المندوبين">
            <h3 className="text-heading-sm font-semibold text-charcoal mb-4">للمندوبين</h3>
            <ul className="space-y-3" role="list">
              {footerLinks.vendor.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-body-sm text-gray-600 hover:text-primary transition-colors duration-fast touch-manipulation">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="divider" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8" role="list" aria-label="مزايا مندوب طيبة">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 touch-manipulation" role="listitem">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
              </div>
              <div>
                <h4 className="text-body-md font-medium text-charcoal">{title}</h4>
                <p className="text-body-xs text-gray-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="divider" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-body-sm text-gray-500">
          <p className="text-center md:text-right">
            © {new Date().getFullYear()} مندوب طيبة. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500" aria-hidden="true" />
              متاح في السعودية
            </span>
            <span className="flex items-center gap-1">
              العملة: <strong>ر.س</strong>
            </span>
            <span className="flex items-center gap-1">
              اللغة: <strong>العربية</strong>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}