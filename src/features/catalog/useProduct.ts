import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProductWithImages } from '@/types/database';

/** Fetch a single product (with its images) by slug for the detail page. */
export function useProduct(slug?: string) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: async (): Promise<ProductWithImages | null> => {
      const { data, error } = await supabase
        .from('products')
        .select('*, product_images(*)')
        .eq('slug', slug!)
        .maybeSingle();

      if (error) throw error;
      return (data as unknown as ProductWithImages | null) ?? null;
    },
  });
}

/** Sort a product's images so the primary one is first. */
export function orderedImages(product: Pick<ProductWithImages, 'product_images'>) {
  return [...(product.product_images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
}

/** Whether a product can be added to the cart. */
export function isPurchasable(p: Pick<ProductWithImages, 'status' | 'stock_units'>): boolean {
  return p.status !== 'out_of_stock' && p.status !== 'archived' && p.stock_units > 0;
}

/** Percent discount (rounded) when a compare-at price is set, else null. */
export function discountPct(pricePaisas: number, comparePaisas: number | null): number | null {
  if (!comparePaisas || comparePaisas <= pricePaisas) return null;
  return Math.round(((comparePaisas - pricePaisas) / comparePaisas) * 100);
}
