# Deployment Guide - مندوب طيبة

## 📋 Overview

This guide covers production deployment to **Vercel** (frontend) with **Supabase** (backend).

---

## 🔧 Prerequisites

- [ ] GitHub repository connected
- [ ] Supabase project created and configured
- [ ] Vercel account
- [ ] Custom domain (optional)
- [ ] SMS provider for phone OTP (Twilio, etc.)
- [ ] VAPID keys generated for push notifications

---

## 🗄️ Supabase Production Setup

### 1. Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization, name: `mandoub-taiba-prod`
4. Set secure database password
5. Select region closest to users (e.g., `eu-west-1` for Saudi Arabia)
6. Wait for project creation

### 2. Configure Authentication

**Authentication > Providers:**
- ✅ Email (enable email confirmations)
- ✅ Phone (enable for OTP - configure SMS provider)

**Authentication > URL Configuration:**
- Site URL: `https://your-domain.com`
- Redirect URLs:
  - `https://your-domain.com/auth/callback`
  - `https://your-domain.com/**`
  - `http://localhost:3000/**` (for development)

**Authentication > Email Templates:**
- Customize "Confirm signup", "Magic Link", "Reset Password" in Arabic

### 3. Run Database Migrations

In **SQL Editor**, execute in order:

```sql
-- 1. Initial Schema
\i supabase/migrations/01_initial_schema.sql

-- 2. RLS Policies
\i supabase/migrations/02_rls_policies.sql

-- 3. Database Functions
\i supabase/migrations/03_functions.sql

-- 4. Seed Data (optional - for demo)
\i supabase/migrations/04_seed_data.sql
```

**Verify:**
- Go to Table Editor → confirm 13 tables exist
- Check RLS enabled on all tables (lock icon)
- Test policies with different roles

### 4. Configure Storage Buckets

Go to **Storage > Create bucket**:

