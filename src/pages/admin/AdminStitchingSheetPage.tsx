import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, Scissors } from 'lucide-react';
import { LogoMark } from '@/components/ui/Logo';
import { MeasurementDiagram } from '@/components/stitching/MeasurementDiagram';
import {
  kameezMeasurements,
  shalwarMeasurements,
  DIAGRAM_HOTSPOTS,
  type MeasurementField,
  type MeasurementKey,
} from '@/features/stitching/measurements';
import { useAdminOrder } from '@/features/admin/useAdminOrder';
import { stitchedItems, garmentLabel, formatDateTime } from '@/features/admin/orderHelpers';
import type { OrderItem } from '@/types/database';
import { cn } from '@/lib/utils';

/**
 * Standalone, print-ready work order for the tailor: one measurement spec per
 * stitched line. Rendered outside the admin shell (no sidebar) so it prints
 * clean — staff still gated by the RequireStaff wrapper on the route.
 */
export function AdminStitchingSheetPage() {
  const { id } = useParams();
  const { order, loading, error } = useAdminOrder(id);

  const items = stitchedItems(order);

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-night-900 print:bg-white">
      {/* Toolbar — hidden on print */}
      <div className="no-print sticky top-0 z-10 bg-white dark:bg-night-800 border-b border-neutral-200 dark:border-night-600 px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link
          to={order ? `/admin/orders/${order.id}` : '/admin/orders'}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-brand-700 dark:hover:text-brand-300"
        >
          <ArrowLeft className="h-4 w-4" /> Back to invoice
        </Link>
        <button onClick={() => window.print()} className="btn-primary py-2.5 text-sm" disabled={items.length === 0}>
          <Printer className="h-4 w-4" /> Print stitching sheet
        </button>
      </div>

      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 print:p-0 print:max-w-none">
        {loading && <p className="text-neutral-500 dark:text-neutral-400">Loading…</p>}
        {error && <p className="text-rose-700 dark:text-rose-400">Could not load order: {error}</p>}
        {!loading && !order && <p className="text-neutral-500 dark:text-neutral-400">Order not found.</p>}
        {order && items.length === 0 && (
          <p className="text-neutral-500 dark:text-neutral-400">This order has no custom-stitching items.</p>
        )}

        {order &&
          items.map((item, idx) => (
            <section
              key={item.id}
              className={cn(
                'bg-white dark:bg-night-800 rounded-2xl shadow-sm border border-neutral-200 dark:border-night-600 p-6 sm:p-8 mb-6 break-inside-avoid print:shadow-none print:border-0 print:mb-0',
                idx > 0 && 'print:break-before-page',
              )}
            >
              <SheetHeader item={item} orderNumber={order.order_number} customer={order.ship_full_name} phone={order.contact_phone} placedAt={order.placed_at} index={idx} count={items.length} />

              <div className="grid lg:grid-cols-2 gap-6 mt-6">
                <MeasurementDiagram activeField={null} className="self-start" />
                <div className="space-y-5">
                  <MeasurementGroup title="Kameez (Shirt)" fields={kameezMeasurements} item={item} />
                  <MeasurementGroup title="Shalwar (Trouser)" fields={shalwarMeasurements} item={item} />
                </div>
              </div>

              <div className="mt-6 border-t border-dashed border-neutral-300 dark:border-night-600 pt-4 grid sm:grid-cols-2 gap-4 text-sm">
                <SignLine label="Tailor / Designer" />
                <SignLine label="Date completed" />
              </div>
            </section>
          ))}
      </div>
    </div>
  );
}

function SheetHeader({
  item, orderNumber, customer, phone, placedAt, index, count,
}: {
  item: OrderItem;
  orderNumber: string;
  customer: string;
  phone: string;
  placedAt: string;
  index: number;
  count: number;
}) {
  return (
    <header className="flex items-start justify-between gap-4 border-b border-neutral-200 dark:border-night-600 pb-4">
      <div className="flex items-center gap-3">
        <LogoMark size={40} />
        <div>
          <p className="font-display text-lg text-ink dark:text-neutral-100 leading-tight inline-flex items-center gap-1.5">
            <Scissors className="h-4 w-4 text-brand-700 dark:text-brand-300" /> Stitching Work Order
          </p>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {garmentLabel(item.garment_type)} · {item.quantity} suit{item.quantity > 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="text-right text-xs text-neutral-600 dark:text-neutral-400 space-y-0.5">
        <p className="font-mono text-brand-700 dark:text-brand-300">{orderNumber}</p>
        <p className="font-medium text-ink dark:text-neutral-100">{customer}</p>
        <p>{phone}</p>
        <p>{formatDateTime(placedAt)}</p>
        {count > 1 && <p className="text-neutral-400">Suit {index + 1} of {count}</p>}
      </div>
    </header>
  );
}

function MeasurementGroup({
  title, fields, item,
}: {
  title: string;
  fields: readonly MeasurementField[];
  item: OrderItem;
}) {
  const unit = item.measurement_unit ?? 'in';
  return (
    <div>
      <h3 className="text-xs uppercase tracking-widest text-neutral-500 dark:text-neutral-400 font-semibold">{title}</h3>
      <table className="w-full mt-2 text-sm">
        <tbody>
          {fields.map((field) => {
            const key = field.key as MeasurementKey;
            const value = item.measurements?.[key];
            const badge = DIAGRAM_HOTSPOTS[key]?.n;
            return (
              <tr key={key} className="border-b border-neutral-100 dark:border-night-700">
                <td className="py-1.5 w-7 text-center">
                  {badge != null && (
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-gold-500 text-[10px] font-bold text-ink">{badge}</span>
                  )}
                </td>
                <td className="py-1.5 text-neutral-700 dark:text-neutral-300">{field.label}</td>
                <td className="py-1.5 text-right font-semibold text-ink dark:text-neutral-100 tabular-nums">
                  {value != null ? `${value} ${unit}` : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SignLine({ label }: { label: string }) {
  return (
    <div>
      <div className="h-8 border-b border-neutral-400 dark:border-night-500" />
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{label}</p>
    </div>
  );
}
