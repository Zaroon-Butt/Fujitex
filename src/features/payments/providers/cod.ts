import type { PaymentProvider } from '../types';

export const codProvider: PaymentProvider = {
  method: 'cod',
  label: 'Cash on Delivery',
  async initiate(intent) {
    return {
      method: 'cod',
      status: 'pending',
      reference: `COD-${intent.orderNumber}`,
      message: 'We will collect cash on delivery. Please keep the exact amount ready.',
    };
  },
};
