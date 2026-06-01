import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navigate, Link } from 'react-router-dom';
import { Package } from 'lucide-react';
import { useAuth, signOut } from '@/features/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { formatPKR } from '@/lib/utils';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/database';

interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_paisas: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  ship_city: string;
  placed_at: string;
}

export function AccountPage() {
  const { loading, user, profile } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('orders')
      .select('id, order_number, status, total_paisas, payment_method, payment_status, ship_city, placed_at')
      .eq('user_id', user.id)
      .order('placed_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as OrderRow[]);
        setOrdersLoading(false);
      });
  }, [user]);

  if (loading) {
    return <div className="container-px mx-auto max-w-3xl py-16 text-neutral-500 dark:text-neutral-400">Loading…</div>;
  }
  if (!user) return <Navigate to="/signin" replace />;

  return (
    <>
      <Helmet><title>My account — Fujitex</title></Helmet>
      <section className="container-px mx-auto max-w-5xl py-10">
        <div className="card p-6 sm:p-8 bg-gradient-to-br from-brand-700 to-emerald-900 text-white border-0">
          <p className="text-xs uppercase tracking-widest text-gold-300">My account</p>
          <h1 className="font-display text-3xl mt-1">{profile?.full_name || 'Welcome'}</h1>
          <p className="text-sm text-white/80 mt-1">{user.email}</p>
          {profile?.phone && <p className="text-sm text-white/80">{profile.phone}</p>}
          <button
            onClick={() => signOut()}
            className="mt-5 inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-medium hover:bg-white/20"
          >
            Sign out
          </button>
        </div>

        <div className="mt-8">
          <h2 className="section-title !text-2xl flex items-center gap-2"><Package className="h-5 w-5" /> Your orders</h2>

          {ordersLoading && <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading orders…</p>}

          {!ordersLoading && orders.length === 0 && (
            <div className="card mt-4 p-8 text-center text-neutral-600 dark:text-neutral-400">
              <p>You haven't placed any orders yet.</p>
              <Link to="/" className="btn-primary mt-5">Start shopping</Link>
            </div>
          )}

          {orders.length > 0 && (
            <ul className="mt-4 grid gap-3">
              {orders.map((o) => (
                <li key={o.id} className="card p-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-ink dark:text-neutral-100">{o.order_number}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {new Date(o.placed_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                      {' · '}{o.ship_city}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="chip-brand">{o.status}</span>
                    <span className="chip">{o.payment_method.toUpperCase()}</span>
                  </div>
                  <p className="font-semibold text-ink dark:text-neutral-100">{formatPKR(o.total_paisas)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </>
  );
}
