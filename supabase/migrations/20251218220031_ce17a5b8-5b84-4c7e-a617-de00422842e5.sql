-- Fix 1: Add length constraint on orders.notes to prevent database bloat
ALTER TABLE orders ADD CONSTRAINT orders_notes_length CHECK (char_length(notes) <= 500);

-- Fix 2: Restrict storage policies to admin users only
DROP POLICY IF EXISTS "Authenticated users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete product images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update product images" ON storage.objects;

CREATE POLICY "Admin users can upload product images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin users can update product images" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin users can delete product images" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'admin'::app_role));

-- Keep public read for product images
CREATE POLICY "Anyone can view product images" ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Fix 3: Remove public coupon read and create secure validation RPC
DROP POLICY IF EXISTS "Anyone can read active coupons" ON coupons;

-- Create a secure coupon validation function that doesn't expose coupon details
CREATE OR REPLACE FUNCTION public.validate_coupon_code(p_code text, p_order_amount numeric)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_discount numeric;
BEGIN
  -- Find the coupon
  SELECT * INTO v_coupon 
  FROM coupons 
  WHERE code = UPPER(TRIM(p_code)) AND is_active = true;
  
  -- Validate coupon exists
  IF NOT FOUND THEN
    RETURN json_build_object('valid', false, 'error', 'كود الكوبون غير صالح');
  END IF;
  
  -- Check expiration
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN json_build_object('valid', false, 'error', 'انتهت صلاحية الكوبون');
  END IF;
  
  -- Check max uses
  IF v_coupon.max_uses IS NOT NULL AND COALESCE(v_coupon.used_count, 0) >= v_coupon.max_uses THEN
    RETURN json_build_object('valid', false, 'error', 'تم استنفاد عدد استخدامات الكوبون');
  END IF;
  
  -- Check min order amount
  IF v_coupon.min_order_amount IS NOT NULL AND p_order_amount < v_coupon.min_order_amount THEN
    RETURN json_build_object('valid', false, 'error', 'الحد الأدنى للطلب هو ' || v_coupon.min_order_amount || ' دج');
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := p_order_amount * (v_coupon.discount_value / 100);
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_order_amount);
  END IF;
  
  -- Return success with only necessary info (not exposing code details)
  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'calculated_discount', v_discount
  );
END;
$$;

-- Fix 4: Improve stock management functions with order validation
-- Replace decrease_product_stock to verify order exists first
CREATE OR REPLACE FUNCTION public.decrease_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order_exists boolean;
BEGIN
  -- Verify that a recent order exists for this product (within last 5 minutes)
  -- This prevents direct RPC abuse without going through checkout flow
  SELECT EXISTS (
    SELECT 1 FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    WHERE oi.product_id = p_product_id
      AND oi.quantity = p_quantity
      AND o.created_at >= NOW() - INTERVAL '5 minutes'
  ) INTO v_order_exists;
  
  IF NOT v_order_exists THEN
    RAISE EXCEPTION 'No valid recent order found for this product';
  END IF;
  
  UPDATE public.products 
  SET stock = GREATEST(0, COALESCE(stock, 0) - p_quantity)
  WHERE id = p_product_id;
END;
$$;

-- Replace increase_product_stock to require admin role
CREATE OR REPLACE FUNCTION public.increase_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins should be able to increase stock
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Only admins can increase product stock';
  END IF;
  
  UPDATE public.products 
  SET stock = COALESCE(stock, 0) + p_quantity
  WHERE id = p_product_id;
END;
$$;