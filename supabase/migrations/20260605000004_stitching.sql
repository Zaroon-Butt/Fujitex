-- Custom stitching for Men's Shalwar Kameez.
-- Adds a configurable stitching fee, per-order-item measurement snapshots, optional
-- saved measurement profiles, and finally the `place_order` RPC the clients already
-- call (customers/guests can't insert into `orders` directly under RLS).
-- All money fields are integer paisas (1 PKR = 100 paisas), matching the initial schema.

-- ============================================================
-- enums
-- ============================================================
create type garment_type as enum ('mens_shalwar_kameez');

-- ============================================================
-- sections: which sections may be stitched (data-driven "men's only")
-- ============================================================
alter table sections
  add column if not exists supports_stitching boolean not null default false;

update sections set supports_stitching = true where slug = 'mens-fabric';

-- ============================================================
-- stitching_options: admin-editable price per garment type
-- ============================================================
create table stitching_options (
  id            uuid primary key default uuid_generate_v4(),
  garment_type  garment_type not null unique,
  label         text not null,
  price_paisas  bigint not null check (price_paisas >= 0),
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_stitching_options_updated
  before update on stitching_options
  for each row execute function set_updated_at();

-- PKR 2,500 default fee for the men's shalwar kameez.
insert into stitching_options (garment_type, label, price_paisas, is_active) values
  ('mens_shalwar_kameez', 'Custom Stitching — Shalwar Kameez', 250000, true);

-- ============================================================
-- stitching_measurements: saved measurement profiles (logged-in reuse).
-- Guests don't save profiles; their measurements live on the order_item snapshot.
-- `values` is a JSON map of measurement key -> number, e.g. {"chest": 40, "kameezLength": 42}.
-- ============================================================
create table stitching_measurements (
  id            uuid primary key default uuid_generate_v4(),
  user_id       uuid references profiles(id) on delete cascade,
  garment_type  garment_type not null default 'mens_shalwar_kameez',
  label         text,
  unit          text not null default 'in' check (unit in ('in', 'cm')),
  values        jsonb not null,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index stitching_measurements_user_idx on stitching_measurements (user_id);

create trigger trg_stitching_measurements_updated
  before update on stitching_measurements
  for each row execute function set_updated_at();

-- ============================================================
-- order_items: stitching snapshot (survives product/price edits)
-- ============================================================
alter table order_items
  add column if not exists with_stitching   boolean not null default false,
  add column if not exists stitching_paisas  bigint  not null default 0 check (stitching_paisas >= 0),
  add column if not exists garment_type      garment_type,
  add column if not exists measurement_unit  text check (measurement_unit in ('in', 'cm')),
  add column if not exists measurements      jsonb;

-- ============================================================
-- orders: denormalized stitching total (separate from product subtotal)
-- ============================================================
alter table orders
  add column if not exists stitching_paisas bigint not null default 0 check (stitching_paisas >= 0);

-- ============================================================
-- RLS
-- ============================================================
alter table stitching_options       enable row level security;
alter table stitching_measurements  enable row level security;

create policy "stitching_options: public read" on stitching_options
  for select using (is_active or is_staff());
create policy "stitching_options: staff write" on stitching_options
  for all using (is_staff()) with check (is_staff());

create policy "stitching_measurements: owner read" on stitching_measurements
  for select using (auth.uid() = user_id or is_staff());
create policy "stitching_measurements: owner write" on stitching_measurements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- place_order RPC  (SECURITY DEFINER — the orders table is staff-insert-only)
--
-- Accepts the order header + an array of line items as JSON. Recomputes all
-- monetary totals server-side for integrity: product subtotal from the lines, and
-- the authoritative stitching fee from `stitching_options` for any stitched line
-- (the client-sent fee is never trusted). Returns the generated order number.
--
--   select place_order('{...}'::jsonb, '[{...}]'::jsonb);
-- ============================================================
create or replace function place_order(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id        uuid;
  v_order_number    text;
  v_user_id         uuid := auth.uid();
  v_item            jsonb;
  v_qty             int;
  v_unit_price      bigint;
  v_with_stitching  boolean;
  v_garment_type    garment_type;
  v_fee             bigint;
  v_subtotal        bigint := 0;
  v_stitching_total bigint := 0;
  v_shipping        bigint := coalesce((p_order->>'shipping_paisas')::bigint, 0);
  v_discount        bigint := coalesce((p_order->>'discount_paisas')::bigint, 0);
  v_total           bigint;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'place_order: at least one line item is required';
  end if;

  -- First pass: recompute authoritative totals.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty          := greatest((v_item->>'quantity')::int, 1);
    v_unit_price   := greatest((v_item->>'unit_price_paisas')::bigint, 0);
    v_with_stitching := coalesce((v_item->>'with_stitching')::boolean, false);
    v_subtotal     := v_subtotal + v_unit_price * v_qty;

    if v_with_stitching then
      v_garment_type := coalesce((v_item->>'garment_type')::garment_type, 'mens_shalwar_kameez');
      select price_paisas into v_fee
        from stitching_options
        where garment_type = v_garment_type and is_active
        limit 1;
      v_stitching_total := v_stitching_total + coalesce(v_fee, 0) * v_qty;
    end if;
  end loop;

  v_total := v_subtotal + v_stitching_total + v_shipping - v_discount;

  insert into orders (
    user_id, contact_email, contact_phone,
    ship_full_name, ship_line1, ship_line2, ship_city, ship_province,
    ship_zone, ship_carrier,
    subtotal_paisas, shipping_paisas, stitching_paisas, discount_paisas, total_paisas,
    payment_method
  ) values (
    v_user_id,
    p_order->>'contact_email', p_order->>'contact_phone',
    p_order->>'ship_full_name', p_order->>'ship_line1', nullif(p_order->>'ship_line2', ''),
    p_order->>'ship_city', nullif(p_order->>'ship_province', ''),
    (p_order->>'ship_zone')::shipping_zone, p_order->>'ship_carrier',
    v_subtotal, v_shipping, v_stitching_total, v_discount, v_total,
    (p_order->>'payment_method')::payment_method
  )
  returning id, order_number into v_order_id, v_order_number;

  -- Second pass: insert line items with stitching snapshots.
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty            := greatest((v_item->>'quantity')::int, 1);
    v_unit_price     := greatest((v_item->>'unit_price_paisas')::bigint, 0);
    v_with_stitching := coalesce((v_item->>'with_stitching')::boolean, false);
    v_fee            := 0;

    if v_with_stitching then
      v_garment_type := coalesce((v_item->>'garment_type')::garment_type, 'mens_shalwar_kameez');
      select price_paisas into v_fee
        from stitching_options
        where garment_type = v_garment_type and is_active
        limit 1;
      v_fee := coalesce(v_fee, 0);
    end if;

    insert into order_items (
      order_id, product_id, product_name, product_slug, fabric_type,
      unit_price_paisas, quantity, line_total_paisas,
      with_stitching, stitching_paisas, garment_type, measurement_unit, measurements
    ) values (
      v_order_id,
      nullif(v_item->>'product_id', '')::uuid,
      v_item->>'product_name', v_item->>'product_slug', nullif(v_item->>'fabric_type', ''),
      v_unit_price, v_qty, v_unit_price * v_qty,
      v_with_stitching,
      v_fee * v_qty,
      case when v_with_stitching then v_garment_type else null end,
      nullif(v_item->>'measurement_unit', ''),
      case when v_with_stitching then v_item->'measurements' else null end
    );
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number);
end;
$$;

grant execute on function place_order(jsonb, jsonb) to anon, authenticated;
