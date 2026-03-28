export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'CUSTOMER' | 'ADMIN' | 'GUEST';
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
}

export interface ProductVariant {
  id: number;
  slug: string;
  name?: string;
  size_label: string | null;
  price: number;
  stock: number;
  image_url: string | null;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  display_name?: string;
  slug: string;
  description: string;
  category_slug: string;
  category_name: string;
  unit: string;
  price: number;
  price_min?: number;
  price_max?: number;
  size_label?: string | null;
  image_url: string | null;
  stock: number;
  is_featured: number;
  variants?: ProductVariant[];
}

export interface CartItem {
  id: number;
  product_id: number;
  name: string;
  slug: string;
  price: number;
  unit: string;
  quantity: number;
  stock: number;
}

export interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  shipping_address: string;
  created_at: string;
  items?: OrderItem[];
  summary?: string;
}

export interface OrderItem {
  id: number;
  product_name: string;
  quantity: number;
  unit_price: number;
}
