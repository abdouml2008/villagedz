-- Create table for tracking pixels (Meta, TikTok, etc.)
CREATE TABLE public.tracking_pixels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform TEXT NOT NULL, -- 'meta' or 'tiktok'
  pixel_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tracking_pixels ENABLE ROW LEVEL SECURITY;

-- Anyone can read active pixels (needed for frontend)
CREATE POLICY "Anyone can read active pixels"
ON public.tracking_pixels
FOR SELECT
USING (is_active = true);

-- Admin users can manage pixels
CREATE POLICY "Admin users can manage pixels"
ON public.tracking_pixels
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin users can read all pixels
CREATE POLICY "Admin users can read all pixels"
ON public.tracking_pixels
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));