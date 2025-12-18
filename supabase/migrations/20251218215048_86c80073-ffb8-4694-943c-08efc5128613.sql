-- Fix overly permissive RLS policies: restrict admin operations to admin role only

-- Products table: drop permissive policies and create admin-only policies
DROP POLICY IF EXISTS "Authenticated users can insert products" ON products;
DROP POLICY IF EXISTS "Authenticated users can update products" ON products;
DROP POLICY IF EXISTS "Authenticated users can delete products" ON products;
DROP POLICY IF EXISTS "Authenticated users can read all products" ON products;

CREATE POLICY "Admin users can insert products" ON products
FOR INSERT TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin users can update products" ON products
FOR UPDATE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin users can delete products" ON products
FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin users can read all products" ON products
FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Categories table: drop permissive policy and create admin-only policy
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;

CREATE POLICY "Admin users can manage categories" ON categories
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Wilayas table: drop permissive policy and create admin-only policy
DROP POLICY IF EXISTS "Authenticated users can manage wilayas" ON wilayas;

CREATE POLICY "Admin users can manage wilayas" ON wilayas
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Delivery_settings table: drop permissive policy and create admin-only policy
DROP POLICY IF EXISTS "Authenticated users can manage delivery settings" ON delivery_settings;

CREATE POLICY "Admin users can manage delivery settings" ON delivery_settings
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add a read policy for delivery settings (needed for checkout)
CREATE POLICY "Anyone can read delivery settings" ON delivery_settings
FOR SELECT
USING (true);

-- Coupons table: drop permissive policy and create admin-only policy
DROP POLICY IF EXISTS "Authenticated users can manage coupons" ON coupons;

CREATE POLICY "Admin users can manage coupons" ON coupons
FOR ALL TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));