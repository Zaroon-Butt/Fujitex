import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPKR } from '@/lib/utils';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/database';

interface OrderRow {
  id: string;
  order_number: string;
  status: OrderStatus;
  contact_email: string;
  ship_full_name: string;
  ship_city: string;
  ship_zone: 'lahore' | 'rest_of_pakistan';
  total_paisas: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  placed_at: string;
}

const statusColor: Record<OrderStatus, string> = {
  pending:   'chip',
  confirmed: 'chip-brand',
  packed:    'chip-brand',
  shipped:   'chip-brand',
  delivered: 'chip-brand',
  cancelled: 'chip-rose',
  refunded:  'chip-rose',
};

export function AdminOrdersPage() {
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('orders')
      .select('id, order_number, status, contact_email, ship_full_name, ship_city, ship_zone, total_paisas, payment_method, payment_status, placed_at')
      .order('placed_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setRows((data ?? []) as OrderRow[]);
        setLoading(false);
      });
  }, []);

  const stats = useMemo(() => {
    const revenuePaisas = rows.reduce((sum, o) => sum + o.total_paisas, 0);
    const byMethod = rows.reduce<Record<PaymentMethod, number>>((acc, o) => {
      acc[o.payment_method] = (acc[o.payment_method] || 0) + 1;
      return acc;
    }, { cod: 0, jazzcash: 0, nayapay: 0 });
    const byCity = rows.reduce<Record<string, number>>((acc, o) => {
      acc[o.ship_city] = (acc[o.ship_city] || 0) + 1;
      return acc;
    }, {});
    const topCity = Object.entries(byCity).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
    return { revenuePaisas, count: rows.length, byMethod, topCity };
  }, [rows]);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink dark:text-neutral-100">Orders</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Latest 200 orders. Regional and payment-method breakdown.</p>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
        <Stat label="Revenue"      value={formatPKR(stats.revenuePaisas)} accent="brand" />
        <Stat label="Orders"       value={stats.count.toString()}         accent="gold" />
        <Stat label="Top city"     value={stats.topCity}                  accent="rose" />
        <Stat label="COD share"    value={stats.count ? `${Math.round((stats.byMethod.cod / stats.count) * 100)}%` : '—'} accent="brand" />
      </div>

      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        {(['cod', 'jazzcash', 'nayapay'] as PaymentMethod[]).map((m) => (
          <div key={m} className="card p-4">
            <p className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{m}</p>
            <p className="font-display text-2xl mt-1 text-ink dark:text-neutral-100">{stats.byMethod[m]}</p>
          </div>
        ))}
      </div>

      {loading && <p className="mt-6 text-neutral-500 dark:text-neutral-400">Loading orders…</p>}

      <div className="mt-6 overflow-x-auto card">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-night-700 text-neutral-600 dark:text-neutral-400 text-left">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">City</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Placed</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} className="border-t border-neutral-100 dark:border-night-700 text-ink dark:text-neutral-100">
                <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{o.ship_full_name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{o.contact_email}</p>
                </td>
                <td className="px-4 py-3">{o.ship_city}<p className="text-xs text-neutral-500 dark:text-neutral-400">{o.ship_zone.replace('_', ' ')}</p></td>
                <td className="px-4 py-3 font-medium">{formatPKR(o.total_paisas)}</td>
                <td className="px-4 py-3 text-xs"><span className="chip">{o.payment_method.toUpperCase()}</span></td>
                <td className="px-4 py-3"><span className={statusColor[o.status]}>{o.status}</span></td>
                <td className="px-4 py-3 text-xs text-neutral-600 dark:text-neutral-400">
                  {new Date(o.placed_at).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })}
                </td>
              </tr>
            ))}
            {!loading && rows.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-neutral-500 dark:text-neutral-400">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: 'brand' | 'gold' | 'rose' }) {
  const styles = {
    brand: 'from-brand-600 to-emerald-800',
    gold:  'from-gold-500 to-gold-700 text-ink',
    rose:  'from-rose-600 to-rose-800',
  } as const;
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${styles[accent]} p-5 text-white shadow-md`}>
      <p className="text-xs uppercase tracking-widest opacity-80">{label}</p>
      <p className="font-display text-2xl mt-1">{value}</p>
    </div>
  );
}
