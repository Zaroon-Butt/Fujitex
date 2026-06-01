import type { PaymentProvider } from '../types';

// Stubbed NayaPay provider. Replace `initiate` with real checkout SDK call once onboarded.
export const nayapayProvider: PaymentProvider = {
  method: 'nayapay',
  label: 'NayaPay',
  async initiate(intent) {
    return {
      method: 'nayapay',
      status: 'pending',
      reference: `NP-STUB-${intent.orderNumber}`,
      message: 'NayaPay integration pending merchant credentials. Order placed as pending.',
    };
  },
};
