-- Create user_permissions table for section access control
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  section TEXT NOT NULL,
  has_access BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, section)
);

-- Enable RLS
ALTER TABLE public.user_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view their own permissions
CREATE POLICY "Users can view own permissions" ON public.user_permissions 
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can manage all permissions
CREATE POLICY "Admins can manage permissions" ON public.user_permissions 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create social_links table for social media management
CREATE TABLE public.social_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.social_links ENABLE ROW LEVEL SECURITY;

-- Anyone can read active social links
CREATE POLICY "Anyone can read active social links" ON public.social_links 
  FOR SELECT USING (is_active = true);

-- Admins can manage social links
CREATE POLICY "Admins can manage social links" ON public.social_links 
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can read all social links (including inactive)
CREATE POLICY "Admins can read all social links" ON public.social_links 
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));