import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

export function PrivacyPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="container-main max-w-3xl">
        <Link to="/" className="inline-flex items-center gap-1.5 text-body-sm text-gray-500 hover:text-primary mb-8 touch-manipulation">
          <ArrowLeft className="w-4 h-4" />
          العودة للرئيسية
        </Link>

        <article className="card p-6 md:p-10">
          <header className="mb-8 pb-6 border-b border-gray-100">
            <h1 className="heading-2 text-charcoal mb-2">سياسة الخصوصية</h1>
            <p className="text-body-md text-gray-500">آخر تحديث: {new Date().toLocaleDateString('ar-SA')}</p>
          </header>

          <div className="prose prose-rtl max-w-none text-body-md text-gray-700 space-y-6">
            <section>
              <h2 className="heading-4 text-charcoal mb-3">مقدمة</h2>
              <p>تلتزم "مندوب طيبة" بحماية خصوصيتك. توضح هذه السياسة كيف نقوم بجمع واستخدام والكشف عن معلوماتك الشخصية عند استخدامك لتطبيقنا وخدماتنا.</p>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">المعلومات التي نجمعها</h2>
              <h3 className="heading-sm text-charcoal mb-2">معلومات الحساب</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>الاسم الكامل</li>
                <li>البريد الإلكتروني</li>
                <li>رقم الجوال (محقق عبر OTP)</li>
                <li>كلمة المرور (مشفرة)</li>
              </ul>
              <h3 className="heading-sm text-charcoal mb-2 mt-4">معلومات الطلب</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>عنوان التوصيل</li>
                <li>تفاصيل المنتجات المطلوبة</li>
                <li>معلومات الدفع (عند الاستلام)</li>
              </ul>
              <h3 className="heading-sm text-charcoal mb-2 mt-4">بيانات الاستخدام</h3>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>عناوين IP</li>
                <li>نوع المتصفح والجهاز</li>
                <li>الصفحات المزارة والوقت المستغرق</li>
                <li>معلومات الموقع (عند الإذن)</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">كيف نستخدم معلوماتك</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>معالجة وتنفيذ الطلبات</li>
                <li>التواصل معك بخصوص طلباتك</li>
                <li>إرسال الإشعارات والعروض الترويجية (بموافقتك)</li>
                <li>تحسين خدماتنا وتجربة المستخدم</li>
                <li>الامتثال للمتطلبات القانونية</li>
                <li>منع الاحتيال وضمان الأمان</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">مشاركة المعلومات</h2>
              <p>لا نبيع معلوماتك الشخصية. قد نشاركها مع:</p>
              <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                <li>المندوبين (لتنفيذ طلباتك)</li>
                <li>شركات التوصيل (لتسليم الطلبات)</li>
                <li>مقدمي خدمات الدفع (عند الدفع الإلكتروني)</li>
                <li>الجهات القانونية عند الضرورة</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">حقوقك</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>الوصول إلى بياناتك وتصحيحها</li>
                <li>طلب حذف حسابك</li>
                <li>سحب الموافقة على التسويق</li>
                <li>الاعتراض على معالجة معينة</li>
                <li>نقل البيانات</li>
              </ul>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">الأمان</h2>
              <p>نطبق تدابير تقنية وتنظيمية مناسبة لحماية بياناتك، بما في ذلك التشفير، والتحكم في الوصول، والمراقبة الأمنية.</p>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">الاحتفاظ بالبيانات</h2>
              <p>نحتفظ ببياناتك طالما كان حسابك نشطاً أو حسبما تقتضي الضرورة القانونية. يتم حذف البيانات غير الضرورية بشكل دوري.</p>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">التغييرات على السياسة</h2>
              <p>قد نحدث هذه السياسة دورياً. سيتم إعلامك بأي تغييرات جوهرية عبر التطبيق أو البريد الإلكتروني.</p>
            </section>

            <section>
              <h2 className="heading-4 text-charcoal mb-3">اتصل بنا</h2>
              <p>لأي استفسارات حول الخصوصية، راسلنا على: <a href="mailto:privacy@mandoubtaiba.sa" className="text-primary hover:underline">privacy@mandoubtaiba.sa</a></p>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}