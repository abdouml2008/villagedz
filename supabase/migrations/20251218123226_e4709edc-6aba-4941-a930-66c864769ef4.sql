-- Fix: Restrict orders table SELECT access to admin users only
-- This addresses the PUBLIC_DATA_EXPOSURE security issue

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can read orders" ON public.orders;

-- Create new policy that restricts SELECT to admin users only
CREATE POLICY "Admin users can read orders" 
ON public.orders 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also fix order_items table to match orders access control
DROP POLICY IF EXISTS "Authenticated users can read order items" ON public.order_items;

CREATE POLICY "Admin users can read order items" 
ON public.order_items 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also restrict DELETE and UPDATE on orders to admin only
DROP POLICY IF EXISTS "Authenticated users can delete orders" ON public.orders;
DROP POLICY IF EXISTS "Authenticated users can update orders" ON public.orders;

CREATE POLICY "Admin users can delete orders" 
ON public.orders 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admin users can update orders" 
ON public.orders 
FOR UPDATE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Restrict DELETE on order_items to admin only
DROP POLICY IF EXISTS "Authenticated users can delete order items" ON public.order_items;

CREATE POLICY "Admin users can delete order items" 
ON public.order_items 
FOR DELETE 
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));