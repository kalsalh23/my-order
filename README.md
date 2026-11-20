# مندوب طيبة - Mandoub Taiba

منصة تجارة إلكترونية متعددة البائعين (Multi-vendor E-commerce Platform) مبنية بأحدث التقنيات.

## 🚀 التقنيات المستخدمة

### Frontend
- **React 18** + **TypeScript**
- **Vite** للبناء والتطوير السريع
- **Tailwind CSS** للتصميم
- **React Router v6** للتنقل
- **TanStack Query** لإدارة حالة الخادم
- **React Hook Form** + **Zod** للنماذج والتحقق
- **Lucide React** للأيقونات

### Backend
- **Supabase** (PostgreSQL + Auth + Storage + Realtime + Edge Functions)
- **Row Level Security (RLS)** للأمان
- **Edge Functions** للعمليات الخلفية

### PWA
- **Service Worker** للعمل بدون إنترنت
- **Web App Manifest** للتثبيت
- **Push Notifications** (VAPID)
- **Offline Fallback**

### Deployment
- **GitHub** للمصادر
- **Vercel** للاستضافة
- **Supabase** للباك إند

---

## 📋 المتطلبات

- Node.js 18+
- npm أو pnpm
- حساب Supabase
- حساب Vercel
- حساب GitHub

---

## 🛠️ الإعداد المحلي

### 1. استنساخ المستودع
```bash
git clone https://github.com/your-username/mandoub-taiba.git
cd mandoub-taiba
```

### 2. تثبيت التبعيات
```bash
npm install
# أو
pnpm install
```

### 3. متغيرات البيئة
انسخ ملف المثال وقم بتعديله:
```bash
cp .env.example .env
```

قم بتعبئة المتغيرات التالية:
```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# VAPID Keys (للإشعارات)
# أنشئها بـ: npx web-push generate-vapid-keys
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key

# App
VITE_APP_NAME=مندوب طيبة
VITE_APP_URL=http://localhost:3000
```

### 4. إعداد Supabase

