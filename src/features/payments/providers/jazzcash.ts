import type { PaymentProvider } from '../types';

// Stubbed JazzCash provider. Replace `initiate` with real merchant API call once credentials are in.
// Docs: https://sandbox.jazzcash.com.pk (merchant portal)
export const jazzcashProvider: PaymentProvider = {
  method: 'jazzcash',
  label: 'JazzCash',
  async initiate(intent) {
    return {
      method: 'jazzcash',
      status: 'pending',
      reference: `JC-STUB-${intent.orderNumber}`,
      message: 'JazzCash integration pending merchant credentials. Order placed as pending.',
    };
  },
};
