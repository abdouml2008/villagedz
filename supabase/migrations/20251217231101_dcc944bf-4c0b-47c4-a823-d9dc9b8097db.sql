-- Add quantity discount columns to products table
ALTER TABLE public.products 
ADD COLUMN discount_quantity integer DEFAULT NULL,
ADD COLUMN discount_percentage numeric DEFAULT NULL;