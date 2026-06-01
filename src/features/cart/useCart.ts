import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
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
}

/** Clamp a desired quantity to [1, maxStock] (or [1, ∞) when stock unknown). */
function clampQty(qty: number, maxStock?: number): number {
  const lower = Math.max(1, qty);
  return maxStock && maxStock > 0 ? Math.min(lower, maxStock) : lower;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  clear: () => void;
  subtotalPaisas: () => number;
  itemCount: () => number;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId
                  ? { ...i, quantity: clampQty(i.quantity + qty, i.maxStock) }
                  : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: clampQty(qty, item.maxStock) }] };
        }),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      setQty: (productId, quantity) =>
        set((s) => ({
          items: quantity <= 0
            ? s.items.filter((i) => i.productId !== productId)
            : s.items.map((i) =>
                i.productId === productId ? { ...i, quantity: clampQty(quantity, i.maxStock) } : i,
              ),
        })),
      clear: () => set({ items: [] }),
      subtotalPaisas: () => get().items.reduce((sum, i) => sum + i.pricePaisas * i.quantity, 0),
      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'fujitex-cart' },
  ),
);
