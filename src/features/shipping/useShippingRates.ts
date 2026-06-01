import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ShippingRate, ShippingZone } from '@/types/database';

/** Active shipping rates (publicly readable), used by the checkout selector. */
export function useShippingRates() {
  return useQuery({
    queryKey: ['shipping-rates'],
    queryFn: async (): Promise<ShippingRate[]> => {
      const { data, error } = await supabase
        .from('shipping_rates')
        .select('*')
        .eq('is_active', true)
        .order('base_paisas', { ascending: true });
      if (error) throw error;
      return (data ?? []) as ShippingRate[];
    },
  });
}

export const ZONE_LABELS: Record<ShippingZone, string> = {
  lahore: 'Within Lahore',
  rest_of_pakistan: 'Rest of Pakistan',
};

/** Best-guess zone from a city string (Lahore vs everywhere else). */
export function zoneForCity(city: string): ShippingZone {
  return city.trim().toLowerCase() === 'lahore' ? 'lahore' : 'rest_of_pakistan';
}