| Bucket Name | Public | File Size Limit | Allowed MIME Types |
|-------------|--------|-----------------|-------------------|
| `store-assets` | ✅ Yes | 5MB | image/* |
| `product-images` | ✅ Yes | 10MB | image/* |

**Policies (SQL Editor):**
```sql
-- store-assets: public read, authenticated write for admins/reps
CREATE POLICY "Public read store assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'store-assets');

CREATE POLICY "Admin/rep write store assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'store-assets' AND
    auth.role() = 'authenticated' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'representative'))
  );

-- product-images: public read, rep write own products
CREATE POLICY "Public read product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Rep write product images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated' AND
    EXISTS (
      SELECT 1 FROM products p
      JOIN representatives r ON r.id = p.representative_id
      WHERE r.profile_id = auth.uid()
    )
  );
```

### 5. Deploy Edge Functions

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy functions
supabase functions deploy send-notification
supabase functions deploy create-admin-user
supabase functions deploy verify-phone
```

**Set Function Secrets (Dashboard > Edge Functions > Settings):**
```
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:support@mandoubtaiba.sa
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_FROM_NUMBER=+96650xxxxxxx
```

### 6. Create Initial Admin User

**Option A: Via Dashboard**
1. Authentication > Users > Add User
2. Email: `admin@mandoubtaiba.sa`
3. Password: secure password
4. After creation, run in SQL Editor:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@mandoubtaiba.sa';
```

**Option B: Via Edge Function**
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-admin-user \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@mandoubtaiba.sa", "password": "secure-password"}'
```

### 7. Generate VAPID Keys

```bash
npx web-push generate-vapid-keys
```
Output:
```
Public Key:  Bxxxxxxxxxxxx...
Private Key: xxxxxxxxxxxxx...
```
- Add **Public Key** to frontend env (`VITE_VAPID_PUBLIC_KEY`)
- Add **Private Key** to Edge Function secrets (`VAPID_PRIVATE_KEY`)

### 8. Configure Realtime

**Database > Replication:**
- Enable for tables: `orders`, `vendor_orders`, `notifications`, `products`

---

## 🌐 Vercel Deployment

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. "Add New..." > "Project"
3. Import from GitHub: `kalsalh23/my-order`
4. Framework Preset: **Vite**
5. Root Directory: `./` (or `mandoub-taiba` if in subfolder)

### 2. Configure Build Settings

| Setting | Value |
|---------|-------|
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | 18.x or 20.x |

### 3. Environment Variables

**Project Settings > Environment Variables:**

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | `https://YOUR_PROJECT.supabase.co` | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Production, Preview, Development |
| `VITE_VAPID_PUBLIC_KEY` | `your-vapid-public-key` | Production, Preview, Development |
| `VITE_APP_NAME` | `مندوب طيبة` | Production, Preview, Development |
| `VITE_APP_URL` | `https://your-domain.com` | Production |

### 4. Custom Domain (Optional)

**Project Settings > Domains:**
1. Add `mandoubtaiba.sa`
2. Add `www.mandoubtaiba.sa`
3. Configure DNS:
   - Type: `CNAME`, Name: `www`, Value: `cname.vercel-dns.com`
   - Type: `A`, Name: `@`, Value: `76.76.21.21` (or Vercel's A record)

### 5. Vercel Configuration

Create/verify `vercel.json` in project root:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/manifest.json",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/icons/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "crons": []
}
```

### 6. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Or push to `main` branch for automatic deployment.

---

## 🔐 Security Checklist

### Supabase
- [ ] RLS enabled on ALL tables
- [ ] Service Role Key ONLY in Edge Functions
- [ ] Anon Key used in frontend only
- [ ] JWT expiry: 1 hour (default)
- [ ] Refresh token rotation enabled
- [ ] MFA encouraged for admin accounts

### Vercel
- [ ] Environment variables set correctly
- [ ] No secrets in code
- [ ] HTTPS enforced (automatic)
- [ ] Security headers configured

### Application
- [ ] CSP headers (add to vercel.json or middleware)
- [ ] Rate limiting on auth endpoints
- [ ] Input validation on all forms
- [ ] Error boundaries catching exceptions

---

## 📊 Monitoring & Analytics

### Vercel Analytics
1. Project Settings > Analytics > Enable
2. Add Web Vitals tracking

### Supabase Monitoring
1. Database > Logs for query performance
2. Auth > Logs for authentication issues
3. Edge Functions > Logs for function errors

### Error Tracking (Optional)
Add Sentry:
```bash
npm install @sentry/react @sentry/tracing
```

---

## 🔄 CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) runs:

1. **Lint & TypeCheck** - ESLint + TypeScript
2. **Test** - Vitest (when tests added)
3. **Build** - Vite production build
4. **Preview Deploy** - Vercel preview for PRs
5. **Production Deploy** - Vercel production on main merge

### Required GitHub Secrets:
```
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
```

### Get Vercel IDs:
```bash
vercel inspect <deployment-url> --token=<token>
# Or from Vercel Dashboard > Settings > General
```

---

## 🚨 Rollback Procedure

### Vercel Rollback
1. Vercel Dashboard > Deployments
2. Click "..." on previous deployment
3. "Promote to Production"

### Supabase Rollback
1. Database > Backups > Restore
2. Or run migration down scripts (if created)

### Emergency Maintenance Mode
In Admin Settings > Store Settings > Maintenance Mode:
- Toggle ON to show maintenance page
- Only admins can access dashboard

---

## 📱 PWA Verification

After deployment, verify:

1. **Lighthouse Audit** (Chrome DevTools):
   - Performance > 90
   - Accessibility > 90
   - Best Practices > 90
   - SEO > 90
   - PWA > 90

2. **PWA Checklist:**
   - [ ] Manifest valid (`/manifest.json`)
   - [ ] Service Worker registered (`/sw.js`)
   - [ ] Install prompt appears
   - [ ] Offline page works (disconnect network)
   - [ ] Icons load (all sizes)
   - [ ] Push notifications work (subscribe test)

3. **Mobile Testing:**
   - iOS Safari: Add to Home Screen
   - Android Chrome: Install banner
   - Test all user flows on device

---

## 📞 Post-Launch

### First 24 Hours
- [ ] Monitor error rates (Vercel Functions, Supabase Logs)
- [ ] Check order flow end-to-end
- [ ] Verify notifications deliver
- [ ] Test admin/vendor dashboards
- [ ] Confirm SSL certificate valid

### First Week
- [ ] Review Core Web Vitals
- [ ] Check database performance
- [ ] Monitor storage usage
- [ ] Review user feedback
- [ ] Backup verification

### Ongoing
- [ ] Weekly dependency updates (Dependabot)
- [ ] Monthly security audit
- [ ] Quarterly performance review
- [ ] Regular database backups

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Local build test
npm run build

# Check TypeScript errors
npm run typecheck

# Check lint errors
npm run lint
```

### Supabase Connection Issues
- Verify `VITE_SUPABASE_URL` format: `https://xxx.supabase.co`
- Check Anon Key not expired
- Confirm project not paused

### PWA Not Installing
- Check `manifest.json` accessible
- Verify HTTPS (required for PWA)
- Check Service Worker scope
- Validate icons exist at paths

### Push Notifications Fail
- VAPID keys match (frontend/public, backend/private)
- Browser supports Push API
- User granted permission
- Service Worker active

---

## 📞 Support Contacts

| Service | Support |
|---------|---------|
| Vercel | [vercel.com/support](https://vercel.com/support) |
| Supabase | [supabase.com/support](https://supabase.com/support) |
| GitHub | [github.com/kalsalh23/my-order/issues](https://github.com/kalsalh23/my-order/issues) |

---

**Last Updated:** 2026-11-20  
**Version:** 1.0.0