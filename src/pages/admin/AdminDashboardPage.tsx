import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ShoppingBag, Package, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPKR } from '@/lib/utils';

interface Stats {
  revenuePaisas: number;
  orderCount: number;
  lowStockCount: number;
  topCity: string;
  paymentBreakdown: { method: string; count: number }[];
  lowStockProducts: { id: string; name: string; stock_units: number }[];
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    (async () => {
      const [{ data: orders }, { data: lowStock }] = await Promise.all([
        supabase
          .from('orders')
          .select('total_paisas, payment_method, ship_city')
          .gte('placed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
        supabase
          .from('products')
          .select('id, name, stock_units')
          .in('status', ['low_stock', 'out_of_stock'])
          .order('stock_units')
          .limit(8),
      ]);

      const o = (orders ?? []) as { total_paisas: number; payment_method: string; ship_city: string }[];
      const cityCounts = o.reduce<Record<string, number>>((acc, r) => {
        acc[r.ship_city] = (acc[r.ship_city] || 0) + 1; return acc;
      }, {});
      const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';

      const methodCounts = o.reduce<Record<string, number>>((acc, r) => {
        acc[r.payment_method] = (acc[r.payment_method] || 0) + 1; return acc;
      }, {});

      setStats({
        revenuePaisas: o.reduce((sum, r) => sum + r.total_paisas, 0),
        orderCount: o.length,
        lowStockCount: (lowStock ?? []).length,
        topCity,
        paymentBreakdown: Object.entries(methodCounts).map(([method, count]) => ({ method, count })),
        lowStockProducts: (lowStock ?? []) as { id: string; name: string; stock_units: number }[],
      });
    })();
  }, []);

  return (
    <div>
      <h1 className="font-display text-2xl text-ink dark:text-neutral-100">Dashboard</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Last 30 days · Pakistan operations overview</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <Card label="Revenue (30d)" value={stats ? formatPKR(stats.revenuePaisas) : '—'} icon={ShoppingBag} accent="brand" />
        <Card label="Orders (30d)"  value={stats?.orderCount.toString() ?? '—'}         icon={Package}      accent="gold" />
        <Card label="Top city"      value={stats?.topCity ?? '—'}                       icon={MapPin}       accent="rose" />
        <Card label="Stock alerts"  value={stats?.lowStockCount.toString() ?? '—'}      icon={AlertTriangle} accent="brand" />
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-8">
        <div className="card p-5">
          <h2 className="font-display text-lg text-ink dark:text-neutral-100">Payment method breakdown</h2>
          {!stats && <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>}
          {stats && stats.paymentBreakdown.length === 0 && (
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">No orders yet in the last 30 days.</p>
          )}
          {stats && (
            <ul className="mt-3 space-y-2">
              {stats.paymentBreakdown.map((p) => {
                const pct = stats.orderCount ? (p.count / stats.orderCount) * 100 : 0;
                const color = p.method === 'cod' ? 'bg-brand-500' : p.method === 'jazzcash' ? 'bg-gold-500' : 'bg-rose-500';
                return (
                  <li key={p.method}>
                    <div className="flex justify-between text-sm">
                      <span className="font-medium uppercase">{p.method}</span>
                      <span>{p.count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="mt-1 h-2 rounded-full bg-neutral-100 dark:bg-night-700 overflow-hidden">
                      <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink dark:text-neutral-100">Low-stock alerts</h2>
            <Link to="/admin/products" className="text-xs font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200">View all →</Link>
          </div>
          {!stats && <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>}
          {stats && stats.lowStockProducts.length === 0 && (
            <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">All stock levels healthy.</p>
          )}
          {stats && stats.lowStockProducts.length > 0 && (
            <ul className="mt-3 divide-y divide-neutral-100 dark:divide-night-600">
              {stats.lowStockProducts.map((p) => (
                <li key={p.id} className="py-2 flex justify-between text-sm">
                  <Link to={`/admin/products/${p.id}`} className="text-ink dark:text-neutral-100 hover:text-brand-700 dark:hover:text-brand-300">{p.name}</Link>
                  <span className={p.stock_units === 0 ? 'chip-rose' : 'chip'}>{p.stock_units} units</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

interface CardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'brand' | 'gold' | 'rose';
}

function Card({ label, value, icon: Icon, accent }: CardProps) {
  const gradients = {
    brand: 'from-brand-600 to-emerald-800',
    gold:  'from-gold-500 to-gold-700 text-ink',
    rose:  'from-rose-600 to-rose-800',
  } as const;
  return (
    <div className={`rounded-2xl bg-gradient-to-br ${gradients[accent]} p-5 shadow-lg text-white`}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest opacity-80">{label}</p>
        <Icon className="h-5 w-5 opacity-70" />
      </div>
      <p className="font-display text-3xl mt-2">{value}</p>
    </div>
  );
}
