# GitHub Setup Instructions for مندوب طيبة

## 📦 Repository Setup

### 1. Create Repository
```bash
# Initialize git (if not already done)
cd mandoub-taiba
git init

# Add all files
git add .

# Initial commit
git commit -m "feat: initial commit - Mandoub Taiba multi-vendor e-commerce platform

- React 18 + TypeScript + Vite
- Tailwind CSS with Arabic RTL design system
- Supabase backend (PostgreSQL, Auth, Storage, Realtime, Edge Functions)
- PWA with Service Worker, offline support, push notifications
- Three-role architecture: Admin, Representative, Guest Customer
- Multi-vendor order splitting architecture
- Complete admin, vendor, and public page implementations"

# Create main branch
git branch -M main
```

### 2. Connect to GitHub
```bash
# Create repository on GitHub.com first, then:
git remote add origin git@github.com:kalsalh23/my-order.git
git push -u origin main
```

### 3. Branch Protection Rules
Go to **Settings → Branches → Add rule**:
- Branch name pattern: `main`
- ✅ Require pull request reviews before merging (1 reviewer)
- ✅ Require status checks to pass before merging
  - `lint-and-typecheck`
  - `test`
  - `build`
- ✅ Require branches to be up to date before merging
- ✅ Include administrators
- ✅ Restrict who can push to matching branches

### 4. Repository Secrets
Go to **Settings → Secrets and variables → Actions → New repository secret**:

| Secret Name | Value | Description |
|-------------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://kqodfuipbveupvshvfnr.supabase.co` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase anon public key |
| `VITE_VAPID_PUBLIC_KEY` | `your-vapid-public-key` | VAPID public key for push notifications |
| `VERCEL_TOKEN` | `your-vercel-token` | Vercel CLI token |
| `VERCEL_ORG_ID` | `your-org-id` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | `your-project-id` | Vercel project ID |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Supabase service role (for Edge Functions) |
| `VAPID_PRIVATE_KEY` | `your-vapid-private-key` | VAPID private key (for Edge Functions) |
| `VAPID_SUBJECT` | `mailto:support@mandoubtaiba.sa` | VAPID subject email |

### 5. Environments
Go to **Settings → Environments → New environment**:
- Name: `production`
- ✅ Required reviewers: (add team leads)
- Wait timer: 0 minutes
- Deployment branches: `main` only

### 6. GitHub Actions Workflow
The workflow file is already at `.github/workflows/ci-cd.yml`. It includes:
- Lint & TypeScript check
- Tests
- Build
- Preview deployment for PRs
- Production deployment for main branch

### 7. Dependabot
Create `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    labels:
      - "dependencies"
      - "npm"
    commit-message:
      prefix: "chore(deps)"
    groups:
      dev-dependencies:
        patterns:
          - "@types/*"
          - "eslint*"
          - "prettier*"
          - "typescript*"
          - "vite*"
      production-dependencies:
        patterns:
          - "react*"
          - "tailwind*"
          - "@supabase/*"
          - "@tanstack/*"
          - "zod"
          - "react-hook-form"
```

### 8. Issue & PR Templates
Create `.github/ISSUE_TEMPLATE/bug_report.yml`:
```yaml
name: Bug Report
description: Report a bug
title: "[Bug]: "
labels: ["bug"]
body:
  - type: markdown
    attributes:
      value: "شكراً للإبلاغ عن المشكلة. يرجى ملء المعلومات أدناه."
  - type: input
    id: version
    attributes:
      label: Version
      description: إصدار التطبيق
      placeholder: "1.0.0"
    validations:
      required: true
  - type: textarea
    id: steps
    attributes:
      label: خطوات التكرار
      description: خطوات واضحة لإعادة إنتاج المشكلة
      placeholder: |
        1. اذهب إلى '...'
        2. اضغط على '...'
        3. شاهد الخطأ
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: السلوك المتوقع
      description: ما الذي تتوقع حدوثه؟
    validations:
      required: true
  - type: textarea
    id: actual
    attributes:
      label: السلوك الفعلي
      description: ما الذي حدث فعلياً؟
    validations:
      required: true
  - type: dropdown
    id: platform
    attributes:
      label: المنصة
      options:
        - Desktop Chrome
        - Desktop Firefox
        - Desktop Safari
        - Mobile Chrome (Android)
        - Mobile Safari (iOS)
        - PWA Installed
    validations:
      required: true
  - type: textarea
    id: logs
    attributes:
      label: سجلات الأخطاء
      description: أي رسائل خطأ من Console أو Network tab
      render: shell
```

