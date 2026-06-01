import type { PaymentMethod } from '@/types/database';
import type { PaymentProvider } from './types';

const codProvider: PaymentProvider = {
  method: 'cod',
  label: 'Cash on Delivery',
  tagline: 'Pay in cash when your order arrives.',
  enabled: true,
  async initiate(intent) {
    return {
      method: 'cod',
      status: 'pending',
      reference: `COD-${intent.orderNumber}`,
      message: 'We will collect cash on delivery. Please keep the exact amount ready.',
    };
  },
};

// JazzCash / NayaPay are stubbed behind the same interface until merchant
// credentials are provisioned — swapping in the real SDK is a one-file change.
const jazzcashProvider: PaymentProvider = {
  method: 'jazzcash',
  label: 'JazzCash',
  tagline: 'Mobile wallet — coming soon.',
  enabled: false,
  async initiate(intent) {
    return {
      method: 'jazzcash',
      status: 'failed',
      message: 'JazzCash is not yet available. Please choose Cash on Delivery.',
      reference: `JC-STUB-${intent.orderNumber}`,
    };
  },
};

const nayapayProvider: PaymentProvider = {
  method: 'nayapay',
  label: 'NayaPay',
  tagline: 'Wallet & card — coming soon.',
  enabled: false,
  async initiate(intent) {
    return {
      method: 'nayapay',
      status: 'failed',
      message: 'NayaPay is not yet available. Please choose Cash on Delivery.',
      reference: `NP-STUB-${intent.orderNumber}`,
    };
  },
};

export const paymentProviders: Record<PaymentMethod, PaymentProvider> = {
  cod: codProvider,
  jazzcash: jazzcashProvider,
  nayapay: nayapayProvider,
};

export const paymentOrder: PaymentMethod[] = ['cod', 'jazzcash', 'nayapay'];
