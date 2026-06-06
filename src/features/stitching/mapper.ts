import type { ProductWithImages } from '@/types/database';
import { orderedImages } from '@/features/catalog/useProduct';
import type { CartItem } from '@/features/cart/useCart';
import { GARMENT_TYPE, type MeasurementUnit, type MeasurementValues } from './measurements';

/** Build a stitched cart line from a product + the customer's measurements. */
export function productToStitchedCartItem(
  product: ProductWithImages,
  stitching: { unit: MeasurementUnit; values: MeasurementValues; feePaisas: number },
): Omit<CartItem, 'quantity' | 'lineId'> {
  const primary = orderedImages(product)[0];
  return {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    pricePaisas: product.price_paisas,
    comparePaisas: product.compare_at_paisas,
    imageUrl: primary?.url,
    fabricType: product.fabric_type,
    maxStock: product.stock_units,
    stitching: {
      garmentType: GARMENT_TYPE,
      unit: stitching.unit,
      values: stitching.values,
      feePaisas: stitching.feePaisas,
    },
  };
}
