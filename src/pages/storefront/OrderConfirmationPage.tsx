import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams, Navigate } from 'react-router-dom';
import { Check, Info } from 'lucide-react';
import { paymentProviders } from '@/features/payments/registry';
import { formatPKR } from '@/lib/utils';
import type { PaymentMethod } from '@/types/database';

export function OrderConfirmationPage() {
  const [params] = useSearchParams();
  const order = params.get('order');
  const total = Number(params.get('total')) || 0;
  const method = params.get('method') as PaymentMethod | null;

  // Reached without placing an order — bounce home.
  if (!order) return <Navigate to="/" replace />;

  const provider = method ? paymentProviders[method] : undefined;

  return (
    <>
      <Helmet><title>Order confirmed — Fujitex</title></Helmet>
      <section className="container-px mx-auto max-w-xl py-12">
        {/* Hero */}
        <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-brand-700 to-emerald-900 text-white p-8 text-center relative">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-gold-400/20 blur-2xl" />
          <div className="relative">
            <div className="mx-auto h-20 w-20 rounded-full bg-white flex items-center justify-center">
              <Check className="h-10 w-10 text-brand-700" strokeWidth={3} />
            </div>
            <p className="mt-5 text-xs uppercase tracking-widest text-gold-300">Order placed</p>
            <h1 className="font-display text-4xl mt-1">Thank you!</h1>
            <p className="mt-2 text-white/85">Your order is confirmed. We'll be in touch shortly.</p>
          </div>
        </div>

        {/* Details */}
        <div className="card -mt-6 mx-3 relative p-6 space-y-3">
          <Row label="Order number" value={order} />
          <div className="border-t border-neutral-200 dark:border-night-600" />
          <Row label="Total" value={formatPKR(total)} emphasize />
          {provider && (
            <>
              <div className="border-t border-neutral-200 dark:border-night-600" />
              <Row label="Payment" value={provider.label} />
            </>
          )}
          {method === 'cod' && (
            <div className="flex items-start gap-2 rounded-lg bg-gold-50 dark:bg-gold-400/10 border border-gold-200 dark:border-gold-400/30 p-3 mt-2">
              <Info className="h-4 w-4 text-gold-700 dark:text-gold-300 shrink-0 mt-0.5" />
              <p className="text-sm text-gold-900 dark:text-gold-200">
                Please keep the exact cash amount ready for delivery.
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          <Link to="/" className="btn-gold w-full justify-center">Continue shopping</Link>
          <Link to="/account" className="btn-ghost w-full justify-center">View my orders</Link>
        </div>
      </section>
    </>
  );
}

function Row({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-neutral-600 dark:text-neutral-400">{label}</span>
      <span
        className={
          emphasize
            ? 'font-display text-xl text-brand-700 dark:text-brand-300'
            : 'text-sm font-semibold text-ink dark:text-neutral-100'
        }
      >
        {value}
      </span>
    </div>
  );
}
