import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function TermsPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container-main max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-body-sm text-gray-500 hover:text-primary mb-8 touch-manipulation">
          <ArrowLeft className="w-4 h-4" />
          العودة للرئيسية
        </Link>

        <article className="card p-6 md:p-10">
          <header className="mb-8 pb-6 border-b border-gray-100">
            <h1 className="heading-2 text-charcoal mb-2">شروط الاستخدام</h1>
            <p className="text-body-md text-gray-500">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>
          </header>

          <div className="prose prose-rtl max-w-none text-body-md text-gray-700 space-y-6">
            <section>
              <h2 className="heading-4 text-charcoal mb-3">قبول الشروط</h2>
              <p>باستخدامك لتطبيق "مندوب طيبة"، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق، يرجى عدم استخدام التطبيق.</p>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">الوصف العام للخدمة</h2>
              <p>"مندوب طيبة" هو منصة تجارة إلكترونية متعددة البائعين تربط العملاء بالمندوبين (البائعين المحليين) لشراء المنتجات. نحن نقدم المنصة التقنية فقط، والمندوبون مسؤولون عن منتجاتهم وخدمات التوصيل.</p>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">الحسابات والتسجيل</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>يجب أن يكون عمرك 18 عاماً على الأقل</li>
                <li>يجب تقديم معلومات دقيقة وكاملة</li>
                <li>أنت مسؤول عن سرية بيانات حسابك</li>
                <li>نحتفظ بالحق في تعليق أو إنهاء الحسابات المخالفة</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">الطلبات والشراء</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>الأسعار بالريال السعودي وتشمل ضريبة القيمة المضافة</li>
                <li>الطلب يعتبر عرضاً للشراء، والعقد يتم عند قبول المندوب</li>
                <li>الدفع عند الاستلام هو الطريقة الأساسية</li>
                <li>يمكن إلغاء الطلب قبل قبوله من المندوب</li>
                <li>الأسعار والتوفر قابلة للتغيير دون إشعار مسبق</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">التوصيل والاستلام</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>مواعيد التوصيل تقديرية وتختلف حسب المنطقة</li>
                <li>يجب توفر شخص لاستلام الطلب في العنوان المحدد</li>
                <li>فشل التوصيل بعد محاولتين قد يؤدي لإلغاء الطلب</li>
                <li>رسوم التوصيل تظهر قبل إتمام الطلب</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">الإرجاع والاستبدال</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>حق الإرجاع خلال 14 يوماً للمنتجات غير التالفة</li>
                <li>المنتجات التالفة أو غير المطابقة يتم استبدالها مجاناً</li>
                <li>بعض المنتجات مستثناة (مواد غذائية، منتجات شخصية، إلخ)</li>
                <li>يتحمل العميل رسوم الإرجاع ما لم يكن الخطأ من المندوب</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">المحتوى والملكية الفكرية</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>جميع المحتويات مملوكة لـ "مندوب طيبة" أو مرخصة لنا</li>
                <li>ممنوع نسخ أو إعادة إنتاج أي محتوى دون إذن</li>
                <li>العلامات التجارية والشعارات محمية قانونياً</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">إخلاء المسؤولية</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>الخدمة مقدمة "كما هي" دون ضمانات</li>
                <li>غير مسؤولين عن انقطاع الخدمة أو الأخطاء التقنية</li>
                <li>المندوبون مسؤولون عن جودة منتجاتهم وخدماتهم</li>
                <li>مسؤوليتنا محدودة بقيمة الطلب المتنازع عليه</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">إنهاء الخدمة</h2>
              <p>نحتفظ بالحق في تعليق أو إنهاء وصولك للخدمة في أي وقت ولأي سبب، بما في ذلك مخالفة هذه الشروط.</p>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">القانون الحاكم وحل النزاعات</h2>
              <p>تخضع هذه الشروط لقوانين المملكة العربية السعودية. أي نزاعات تحل ودياً أولاً، وإلا فالمحاكم السعودية هي المختصة.</p>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">التغييرات على الشروط</h2>
              <p>قد نقوم بتحديث هذه الشروط دورياً. استمرار استخدامك للخدمة يعني قبولك للتغييرات.</p>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">اتصل بنا</h2>
              <p>للاستفسارات حول هذه الشروط: <a href="mailto:legal@mandoubtaiba.sa" className="text-primary hover:underline">legal@mandoubtaiba.sa</a></p>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}