-- Drop all insert policies
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create order items" ON public.order_items;

-- Create policies without role restriction (applies to all roles including anon)
CREATE POLICY "Public can insert orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public can insert order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);