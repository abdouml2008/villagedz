-- Create junction table for coupon-product relationship
CREATE TABLE public.coupon_products (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (coupon_id, product_id)
);

-- Enable RLS
ALTER TABLE public.coupon_products ENABLE ROW LEVEL SECURITY;

-- Admin can manage coupon_products
CREATE POLICY "Admin users can manage coupon_products"
ON public.coupon_products
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can read coupon_products (needed for checkout validation)
CREATE POLICY "Anyone can read coupon_products"
ON public.coupon_products
FOR SELECT
USING (true);

-- Add applies_to_all column to coupons table (true = all products, false = specific products)
ALTER TABLE public.coupons ADD COLUMN applies_to_all boolean DEFAULT true;

-- Update validate_coupon_code function to check product eligibility
CREATE OR REPLACE FUNCTION public.validate_coupon_code(p_code text, p_order_amount numeric, p_product_ids uuid[] DEFAULT NULL)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_discount numeric;
  v_eligible_count integer;
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
  
  -- Check product eligibility if coupon is for specific products
  IF v_coupon.applies_to_all = false AND p_product_ids IS NOT NULL THEN
    SELECT COUNT(*) INTO v_eligible_count
    FROM coupon_products cp
    WHERE cp.coupon_id = v_coupon.id
      AND cp.product_id = ANY(p_product_ids);
    
    IF v_eligible_count = 0 THEN
      RETURN json_build_object('valid', false, 'error', 'الكوبون لا ينطبق على المنتجات المحددة');
    END IF;
  END IF;
  
  -- Calculate discount
  IF v_coupon.discount_type = 'percentage' THEN
    v_discount := p_order_amount * (v_coupon.discount_value / 100);
  ELSE
    v_discount := LEAST(v_coupon.discount_value, p_order_amount);
  END IF;
  
  -- Return success with coupon details
  RETURN json_build_object(
    'valid', true,
    'coupon_id', v_coupon.id,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'calculated_discount', v_discount,
    'applies_to_all', v_coupon.applies_to_all
  );
END;
$function$;

-- Update apply_coupon_atomic function similarly
CREATE OR REPLACE FUNCTION public.apply_coupon_atomic(p_coupon_code text, p_order_amount numeric, p_product_ids uuid[] DEFAULT NULL)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_coupon coupons%ROWTYPE;
  v_eligible_count integer;
BEGIN
  -- Lock the coupon row for update to prevent race conditions
  SELECT * INTO v_coupon 
  FROM coupons 
  WHERE code = UPPER(TRIM(p_coupon_code)) AND is_active = true
  FOR UPDATE;
  
  -- Validate coupon exists
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'كود الكوبون غير صالح');
  END IF;
  
  -- Check expiration
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < NOW() THEN
    RETURN json_build_object('success', false, 'error', 'انتهت صلاحية الكوبون');
  END IF;
  
  -- Check max uses (atomic check)
  IF v_coupon.max_uses IS NOT NULL AND COALESCE(v_coupon.used_count, 0) >= v_coupon.max_uses THEN
    RETURN json_build_object('success', false, 'error', 'تم استنفاد عدد استخدامات الكوبون');
  END IF;
  
  -- Check min order amount
  IF v_coupon.min_order_amount IS NOT NULL AND p_order_amount < v_coupon.min_order_amount THEN
    RETURN json_build_object('success', false, 'error', 'الحد الأدنى للطلب هو ' || v_coupon.min_order_amount || ' دج');
  END IF;
  
  -- Check product eligibility if coupon is for specific products
  IF v_coupon.applies_to_all = false AND p_product_ids IS NOT NULL THEN
    SELECT COUNT(*) INTO v_eligible_count
    FROM coupon_products cp
    WHERE cp.coupon_id = v_coupon.id
      AND cp.product_id = ANY(p_product_ids);
    
    IF v_eligible_count = 0 THEN
      RETURN json_build_object('success', false, 'error', 'الكوبون لا ينطبق على المنتجات المحددة');
    END IF;
  END IF;
  
  -- Atomically increment used_count
  UPDATE coupons 
  SET used_count = COALESCE(used_count, 0) + 1 
  WHERE id = v_coupon.id;
  
  -- Return success with coupon details
  RETURN json_build_object(
    'success', true,
    'coupon_id', v_coupon.id,
    'code', v_coupon.code,
    'discount_type', v_coupon.discount_type,
    'discount_value', v_coupon.discount_value,
    'applies_to_all', v_coupon.applies_to_all
  );
END;
$function$;