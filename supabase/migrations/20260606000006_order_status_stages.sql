-- Add two fulfilment stages to the order lifecycle so staff can track an order
-- through stitching: "In Progress" (being stitched / prepared) and "Completed"
-- (work done, ready to hand over / ship).
--
-- Postgres ADD VALUE is idempotent here via IF NOT EXISTS. New values are appended
-- to the enum; the admin UI defines its own display order, so enum sort order does
-- not matter. This migration only declares the values (it does not use them), so it
-- is safe to run inside the migration transaction.
--
-- Apply with `supabase db push` (or paste into the Supabase SQL editor). Until then,
-- setting a status to in_progress/completed will be rejected by the DB enum.

alter type order_status add value if not exists 'in_progress';
alter type order_status add value if not exists 'completed';
