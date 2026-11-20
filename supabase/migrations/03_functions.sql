-- Mandoub Taiba - Database Functions
-- Version: 1.0.0
-- Description: PostgreSQL functions for business logic

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate unique order number
CREATE OR REPLACE FUNCTION public.generate_order_number()
RETURNS TEXT AS $$
DECLARE
    order_num TEXT;
    counter INTEGER := 0;
BEGIN
    LOOP
        order_num := 'MT-' || TO_CHAR(NOW(), 'YYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
        IF NOT EXISTS (SELECT 1 FROM public.orders WHERE order_number = order_num) THEN
            RETURN order_num;
        END IF;
        counter := counter + 1;
        IF counter > 10 THEN
            RAISE EXCEPTION 'Failed to generate unique order number';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- ============================================
-- CREATE ORDER FUNCTION (Main checkout logic)
-- ============================================

CREATE OR REPLACE FUNCTION public.create_order(
    p_customer_name TEXT,
    p_customer_phone TEXT,
    p_delivery_address TEXT,
    p_notes TEXT,
    p_cart_items JSONB
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_subtotal NUMERIC(12,2) := 0;
    v_delivery_fee NUMERIC(12,2) := 15.00;
    v_total NUMERIC(12,2) := 0;
    v_free_delivery_threshold NUMERIC(12,2) := 200.00;
    v_cart_item JSONB;
    v_product_id UUID;
    v_quantity INTEGER;
    v_rep_id UUID;
    v_product RECORD;
    v_rep_orders JSONB := '{}'::JSONB;
    v_vendor_order_id UUID;
    v_item_total NUMERIC(12,2);
BEGIN
    -- Validate cart is not empty
    IF p_cart_items IS NULL OR jsonb_array_length(p_cart_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty';
    END IF;

    -- Generate order number
    v_order_number := public.generate_order_number();

    -- Process each cart item - validate stock and prices
    FOR v_cart_item IN SELECT * FROM jsonb_array_elements(p_cart_items)
    LOOP
        v_product_id := (v_cart_item->>'product_id')::UUID;
        v_quantity := (v_cart_item->>'quantity')::INTEGER;

        -- Lock product row for update
        SELECT id, representative_id, price, discount_price, stock_quantity, is_active
        INTO v_product
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product not found: %', v_product_id;
        END IF;

        IF NOT v_product.is_active THEN
            RAISE EXCEPTION 'Product is not active: %', v_product_id;
        END IF;

        IF v_product.stock_quantity < v_quantity THEN
            RAISE EXCEPTION 'Insufficient stock for product: %', v_product_id;
        END IF;

        -- Calculate item total using current price
        v_item_total := COALESCE(v_product.discount_price, v_product.price) * v_quantity;
        v_subtotal := v_subtotal + v_item_total;

        -- Group by representative
        v_rep_id := v_product.representative_id;
        v_rep_orders := jsonb_set(
            v_rep_orders,
            ARRAY[v_rep_id::TEXT],
            COALESCE(v_rep_orders->v_rep_id::TEXT, '[]'::JSONB) || jsonb_build_object(
                'product_id', v_product_id,
                'quantity', v_quantity,
                'price', COALESCE(v_product.discount_price, v_product.price),
                'product_name', (SELECT name FROM public.products WHERE id = v_product_id)
            )
        );
    END LOOP;

    -- Calculate delivery fee
    IF v_subtotal >= v_free_delivery_threshold THEN
        v_delivery_fee := 0;
    END IF;
    v_total := v_subtotal + v_delivery_fee;

    -- Create parent order
    INSERT INTO public.orders (
        order_number,
        customer_name,
        customer_phone,
        customer_phone_verified,
        delivery_address,
        notes,
        subtotal,
        delivery_fee,
        total,
        status
    ) VALUES (
        v_order_number,
        p_customer_name,
        p_customer_phone,
        FALSE, -- Will be verified via OTP
        p_delivery_address,
        p_notes,
        v_subtotal,
        v_delivery_fee,
        v_total,
        'pending'
    ) RETURNING id INTO v_order_id;

    -- Create vendor orders and order items
    FOR v_rep_id IN SELECT DISTINCT jsonb_object_keys(v_rep_orders)
    LOOP
        DECLARE
            v_rep_subtotal NUMERIC(12,2) := 0;
            v_rep_delivery_fee NUMERIC(12,2) := 15.00;
            v_rep_total NUMERIC(12,2) := 0;
            v_item JSONB;
        BEGIN
            -- Calculate representative subtotal
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_rep_orders->v_rep_id)
            LOOP
                v_rep_subtotal := v_rep_subtotal + ((v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER);
            END LOOP;

            -- Delivery fee per representative (can be customized)
            IF v_rep_subtotal >= v_free_delivery_threshold THEN
                v_rep_delivery_fee := 0;
            END IF;
            v_rep_total := v_rep_subtotal + v_rep_delivery_fee;

            -- Create vendor order
            INSERT INTO public.vendor_orders (
                order_id,
                representative_id,
                subtotal,
                delivery_fee,
                total,
                status
            ) VALUES (
                v_order_id,
                v_rep_id::UUID,
                v_rep_subtotal,
                v_rep_delivery_fee,
                v_rep_total,
                'pending'
            ) RETURNING id INTO v_vendor_order_id;

            -- Create order items and update stock
            FOR v_item IN SELECT * FROM jsonb_array_elements(v_rep_orders->v_rep_id)
            LOOP
                DECLARE
                    v_item_total NUMERIC(12,2) := ((v_item->>'price')::NUMERIC * (v_item->>'quantity')::INTEGER);
                    v_prod_name TEXT := (v_item->>'product_name')::TEXT;
                BEGIN
                    INSERT INTO public.order_items (
                        vendor_order_id,
                        product_id,
                        product_name_snapshot,
                        product_price_snapshot,
                        quantity,
                        total
                    ) VALUES (
                        v_vendor_order_id,
                        (v_item->>'product_id')::UUID,
                        v_prod_name,
                        (v_item->>'price')::NUMERIC,
                        (v_item->>'quantity')::INTEGER,
                        v_item_total
                    );

                    -- Update stock
                    UPDATE public.products
                    SET stock_quantity = stock_quantity - (v_item->>'quantity')::INTEGER
                    WHERE id = (v_item->>'product_id')::UUID;
                END;
            END LOOP;
        END;
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- ============================================
-- GET REPRESENTATIVE STATS
-- ============================================

CREATE OR REPLACE FUNCTION public.get_representative_stats(p_rep_id UUID)
RETURNS TABLE (
    total_products BIGINT,
    active_products BIGINT,
    total_orders BIGINT,
    pending_orders BIGINT,
    completed_orders BIGINT,
    total_sales NUMERIC(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.products WHERE representative_id = p_rep_id) AS total_products,
        (SELECT COUNT(*) FROM public.products WHERE representative_id = p_rep_id AND is_active = TRUE) AS active_products,
        (SELECT COUNT(*) FROM public.vendor_orders WHERE representative_id = p_rep_id) AS total_orders,
        (SELECT COUNT(*) FROM public.vendor_orders WHERE representative_id = p_rep_id AND status = 'pending') AS pending_orders,
        (SELECT COUNT(*) FROM public.vendor_orders WHERE representative_id = p_rep_id AND status = 'delivered') AS completed_orders,
        (SELECT COALESCE(SUM(total), 0) FROM public.vendor_orders WHERE representative_id = p_rep_id AND status = 'delivered') AS total_sales;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- GET VENDOR ORDERS (with pagination)
-- ============================================

CREATE OR REPLACE FUNCTION public.get_vendor_orders(
    p_rep_id UUID,
    p_status TEXT DEFAULT NULL,
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    order_id UUID,
    representative_id UUID,
    subtotal NUMERIC(12,2),
    delivery_fee NUMERIC(12,2),
    total NUMERIC(12,2),
    status TEXT,
    created_at TIMESTAMPTZ,
    order_number TEXT,
    customer_name TEXT,
    customer_phone TEXT,
    delivery_address TEXT,
    items JSONB
) AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_page_size;
BEGIN
    RETURN QUERY
    SELECT
        vo.id,
        vo.order_id,
        vo.representative_id,
        vo.subtotal,
        vo.delivery_fee,
        vo.total,
        vo.status,
        vo.created_at,
        o.order_number,
        o.customer_name,
        o.customer_phone,
        o.delivery_address,
        (
            SELECT jsonb_agg(jsonb_build_object(
                'id', oi.id,
                'product_id', oi.product_id,
                'product_name', oi.product_name_snapshot,
                'price', oi.product_price_snapshot,
                'quantity', oi.quantity,
                'total', oi.total,
                'product_image', p.main_image
            ))
            FROM public.order_items oi
            LEFT JOIN public.products p ON oi.product_id = p.id
            WHERE oi.vendor_order_id = vo.id
        ) AS items
    FROM public.vendor_orders vo
    JOIN public.orders o ON vo.order_id = o.id
    WHERE vo.representative_id = p_rep_id
    AND (p_status IS NULL OR vo.status = p_status)
    ORDER BY vo.created_at DESC
    LIMIT p_page_size OFFSET v_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- UPDATE ORDER STATUS (with validation & history)
-- ============================================

CREATE OR REPLACE FUNCTION public.update_order_status(
    p_vendor_order_id UUID,
    p_new_status TEXT,
    p_changed_by UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_status TEXT;
    v_rep_id UUID;
    v_valid_transition BOOLEAN := FALSE;
BEGIN
    -- Get current status and representative
    SELECT status, representative_id
    INTO v_old_status, v_rep_id
    FROM public.vendor_orders
    WHERE id = p_vendor_order_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Vendor order not found';
    END IF;

    -- Validate authorization
    IF v_rep_id != public.get_my_representative_id() AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Not your vendor order';
    END IF;

    -- Validate status transition
    v_valid_transition := CASE
        WHEN v_old_status = 'pending' AND p_new_status IN ('accepted', 'rejected', 'cancelled') THEN TRUE
        WHEN v_old_status = 'accepted' AND p_new_status IN ('preparing', 'rejected', 'cancelled') THEN TRUE
        WHEN v_old_status = 'preparing' AND p_new_status IN ('ready', 'cancelled') THEN TRUE
        WHEN v_old_status = 'ready' AND p_new_status IN ('out_for_delivery', 'cancelled') THEN TRUE
        WHEN v_old_status = 'out_for_delivery' AND p_new_status IN ('delivered', 'cancelled') THEN TRUE
        WHEN v_old_status = p_new_status THEN TRUE
        ELSE FALSE
    END;

    IF NOT v_valid_transition THEN
        RAISE EXCEPTION 'Invalid status transition from % to %', v_old_status, p_new_status;
    END IF;

    -- Update status
    UPDATE public.vendor_orders
    SET status = p_new_status,
        updated_at = NOW()
    WHERE id = p_vendor_order_id;

    -- Record history
    INSERT INTO public.order_status_history (
        vendor_order_id,
        old_status,
        new_status,
        changed_by
    ) VALUES (
        p_vendor_order_id,
        v_old_status,
        p_new_status,
        p_changed_by
    );

    -- Create notification for customer
    -- This would be done via a trigger or application logic

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER VOLATILE;

-- ============================================
-- SEARCH PRODUCTS
-- ============================================

CREATE OR REPLACE FUNCTION public.search_products(
    p_query TEXT DEFAULT NULL,
    p_category_id UUID DEFAULT NULL,
    p_min_price NUMERIC DEFAULT NULL,
    p_max_price NUMERIC DEFAULT NULL,
    p_representative_id UUID DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'newest',
    p_page INTEGER DEFAULT 1,
    p_page_size INTEGER DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    representative_id UUID,
    category_id UUID,
    name TEXT,
    slug TEXT,
    description TEXT,
    price NUMERIC(12,2),
    discount_price NUMERIC(12,2),
    stock_quantity INTEGER,
    main_image TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    representative_name TEXT,
    representative_slug TEXT,
    category_name TEXT,
    category_slug TEXT
) AS $$
DECLARE
    v_offset INTEGER := (p_page - 1) * p_page_size;
    v_order_by TEXT;
BEGIN
    v_order_by := CASE p_sort_by
        WHEN 'price_asc' THEN 'price ASC'
        WHEN 'price_desc' THEN 'price DESC'
        WHEN 'popular' THEN 'created_at DESC' -- Could be enhanced with order count
        ELSE 'created_at DESC'
    END;

    RETURN QUERY EXECUTE format(
        'SELECT
            p.id, p.representative_id, p.category_id, p.name, p.slug, p.description,
            p.price, p.discount_price, p.stock_quantity, p.main_image, p.is_active,
            p.created_at, p.updated_at,
            r.store_name AS representative_name,
            r.store_slug AS representative_slug,
            c.name AS category_name,
            c.slug AS category_slug
        FROM public.products p
        JOIN public.representatives r ON p.representative_id = r.id
        JOIN public.categories c ON p.category_id = c.id
        WHERE p.is_active = TRUE
        AND r.is_visible = TRUE
        %s %s %s %s %s
        ORDER BY %s
        LIMIT %s OFFSET %s',
        CASE WHEN p_query IS NOT NULL THEN 'AND p.name ILIKE %L' ELSE '' END,
        CASE WHEN p_category_id IS NOT NULL THEN 'AND p.category_id = %L' ELSE '' END,
        CASE WHEN p_min_price IS NOT NULL THEN 'AND p.price >= %L' ELSE '' END,
        CASE WHEN p_max_price IS NOT NULL THEN 'AND p.price <= %L' ELSE '' END,
        CASE WHEN p_representative_id IS NOT NULL THEN 'AND p.representative_id = %L' ELSE '' END,
        v_order_by,
        p_page_size,
        v_offset
    ) USING p_query, p_category_id, p_min_price, p_max_price, p_representative_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================
-- INITIAL STORE SETTINGS
-- ============================================

INSERT INTO public.store_settings (key, value) VALUES
    ('marketplace_name', 'مندوب طيبة'),
    ('marketplace_tagline', 'متجرك المحلي.. أقرب إليك'),
    ('currency', 'SAR'),
    ('currency_symbol', 'ر.س'),
    ('delivery_fee', '15'),
    ('free_delivery_threshold', '200'),
    ('contact_phone', '920000000'),
    ('contact_email', 'support@mandoubtaiba.sa'),
    ('address', 'المملكة العربية السعودية'),
    ('social_facebook', ''),
    ('social_twitter', ''),
    ('social_instagram', ''),
    ('social_snapchat', '')
ON CONFLICT (key) DO NOTHING;