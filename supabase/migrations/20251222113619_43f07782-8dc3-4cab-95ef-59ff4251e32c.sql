-- Add UPDATE policy for order_items table
CREATE POLICY "Admin users can update order items"
ON public.order_items
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));