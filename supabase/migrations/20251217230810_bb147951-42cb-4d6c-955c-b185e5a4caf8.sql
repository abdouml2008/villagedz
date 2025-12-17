-- Add min and max quantity columns to products table
ALTER TABLE public.products 
ADD COLUMN min_quantity integer DEFAULT 1,
ADD COLUMN max_quantity integer DEFAULT NULL;