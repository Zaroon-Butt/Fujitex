import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export interface CartItem {
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
}

interface CartState {
  items: CartItem[];
  /** True once persisted cart has been read from AsyncStorage (avoids empty flash). */
  hasHydrated: boolean;
  setHasHydrated: () => void;
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, quantity: number) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  clear: () => void;
}

/** Clamp a desired quantity to [1, maxStock] (or [1, ∞) when stock unknown). */
function clampQty(qty: number, maxStock?: number): number {
  const lower = Math.max(1, qty);
  return maxStock && maxStock > 0 ? Math.min(lower, maxStock) : lower;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hasHydrated: false,
      setHasHydrated: () => set({ hasHydrated: true }),

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

      remove: (productId) =>
        set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),

      setQty: (productId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.productId !== productId)
              : s.items.map((i) =>
                  i.productId === productId
                    ? { ...i, quantity: clampQty(quantity, i.maxStock) }
                    : i,
                ),
        })),

      increment: (productId) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.productId === productId ? { ...i, quantity: clampQty(i.quantity + 1, i.maxStock) } : i,
          ),
        })),

      decrement: (productId) =>
        set((s) => ({
          items: s.items.flatMap((i) => {
            if (i.productId !== productId) return [i];
            const next = i.quantity - 1;
            return next <= 0 ? [] : [{ ...i, quantity: next }];
          }),
        })),

      clear: () => set({ items: [] }),
    }),
    {
      name: 'fujitex-cart',
      storage: createJSONStorage(() => AsyncStorage),
      // Only the line items need to survive a restart.
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(),
    },
  ),
);

/* ----------------------------- selector hooks ----------------------------- */

export const useCartItems = () => useCartStore((s) => s.items);

export const useCartHydrated = () => useCartStore((s) => s.hasHydrated);

export const useCartCount = () =>
  useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

export const useCartSubtotal = () =>
  useCartStore((s) => s.items.reduce((sum, i) => sum + i.pricePaisas * i.quantity, 0));

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