Create `.github/PULL_REQUEST_TEMPLATE.md`:
```markdown
## وصف التغييرات
وصف مختصر ومباشر للتغييرات المضافة في هذا الـ PR.

## نوع التغيير
- [ ] إصلاح خطأ (Bug fix)
- [ ] ميزة جديدة (New feature)
- [ ] تغيير جذري (Breaking change)
- [ ] تحسين الأداء (Performance improvement)
- [ ] تحديث التوثيق (Documentation update)
- [ ] صيانة (Refactoring/Chore)

## قائمة التحقق
- [ ] الكود يتبع معايير المشروع (ESLint, Prettier)
- [ ] تم إضافة اختبارات للوظائف الجديدة
- [ ] جميع الاختبارات تمر بنجاح
- [ ] تم تحديث التوثيق إن لزم
- [ ] لا توجد أخطاء TypeScript
- [ ] البناء ينجح محلياً (`npm run build`)

## لقطات شاشة (إن وجدت)
أضف لقطات شاشة للتغييرات البصرية.

## ملاحظات إضافية
أي معلومات إضافية للمراجعين.
```

---

## 🔧 Local Development Setup

### Clone & Setup
```bash
# Clone repository
git clone git@github.com:kalsalh23/my-order.git
cd my-order

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Fill in your local Supabase credentials in .env
# VITE_SUPABASE_URL=http://localhost:54321 (for local Supabase)
# VITE_SUPABASE_ANON_KEY=your-local-anon-key

# Start Supabase locally (optional)
npx supabase start

# Run migrations
npx supabase db reset

# Start development server
npm run dev
```

### Git Workflow
```bash
# Create feature branch
git checkout -b feature/amazing-feature

# Make changes, commit frequently
git add .
git commit -m "feat: add amazing feature"

# Push to origin
git push origin feature/amazing-feature

# Create Pull Request on GitHub
```

### Commit Message Convention
Follow Conventional Commits:
```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:
- `feat`: ميزة جديدة
- `fix`: إصلاح خطأ
- `docs`: تحديث التوثيق
- `style`: تنسيق الكود (prettier, إلخ)
- `refactor`: إعادة هيكلة الكود
- `perf`: تحسين الأداء
- `test`: إضافة/تعديل الاختبارات
- `chore`: مهام صيانة (dependencies, build, إلخ)

Examples:
```
feat(products): add product image gallery
fix(cart): resolve quantity update issue
docs(readme): update deployment instructions
chore(deps): update react to 18.2.0
```

---

## 📁 Repository Structure Overview
```
mandoub-taiba/
├── .github/
│   ├── workflows/ci-cd.yml       # CI/CD pipeline
│   ├── dependabot.yml            # Dependabot config
│   ├── ISSUE_TEMPLATE/           # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md  # PR template
├── public/                       # Static assets
│   ├── icons/                    # PWA icons
│   ├── images/                   # Placeholder images
│   ├── manifest.json             # PWA manifest
│   ├── sw.js                     # Service Worker
│   └── offline.html              # Offline fallback
├── src/
│   ├── components/               # Reusable components
│   ├── features/                 # Feature modules
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Library configs (Supabase)
│   ├── pages/                    # Page components
│   │   ├── admin/                # Admin dashboard pages
│   │   ├── public/               # Public marketplace pages
│   │   └── vendor/               # Vendor dashboard pages
│   ├── services/                 # API services
│   ├── styles/                   # Global styles
│   ├── types/                    # TypeScript types
│   └── utils/                    # Utility functions
├── supabase/
│   ├── migrations/               # SQL migrations
│   └── functions/                # Edge Functions
├── .env.example                  # Environment template
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 🚨 Important Notes

1. **Never commit `.env` files** - they're in `.gitignore`
2. **Service Role Key** - only use in Edge Functions, never in frontend
3. **VAPID Keys** - generate with `npx web-push generate-vapid-keys`
4. **Database Migrations** - run in order (01, 02, 03, 04)
5. **Supabase Local Dev** - use `npx supabase start` for local development
6. **Production Secrets** - only add to GitHub Secrets, not `.env.example`