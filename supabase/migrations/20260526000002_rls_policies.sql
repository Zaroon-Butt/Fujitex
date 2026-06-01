-- Row Level Security
-- Public catalog data is readable by everyone; writes restricted to admin/manager.
-- Orders and addresses are scoped to the authenticated user.

alter table profiles              enable row level security;
alter table sections              enable row level security;
alter table categories            enable row level security;
alter table products              enable row level security;
alter table product_images        enable row level security;
alter table shipping_rates        enable row level security;
alter table addresses             enable row level security;
alter table orders                enable row level security;
alter table order_items           enable row level security;
alter table payment_transactions  enable row level security;

-- helper: is current user staff?
create or replace function is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid()
      and role in ('admin', 'manager')
  );
$$;

-- ---------- profiles ----------
create policy "profiles: self read"  on profiles for select using (auth.uid() = id or is_staff());
create policy "profiles: self update" on profiles for update using (auth.uid() = id) with check (auth.uid() = id and role = (select role from profiles where id = auth.uid()));
create policy "profiles: staff manage" on profiles for all using (is_staff()) with check (is_staff());

-- ---------- public catalog (sections, categories, products, images) ----------
create policy "sections: public read"   on sections   for select using (is_active or is_staff());
create policy "sections: staff write"   on sections   for all    using (is_staff()) with check (is_staff());

create policy "categories: public read" on categories for select using (is_active or is_staff());
create policy "categories: staff write" on categories for all    using (is_staff()) with check (is_staff());

create policy "products: public read"   on products   for select using (status <> 'archived' or is_staff());
create policy "products: staff write"   on products   for all    using (is_staff()) with check (is_staff());

create policy "product_images: public read" on product_images for select using (true);
create policy "product_images: staff write" on product_images for all using (is_staff()) with check (is_staff());

create policy "shipping_rates: public read" on shipping_rates for select using (is_active or is_staff());
create policy "shipping_rates: staff write" on shipping_rates for all using (is_staff()) with check (is_staff());

-- ---------- addresses (per-user) ----------
create policy "addresses: owner read"   on addresses for select using (auth.uid() = user_id or is_staff());
create policy "addresses: owner write"  on addresses for all    using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------- orders ----------
-- Customers can read their own orders. Staff can read all.
-- Inserts are allowed for authenticated users on their own user_id, plus guests (user_id null)
-- via a server-side function in a later migration; for now we keep insert staff-only and route
-- customer checkout through a SECURITY DEFINER function.
create policy "orders: owner or staff read" on orders for select using (
  (auth.uid() is not null and auth.uid() = user_id) or is_staff()
);
create policy "orders: staff write"         on orders for all    using (is_staff()) with check (is_staff());

create policy "order_items: via order read" on order_items for select using (
  exists (
    select 1 from orders o
    where o.id = order_items.order_id
      and ((auth.uid() is not null and auth.uid() = o.user_id) or is_staff())
  )
);
create policy "order_items: staff write"    on order_items for all using (is_staff()) with check (is_staff());

create policy "payment_tx: via order read"  on payment_transactions for select using (
  exists (
    select 1 from orders o
    where o.id = payment_transactions.order_id
      and ((auth.uid() is not null and auth.uid() = o.user_id) or is_staff())
  )
);
create policy "payment_tx: staff write"     on payment_transactions for all using (is_staff()) with check (is_staff());
