-- Mandoub Taiba - Seed Data
-- Version: 1.0.0
-- Description: Sample data for development and testing

-- Note: This seed data is for DEVELOPMENT ONLY
-- Do not run in production without modification

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
-- STORE SETTINGS (Additional)
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
-- BANNERS (Sample)
-- ============================================

INSERT INTO public.banners (title, image_url, target_url, sort_order, is_active) VALUES
    ('عروض الصيف الحصرية', '/images/banners/summer-sale.jpg', '/products?sale=true', 1, TRUE),
    ('أجهزة ذكية بأسعار مخفضة', '/images/banners/tech-sale.jpg', '/categories/electronics', 2, TRUE),
    ('أزياء الموسم الجديد', '/images/banners/fashion-new.jpg', '/categories/fashion', 3, TRUE)
ON CONFLICT DO NOTHING;

-- ============================================
-- NOTE: The following data requires auth.users to exist
-- Run these after creating test users via Supabase Auth
-- ============================================

/*
-- Example: Create admin user (run in Supabase SQL editor after creating auth user)
-- INSERT INTO public.profiles (id, full_name, email, role) VALUES
--     ('<admin-user-uuid>', 'مدير النظام', 'admin@mandoubtaiba.sa', 'admin');

-- Example: Create representative users
-- INSERT INTO public.profiles (id, full_name, email, phone, role) VALUES
--     ('<rep1-user-uuid>', 'أحمد محمد', 'ahmed@store1.com', '+966501234567', 'representative'),
--     ('<rep2-user-uuid>', 'فاطمة علي', 'fatima@store2.com', '+966507654321', 'representative');

-- Example: Create representatives
-- INSERT INTO public.representatives (user_id, store_name, store_slug, description, phone, location, is_visible) VALUES
--     ('<rep1-user-uuid>', 'متجر أحمد للإلكترونيات', 'ahmed-electronics', 'أفضل الأسعار للإلكترونيات والأجهزة الذكية', '+966501234567', 'الرياض', TRUE),
--     ('<rep2-user-uuid>', 'بوتيك فاطمة للأزياء', 'fatima-fashion', 'أحدث صيحات الموضة والأزياء النسائية', '+966507654321', 'جدة', TRUE);

-- Example: Create products (after representatives exist)
-- INSERT INTO public.products (representative_id, category_id, name, slug, description, price, discount_price, stock_quantity, main_image, is_active) VALUES
--     (<rep1-id>, <electronics-cat-id>, 'آيفون 15 برو', 'iphone-15-pro', 'أحدث آيفون من آبل مع شريحة A17 برو', 4999.00, 4799.00, 10, '/images/products/iphone15pro.jpg', TRUE),
--     (<rep1-id>, <electronics-cat-id>, 'سامسونج جالكسي S24', 'samsung-galaxy-s24', 'هاتف ذكي رائد من سامسونج', 3999.00, 3799.00, 15, '/images/products/galaxys24.jpg', TRUE),
--     (<rep2-id>, <fashion-cat-id>, 'فستان سهرة أنيق', 'elegant-evening-dress', 'فستان سهرة بقماش فاخر وتصميم عصري', 299.00, 249.00, 20, '/images/products/evening-dress.jpg', TRUE);
*/

-- ============================================
-- DEVELOPMENT HELPER: Create test users via SQL (for local dev only)
-- ============================================

-- This section is for LOCAL DEVELOPMENT ONLY with Supabase local dev
-- In production, users are created via Supabase Auth UI or API

DO $$
DECLARE
    v_admin_id UUID;
    v_rep1_id UUID;
    v_rep2_id UUID;
    v_cat_electronics UUID;
    v_cat_fashion UUID;
    v_cat_home UUID;
