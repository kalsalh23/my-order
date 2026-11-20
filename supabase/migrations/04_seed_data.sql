-- Mandoub Taiba - Seed Data
-- Version: 1.0.0
-- Description: Sample catalog data for development and testing
-- Note: Kept extension-free (no pgcrypto/uuid-ossp) so it applies on hosted Supabase

-- Categories
INSERT INTO public.categories (id, name, slug, image_url, sort_order, is_active) VALUES
  ('44444444-0000-0000-0000-000000000001', 'الإلكترونيات', 'electronics', NULL, 1, true),
  ('55555555-0000-0000-0000-000000000002', 'الأزياء والموضة', 'fashion', NULL, 2, true),
  ('66666666-0000-0000-0000-000000000003', 'المنزل والحديقة', 'home-garden', NULL, 3, true)
ON CONFLICT (slug) DO NOTHING;

-- Store settings
INSERT INTO public.store_settings (key, value) VALUES
  ('marketplace_name', 'مندوب طيبة'),
  ('currency', 'SAR'),
  ('delivery_fee', '25'),
  ('free_delivery_threshold', '200')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- Banners
INSERT INTO public.banners (id, title, image_url, target_url, sort_order, is_active) VALUES
  ('77777777-0000-0000-0000-000000000001', 'رمضان كريم', '/images/placeholder-product.svg', '/products?category=fashion', 1, true),
  ('88888888-0000-0000-0000-000000000002', 'تخفيضات نهاية الموسم', '/images/placeholder-product.svg', '/products?category=electronics', 2, true)
ON CONFLICT (id) DO NOTHING;
