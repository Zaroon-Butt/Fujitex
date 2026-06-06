import { supabase } from '@/lib/supabase';
import { paymentProviders } from '@/features/payments/registry';
import type { CartItem } from '@/features/cart/useCart';
import type { PaymentMethod, ShippingZone } from '@/types/database';

export interface CheckoutInput {
  items: CartItem[];
  contactEmail: string;
  contactPhone: string;
  shipFullName: string;
  shipLine1: string;
  shipLine2?: string;
  shipCity: string;
  shipProvince?: string;
  shipZone: ShippingZone;
  shipCarrier: string;
  subtotalPaisas: number;
  shippingPaisas: number;
  stitchingPaisas: number;
  totalPaisas: number;
  paymentMethod: PaymentMethod;
}

export interface PlacedOrder {
  orderNumber: string;
  paymentMessage?: string;
  /** True when the order was persisted server-side via the place_order RPC. */
  persisted: boolean;
}

/** Client-side fallback order number, format-compatible with the DB generator. */
function localOrderNumber(): string {
  const year = new Date().getFullYear();
  const seq = Math.floor(100000 + Math.random() * 900000);
  return `FJ-${year}-${seq}`;
}

/**
 * Place an order. Persistence is routed through a Supabase `place_order`
 * SECURITY DEFINER RPC (the `orders` table is staff-insert-only under RLS).
 * Until that migration lands this gracefully falls back to a client-confirmed
 * order so the COD flow is usable end-to-end — mirrors the mobile app.
 */
export async function placeOrder(input: CheckoutInput): Promise<PlacedOrder> {
  const provider = paymentProviders[input.paymentMethod];

  let orderNumber = localOrderNumber();
  let persisted = false;
  try {
    const { data, error } = await supabase.rpc('place_order', {
      p_order: {
        contact_email: input.contactEmail,
        contact_phone: input.contactPhone,
        ship_full_name: input.shipFullName,
        ship_line1: input.shipLine1,
        ship_line2: input.shipLine2 ?? null,
        ship_city: input.shipCity,
        ship_province: input.shipProvince ?? null,
        ship_zone: input.shipZone,
        ship_carrier: input.shipCarrier,
        subtotal_paisas: input.subtotalPaisas,
        shipping_paisas: input.shippingPaisas,
        stitching_paisas: input.stitchingPaisas,
        total_paisas: input.totalPaisas,
        payment_method: input.paymentMethod,
      },
      p_items: input.items.map((i) => ({
        product_id: i.productId,
        product_name: i.name,
        product_slug: i.slug,
        fabric_type: i.fabricType ?? null,
        unit_price_paisas: i.pricePaisas,
        quantity: i.quantity,
        line_total_paisas: i.pricePaisas * i.quantity,
        with_stitching: !!i.stitching,
        stitching_paisas: i.stitching ? i.stitching.feePaisas * i.quantity : 0,
        garment_type: i.stitching?.garmentType ?? null,
        measurement_unit: i.stitching?.unit ?? null,
        measurements: i.stitching?.values ?? null,
      })),
    });
    if (!error && (data as { order_number?: string })?.order_number) {
      orderNumber = (data as { order_number: string }).order_number;
      persisted = true;
    }
  } catch {
    // RPC not available yet — fall through to client confirmation.
  }

  const payment = await provider.initiate({
    orderId: orderNumber,
    orderNumber,
    amountPaisas: input.totalPaisas,
    customerEmail: input.contactEmail,
    customerPhone: input.contactPhone,
  });

  return { orderNumber, paymentMessage: payment.message, persisted };
}
