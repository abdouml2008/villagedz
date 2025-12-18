-- Drop existing insert policies
DROP POLICY IF EXISTS "Public can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Public can insert order items" ON public.order_items;

-- Create new INSERT policies that explicitly allow anon role
CREATE POLICY "Allow anonymous order creation" 
ON public.orders 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Allow anonymous order items creation" 
ON public.order_items 
FOR INSERT 
TO anon, authenticated
WITH CHECK (true);