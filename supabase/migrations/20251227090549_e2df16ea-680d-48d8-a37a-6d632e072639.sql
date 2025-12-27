-- Add code column for full pixel script
ALTER TABLE public.tracking_pixels 
ADD COLUMN code TEXT;

-- Add a name/label column for better organization
ALTER TABLE public.tracking_pixels 
ADD COLUMN name TEXT;