import { Link } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useCart, type CartItem } from '@/features/cart/useCart';
import { kameezMeasurements, shalwarMeasurements } from '@/features/stitching/measurements';
import { formatPKR } from '@/lib/utils';

/** Short, human summary of a stitched line's measurements (first few fields). */
function stitchingSummary(item: CartItem): string {
  if (!item.stitching) return '';
  const fields = [...kameezMeasurements, ...shalwarMeasurements];
  const parts = fields
    .map((f) => {
      const v = item.stitching!.values[f.key as keyof typeof item.stitching.values];
      return v === undefined ? null : `${f.label.split(' ')[0]} ${v}`;
    })
    .filter(Boolean)
    .slice(0, 4);
  return `${parts.join(' · ')} (${item.stitching.unit})`;
}

export function CartPage() {
  const { items, setQty, remove, subtotalPaisas, stitchingTotalPaisas } = useCart();

  if (items.length === 0) {
    return (
      <section className="container-px mx-auto max-w-3xl py-12 text-center">
        <h1 className="font-display text-2xl text-neutral-900 dark:text-neutral-100">Your cart is empty</h1>
        <Link to="/" className="btn-primary mt-6">Continue shopping</Link>
      </section>
    );
  }

  const stitching = stitchingTotalPaisas();
  const subtotal = subtotalPaisas();

  return (
    <section className="container-px mx-auto max-w-3xl py-8">
      <h1 className="font-display text-2xl text-neutral-900 dark:text-neutral-100 mb-6">Your cart</h1>
      <ul className="divide-y divide-neutral-200 dark:divide-night-600 border border-neutral-200 dark:border-night-600 rounded-lg bg-white dark:bg-night-800">
        {items.map((i) => (
          <li key={i.lineId} className="p-4 flex gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{i.name}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{formatPKR(i.pricePaisas)}</p>

              {i.stitching && (
                <div className="mt-2">
                  <span className="chip">
                    <Scissors className="h-3 w-3" /> Stitched to size · +{formatPKR(i.stitching.feePaisas)}
                  </span>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{stitchingSummary(i)}</p>
                </div>
              )}

              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={i.quantity}
                  onChange={(e) => setQty(i.lineId, parseInt(e.target.value, 10) || 1)}
                  className="w-16 rounded border border-neutral-300 dark:border-night-600 dark:bg-night-700 dark:text-neutral-100 px-2 py-1 text-sm"
                />
                <button onClick={() => remove(i.lineId)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
                  Remove
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
              {formatPKR((i.pricePaisas + (i.stitching?.feePaisas ?? 0)) * i.quantity)}
            </p>
          </li>
        ))}
      </ul>

      <div className="mt-6 space-y-1.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-600 dark:text-neutral-400">Subtotal</span>
          <span className="text-neutral-900 dark:text-neutral-100">{formatPKR(subtotal)}</span>
        </div>
        {stitching > 0 && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-600 dark:text-neutral-400">Stitching</span>
            <span className="text-neutral-900 dark:text-neutral-100">{formatPKR(stitching)}</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-neutral-200 dark:border-night-600 pt-2">
          <span className="text-base text-neutral-700 dark:text-neutral-300">Total</span>
          <span className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {formatPKR(subtotal + stitching)}
          </span>
        </div>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Shipping calculated at checkout.</p>
      <Link to="/checkout" className="btn-primary mt-6 w-full">Proceed to checkout</Link>
    </section>
  );
}
