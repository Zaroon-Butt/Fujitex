# Fujitex Mobile

The Fujitex storefront as a native iOS/Android app — a React Native (Expo) port of
the web shop, sharing the same Supabase backend, the same emerald/gold brand
language, and the same PKR / COD commerce model.

Built to be **scalable, responsive on every phone, and visually richer than the web**.

---

## Tech stack

| Concern              | Choice                                                        |
| -------------------- | ------------------------------------------------------------- |
| Framework            | **Expo SDK 56** (React Native 0.85, React 19, New Architecture) |
| Navigation           | **expo-router** (file-based, typed)                           |
| Global state         | **Zustand** (+ `persist`) — cart & auth/session              |
| Server state / cache | **TanStack Query** — catalog cached hard for metered 3G/4G    |
| Backend              | **Supabase** (`@supabase/supabase-js`) — shared with web      |
| Session storage      | **AsyncStorage** (Supabase auth + cart persistence)           |
| Animations           | **react-native-reanimated** v4 (+ worklets)                   |
| Responsive sizing    | **react-native-size-matters** via `src/theme/scale.ts`        |
| Images               | **expo-image** (caching + blurhash placeholders)              |
| Icons                | **@expo/vector-icons** (Feather — the family lucide is built on) |

## Getting started

```bash
cd mobile-app
npm install            # if node_modules isn't present
npx expo start         # then press i (iOS), a (Android), or scan in Expo Go
```

Environment variables live in `.env` (already wired to the shared Supabase
project). Copy `.env.example` → `.env` to point at a different backend. All vars
are `EXPO_PUBLIC_*` so they're inlined into the JS bundle.

```bash
npm run typecheck      # tsc --noEmit
npm run doctor         # npx expo-doctor
```

## Architecture

A feature-first layout keeps the app scalable — UI, state, and data per domain:

```
mobile-app/
├── app/                        # expo-router routes (the navigation tree)
│   ├── _layout.tsx             # Root: providers, fonts, auth init, splash gate
│   ├── (tabs)/                 # Bottom tabs: Home · Shop · Cart · Account
│   ├── section/[slug].tsx      # Category / section product listing
│   ├── product/[slug].tsx      # Product detail (gallery + add to cart)
│   ├── checkout.tsx            # Address → shipping → payment → place order
│   ├── order-confirmation.tsx  # Success screen
│   └── sign-in.tsx / sign-up.tsx
└── src/
    ├── theme/                  # Design tokens ported from the web Tailwind config
    │   ├── colors.ts           #   brand (emerald), gold, rose, cream, ink + gradients
    │   ├── typography.ts       #   Inter + Playfair Display scale
    │   ├── spacing.ts          #   spacing / radii (responsively scaled)
    │   └── scale.ts            #   size-matters wrappers (s / vs / ms / font)
    ├── lib/                    # supabase client, env, queryClient, formatPKR
    ├── types/                  # DB row types (kept in sync with Supabase schema)
    ├── features/               # domain logic
    │   ├── cart/               #   Zustand store (persisted) + selectors + mapper
    │   ├── auth/               #   Zustand session store (Supabase auth)
    │   ├── catalog/            #   useProducts / useProduct (TanStack Query)
    │   ├── nav/                #   useNavigation (CMS-driven sections+categories)
    │   ├── shipping/           #   useShippingRates + zone helpers
    │   ├── checkout/           #   placeOrder()
    │   └── payments/           #   PaymentProvider interface + COD/JazzCash/NayaPay
    └── components/             # ui/ primitives + ProductCard, CategoryCard, …
```

### State & session

- **Cart** (`features/cart/store.ts`) — Zustand + `persist` to AsyncStorage
  (`fujitex-cart`). Survives app restarts; quantities are clamped to live stock.
  Selector hooks (`useCartCount`, `useCartSubtotal`, …) keep re-renders tight.
- **Auth/session** (`features/auth/store.ts`) — Supabase session is persisted to
  AsyncStorage and auto-refreshed; `init()` (called once in the root layout)
  subscribes to `onAuthStateChange` and pauses token refresh while backgrounded.

### Responsiveness

Every size flows through `src/theme/scale.ts` (size-matters), and grids compute
exact item widths from the live window width (`useWindowDimensions`), going 2-up
on phones and 3-up on tablets/large screens, in any orientation.

## Backend note — order persistence

Catalog, navigation, shipping rates, auth, and order history are **fully live**
against Supabase. Placing an order currently routes through `placeOrder()`
(`features/checkout/placeOrder.ts`), which calls a Supabase `place_order`
SECURITY DEFINER RPC.

That RPC is a **backend task that isn't provisioned yet** — the `orders` table is
insert-restricted to staff by RLS (customer/guest checkout was always intended to
go through this function; the web app likewise has no checkout wired). Until the
migration lands, `placeOrder()` **gracefully falls back** to a client-confirmed
order so the COD flow is fully usable end-to-end. Once the RPC exists it returns
`persisted: true` with the real DB order number — no app changes needed.

## Payments

`features/payments/` mirrors the web's provider pattern. **COD is live**;
**JazzCash & NayaPay are stubbed** (shown but disabled) behind the shared
`PaymentProvider` interface — swapping in the real SDKs is a one-file change.
