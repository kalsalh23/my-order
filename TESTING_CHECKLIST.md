# مندوب طيبة - Testing Checklist

## 📋 Pre-Deployment Testing Checklist

### ✅ Core Functionality

#### Authentication & Authorization
- [ ] Admin login with email/password
- [ ] Representative login with email/password
- [ ] Guest browsing without login
- [ ] Role-based route protection (admin, vendor, public)
- [ ] Session persistence across refresh
- [ ] Logout functionality
- [ ] JWT token handling
- [ ] Phone OTP verification (when SMS configured)
- [ ] Password reset flow

#### Public Marketplace (Guest)
- [ ] Homepage loads with banners, categories, featured products
- [ ] Product listing page with pagination
- [ ] Category filtering works
- [ ] Search by product name
- [ ] Price range filtering
- [ ] Sorting (newest, price asc/desc, popular)
- [ ] Product detail page with image gallery
- [ ] Add to cart from product card and detail page
- [ ] Quantity selector on product cards
- [ ] Cart page shows items with correct prices
- [ ] Cart quantity updates
- [ ] Cart item removal
- [ ] Cart persistence in localStorage
- [ ] Checkout form validation
- [ ] Phone number format validation (Saudi)
- [ ] Order creation with phone verification
- [ ] Order success page with order number
- [ ] Order tracking by order number + phone
- [ ] Stores listing page
- [ ] Store detail page with products/info/reviews
- [ ] Category pages

#### Representative Dashboard
- [ ] Dashboard stats display
- [ ] Profile management (logo, cover, info, social)
- [ ] Product CRUD (create, read, update, delete)
- [ ] Product image upload (main + additional)
- [ ] Product status toggle (active/inactive)
- [ ] Orders listing with status tabs
- [ ] Order detail with timeline
- [ ] Order status transitions (pending→accepted→preparing→ready→out_for_delivery→delivered)
- [ ] Order rejection with reason
- [ ] Notifications page (read/unread, mark all read)
- [ ] Settings (profile, store, security, notifications, appearance)
- [ ] Password change
- [ ] Avatar upload

#### Admin Dashboard
- [ ] Dashboard stats (reps, products, orders, sales)
- [ ] Representatives management (list, create, edit, delete, toggle visibility)
- [ ] Products management (list, search, filter, delete)
- [ ] Categories management (CRUD, image upload, ordering)
- [ ] Banners management (CRUD, image upload, ordering)
- [ ] Orders overview (all marketplace orders)
- [ ] Notifications (list, send to all/users)
- [ ] Settings (general, delivery, social, features, appearance, advanced)
- [ ] Store branding (logo, favicon upload)
- [ ] Maintenance mode toggle

#### Multi-Vendor Order Architecture
- [ ] Cart with products from multiple representatives
- [ ] Checkout creates parent order + vendor sub-orders
- [ ] Each representative sees only their sub-order
- [ ] Admin sees parent order + all sub-orders
- [ ] Order totals calculated correctly per vendor
- [ ] Delivery fees split per vendor
- [ ] Stock deduction on order creation

### ✅ UI/UX & Design

#### RTL & Arabic Support
- [ ] Document dir="rtl" and lang="ar"
- [ ] All text in Arabic
- [ ] Numbers in Arabic-Indic format
- [ ] Currency in SAR with ر.س symbol
- [ ] RTL flex/grid layouts
- [ ] RTL navigation (back buttons, pagination)
- [ ] RTL form inputs and labels
- [ ] RTL modal/dropdown positioning
- [ ] RTL icons (chevrons, arrows)
- [ ] Date formatting in Arabic locale

#### Responsive Design
- [ ] Mobile (< 640px) - single column grids
- [ ] Tablet (640-1024px) - 2-3 column grids
- [ ] Desktop (1024-1280px) - 3-4 column grids
- [ ] Large desktop (>1280px) - 4+ column grids
- [ ] Bottom navigation on mobile
- [ ] Sidebar navigation on desktop
- [ ] Touch targets ≥ 44x44px
- [ ] No horizontal scrolling
- [ ] Safe area insets for notches

#### Visual Design
- [ ] Brand colors: #243C32 (primary), #F5F2EA (secondary), #D6A15D (accent)
- [ ] IBM Plex Sans Arabic font loaded
- [ ] Consistent spacing (4px base unit)
- [ ] Product cards with image, name, price, store
- [ ] Buttons: primary, secondary, outline, ghost, danger
- [ ] Form inputs with validation states
- [ ] Badges for status (success, warning, danger, info)
- [ ] Loading skeletons for all async content
- [ ] Empty states with illustrations
- [ ] Error states with clear messages
- [ ] Toast notifications (success, error, warning, info)

