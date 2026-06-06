import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { DEFAULT_STITCHING_PAISAS, GARMENT_TYPE } from './measurements';

/**
 * The configured stitching fee (paisas) for the men's shalwar kameez.
 * Reads `stitching_options` and falls back to DEFAULT_STITCHING_PAISAS if the
 * table/row isn't there yet — mirrors the graceful-fallback ethos of placeOrder.
 */
export function useStitchingPrice() {
  const query = useQuery({
    queryKey: ['stitching-price', GARMENT_TYPE],
    staleTime: 1000 * 60 * 10,
    queryFn: async (): Promise<number> => {
      const { data, error } = await supabase
        .from('stitching_options')
        .select('price_paisas')
        .eq('garment_type', GARMENT_TYPE)
        .eq('is_active', true)
        .maybeSingle();
      if (error) throw error;
      return (data as { price_paisas?: number } | null)?.price_paisas ?? DEFAULT_STITCHING_PAISAS;
    },
  });

  return {
    pricePaisas: query.data ?? DEFAULT_STITCHING_PAISAS,
    isLoading: query.isLoading,
  };
}
