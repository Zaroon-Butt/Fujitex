import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Scissors } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPKR, cn } from '@/lib/utils';
import { LogoMark } from '@/components/ui/Logo';
import { useAdminOrder } from '@/features/admin/useAdminOrder';
import { stitchedItems, formatDateTime, statusLabel } from '@/features/admin/orderHelpers';
import type { OrderStatus } from '@/types/database';

/** Fulfilment flow staff move an order through (defines the dropdown order). */
const STATUS_FLOW: OrderStatus[] = [
  'pending', 'confirmed', 'in_progress', 'completed', 'delivered', 'cancelled', 'refunded',
];

const statusChip: Record<OrderStatus, string> = {
  pending:     'chip',
  confirmed:   'chip-brand',
  in_progress: 'chip-brand',
  completed:   'chip-brand',
  packed:      'chip-brand',
  shipped:     'chip-brand',
  delivered:   'chip-brand',
  cancelled:   'chip-rose',
  refunded:    'chip-rose',
};

export function AdminOrderDetailPage() {
  const { id } = useParams();
  const { order, loading, error, setStatus } = useAdminOrder(id);
  const [saving, setSaving] = useState(false);

  async function changeStatus(next: OrderStatus) {
    if (!order || next === order.status) return;
    setStatus(next); // optimistic
    setSaving(true);
    const { error: err } = await supabase.from('orders').update({ status: next }).eq('id', order.id);
    setSaving(false);
    if (err) {
      alert(`Could not update status: ${err.message}`);
      setStatus(order.status); // revert
    }
  }

  if (loading) return <p className="text-neutral-500 dark:text-neutral-400">Loading order…</p>;
  if (error) return <p className="text-rose-700 dark:text-rose-400">Could not load order: {error}</p>;
  if (!order) {
    return (
      <div>
        <BackLink />
        <p className="mt-6 text-neutral-500 dark:text-neutral-400">Order not found.</p>
      </div>
    );
  }

  const stitched = stitchedItems(order);
  // Always offer the current status, even if it's a legacy one (packed/shipped).
  const statusOptions = STATUS_FLOW.includes(order.status) ? STATUS_FLOW : [order.status, ...STATUS_FLOW];

  return (
    <div className="max-w-3xl">
      {/* Action bar — hidden when printing */}
      <div className="flex items-center justify-between gap-3 flex-wrap print:hidden">
        <BackLink />
        <div className="flex items-center gap-2">
          {stitched.length > 0 && (
            <Link to={`/admin/orders/${order.id}/stitching`} className="btn-ghost py-2.5 text-sm">
              <Scissors className="h-4 w-4" /> Stitching sheet ({stitched.length})
            </Link>
          )}
          <button onClick={() => window.print()} className="btn-primary py-2.5 text-sm">
            <Printer className="h-4 w-4" /> Print invoice
          </button>
        </div>
      </div>

      {/* Status tracker — hidden when printing */}
      <div className="mt-4 card p-4 flex items-center justify-between gap-4 flex-wrap print:hidden">
        <div>
          <p className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Order status</p>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Update as the order moves through fulfilment.</p>
        </div>
        <select
          value={order.status}
          disabled={saving}
          onChange={(e) => changeStatus(e.target.value as OrderStatus)}
          className="input max-w-[12rem]"
        >
          {statusOptions.map((s) => (
            <option key={s} value={s}>{statusLabel(s)}</option>
          ))}
        </select>
      </div>

      {/* The invoice document */}
      <article className="mt-5 card p-6 sm:p-8 print:shadow-none print:border-0">
        {/* Letterhead */}
        <header className="flex items-start justify-between gap-4 border-b border-neutral-200 dark:border-night-600 pb-5">
          <div className="flex items-center gap-3">
            <LogoMark size={44} />
            <div>
              <p className="font-display text-2xl text-ink dark:text-neutral-100 leading-none">Fujitex</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Premium unstitched fabric · Pakistan</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-display text-xl text-ink dark:text-neutral-100">Invoice</p>
            <p className="font-mono text-sm text-brand-700 dark:text-brand-300 mt-1">{order.order_number}</p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{formatDateTime(order.placed_at)}</p>
          </div>
        </header>

        {/* Status + payment chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4">
          <span className={statusChip[order.status]}>{statusLabel(order.status)}</span>
          <span className="chip">{order.payment_method.toUpperCase()}</span>
          <span className="chip">Payment: {order.payment_status}</span>
          {stitched.length > 0 && (
            <span className="chip-brand"><Scissors className="h-3 w-3" /> {stitched.length} stitched</span>
          )}
        </div>

        {/* Bill to / Ship to */}
        <div className="grid sm:grid-cols-2 gap-5 mt-6">
          <AddressBlock title="Customer">
            <p className="font-medium text-ink dark:text-neutral-100">{order.ship_full_name}</p>
            <p>{order.contact_email}</p>
            <p>{order.contact_phone}</p>
          </AddressBlock>
          <AddressBlock title="Ship to">
            <p>{order.ship_line1}</p>
            {order.ship_line2 && <p>{order.ship_line2}</p>}
            <p>
              {order.ship_city}
              {order.ship_province ? `, ${order.ship_province}` : ''}
              {order.ship_postal_code ? ` ${order.ship_postal_code}` : ''}
            </p>
            <p className="capitalize">{order.ship_zone.replace(/_/g, ' ')}</p>
            {order.ship_carrier && <p>Carrier: {order.ship_carrier}</p>}
            {order.ship_tracking_id && <p>Tracking: {order.ship_tracking_id}</p>}
          </AddressBlock>
        </div>

        {/* Line items */}
        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-night-600">
              <tr>
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium text-center">Qty</th>
                <th className="py-2 font-medium text-right">Unit</th>
                <th className="py-2 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.order_items.map((item) => (
                <tr key={item.id} className="border-b border-neutral-100 dark:border-night-700 align-top">
                  <td className="py-3 pr-3">
                    <p className="font-medium text-ink dark:text-neutral-100">{item.product_name}</p>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{item.fabric_type ?? '—'}</p>
                    {item.with_stitching && (
                      <p className="text-xs text-brand-700 dark:text-brand-300 mt-0.5 inline-flex items-center gap-1">
                        <Scissors className="h-3 w-3" /> Custom stitching · {formatPKR(item.stitching_paisas)}
                      </p>
                    )}
                  </td>
                  <td className="py-3 text-center text-neutral-700 dark:text-neutral-300">{item.quantity}</td>
                  <td className="py-3 text-right text-neutral-700 dark:text-neutral-300">{formatPKR(item.unit_price_paisas)}</td>
                  <td className="py-3 text-right font-medium text-ink dark:text-neutral-100">{formatPKR(item.line_total_paisas)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mt-5 flex justify-end">
          <dl className="w-full sm:w-72 space-y-1.5 text-sm">
            <TotalRow label="Subtotal" value={formatPKR(order.subtotal_paisas)} />
            {order.stitching_paisas > 0 && <TotalRow label="Stitching" value={formatPKR(order.stitching_paisas)} />}
            <TotalRow label="Shipping" value={order.shipping_paisas > 0 ? formatPKR(order.shipping_paisas) : 'Free'} />
            {order.discount_paisas > 0 && <TotalRow label="Discount" value={`− ${formatPKR(order.discount_paisas)}`} />}
            <div className="border-t border-neutral-200 dark:border-night-600 pt-2 mt-1">
              <TotalRow label="Total" value={formatPKR(order.total_paisas)} emphasize />
            </div>
          </dl>
        </div>

        {order.notes && (
          <div className="mt-6 border-t border-neutral-200 dark:border-night-600 pt-4">
            <p className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">Notes</p>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 mt-1">{order.notes}</p>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
          Thank you for shopping with Fujitex.
        </p>
      </article>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/admin/orders" className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-brand-700 dark:hover:text-brand-300">
      <ArrowLeft className="h-4 w-4" /> Back to orders
    </Link>
  );
}

function AddressBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400">{title}</p>
      <div className="mt-1.5 text-sm text-neutral-700 dark:text-neutral-300 space-y-0.5">{children}</div>
    </div>
  );
}

function TotalRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <dt className={cn('text-neutral-600 dark:text-neutral-400', emphasize && 'font-semibold text-ink dark:text-neutral-100')}>{label}</dt>
      <dd className={cn('text-ink dark:text-neutral-100', emphasize ? 'font-display text-lg text-brand-700 dark:text-brand-300' : 'font-medium')}>{value}</dd>
    </div>
  );
}