#### Accessibility
- [ ] Semantic HTML5 elements
- [ ] ARIA labels on interactive elements
- [ ] Focus visible outlines
- [ ] Keyboard navigation
- [ ] Skip to main content link
- [ ] Alt text for all images
- [ ] Color contrast ratios (WCAG AA)
- [ ] Reduced motion support
- [ ] Screen reader compatible

### ✅ PWA Features
- [ ] Web App Manifest valid
- [ ] Service Worker registered
- [ ] Offline fallback page
- [ ] Install prompt works
- [ ] App icons (72x72 to 512x512)
- [ ] Splash screen
- [ ] Theme color in status bar
- [ ] Standalone display mode
- [ ] Push notifications (when VAPID configured)
- [ ] Notification permission after user action
- [ ] Push subscription management
- [ ] Background sync (if implemented)

### ✅ Performance
- [ ] Code splitting by routes
- [ ] Lazy loading images
- [ ] Image optimization (WebP, responsive sizes)
- [ ] TanStack Query caching
- [ ] Bundle size < 500KB gzipped
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] No console errors/warnings

### ✅ Security
- [ ] RLS enabled on all tables
- [ ] Admin policies restrict to admin role
- [ ] Representative policies restrict to own data
- [ ] No service_role key in frontend
- [ ] No VAPID private key in frontend
- [ ] Environment variables for all secrets
- [ ] Input validation (Zod schemas)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (React auto-escaping)
- [ ] CSRF protection (SameSite cookies)
- [ ] Secure headers (CSP, HSTS)

### ✅ Database & Backend
- [ ] All migrations run successfully
- [ ] Foreign keys and constraints
- [ ] Indexes on frequently queried columns
- [ ] Updated_at triggers working
- [ ] create_order function atomic
- [ ] get_representative_stats function
- [ ] get_vendor_orders function with pagination
- [ ] update_order_status with validation
- [ ] Edge Functions deployed
- [ ] Storage buckets configured
- [ ] Auth providers configured

---

### 🧪 Test Scenarios

#### Scenario 1: Complete Guest Purchase Flow
1. Open homepage
2. Browse products by category
3. Search for product
4. View product details
5. Add 2-3 products to cart (from different stores if possible)
6. View cart, update quantities
7. Proceed to checkout
8. Fill form (name, phone, address)
9. Submit order
10. Verify order success page
11. Track order with order number + phone

#### Scenario 2: Representative Management
1. Login as representative
2. Update store profile (logo, cover, description)
3. Add new product with multiple images
4. Edit product (price, stock, description)
5. Toggle product active/inactive
6. Receive new order notification
7. Accept order → preparing → ready → out for delivery → delivered
8. Reject order with reason
9. View order history
10. Check notifications page

#### Scenario 3: Admin Management
1. Login as admin
2. View dashboard stats
3. Create new representative account
4. Edit representative (toggle visibility, reset password)
5. View all products, filter by representative
6. Manage categories (add, edit, reorder, delete)
7. Manage banners (add, edit, reorder, delete)
8. View all orders, filter by status
9. Send notification to all representatives
10. Update store settings (general, delivery, appearance)

#### Scenario 4: Edge Cases
1. Network offline → verify offline page
2. Slow network → verify loading skeletons
3. Invalid phone format → verify validation
4. Out of stock product → verify disabled add to cart
5. Expired OTP → verify error handling
6. Unauthorized route access → verify redirect
7. Large image upload → verify size validation
8. Concurrent order status updates → verify validation
9. Deleted product in cart → verify handling
10. Maintenance mode → verify public access blocked

---

### 📱 Device & Browser Testing

#### Mobile Devices
- [ ] iPhone Safari (latest)
- [ ] Android Chrome (latest)
- [ ] iPad Safari
- [ ] Android tablet Chrome

#### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

#### PWA Testing
- [ ] Install on iOS (Add to Home Screen)
- [ ] Install on Android (WebAPK)
- [ ] Install on Desktop (Chrome/Edge)
- [ ] Offline mode
- [ ] Push notifications (if configured)

---

### 🚀 Deployment Verification

#### Vercel
- [ ] Build succeeds
- [ ] Environment variables set
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Preview deployments work
- [ ] Production deployment works

#### Supabase
- [ ] Database connected
- [ ] Auth configured (Email, Phone)
- [ ] Storage buckets public
- [ ] Edge Functions deployed
- [ ] Realtime enabled
- [ ] RLS policies active
- [ ] Backups configured

#### GitHub
- [ ] Repository created
- [ ] Branch protection (main)
- [ ] CI/CD workflow configured
- [ ] Secrets added (Supabase, Vercel, VAPID)
- [ ] Dependabot enabled

---

### 📝 Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Frontend Lead | | | |
| Backend Lead | | | |
| QA Lead | | | |
| Product Owner | | | |

---

**Version:** 1.0.0  
**Last Updated:** 2026-11-20