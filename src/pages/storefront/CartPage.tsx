import { Link } from 'react-router-dom';
import { useCart } from '@/features/cart/useCart';
import { formatPKR } from '@/lib/utils';

export function CartPage() {
  const { items, setQty, remove, subtotalPaisas } = useCart();

  if (items.length === 0) {
    return (
      <section className="container-px mx-auto max-w-3xl py-12 text-center">
        <h1 className="font-display text-2xl text-neutral-900 dark:text-neutral-100">Your cart is empty</h1>
        <Link to="/" className="btn-primary mt-6">Continue shopping</Link>
      </section>
    );
  }

  return (
    <section className="container-px mx-auto max-w-3xl py-8">
      <h1 className="font-display text-2xl text-neutral-900 dark:text-neutral-100 mb-6">Your cart</h1>
      <ul className="divide-y divide-neutral-200 dark:divide-night-600 border border-neutral-200 dark:border-night-600 rounded-lg bg-white dark:bg-night-800">
        {items.map((i) => (
          <li key={i.productId} className="p-4 flex gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{i.name}</p>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{formatPKR(i.pricePaisas)}</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={i.quantity}
                  onChange={(e) => setQty(i.productId, parseInt(e.target.value, 10) || 1)}
                  className="w-16 rounded border border-neutral-300 dark:border-night-600 dark:bg-night-700 dark:text-neutral-100 px-2 py-1 text-sm"
                />
                <button onClick={() => remove(i.productId)} className="text-sm text-red-600 dark:text-red-400 hover:underline">
                  Remove
                </button>
              </div>
            </div>
            <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{formatPKR(i.pricePaisas * i.quantity)}</p>
          </li>
        ))}
      </ul>
      <div className="mt-6 flex items-center justify-between">
        <p className="text-base text-neutral-700 dark:text-neutral-300">Subtotal</p>
        <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{formatPKR(subtotalPaisas())}</p>
      </div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Shipping calculated at checkout.</p>
      <Link to="/checkout" className="btn-primary mt-6 w-full">Proceed to checkout</Link>
    </section>
  );
}
