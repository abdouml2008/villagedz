-- Add custom delivery settings per product
ALTER TABLE public.products 
ADD COLUMN custom_home_delivery_price numeric DEFAULT NULL,
ADD COLUMN custom_office_delivery_price numeric DEFAULT NULL,
ADD COLUMN home_delivery_enabled boolean DEFAULT true,
ADD COLUMN office_delivery_enabled boolean DEFAULT true;