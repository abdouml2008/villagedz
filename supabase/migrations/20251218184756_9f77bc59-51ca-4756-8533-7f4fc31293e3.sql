-- Create atomic coupon application function to prevent race conditions
CREATE OR REPLACE FUNCTION public.apply_coupon_atomic(
  p_coupon_code text,
  p_order_amount numeric
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_coupon coupons%ROWTYPE;
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
    'discount_value', v_coupon.discount_value
  );
END;
$$;