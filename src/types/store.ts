export interface Category {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  icon: string | null;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: number;
  is_active: boolean;
  min_quantity: number | null;
  max_quantity: number | null;
  discount_quantity: number | null;
  discount_percentage: number | null;
  created_at: string;
  updated_at: string;
  category?: Category;
}

export interface Wilaya {
  id: number;
  code: string;
  name: string;
  name_ar: string;
  home_delivery_price: number;
  office_delivery_price: number;
}

export interface Order {
  id: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_phone: string;
  wilaya_id: number | null;
  delivery_type: 'home' | 'office';
  delivery_price: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  wilaya?: Wilaya;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  size: string | null;
  color: string | null;
  price: number;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
}

export interface DeliverySettings {
  id: string;
  default_home_price: number;
  default_office_price: number;
  updated_at: string;
}
