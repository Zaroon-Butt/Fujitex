-- Fujitex initial schema
-- Pakistani fabric marketplace: sections > categories > products, orders, addresses, payments
-- All money fields are stored as integer paisas (1 PKR = 100 paisas) to avoid float rounding.

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================
-- enums
-- ============================================================
create type product_status      as enum ('active', 'low_stock', 'out_of_stock', 'archived');
create type order_status        as enum ('pending', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled', 'refunded');
create type payment_method      as enum ('cod', 'jazzcash', 'nayapay');
create type payment_status      as enum ('pending', 'authorized', 'captured', 'failed', 'refunded');
create type user_role           as enum ('customer', 'admin', 'manager');
create type shipping_zone       as enum ('lahore', 'rest_of_pakistan');

-- ============================================================
-- profiles  (mirrors auth.users; admin role lives here)
-- ============================================================
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text unique not null,
  full_name     text,
  phone         text,
  role          user_role not null default 'customer',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- sections (top-level: "Men's Fabric", future: "Women", "Kids")
-- Admin can add new sections; routes are generated from slug.
-- ============================================================
create table sections (
  id            uuid primary key default uuid_generate_v4(),
  slug          text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name          text not null,
  description   text,
  hero_image_url text,
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ============================================================
-- categories (nested per section: Unstitched Cotton, Wash & Wear, ...)
-- self-referencing for arbitrary depth (e.g. Cotton > Premium Cotton).
-- ============================================================
create table categories (
  id            uuid primary key default uuid_generate_v4(),
  section_id    uuid not null references sections(id) on delete cascade,
  parent_id     uuid references categories(id) on delete cascade,
  slug          text not null check (slug ~ '^[a-z0-9-]+$'),
  name          text not null,
  description   text,
  image_url     text,
  sort_order    int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (section_id, slug)
);

create index categories_section_idx on categories (section_id, sort_order);
create index categories_parent_idx  on categories (parent_id);

-- ============================================================
-- products
-- price_paisas: PKR * 100. stock_units is in "suits" (per spec).
-- ============================================================
create table products (
  id              uuid primary key default uuid_generate_v4(),
  category_id     uuid not null references categories(id) on delete restrict,
  slug            text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name            text not null,
  description     text,
  fabric_type     text,                                   -- Cotton, Karandi, Latha, Wash & Wear, etc.
  fabric_blend    text,                                   -- e.g. "65% Cotton / 35% Polyester"
  color           text,
  occasion        text,                                   -- Formal, Eid Collection, Casual
  price_paisas    bigint not null check (price_paisas >= 0),
  compare_at_paisas bigint check (compare_at_paisas is null or compare_at_paisas >= price_paisas),
  stock_units     int not null default 0 check (stock_units >= 0),
  low_stock_threshold int not null default 5,
  status          product_status not null default 'active',
  metadata        jsonb not null default '{}'::jsonb,     -- room for unit (meters/suits), care, etc.
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index products_category_idx on products (category_id);
create index products_status_idx   on products (status) where status = 'active';
create index products_fabric_idx   on products (fabric_type);
create index products_occasion_idx on products (occasion);

-- product images (ordered, primary first)
create table product_images (
  id            uuid primary key default uuid_generate_v4(),
  product_id    uuid not null references products(id) on delete cascade,
  url           text not null,                            -- WebP in Supabase Storage
  alt_text      text,
  sort_order    int not null default 0,
  is_primary    boolean not null default false,
  width         int,
  height        int,
  created_at    timestamptz not null default now()
);

create index product_images_product_idx on product_images (product_id, sort_order);
create unique index product_images_one_primary on product_images (product_id) where is_primary;

-- ============================================================
-- shipping rates (by zone, simple table — admin-editable)
-- ============================================================
create table shipping_rates (
  id              uuid primary key default uuid_generate_v4(),
  zone            shipping_zone not null,
  carrier         text not null,                          -- 'Leopard' | 'TCS' | 'Trax'
  base_paisas     bigint not null check (base_paisas >= 0),
  per_kg_paisas   bigint not null default 0 check (per_kg_paisas >= 0),
  eta_days_min    int not null default 1,
  eta_days_max    int not null default 5,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- addresses (saved customer shipping addresses)
-- ============================================================
create table addresses (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid not null references profiles(id) on delete cascade,
  full_name     text not null,
  phone         text not null,
  line1         text not null,
  line2         text,
  city          text not null,                            -- Lahore, Karachi, Islamabad, ...
  province      text,
  postal_code   text,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now()
);

create index addresses_user_idx on addresses (user_id);

-- ============================================================
-- orders
-- Totals are denormalized snapshots at checkout time (price, shipping, tax).
-- ============================================================
create table orders (
  id                  uuid primary key default uuid_generate_v4(),
  order_number        text unique not null,                       -- human-readable, e.g. FJ-2026-000123
  user_id             uuid references profiles(id) on delete set null, -- nullable for guest checkout
  status              order_status not null default 'pending',

  -- contact snapshot
  contact_email       text not null,
  contact_phone       text not null,

  -- shipping snapshot
  ship_full_name      text not null,
  ship_line1          text not null,
  ship_line2          text,
  ship_city           text not null,
  ship_province       text,
  ship_postal_code    text,
  ship_zone           shipping_zone not null,
  ship_carrier        text,
  ship_tracking_id    text,

  -- monetary snapshot (all in paisas)
  subtotal_paisas     bigint not null check (subtotal_paisas >= 0),
  shipping_paisas     bigint not null default 0 check (shipping_paisas >= 0),
  discount_paisas     bigint not null default 0 check (discount_paisas >= 0),
  total_paisas        bigint not null check (total_paisas >= 0),

  -- payment
  payment_method      payment_method not null,
  payment_status      payment_status not null default 'pending',
  payment_reference   text,                                       -- gateway txn id

  notes               text,
  placed_at           timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index orders_user_idx        on orders (user_id);
create index orders_status_idx      on orders (status);
create index orders_placed_idx      on orders (placed_at desc);
create index orders_city_idx        on orders (ship_city);
create index orders_payment_idx     on orders (payment_method, payment_status);

create table order_items (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references orders(id) on delete cascade,
  product_id      uuid references products(id) on delete set null,
  -- snapshot fields (so historic orders survive product edits/deletes)
  product_name    text not null,
  product_slug    text not null,
  fabric_type     text,
  unit_price_paisas bigint not null check (unit_price_paisas >= 0),
  quantity        int not null check (quantity > 0),
  line_total_paisas bigint not null check (line_total_paisas >= 0),
  created_at      timestamptz not null default now()
);

create index order_items_order_idx on order_items (order_id);

-- ============================================================
-- payment_transactions (audit log per gateway interaction)
-- ============================================================
create table payment_transactions (
  id              uuid primary key default uuid_generate_v4(),
  order_id        uuid not null references orders(id) on delete cascade,
  method          payment_method not null,
  status          payment_status not null,
  amount_paisas   bigint not null,
  gateway_reference text,
  raw_response    jsonb,
  created_at      timestamptz not null default now()
);

create index payment_tx_order_idx on payment_transactions (order_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated   before update on profiles    for each row execute function set_updated_at();
create trigger trg_sections_updated   before update on sections    for each row execute function set_updated_at();
create trigger trg_categories_updated before update on categories  for each row execute function set_updated_at();
create trigger trg_products_updated   before update on products    for each row execute function set_updated_at();
create trigger trg_orders_updated     before update on orders      for each row execute function set_updated_at();

-- ============================================================
-- auto-derive product status from stock
-- ============================================================
create or replace function product_status_from_stock()
returns trigger as $$
begin
  if new.status = 'archived' then
    return new;  -- admin override; leave alone
  end if;
  if new.stock_units <= 0 then
    new.status := 'out_of_stock';
  elsif new.stock_units <= new.low_stock_threshold then
    new.status := 'low_stock';
  else
    new.status := 'active';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_products_auto_status
  before insert or update of stock_units, low_stock_threshold on products
  for each row execute function product_status_from_stock();

-- ============================================================
-- order_number generator: FJ-YYYY-NNNNNN  (zero-padded sequence per year)
-- ============================================================
create sequence orders_seq;

create or replace function generate_order_number()
returns trigger as $$
begin
  if new.order_number is null or new.order_number = '' then
    new.order_number := 'FJ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('orders_seq')::text, 6, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_orders_order_number
  before insert on orders
  for each row execute function generate_order_number();

-- ============================================================
-- profile auto-create on auth signup
-- ============================================================
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
