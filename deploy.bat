@echo off
chcp 65001 >nul
echo ==========================================
echo  مندوب طيبة - سكريبت النشر الآلي
echo ==========================================
echo.

REM ==========================================
REM التحقق من المتطلبات
REM ==========================================
echo [1/8] التحقق من الأدوات المطلوبة...
where node >nul 2>&1 || (echo ERROR: Node.js غير مثبت & exit /b 1)
where npm >nul 2>&1 || (echo ERROR: npm غير مثبت & exit /b 1)
where git >nul 2>&1 || (echo ERROR: Git غير مثبت & exit /b 1)
echo    ✓ Node.js, npm, Git متوفرة

REM ==========================================
REM تثبيت التبعيات
REM ==========================================
echo.
echo [2/8] تثبيت التبعيات...
npm install
if %errorlevel% neq 0 (echo ERROR: فشل تثبيت التبعيات & exit /b 1)
echo    ✓ التبعيات مثبتة

REM ==========================================
REM بناء الإنتاج
REM ==========================================
echo.
echo [3/8] بناء نسخة الإنتاج...
npm run build
if %errorlevel% neq 0 (echo ERROR: فشل البناء & exit /b 1)
echo    ✓ البناء ناجح

REM ==========================================
REM إعداد Git
REM ==========================================
echo.
echo [4/8] إعداد Git ورفع الكود...
if not exist .git (
    git init
    git branch -M main
)
git add .
git commit -m "feat: initial commit - Mandoub Taiba production ready"
git remote remove origin 2>nul
git remote add origin git@github.com:kalsalh23/my-order.git
git push -u origin main --force
if %errorlevel% neq 0 (echo WARNING: تحقق من SSH key في GitHub & exit /b 1)
echo    ✓ الكود مرفوع لـ GitHub

REM ==========================================
REM توليد مفاتيح VAPID
REM ==========================================
echo.
echo [5/8] توليد مفاتيح VAPID للإشعارات...
npx web-push generate-vapid-keys > vapid_keys.txt 2>&1
for /f "tokens=2" %%a in ('findstr "Public Key:" vapid_keys.txt') do set VAPID_PUBLIC=%%a
for /f "tokens=2" %%a in ('findstr "Private Key:" vapid_keys.txt') do set VAPID_PRIVATE=%%a
echo    Public Key:  %VAPID_PUBLIC%
echo    Private Key: %VAPID_PRIVATE%
echo.
echo    *** احفظ المفتاح الخاص بأمان! ***
echo.

REM ==========================================
REM تحديث .env.production بمفتاح VAPID
REM ==========================================
echo [6/8] تحديث متغيرات البيئة...
powershell -Command "(Get-Content .env.production) -replace 'VITE_VAPID_PUBLIC_KEY=', 'VITE_VAPID_PUBLIC_KEY=%VAPID_PUBLIC%' | Set-Content .env.production"
echo    ✓ تم تحديث VITE_VAPID_PUBLIC_KEY

REM ==========================================
REM نشر Supabase
REM ==========================================
echo.
echo [7/8] نشر قاعدة البيانات و Edge Functions على Supabase...
echo    تثبيت Supabase CLI...
npm install -g supabase >nul 2>&1

echo تسجيل الدخول (قم بتسجيل الدخول عند المطالبة)...
supabase login --token

echo    ربط المشروع...
supabase link --project-ref kqodfuipbveupvshvfnr

echo    تنفيذ الترحيلات...
supabase db push --include-all

echo    نشر Edge Functions...
supabase functions deploy send-notification
supabase functions deploy create-admin-user
supabase functions deploy verify-phone

echo إعداد أسرار الوظائف...
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
supabase secrets set VAPID_PRIVATE_KEY="%VAPID_PRIVATE%"
supabase secrets set VAPID_SUBJECT="mailto:support@mandoubtaiba.sa"

echo    ✓ Supabase جاهز

REM ==========================================
REM نشر Vercel
REM ==========================================
echo.
echo [8/8] النشر على Vercel...
echo    تثبيت Vercel CLI...
npm install -g vercel >nul 2>&1

echo تسجيل الدخول...
vercel login

echo نشر الإنتاج...
vercel --prod --yes

echo.
echo ==========================================
echo  ✅ النشر مكتمل!
echo ==========================================
echo.
echo  خطوات تالية يدوية:
echo  1. أضف النطاق المخصص في Vercel Dashboard
echo  2. حدث VITE_APP_URL في Vercel Environment Variables
echo  3. اختبر جميع التدفقات (تسوق، طلب، لوحة تحكم)
echo  4. *** دوّر جميع المفاتيح المشتركة ***
echo.
pause