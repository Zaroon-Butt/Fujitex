import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  /** Max stock captured at add-time — used to clamp the quantity stepper. */
  maxStock?: number;
  /** Present when the customer chose custom stitching for this line. */
  stitching?: StitchingSelection;
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

type NewItem = Omit<CartItem, 'quantity' | 'lineId'>;

interface CartState {
  items: CartItem[];
  add: (item: NewItem, qty?: number) => void;
  remove: (lineId: string) => void;
  setQty: (lineId: string, quantity: number) => void;
  clear: () => void;
  /** Product-only subtotal (excludes stitching). */
  subtotalPaisas: () => number;
  /** Σ stitching fees across stitched lines. */
  stitchingTotalPaisas: () => number;
  itemCount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
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
          const lineId = item.stitching ? `${item.productId}:stitch:${uniqueSuffix()}` : item.productId;
          return { items: [...s.items, { ...item, lineId, quantity: clampQty(qty, item.maxStock) }] };
        }),
      remove: (lineId) => set((s) => ({ items: s.items.filter((i) => i.lineId !== lineId) })),
      setQty: (lineId, quantity) =>
        set((s) => ({
          items: quantity <= 0
            ? s.items.filter((i) => i.lineId !== lineId)
            : s.items.map((i) =>
                i.lineId === lineId ? { ...i, quantity: clampQty(quantity, i.maxStock) } : i,
              ),
        })),
      clear: () => set({ items: [] }),
      subtotalPaisas: () => get().items.reduce((sum, i) => sum + i.pricePaisas * i.quantity, 0),
      stitchingTotalPaisas: () =>
        get().items.reduce((sum, i) => sum + (i.stitching ? i.stitching.feePaisas * i.quantity : 0), 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: 'fujitex-cart',
      version: 2,
      // Backfill lineId for carts persisted before per-line identity existed.
      migrate: (persisted) => {
        const state = persisted as { items?: CartItem[] } | undefined;
        if (state?.items) {
          state.items = state.items.map((i) => ({ ...i, lineId: i.lineId ?? i.productId }));
        }
        return state as CartState;
      },
    },
  ),
);
