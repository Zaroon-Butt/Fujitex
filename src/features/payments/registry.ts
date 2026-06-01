import type { PaymentMethod } from '@/types/database';
import type { PaymentProvider } from './types';
import { codProvider } from './providers/cod';
import { jazzcashProvider } from './providers/jazzcash';
import { nayapayProvider } from './providers/nayapay';

export const paymentProviders: Record<PaymentMethod, PaymentProvider> = {
  cod: codProvider,
  jazzcash: jazzcashProvider,
  nayapay: nayapayProvider,
};

export const enabledPaymentMethods: PaymentMethod[] = ['cod', 'jazzcash', 'nayapay'];
