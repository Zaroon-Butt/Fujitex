import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { MeasurementUnit, MeasurementValues } from '@/features/stitching/measurements';

/** Custom-stitching selection attached to a cart line. */
export interface StitchingSelection {
  garmentType: string;
  unit: MeasurementUnit;
  values: MeasurementValues;
  /** Snapshot of the per-suit stitching fee (paisas) at add-time. */
  feePaisas: number;
}

export interface CartItem {
  /**
   * Unique per line. Fabric-only lines reuse `productId` (so re-adding merges);
   * stitched lines get a unique id so different sizes never collapse together.
   */
  lineId: string;
  productId: string;
  slug: string;
  name: string;
  pricePaisas: number;
  comparePaisas?: number | null;
  quantity: number;
  imageUrl?: string;
  fabricType?: string | null;
  /** Max stock at the time of adding — used to clamp the quantity stepper. */
  maxStock?: number;
  /** Present when the customer chose custom stitching for this line. */
  stitching?: StitchingSelection;
}

interface CartState {
  items: CartItem[];
  /** True once persisted cart has been read from AsyncStorage (avoids empty flash). */
  hasHydrated: boolean;
  setHasHydrated: () => void;
  add: (item: Omit<CartItem, 'quantity' | 'lineId'>, qty?: number) => void;
  remove: (lineId: string) => void;
  setQty: (lineId: string, quantity: number) => void;
  increment: (lineId: string) => void;
  decrement: (lineId: string) => void;
  clear: () => void;
}

/** Clamp a desired quantity to [1, maxStock] (or [1, ∞) when stock unknown). */
function clampQty(qty: number, maxStock?: number): number {
  const lower = Math.max(1, qty);
  return maxStock && maxStock > 0 ? Math.min(lower, maxStock) : lower;
}

/** Short unique suffix for stitched lines (avoids adding a uuid dependency). */
function uniqueSuffix(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: () => set({ hasHydrated: true }),

      add: (item, qty = 1) =>
        set((s) => {
          // Fabric-only lines merge by product; stitched lines are always new.
          if (!item.stitching) {
            const existing = s.items.find((i) => i.productId === item.productId && !i.stitching);
            if (existing) {
              return {
                items: s.items.map((i) =>
                  i.lineId === existing.lineId
                    ? { ...i, quantity: clampQty(i.quantity + qty, i.maxStock) }
                    : i,
                ),
              };
            }
          }
          const lineId = item.stitching
            ? `${item.productId}:stitch:${uniqueSuffix()}`
            : item.productId;
          return { items: [...s.items, { ...item, lineId, quantity: clampQty(qty, item.maxStock) }] };
        }),

      remove: (lineId) =>
        set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) })),

      setQty: (lineId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.lineId !== lineId)
              : s.items.map((i) =>
                  i.lineId === lineId ? { ...i, quantity: clampQty(quantity, i.maxStock) } : i,
                ),
        })),

      increment: (lineId) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.lineId === lineId ? { ...i, quantity: clampQty(i.quantity + 1, i.maxStock) } : i,
          ),
        })),

      decrement: (lineId) =>
        set((s) => ({
          items: s.items.flatMap((i) => {
            if (i.lineId !== lineId) return [i];
            const next = i.quantity - 1;
            return next <= 0 ? [] : [{ ...i, quantity: next }];
          }),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'fujitex-cart',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // Only the line items need to survive a restart.
      partialize: (s) => ({ items: s.items }),
      // Backfill lineId for carts persisted before per-line identity existed.
      migrate: (persisted) => {
        const state = persisted as { items?: CartItem[] } | undefined;
        if (state?.items) {
          state.items = state.items.map((i) => ({ ...i, lineId: i.lineId ?? i.productId }));
        }
        return state as { items: CartItem[] };
      },
      onRehydrateStorage: () => (state) => state?.setHasHydrated(),
    },
  ),
);

/* ----------------------------- selector hooks ----------------------------- */

export const useCartItems = () => useCartStore((s) => s.items);

export const useCartHydrated = () => useCartStore((s) => s.hasHydrated);

export const useCartCount = () =>
  useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

/** Product-only subtotal (excludes stitching). */
export const useCartSubtotal = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.pricePaisas * i.quantity, 0));

/** Σ stitching fees across stitched lines. */
export const useCartStitchingTotal = () =>
  useCartStore((s) =>
    s.items.reduce((sum, i) => sum + (i.stitching ? i.stitching.feePaisas * i.quantity : 0), 0),
  );

export const useIsInCart = (productId: string) =>
  useCartStore((s) => s.items.some((i) => i.productId === productId));

/** Grouped action handles — `useShallow` keeps the returned object stable. */
export const useCartActions = () =>
  useCartStore(
    useShallow((s) => ({
      add: s.add,
      remove: s.remove,
      setQty: s.setQty,
      increment: s.increment,
      decrement: s.decrement,
      clear: s.clear,
    })),
  );
