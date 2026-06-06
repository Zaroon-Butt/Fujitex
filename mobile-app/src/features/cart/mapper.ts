import type { ProductWithImages } from '@/types/database';
import { orderedImages } from '@/features/catalog/useProduct';
import type { CartItem } from './store';

/** Build a cart line item from a catalog product (snapshot of price/name/image). */
export function productToCartItem(product: ProductWithImages): Omit<CartItem, 'quantity' | 'lineId'> {
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
  };
}

export function isPurchasable(product: ProductWithImages): boolean {
  return product.status !== 'out_of_stock' && product.stock_units > 0;
}
