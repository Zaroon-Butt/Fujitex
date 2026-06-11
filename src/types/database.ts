// Hand-written DB row types. Replace with `supabase gen types typescript` once auth is set up.

export type UserRole = 'customer' | 'admin' | 'manager';
export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock' | 'archived';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
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
  avatar_url: string | null;
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
  supports_stitching: boolean;
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
  /** Optional colour this image belongs to (null = shown for every colour). */
  color_id: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
}

export interface ProductColor {
  id: string;
  product_id: string;
  name: string;
  /** Swatch colour as #rrggbb, or null when only a name is given. */
  hex: string | null;
  sort_order: number;
  is_default: boolean;
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

/** The category + section a product belongs to (embedded via PostgREST join). */
export interface ProductCategoryRef {
  slug: string;
  name: string;
  sections: { slug: string; name: string; supports_stitching: boolean } | null;
}

export interface ProductWithImages extends Product {
  product_images: ProductImage[];
  /** Colour variants, when embedded (e.g. useProduct). Absent on legacy queries. */
  product_colors?: ProductColor[];
  /** Present when the query embeds the category/section (e.g. useProduct). */
  categories?: ProductCategoryRef | null;
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

export type GarmentType = 'mens_shalwar_kameez';

/** A single line on an order — a frozen snapshot taken at checkout time. */
export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string;
  fabric_type: string | null;
  unit_price_paisas: number;
  quantity: number;
  line_total_paisas: number;
  /** Stitching snapshot (see the 20260605000004_stitching migration). */
  with_stitching: boolean;
  stitching_paisas: number;
  garment_type: GarmentType | null;
  measurement_unit: 'in' | 'cm' | null;
  /** Map of measurement key -> value in `measurement_unit`, e.g. { chest: 40 }. */
  measurements: Record<string, number> | null;
  created_at: string;
}

/** Full order header (all monetary fields in paisas). */
export interface Order {
  id: string;
  order_number: string;
  user_id: string | null;
  status: OrderStatus;
  contact_email: string;
  contact_phone: string;
  ship_full_name: string;
  ship_line1: string;
  ship_line2: string | null;
  ship_city: string;
  ship_province: string | null;
  ship_postal_code: string | null;
  ship_zone: ShippingZone;
  ship_carrier: string | null;
  ship_tracking_id: string | null;
  subtotal_paisas: number;
  shipping_paisas: number;
  stitching_paisas: number;
  discount_paisas: number;
  total_paisas: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  payment_reference: string | null;
  notes: string | null;
  placed_at: string;
  updated_at: string;
}

export interface OrderWithItems extends Order {
  order_items: OrderItem[];
}
