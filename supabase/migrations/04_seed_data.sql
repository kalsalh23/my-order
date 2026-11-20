-- Mandoub Taiba - Seed Data
-- Version: 1.0.0
-- Description: Sample reference data for development and testing
-- Note: This seed data is for DEVELOPMENT ONLY
-- Auth users must be created via Supabase Auth dashboard/API, not via SQL

-- ============================================
-- CATEGORIES
-- ============================================

INSERT INTO public.categories (name, slug, image_url, sort_order, is_active) VALUES
    ('إلكترونيات', 'electronics', '/images/categories/electronics.jpg', 1, TRUE),
    ('أزياء', 'fashion', '/images/categories/fashion.jpg', 2, TRUE),
    ('منزل وحديقة', 'home-garden', '/images/categories/home-garden.jpg', 3, TRUE),
    ('صحة وجمال', 'health-beauty', '/images/categories/health-beauty.jpg', 4, TRUE),
    ('رياضة ولياقة', 'sports-fitness', '/images/categories/sports-fitness.jpg', 5, TRUE),
    ('أطفال ورضع', 'kids-babies', '/images/categories/kids-babies.jpg', 6, TRUE),
    ('سيارات', 'automotive', '/images/categories/automotive.jpg', 7, TRUE),
    ('كتب ومكتبة', 'books', '/images/categories/books.jpg', 8, TRUE),
    ('ألعاب', 'toys', '/images/categories/toys.jpg', 9, TRUE),
    ('أطعمة ومشروبات', 'food-beverages', '/images/categories/food-beverages.jpg', 10, TRUE)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- STORE SETTINGS
-- ============================================

INSERT INTO public.store_settings (key, value) VALUES
    ('maintenance_mode', 'false'),
    ('registration_enabled', 'true'),
    ('guest_checkout_enabled', 'true'),
    ('phone_verification_required', 'true'),
    ('max_images_per_product', '5'),
    ('max_file_size_mb', '5'),
    ('allowed_image_types', '["image/jpeg", "image/png", "image/webp"]'),
    ('default_product_status', 'active'),
    ('auto_approve_products', 'true'),
    ('order_auto_cancel_hours', '24'),
    ('review_enabled', 'true'),
    ('wishlist_enabled', 'true')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- BANNERS
-- ============================================

INSERT INTO public.banners (title, image_url, target_url, sort_order, is_active) VALUES
    ('عروض الصيف الحصرية', '/images/banners/summer-sale.jpg', '/products?sale=true', 1, TRUE),
    ('أجهزة ذكية بأسعار مخفضة', '/images/banners/tech-sale.jpg', '/categories/electronics', 2, TRUE),
    ('أزياء الموسم الجديد', '/images/banners/fashion-new.jpg', '/categories/fashion', 3, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTE: Auth users and sample products
-- ============================================
-- Create test users via Supabase Auth dashboard or API:
--   https://app.supabase.com/project/kqodfuipbveupvshvfnr/auth/users
-- Then create profiles, representatives, and products via SQL or the app UI.
-- Do NOT insert directly into auth.users (managed by GoTrue).
