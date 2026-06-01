import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { OrderStatus, PaymentMethod, PaymentStatus } from '@/types/database';

export interface OrderSummary {
  id: string;
  order_number: string;
  status: OrderStatus;
  total_paisas: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  ship_city: string;
  placed_at: string;
}

export function useMyOrders(userId?: string) {
  return useQuery({
    queryKey: ['orders', userId],
    enabled: !!userId,
    queryFn: async (): Promise<OrderSummary[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, total_paisas, payment_method, payment_status, ship_city, placed_at')
        .eq('user_id', userId!)
        .order('placed_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as OrderSummary[];
    },
  });
}