BEGIN
    -- Only run if in development (check for existing data)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'admin@local.dev') THEN
        -- Create test admin (password: admin123)
        v_admin_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data, raw_user_meta_data)
        VALUES (
            v_admin_id,
            'admin@local.dev',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            'authenticated',
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "مدير التطوير", "role": "admin"}'
        );
        INSERT INTO public.profiles (id, full_name, email, role) VALUES
            (v_admin_id, 'مدير التطوير', 'admin@local.dev', 'admin');
    END IF;

    -- Create test representative 1
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'rep1@local.dev') THEN
        v_rep1_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data, raw_user_meta_data)
        VALUES (
            v_rep1_id,
            'rep1@local.dev',
            crypt('rep123456', gen_salt('bf')),
            NOW(),
            'authenticated',
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "أحمد محمد", "role": "representative"}'
        );
        INSERT INTO public.profiles (id, full_name, email, phone, role) VALUES
            (v_rep1_id, 'أحمد محمد', 'rep1@local.dev', '+966501234567', 'representative');
    END IF;

    -- Create test representative 2
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE email = 'rep2@local.dev') THEN
        v_rep2_id := gen_random_uuid();
        INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data, raw_user_meta_data)
        VALUES (
            v_rep2_id,
            'rep2@local.dev',
            crypt('rep123456', gen_salt('bf')),
            NOW(),
            'authenticated',
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "فاطمة علي", "role": "representative"}'
        );
        INSERT INTO public.profiles (id, full_name, email, phone, role) VALUES
            (v_rep2_id, 'فاطمة علي', 'rep2@local.dev', '+966507654321', 'representative');
    END IF;

    -- Get category IDs
    SELECT id INTO v_cat_electronics FROM public.categories WHERE slug = 'electronics';
    SELECT id INTO v_cat_fashion FROM public.categories WHERE slug = 'fashion';
    SELECT id INTO v_cat_home FROM public.categories WHERE slug = 'home-garden';

    -- Create representatives
    IF NOT EXISTS (SELECT 1 FROM public.representatives WHERE user_id = v_rep1_id) THEN
        INSERT INTO public.representatives (user_id, store_name, store_slug, description, phone, location, is_visible)
        VALUES (
            v_rep1_id,
            'متجر أحمد للإلكترونيات',
            'ahmed-electronics',
            'أفضل الأسعار للإلكترونيات والأجهزة الذكية - ضمان عامين على جميع المنتجات',
            '+966501234567',
            'الرياض، حي العليا',
            TRUE
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.representatives WHERE user_id = v_rep2_id) THEN
        INSERT INTO public.representatives (user_id, store_name, store_slug, description, phone, location, is_visible)
        VALUES (
            v_rep2_id,
            'بوتيك فاطمة للأزياء',
            'fatima-fashion',
            'أحدث صيحات الموضة والأزياء النسائية - شحن مجاني للطلبات فوق 200 ريال',
            '+966507654321',
            'جدة، حي الروضة',
            TRUE
        );
    END IF;

    -- Create sample products
    IF v_cat_electronics IS NOT NULL AND v_rep1_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'iphone-15-pro' AND representative_id = v_rep1_id) THEN
            INSERT INTO public.products (representative_id, category_id, name, slug, description, price, discount_price, stock_quantity, main_image, is_active)
            VALUES
                (v_rep1_id, v_cat_electronics, 'آيفون 15 برو 256 جيجا', 'iphone-15-pro', 'أحدث آيفون من آبل مع شريحة A17 برو، كاميرا 48 ميجابكسل، شاشة 6.1 بوصة Super Retina XDR', 4999.00, 4799.00, 10, '/images/products/iphone15pro.jpg', TRUE),
                (v_rep1_id, v_cat_electronics, 'سامسونج جالكسي S24 ألترا', 'samsung-galaxy-s24-ultra', 'هاتف ذكي رائد مع قلم S Pen، كاميرا 200 ميجابكسل، شاشة 6.8 بوصة Dynamic AMOLED 2X', 4799.00, 4499.00, 8, '/images/products/galaxys24ultra.jpg', TRUE),
                (v_rep1_id, v_cat_electronics, 'سماعات آيربودز برو 2', 'airpods-pro-2', 'سماعات لاسلكية مع إلغاء ضوضاء نشط، صوت مكاني، شحن MagSafe', 899.00, 799.00, 25, '/images/products/airpodspro2.jpg', TRUE),
                (v_rep1_id, v_cat_electronics, 'آيباد إير M2', 'ipad-air-m2', 'جهاز لوحي قوي مع شريحة M2، شاشة 11 بوصة Liquid Retina، يدعم قلم آبل', 2799.00, 2599.00, 12, '/images/products/ipadair.jpg', TRUE);
        END IF;
    END IF;

    IF v_cat_fashion IS NOT NULL AND v_rep2_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'elegant-evening-dress' AND representative_id = v_rep2_id) THEN
            INSERT INTO public.products (representative_id, category_id, name, slug, description, price, discount_price, stock_quantity, main_image, is_active)
            VALUES
                (v_rep2_id, v_cat_fashion, 'فستان سهرة أنيق أسود', 'elegant-evening-dress', 'فستان سهرة بقماش شيفون فاخر، تصميم بدون أكمام، حزام خصر قابل للتعديل', 299.00, 249.00, 20, '/images/products/evening-dress.jpg', TRUE),
                (v_rep2_id, v_cat_fashion, 'حقيبة يد جلدية بنية', 'leather-handbag-brown', 'حقيبة يد من جلد طبيعي 100%، سعة كبيرة، جيب داخلي بسحاب، حزام كتف قابل للفصل', 399.00, 349.00, 15, '/images/products/leather-bag.jpg', TRUE),
                (v_rep2_id, v_cat_fashion, 'حذاء كعب متوسط أسود', 'black-mid-heel-shoes', 'حذاء بكعب متوسط 6 سم، جلد ناعم، نعل مريح، مناسب للعمل والمناسبات', 199.00, 169.00, 30, '/images/products/heels.jpg', TRUE),
                (v_rep2_id, v_cat_fashion, 'عباءة حريرية ملونة', 'silk-abaya-colorful', 'عباءة من الحرير الطبيعي، ألوان عصرية، تطريز يدوي على الأكمام', 449.00, 399.00, 10, '/images/products/silk-abaya.jpg', TRUE);
        END IF;
    END IF;

    IF v_cat_home IS NOT NULL AND v_rep1_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.products WHERE slug = 'smart-air-fryer' AND representative_id = v_rep1_id) THEN
            INSERT INTO public.products (representative_id, category_id, name, slug, description, price, discount_price, stock_quantity, main_image, is_active)
            VALUES
                (v_rep1_id, v_cat_home, 'قلاية هوائية ذكية 5 لتر', 'smart-air-fryer', 'قلاية هوائية بتقنية Rapid Air، تحكم عبر التطبيق، 10 برامج طهي مسبقة، سهلة التنظيف', 449.00, 399.00, 18, '/images/products/airfryer.jpg', TRUE),
                (v_rep1_id, v_cat_home, 'مكنسة روبوتية ذكية', 'robot-vacuum', 'مكنسة روبوتية بملاحة ليزر، شفط قوي 4000 باسكال، مسح ومسح، تحكم صوتي', 1299.00, 1099.00, 8, '/images/products/robotvacuum.jpg', TRUE);
        END IF;
    END IF;
END $$;