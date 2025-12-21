-- Make reviews publish immediately and phone optional
ALTER TABLE public.reviews 
  ALTER COLUMN is_approved SET DEFAULT true,
  ALTER COLUMN customer_phone DROP NOT NULL;

-- Create review_replies table for anyone to reply
CREATE TABLE public.review_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reply_name TEXT NOT NULL,
  reply_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.review_replies ENABLE ROW LEVEL SECURITY;

-- Anyone can read replies on approved reviews
CREATE POLICY "Anyone can read replies" 
ON public.review_replies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.reviews 
    WHERE reviews.id = review_replies.review_id 
    AND reviews.is_approved = true
  )
);

-- Anyone can create replies
CREATE POLICY "Anyone can create replies" 
ON public.review_replies 
FOR INSERT 
WITH CHECK (true);

-- Admin can manage all replies
CREATE POLICY "Admin can manage replies" 
ON public.review_replies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));