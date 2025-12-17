-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create products table
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  colors TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create wilayas table (58 Algerian wilayas)
CREATE TABLE public.wilayas (
  id SERIAL PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  home_delivery_price DECIMAL(10,2) DEFAULT 600,
  office_delivery_price DECIMAL(10,2) DEFAULT 400
);

-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_first_name TEXT NOT NULL,
  customer_last_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  wilaya_id INTEGER REFERENCES public.wilayas(id),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('home', 'office')),
  delivery_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  color TEXT,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create delivery settings table
CREATE TABLE public.delivery_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  default_home_price DECIMAL(10,2) DEFAULT 600,
  default_office_price DECIMAL(10,2) DEFAULT 400,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wilayas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies for categories, products, wilayas
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Anyone can read wilayas" ON public.wilayas FOR SELECT USING (true);

-- Public insert for orders (customers can place orders)
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can create order items" ON public.order_items FOR INSERT WITH CHECK (true);

-- Admin policies (authenticated users)
CREATE POLICY "Authenticated users can manage categories" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage products" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can manage wilayas" ON public.wilayas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read orders" ON public.orders FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can update orders" ON public.orders FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Authenticated users can read order items" ON public.order_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can manage delivery settings" ON public.delivery_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default categories
INSERT INTO public.categories (name, name_ar, slug, icon) VALUES
('Men''s Clothing', 'ملابس رجالية', 'men', '👔'),
('Women''s Clothing', 'ملابس نسائية', 'women', '👗'),
('Kids'' Clothing', 'ملابس أطفال', 'kids', '👶'),
('Other Items', 'أغراض أخرى', 'other', '🛍️');

-- Insert all 58 Algerian wilayas
INSERT INTO public.wilayas (code, name, name_ar) VALUES
('01', 'Adrar', 'أدرار'),
('02', 'Chlef', 'الشلف'),
('03', 'Laghouat', 'الأغواط'),
('04', 'Oum El Bouaghi', 'أم البواقي'),
('05', 'Batna', 'باتنة'),
('06', 'Béjaïa', 'بجاية'),
('07', 'Biskra', 'بسكرة'),
('08', 'Béchar', 'بشار'),
('09', 'Blida', 'البليدة'),
('10', 'Bouira', 'البويرة'),
('11', 'Tamanrasset', 'تمنراست'),
('12', 'Tébessa', 'تبسة'),
('13', 'Tlemcen', 'تلمسان'),
('14', 'Tiaret', 'تيارت'),
('15', 'Tizi Ouzou', 'تيزي وزو'),
('16', 'Algiers', 'الجزائر'),
('17', 'Djelfa', 'الجلفة'),
('18', 'Jijel', 'جيجل'),
('19', 'Sétif', 'سطيف'),
('20', 'Saïda', 'سعيدة'),
('21', 'Skikda', 'سكيكدة'),
('22', 'Sidi Bel Abbès', 'سيدي بلعباس'),
('23', 'Annaba', 'عنابة'),
('24', 'Guelma', 'قالمة'),
('25', 'Constantine', 'قسنطينة'),
('26', 'Médéa', 'المدية'),
('27', 'Mostaganem', 'مستغانم'),
('28', 'M''Sila', 'المسيلة'),
('29', 'Mascara', 'معسكر'),
('30', 'Ouargla', 'ورقلة'),
('31', 'Oran', 'وهران'),
('32', 'El Bayadh', 'البيض'),
('33', 'Illizi', 'إليزي'),
('34', 'Bordj Bou Arréridj', 'برج بوعريريج'),
('35', 'Boumerdès', 'بومرداس'),
('36', 'El Tarf', 'الطارف'),
('37', 'Tindouf', 'تندوف'),
('38', 'Tissemsilt', 'تيسمسيلت'),
('39', 'El Oued', 'الوادي'),
('40', 'Khenchela', 'خنشلة'),
('41', 'Souk Ahras', 'سوق أهراس'),
('42', 'Tipaza', 'تيبازة'),
('43', 'Mila', 'ميلة'),
('44', 'Aïn Defla', 'عين الدفلى'),
('45', 'Naâma', 'النعامة'),
('46', 'Aïn Témouchent', 'عين تموشنت'),
('47', 'Ghardaïa', 'غرداية'),
('48', 'Relizane', 'غليزان'),
('49', 'El M''Ghair', 'المغير'),
('50', 'El Meniaa', 'المنيعة'),
('51', 'Ouled Djellal', 'أولاد جلال'),
('52', 'Bordj Baji Mokhtar', 'برج باجي مختار'),
('53', 'Béni Abbès', 'بني عباس'),
('54', 'Timimoun', 'تيميمون'),
('55', 'Touggourt', 'تقرت'),
('56', 'Djanet', 'جانت'),
('57', 'In Salah', 'عين صالح'),
('58', 'In Guezzam', 'عين قزام');

-- Insert default delivery settings
INSERT INTO public.delivery_settings (default_home_price, default_office_price) VALUES (600, 400);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();