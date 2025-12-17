-- Allow authenticated users to delete orders
CREATE POLICY "Authenticated users can delete orders" 
ON public.orders 
FOR DELETE 
USING (true);

-- Allow authenticated users to delete order items
CREATE POLICY "Authenticated users can delete order items" 
ON public.order_items 
FOR DELETE 
USING (true);