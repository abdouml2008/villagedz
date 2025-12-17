-- Create coupons table
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL,
  min_order_amount numeric DEFAULT NULL,
  max_uses integer DEFAULT NULL,
  used_count integer DEFAULT 0,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can read active coupons (for validation)
CREATE POLICY "Anyone can read active coupons" ON public.coupons
FOR SELECT USING (is_active = true);

-- Authenticated users can manage coupons
CREATE POLICY "Authenticated users can manage coupons" ON public.coupons
FOR ALL USING (true) WITH CHECK (true);

-- Add coupon_code to orders table
ALTER TABLE public.orders ADD COLUMN coupon_code text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN coupon_discount numeric DEFAULT 0;