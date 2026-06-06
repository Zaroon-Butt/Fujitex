# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Fujitex is a Pakistani unstitched-fabric marketplace. It is **two client apps over one shared Supabase backend**:

- **Web** (repo root, `src/`) — Vite + React 19 + TypeScript storefront *and* admin panel.
- **Mobile** (`mobile-app/`) — Expo Router + React Native storefront (no admin).

Both talk directly to Supabase (Postgres + Auth + Storage) with the anon key; there is no separate API server. Business-critical logic that can't be trusted to the client lives in Postgres RPCs/RLS (see `place_order` below).

## Commands

**Web (run from repo root):**
- `npm run dev` — Vite dev server on port 5173 (host exposed)
- `npm run build` — `tsc -b && vite build` (type-checks then bundles)
- `npm run lint` — ESLint over the repo
- `npm run preview` — serve the production build

**Mobile (run from `mobile-app/`):**
- `npm start` / `npx expo start` — Metro bundler
- `npm run ios` / `npm run android` — native run
- `npm run typecheck` — `tsc --noEmit`
- `npm run doctor` — `npx expo-doctor`

There is **no test runner configured** in either app — do not assume `npm test` exists. The only automated check is the build/typecheck + lint above.

## Conventions you must follow

- **Money is always integer paisas** (1 PKR = 100 paisas), stored as `bigint` in Postgres and `number` in TS. Never use floats for money. Format for display only via `formatPKR(paisas)` in `src/lib/utils.ts` (divides by 100). Field names end in `_paisas` / `Paisas`.
- **Path alias** `@` → `src/` (web only; configured in `vite.config.ts` and `tsconfig`).
- **DB row types are hand-written**, not generated — `src/types/database.ts` (and the mobile copy). Keep them in sync with migrations by hand. When an enum gains a value in a migration, add it to the TS union too.
- **Env access is centralized and fail-fast** via `lib/env.ts`. Web reads `VITE_*` (from `.env.local`); mobile reads `EXPO_PUBLIC_*` (from `mobile-app/.env`). Add new vars to the `env` object, not scattered `import.meta.env` reads.

## Cross-platform code duplication (important)

The web and mobile apps **do not share a package**. Instead, several domain modules are **copied verbatim** into both trees and kept in sync by hand:

- `types/database.ts`
- `features/stitching/*` (`measurements.ts`, `mapper.ts`, `diagramAsset.ts`, `useStitchingPrice.ts`)
- `features/cart/*`, `features/checkout/placeOrder.ts`, `features/payments/*`, `features/shipping/*`, `features/nav/*`

When you change shared domain logic (measurement fields, the `place_order` payload shape, payment providers, cart math), **update both `src/...` and `mobile-app/src/...`**. These files are written framework-agnostic on purpose. UI differs per platform (Tailwind/DOM on web, the `mobile-app/src/theme` + RN primitives on mobile) and is *not* shared.

## Backend & data model (Supabase)

Migrations live in `supabase/migrations/` and apply **in filename order**. Apply via the Supabase SQL editor, `supabase db push`, or the `supabase` MCP server's `apply_migration` tool. Project ref `ewrywsrmiyovcxwceeaf`. See `supabase/README.md` for the apply steps and how to promote yourself to admin (`update profiles set role = 'admin' ...`).

Core shape:
- **Catalog hierarchy:** `sections` → `categories` (self-referencing `parent_id` for nesting) → `products` → `product_images` / `product_colors`. Routes are generated from slugs.
- **`profiles`** mirrors `auth.users` and holds `role` (`customer | admin | manager`). A trigger auto-creates a profile on signup. The SQL helper `is_staff()` gates writes.
- **Orders:** `orders` + `order_items`. Order items **snapshot** product name/slug/price (and stitching measurements) so historical orders survive product edits/deletes. Order numbers are generated server-side as `FJ-YYYY-NNNNNN`.
- **RLS:** public catalog tables are world-readable, writes are staff-only. The `orders` table is **staff-insert-only** — customers and guests cannot insert directly.

### The `place_order` RPC

Customer/guest checkout goes through `place_order(p_order jsonb, p_items jsonb)`, a `SECURITY DEFINER` function (defined in `20260605000004_stitching.sql`, granted to `anon` + `authenticated`). It **recomputes all monetary totals server-side** — product subtotal from the line items and the authoritative stitching fee from `stitching_options`. **The client-sent stitching fee is never trusted.** Both `placeOrder.ts` clients build the exact JSON payload this function expects; if you change one, change the function and the other client. The clients also have a graceful fallback (local order number, `persisted: false`) for when the RPC isn't deployed yet.

## Web app structure

- Entry: `src/main.tsx` → `App.tsx` (wraps `HelmetProvider` + React Query) → `routes/AppRoutes.tsx`.
- **Routing:** React Router (`BrowserRouter`). Storefront pages render under `StoreLayout`; admin pages under `/admin` are wrapped in `RequireStaff` (checks the signed-in user's profile role) inside `AdminLayout`. Standalone printable docs (e.g. the stitching work sheet at `/admin/orders/:id/stitching`) are staff-gated but rendered **outside** the admin shell so they print clean.
- **Data fetching:** TanStack Query, configured in `src/lib/queryClient.ts` with deliberately aggressive caching (5-min `staleTime`, no refetch on window focus) — the target users are on metered Pakistani mobile data, so minimizing refetches is a product requirement, not an oversight.
- **Cart:** Zustand store persisted to `localStorage` (`src/features/cart/useCart.ts`). Each line has a `lineId`: fabric-only lines reuse `productId` so re-adding merges; stitched lines get a unique id so different measurement sets never collapse together. The store is versioned with a `migrate` for older persisted carts.
- **Auth:** `useAuth()` derives `isStaff` from the profile role. `signOut()` is exported alongside it.
- **Forms:** react-hook-form + Zod resolvers.
- **Theme:** light/dark toggled via a `dark` class on `<html>` (Tailwind `darkMode: 'class'`). `src/lib/theme.ts` is the store; the initial class is applied pre-paint by an inline script in `index.html` to avoid a flash.

## Stitching feature

Custom stitching is **men's-only**, driven by data (`sections.supports_stitching`, set true for `mens-fabric`), for the `mens_shalwar_kameez` garment at a default PKR 2,500 fee held in `stitching_options`. `features/stitching/measurements.ts` is the single source of truth for measurement fields, unit conversion (in/cm), validation ranges, and the diagram hotspot map used by `MeasurementDiagram`. Measurements are snapshotted onto `order_items`; logged-in users can also save reusable profiles in `stitching_measurements`.

## Mobile specifics

`mobile-app/AGENTS.md` (referenced by `mobile-app/CLAUDE.md`) carries a hard rule: **Expo has changed — read the versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing Expo/React Native code.** Honor it; don't write RN/Expo APIs from memory. Navigation is file-based via Expo Router (`mobile-app/app/`). State uses Zustand stores under `mobile-app/src/features/*/store.ts`.
