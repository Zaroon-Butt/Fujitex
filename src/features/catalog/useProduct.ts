import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ProductColor, ProductImage, ProductWithImages } from '@/types/database';

// Selects degrade gracefully as migrations land:
//   FULL   — colours + section stitching flag (current schema)
//   COLORS — colours, no stitching join (stitching migration pending)
//   LEGACY — images only (colours migration pending)
const PRODUCT_SELECT_FULL =
  '*, product_images(*), product_colors(*), categories!inner(slug, name, sections!inner(slug, name, supports_stitching))';
const PRODUCT_SELECT_COLORS = '*, product_images(*), product_colors(*)';
const PRODUCT_SELECT_LEGACY = '*, product_images(*)';

/** Fetch a single product (with its images & colours) by slug for the detail page. */
export function useProduct(slug?: string) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: !!slug,
    queryFn: async (): Promise<ProductWithImages | null> => {
      // Prefer the full select, then progressively fall back so the storefront
      // keeps working even when a migration hasn't been applied yet.
      for (const select of [PRODUCT_SELECT_FULL, PRODUCT_SELECT_COLORS, PRODUCT_SELECT_LEGACY]) {
        const res = await supabase.from('products').select(select).eq('slug', slug!).maybeSingle();
        if (!res.error) return (res.data as unknown as ProductWithImages | null) ?? null;
        if (select === PRODUCT_SELECT_LEGACY) throw res.error;
      }
      return null;
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

/** A product's colours, ordered (sort_order, then name). */
export function orderedColors(product: Pick<ProductWithImages, 'product_colors'>): ProductColor[] {
  return [...(product.product_colors ?? [])].sort((a, b) => {
    if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
    return a.name.localeCompare(b.name);
  });
}

/** The colour to pre-select (flagged default, else the first), or null. */
export function defaultColor(product: Pick<ProductWithImages, 'product_colors'>): ProductColor | null {
  const colors = orderedColors(product);
  return colors.find((c) => c.is_default) ?? colors[0] ?? null;
}

/**
 * Gallery images for the selected colour: that colour's images first, then the
 * "general" (unassigned) ones. Falls back to all images when the colour has none
 * of its own, or when no colour is selected.
 */
export function imagesForColor(
  product: Pick<ProductWithImages, 'product_images'>,
  colorId: string | null,
): ProductImage[] {
  const all = orderedImages(product);
  if (!colorId) return all;
  const scoped = all.filter((i) => i.color_id === colorId);
  if (!scoped.length) return all;
  return [...scoped, ...all.filter((i) => i.color_id == null)];
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
