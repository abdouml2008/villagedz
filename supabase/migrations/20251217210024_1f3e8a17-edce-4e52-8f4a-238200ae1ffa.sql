-- Drop existing restrictive policies on products
DROP POLICY IF EXISTS "Anyone can read active products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can manage products" ON public.products;

-- Create permissive policies for products
CREATE POLICY "Anyone can read active products" 
ON public.products 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Authenticated users can read all products" 
ON public.products 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert products" 
ON public.products 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update products" 
ON public.products 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products" 
ON public.products 
FOR DELETE 
TO authenticated
USING (true);