1. أنشئ مشروع جديد في [Supabase](https://supabase.com)
2. اذهب إلى SQL Editor
3. نفذ ملفات الترحيل بالترتيب:
   - `supabase/migrations/01_initial_schema.sql`
   - `supabase/migrations/02_rls_policies.sql`
   - `supabase/migrations/03_functions.sql`
   - `supabase/migrations/04_seed_data.sql` (للبيانات التجريبية فقط)

4. أضف Edge Functions:
   - `supabase/functions/send-notification`
   - `supabase/functions/create-admin-user`
   - `supabase/functions/verify-phone`

5. في Authentication > Settings:
   - فعّل Email/Password
   - فعّل Phone (SMS) إذا متاح
   - أضف Redirect URLs للتطوير

6. في Storage:
   - أنشئ bucket باسم `store-assets` (public)
   - أنشئ bucket باسم `product-images` (public)

### 5. تشغيل المشروع
```bash
npm run dev
```
سيفتح التطبيق على `http://localhost:3000`

---

## 📁 هيكل المشروع

```
mandoub-taiba/
├── public/                 # الملفات الثابتة
│   ├── icons/             # أيقونات PWA
│   ├── images/            # صور placeholder
│   ├── manifest.json      # PWA Manifest
│   ├── sw.js             # Service Worker
│   └── offline.html      # صفحة عدم الاتصال
├── src/
│   ├── components/        # المكونات المشتركة
│   │   ├── common/       # مكونات عامة (Toast, Skeletons, etc.)
│   │   ├── layout/       # تخطيطات (Header, Footer, Layouts)
│   │   ├── navigation/   # تنقل (BottomNavigation)
│   │   └── products/     # منتجات (ProductCard, CategoryCard)
│   ├── features/         # الميزات الرئيسية
│   │   ├── auth/         # المصادقة
│   │   ├── cart/         # السلة
│   │   └── products/     # المنتجات
│   ├── hooks/            # Custom Hooks
│   ├── lib/              # مكتبات (Supabase client)
│   ├── pages/            # الصفحات
│   │   ├── public/       # صفحات عامة
│   │   ├── vendor/       # صفحات المندوب
│   │   └── admin/        # صفحات الإدارة
│   ├── services/         # خدمات API
│   ├── styles/           # أنماط CSS
│   ├── types/            # أنواع TypeScript
│   └── utils/            # دوال مساعدة
├── supabase/
│   ├── migrations/       # ترحيلات قاعدة البيانات
│   └── functions/        # Edge Functions
├── .env.example          # مثال متغيرات البيئة
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🎯 الأدوار والصلاحيات

### 1. مدير النظام (Admin)
- لوحة تحكم شاملة
- إدارة المندوبين (إضافة، تعديل، إيقاف)
- إدارة المنتجات (مراجعة، إخفاء)
- إدارة الطلبات (مراقبة، إلغاء)
- إدارة الأقسام والبانرات
- الإشعارات المنصة
- إعدادات المتجر

### 2. المندوب (Representative/Vendor)
- لوحة تحكم شخصية
- إدارة المتجر (الشعار، الغلاف، الوصف)
- إدارة المنتجات (إضافة، تعديل، حذف، صور)
- إدارة الطلبات (قبول، رفض، تحديث الحالة)
- الإحصائيات والمبيعات
- الإشعارات
- الإعدادات الشخصية

### 3. العميل (Customer/Guest)
- تصفح المنتجات بدون تسجيل
- البحث والتصفية
- سلة تسوق مستمرة
- دفع كضيف (الاسم، الهاتف، العنوان)
- تتبع الطلب برقم الطلب والهاتف
- لا حاجة لحساب

---

## 🔐 الأمان

- **Row Level Security** على جميع الجداول
- **Supabase Auth** للمصادقة
- **Service Role Key** فقط في Edge Functions
- **VAPID Keys** للإشعارات
- التحقق من الهاتف عبر OTP
- تشفير كلمات المرور (bcrypt)
- التحقق من صحة البيانات بـ Zod

---

## 📱 PWA Features

- ✅ قابل للتثبيت على الهاتف والكمبيوتر
- ✅ يعمل بدون إنترنت (Offline First)
- ✅ إشعارات Push أصلية
- ✅ Splash Screen مخصص
- ✅ تحديث تلقائي
- ✅ اختصارات التطبيق
- ✅ Lighthouse Score 90+

---

## 🚀 النشر على Vercel

### 1. ربط المستودع
1. ادخل إلى [Vercel Dashboard](https://vercel.com/dashboard)
2. اضغط "Add New Project"
3. اختر مستودع GitHub

### 2. متغيرات البيئة
أضف في Project Settings > Environment Variables:
```env
VITE_SUPABASE_URL=your-production-supabase-url
VITE_SUPABASE_ANON_KEY=your-production-anon-key
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_APP_URL=https://your-domain.vercel.app
```

### 3. النشر
سيتم النشر تلقائياً عند كل push للفرع الرئيسي.

---

## 📊 قاعدة البيانات

### الجداول الرئيسية
- `profiles` - ملفات المستخدمين
- `representatives` - المندوبين/المتاجر
- `categories` - أقسام المنتجات
- `products` - المنتجات
- `product_images` - صور المنتجات
- `orders` - الطلبات الرئيسية
- `vendor_orders` - طلبات المندوبين الفرعية
- `order_items` - عناصر الطلب
- `notifications` - الإشعارات
- `push_subscriptions` - اشتراكات Push
- `banners` - البانرات الإعلانية
- `store_settings` - إعدادات المتجر
- `order_status_history` - سجل حالات الطلبات

### الدوال المهمة
- `create_order()` - إنشاء طلب مع تقسيم للمندوبين
- `get_representative_stats()` - إحصائيات المندوب
- `get_vendor_orders()` - طلبات المندوب مع ترقيم
- `update_order_status()` - تحديث حالة مع تحقق
- `search_products()` - بحث منتجات محسن

---

## 🧪 الاختبار

```bash
# تشغيل الاختبارات
npm run test

# فحص الكود
npm run lint

# فحص الأنواع
npm run typecheck

# بناء الإنتاج
npm run build

# معاينة البناء
npm run preview
```

---

## 📝 قائمة التحقق قبل الإنتاج

### Supabase
- [ ] تنفيذ جميع الترحيلات
- [ ] تفعيل RLS على جميع الجداول
- [ ] إعداد Edge Functions
- [ ] تكوين Storage Buckets
- [ ] إعداد مزود SMS للهاتف (Twilio, etc.)
- [ ] إنشاء VAPID Keys للإنتاج
- [ ] إضافة Admin User أولي
- [ ] اختبار السياسات بـ SQL Editor

### Frontend
- [ ] بناء الإنتاج ينجح بدون أخطاء
- [ ] جميع المسارات تعمل
- [ ] PWA يعمل (Manifest, SW, Icons)
- [ ] الإشعارات تعمل
- [ ] RTL صحيح في جميع الصفحات
- [ ] الصور محسنة (WebP, أحجام متعددة)
- [ ] Meta tags للـ SEO
- [ ] Error Boundaries

### الأمان
- [ ] Service Role Key غير مكشوف
- [ ] VAPID Private Key آمن
- [ ] CORS مضبوط في Supabase
- [ ] Rate Limiting على Edge Functions
- [ ] HTTPS مفروض
- [ ] CSP Headers

### الأداء
- [ ] Code Splitting للمسارات
- [ ] Lazy Loading للصور
- [ ] Caching策略 صحيحة
- [ ] Bundle Size محسن
- [ ] Core Web Vitals جيدة

---

## 🐛 استكشاف الأخطاء

### مشاكل شائعة

**Supabase Connection Failed**
- تحقق من `VITE_SUPABASE_URL` و `VITE_SUPABASE_ANON_KEY`
- تأكد من تفعيل المشروع في Supabase

**RLS Policy Denied**
- تحقق من سياسات الجدول في SQL Editor
- تأكد من دور المستخدم (admin/representative)

**Push Notifications Not Working**
- تأكد من VAPID Keys في `.env` و Edge Function
- تحقق من دعم المتصفح
- اختبر على HTTPS فقط

**Build Fails on Vercel**
- تحقق من متغيرات البيئة في Vercel
- راجع Build Logs للتفاصيل
- تأكد من عدم وجود أخطاء TypeScript

---

## 📄 الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

---

## 🤝 المساهمة

1. Fork المستودع
2. أنشئ فرع للميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

---

## 📞 الدعم

- **البريد الإلكتروني**: support@mandoubtaiba.sa
- **الموقع**: https://mandoubtaiba.sa
- **GitHub Issues**: للمشاكل التقنية

---

**مبني بـ ❤️ لفريق مندوب طيبة**