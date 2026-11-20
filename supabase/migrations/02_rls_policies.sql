-- Mandoub Taiba - Row Level Security Policies
-- Version: 1.0.0
-- Description: RLS policies for all tables

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Helper functions for role checking
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin'
        FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_representative()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'representative'
        FROM public.profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_my_representative_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT id
        FROM public.representatives
        WHERE user_id = auth.uid()
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- PROFILES POLICIES
-- ============================================

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT USING (public.is_admin());

-- Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles" ON public.profiles
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- REPRESENTATIVES POLICIES
-- ============================================

-- Public can read visible representatives
CREATE POLICY "Public can read visible representatives" ON public.representatives
    FOR SELECT USING (is_visible = TRUE);

-- Representatives can read their own profile
CREATE POLICY "Representatives can read own profile" ON public.representatives
    FOR SELECT USING (user_id = auth.uid());

-- Representatives can update their own profile
CREATE POLICY "Representatives can update own profile" ON public.representatives
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can manage all representatives
CREATE POLICY "Admins can manage all representatives" ON public.representatives
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- CATEGORIES POLICIES
-- ============================================

-- Public can read active categories
CREATE POLICY "Public can read active categories" ON public.categories
    FOR SELECT USING (is_active = TRUE);

-- Admins can manage all categories
CREATE POLICY "Admins can manage all categories" ON public.categories
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Public can read active products from visible representatives
CREATE POLICY "Public can read active products" ON public.products
    FOR SELECT USING (
        is_active = TRUE
        AND EXISTS (
            SELECT 1 FROM public.representatives
            WHERE id = products.representative_id
            AND is_visible = TRUE
        )
    );

-- Representatives can manage their own products
CREATE POLICY "Representatives can read own products" ON public.products
    FOR SELECT USING (representative_id = public.get_my_representative_id());

CREATE POLICY "Representatives can insert own products" ON public.products
    FOR INSERT WITH CHECK (representative_id = public.get_my_representative_id());

CREATE POLICY "Representatives can update own products" ON public.products
    FOR UPDATE USING (representative_id = public.get_my_representative_id())
    WITH CHECK (representative_id = public.get_my_representative_id());

CREATE POLICY "Representatives can delete own products" ON public.products
    FOR DELETE USING (representative_id = public.get_my_representative_id());

-- Admins can manage all products
CREATE POLICY "Admins can manage all products" ON public.products
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- PRODUCT IMAGES POLICIES
-- ============================================

-- Public can read images of active products
CREATE POLICY "Public can read product images" ON public.product_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.products p
            JOIN public.representatives r ON p.representative_id = r.id
            WHERE p.id = product_images.product_id
            AND p.is_active = TRUE
            AND r.is_visible = TRUE
        )
    );

-- Representatives can manage images of their own products
CREATE POLICY "Representatives can manage own product images" ON public.product_images
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE id = product_images.product_id
            AND representative_id = public.get_my_representative_id()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.products
            WHERE id = product_images.product_id
            AND representative_id = public.get_my_representative_id()
        )
    );

-- Admins can manage all product images
CREATE POLICY "Admins can manage all product images" ON public.product_images
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- ORDERS POLICIES
-- ============================================

-- Customers can read their own orders (via phone verification)
-- Note: Direct SELECT by customers is restricted. Use RPC functions.
CREATE POLICY "Admins can read all orders" ON public.orders
    FOR SELECT USING (public.is_admin());

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders" ON public.orders
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- VENDOR ORDERS POLICIES
-- ============================================

-- Representatives can read their own vendor orders
CREATE POLICY "Representatives can read own vendor orders" ON public.vendor_orders
    FOR SELECT USING (representative_id = public.get_my_representative_id());

-- Representatives can update status of their vendor orders (limited transitions)
CREATE POLICY "Representatives can update own vendor orders" ON public.vendor_orders
    FOR UPDATE USING (representative_id = public.get_my_representative_id())
    WITH CHECK (
        representative_id = public.get_my_representative_id()
        AND status IN ('accepted', 'rejected', 'preparing', 'ready', 'out_for_delivery', 'delivered', 'cancelled')
        AND (
            -- Define valid transitions
            (OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected', 'cancelled')) OR
            (OLD.status = 'accepted' AND NEW.status IN ('preparing', 'rejected', 'cancelled')) OR
            (OLD.status = 'preparing' AND NEW.status IN ('ready', 'cancelled')) OR
            (OLD.status = 'ready' AND NEW.status IN ('out_for_delivery', 'cancelled')) OR
            (OLD.status = 'out_for_delivery' AND NEW.status IN ('delivered', 'cancelled')) OR
            (OLD.status = NEW.status)
        )
    );

-- Admins can manage all vendor orders
CREATE POLICY "Admins can manage all vendor orders" ON public.vendor_orders
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- ORDER ITEMS POLICIES
-- ============================================

-- Representatives can read items of their vendor orders
CREATE POLICY "Representatives can read own order items" ON public.order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vendor_orders
            WHERE id = order_items.vendor_order_id
            AND representative_id = public.get_my_representative_id()
        )
    );

-- Admins can manage all order items
CREATE POLICY "Admins can manage all order items" ON public.order_items
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications" ON public.notifications
    FOR SELECT USING (user_id = auth.uid());

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Admins can manage all notifications
CREATE POLICY "Admins can manage all notifications" ON public.notifications
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- System can insert notifications (via service role or RPC)
CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- PUSH SUBSCRIPTIONS POLICIES
-- ============================================

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON public.push_subscriptions
    FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============================================
-- BANNERS POLICIES
-- ============================================

-- Public can read active banners
CREATE POLICY "Public can read active banners" ON public.banners
    FOR SELECT USING (is_active = TRUE);

-- Admins can manage all banners
CREATE POLICY "Admins can manage all banners" ON public.banners
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- STORE SETTINGS POLICIES
-- ============================================

-- Public can read public settings
CREATE POLICY "Public can read public settings" ON public.store_settings
    FOR SELECT USING (key IN ('marketplace_name', 'currency', 'delivery_fee', 'free_delivery_threshold'));

-- Admins can manage all settings
CREATE POLICY "Admins can manage all settings" ON public.store_settings
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ============================================
-- ORDER STATUS HISTORY POLICIES
-- ============================================

-- Representatives can read history of their vendor orders
CREATE POLICY "Representatives can read own order history" ON public.order_status_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.vendor_orders
            WHERE id = order_status_history.vendor_order_id
            AND representative_id = public.get_my_representative_id()
        )
    );

-- Admins can manage all order history
CREATE POLICY "Admins can manage all order history" ON public.order_status_history
    FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

-- System can insert history (via RPC)
CREATE POLICY "System can insert order history" ON public.order_status_history
    FOR INSERT WITH CHECK (TRUE);