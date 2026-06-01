-- Seed data: one section ("Men's Fabric") with the categories from the spec,
-- plus a few sample products and shipping rates for both zones.

insert into sections (slug, name, description, sort_order, is_active) values
  ('mens-fabric', 'Men''s Fabric',
   'Premium unstitched and stitched fabrics curated for the Pakistani gentleman.',
   1, true);

with s as (select id from sections where slug = 'mens-fabric')
insert into categories (section_id, slug, name, description, sort_order, is_active)
select s.id, v.slug, v.name, v.description, v.sort_order, true
from s, (values
  ('unstitched-cotton', 'Unstitched Cotton', 'Breathable summer cottons in solid and textured weaves.', 1),
  ('wash-and-wear',     'Wash & Wear',       'Wrinkle-resistant blends for daily formal wear.',          2),
  ('karandi',           'Karandi',           'Warm winter karandi suitings.',                            3),
  ('latha',             'Latha',             'Crisp latha for shalwar kameez.',                          4)
) as v(slug, name, description, sort_order);

-- shipping rates
insert into shipping_rates (zone, carrier, base_paisas, per_kg_paisas, eta_days_min, eta_days_max, is_active) values
  ('lahore',          'Leopard', 15000,  0, 1, 2, true),   -- PKR 150
  ('lahore',          'TCS',     20000,  0, 1, 2, true),   -- PKR 200
  ('rest_of_pakistan','Leopard', 25000,  0, 2, 5, true),   -- PKR 250
  ('rest_of_pakistan','TCS',     30000,  0, 2, 4, true),   -- PKR 300
  ('rest_of_pakistan','Trax',    22000,  0, 3, 6, true);   -- PKR 220

-- sample products (4 — one per category) so the storefront has something to render
with cats as (
  select c.id, c.slug
  from categories c
  join sections s on s.id = c.section_id
  where s.slug = 'mens-fabric'
)
insert into products (category_id, slug, name, description, fabric_type, fabric_blend, color, occasion,
                     price_paisas, compare_at_paisas, stock_units, low_stock_threshold, metadata)
select c.id, v.slug, v.name, v.description, v.fabric_type, v.blend, v.color, v.occasion,
       v.price_paisas, v.compare_paisas, v.stock, 5,
       jsonb_build_object('unit', v.unit)
from cats c
join (values
  ('unstitched-cotton', 'royal-summer-cotton',  'Royal Summer Cotton',     'Lightweight pure cotton, ideal for Pakistani summers.',
     'Cotton',     '100% Cotton',                 'Stone Beige', 'Casual',         350000, 420000, 24, 'suit'),
  ('wash-and-wear',     'classic-graphite-ww',   'Classic Graphite Wash & Wear', 'Office-ready wrinkle-resistant blend.',
     'Wash & Wear', '65% Polyester / 35% Cotton', 'Graphite',    'Formal',         480000, null,   8, 'suit'),
  ('karandi',           'heritage-karandi',      'Heritage Karandi',        'Warm winter weave with subtle texture.',
     'Karandi',     'Wool Blend',                 'Charcoal',    'Formal',         620000, 720000, 4, 'suit'),
  ('latha',             'eid-latha-cream',       'Eid Latha — Cream',       'Crisp white-cream latha for Eid shalwar kameez.',
     'Latha',       '100% Cotton',                'Cream',       'Eid Collection', 280000, null,  16, 'suit')
) as v(cat_slug, slug, name, description, fabric_type, blend, color, occasion,
       price_paisas, compare_paisas, stock, unit)
on c.slug = v.cat_slug;
