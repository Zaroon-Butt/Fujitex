import type { PaymentMethod } from '@/types/database';

export interface PaymentIntent {
  orderId: string;
  orderNumber: string;
  amountPaisas: number;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentResult {
  method: PaymentMethod;
  status: 'pending' | 'authorized' | 'captured' | 'failed';
  reference?: string;
  redirectUrl?: string; // hosted checkout flow
  message?: string;
}

export interface PaymentProvider {
  method: PaymentMethod;
  label: string;
  /** Short customer-facing tagline shown under the option. */
  tagline: string;
  /** Stubbed gateways are shown but disabled until merchant creds land. */
  enabled: boolean;
  initiate(intent: PaymentIntent): Promise<PaymentResult>;
}
