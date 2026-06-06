import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProductWithImages } from '@/types/database';

// Full select embeds the section's stitching flag; base select is the legacy
// shape used as a fallback when the stitching migration hasn't been applied yet.
const PRODUCT_SELECT_FULL =
  '*, product_images(*), categories!inner(slug, name, sections!inner(slug, name, supports_stitching))';
const PRODUCT_SELECT_BASE = '*, product_images(*)';

/** Fetch a single product (with its images) by slug for the detail page. */
export function useProduct(slug?: string) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: async (): Promise<ProductWithImages | null> => {
      // Prefer the full select. If `sections.supports_stitching` doesn't exist
      // yet (migration pending), PostgREST 400s — fall back so the storefront
      // keeps working and stitching simply stays off until the migration lands.
      let res = await supabase
        .from('products')
        .select(PRODUCT_SELECT_FULL)
        .eq('slug', slug!)
        .maybeSingle();
      if (res.error) {
        res = await supabase
          .from('products')
          .select(PRODUCT_SELECT_BASE)
          .eq('slug', slug!)
          .maybeSingle();
      }
      if (res.error) throw res.error;
      return (res.data as unknown as ProductWithImages | null) ?? null;
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

/**
 * Whether custom stitching can be offered for this product. Data-driven: the
 * product's section must have `supports_stitching` enabled (men's only today).
 */
export function supportsStitching(p: Pick<ProductWithImages, 'categories'>): boolean {
  return p.categories?.sections?.supports_stitching === true;
}

/** Percent discount (rounded) when a compare-at price is set, else null. */
export function discountPct(pricePaisas: number, comparePaisas: number | null): number | null {
  if (!comparePaisas || comparePaisas <= pricePaisas) return null;
  return Math.round(((comparePaisas - pricePaisas) / comparePaisas) * 100);
}
