import type { GarmentType, OrderItem, OrderWithItems } from '@/types/database';

const GARMENT_LABELS: Record<GarmentType, string> = {
  mens_shalwar_kameez: "Men's Shalwar Kameez",
};

export function garmentLabel(type: GarmentType | null | undefined): string {
  return type ? GARMENT_LABELS[type] ?? type : 'Custom Stitching';
}

/** Line items on the order that were ordered with custom stitching. */
export function stitchedItems(order: OrderWithItems | null): OrderItem[] {
  return (order?.order_items ?? []).filter((i) => i.with_stitching);
}

/** Human label for an order status, e.g. "in_progress" -> "In Progress". */
export function statusLabel(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Long, readable Pakistan-local date+time, e.g. "6 Jun 2026, 3:42 PM". */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-PK', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}
