// DB row types — kept in sync with the Fujitex web app / Supabase schema.

export type UserRole = 'customer' | 'admin' | 'manager';
export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'archived';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';
export type PaymentMethod = 'cod' | 'jazzcash' | 'nayapay';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';
export type ShippingZone = 'lahore' | 'rest_of_pakistan';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Section {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  hero_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  section_id: string;
  parent_id: string | null;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string | null;
  fabric_type: string | null;
  fabric_blend: string | null;
  color: string | null;
  occasion: string | null;
  price_paisas: number;
  compare_at_paisas: number | null;
  stock_units: number;
  low_stock_threshold: number;
  status: ProductStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
}

export interface SectionWithCategories extends Section {
  categories: Category[];
}

export interface ShippingRate {
  id: string;
  zone: ShippingZone;
  carrier: string;
  base_paisas: number;
  per_kg_paisas: number;
  eta_days_min: number;
  eta_days_max: number;
  is_active: boolean;
  created_at: string;
}
