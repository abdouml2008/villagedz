-- Create promo_banners table for customizable banners
CREATE TABLE public.promo_banners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  icon TEXT DEFAULT '🎉',
  bg_gradient TEXT DEFAULT 'from-primary via-primary/90 to-primary/80',
  link TEXT,
  link_text TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

-- Anyone can read active banners
CREATE POLICY "Anyone can read active banners" 
ON public.promo_banners 
FOR SELECT 
USING (is_active = true);

-- Admin can manage banners
CREATE POLICY "Admin can manage banners" 
ON public.promo_banners 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default banners
INSERT INTO public.promo_banners (title, subtitle, icon, bg_gradient, link, link_text, sort_order) VALUES
('خصم 20% على جميع المنتجات', 'استخدم الكود: VILLAGE20', '💸', 'from-primary via-primary/90 to-primary/80', '/cart', 'تسوق الآن', 1),
('توصيل مجاني للطلبات فوق 5000 دج', 'لجميع ولايات الجزائر', '🚚', 'from-green-600 via-green-500 to-emerald-500', NULL, NULL, 2),
('منتجات جديدة كل أسبوع', 'اكتشف آخر صيحات الموضة', '✨', 'from-purple-600 via-violet-500 to-indigo-500', NULL, NULL, 3),
('هدية مجانية مع كل طلب', 'لفترة محدودة فقط', '🎁', 'from-orange-500 via-amber-500 to-yellow-500', NULL, NULL, 4);