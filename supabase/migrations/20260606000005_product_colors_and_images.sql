-- Product colours (variants) + multi-image gallery + storage bucket.
--
-- A product can come in several colours; each `product_images` row may optionally
-- belong to a colour (color_id null = a "general" image shown for every colour).
-- Money & inventory stay on `products` — colours here are presentation/selection
-- only, so the cart / place_order RPC are untouched.
--
-- This migration also creates the public `product-images` storage bucket and its
-- RLS policies, replacing the manual bucket step previously in supabase/README.md.

-- ============================================================
-- product_colors
-- ============================================================
create table product_colors (
  id          uuid primary key default uuid_generate_v4(),
  product_id  uuid not null references products(id) on delete cascade,
  name        text not null,                                          -- "Stone Beige", "Graphite"
  hex         text check (hex is null or hex ~* '^#[0-9a-f]{6}$'),    -- swatch colour, e.g. #c9b8a0
  sort_order  int not null default 0,
  is_default  boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (product_id, name)
);

create index product_colors_product_idx on product_colors (product_id, sort_order);

-- ============================================================
-- product_images: optional link to a colour
-- ============================================================
alter table product_images
  add column if not exists color_id uuid references product_colors(id) on delete set null;

create index if not exists product_images_color_idx on product_images (color_id);

-- ============================================================
-- RLS  (mirrors product_images: public read, staff write)
-- ============================================================
alter table product_colors enable row level security;

create policy "product_colors: public read" on product_colors
  for select using (true);
create policy "product_colors: staff write" on product_colors
  for all using (is_staff()) with check (is_staff());

-- ============================================================
-- Storage: public `product-images` bucket + staff-write policies.
-- Public read so the storefront can render photos; writes restricted to staff.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "product-images: public read" on storage.objects;
create policy "product-images: public read" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "product-images: staff write" on storage.objects;
create policy "product-images: staff write" on storage.objects
  for all
  using  (bucket_id = 'product-images' and public.is_staff())
  with check (bucket_id = 'product-images' and public.is_staff());
