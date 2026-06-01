import { Link } from 'react-router-dom';
import type { ProductWithImages } from '@/types/database';
import { formatPKR } from '@/lib/utils';

interface Props {
  product: ProductWithImages;
}

export function ProductCard({ product }: Props) {
  const primary = product.product_images.find((i) => i.is_primary) ?? product.product_images[0];
  return (
    <Link
      to={`/p/${product.slug}`}
      className="group block bg-white dark:bg-night-800 rounded-lg overflow-hidden border border-neutral-200 dark:border-night-600 hover:border-brand-400 dark:hover:border-brand-500 transition-colors"
    >
      <div className="aspect-[3/4] bg-neutral-100 dark:bg-night-700 overflow-hidden">
        {primary ? (
          <img
            src={primary.url}
            alt={primary.alt_text ?? product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm">
            No image
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">{product.fabric_type}</p>
        <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100 mt-0.5 line-clamp-1">{product.name}</h3>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-sm font-semibold text-brand-700 dark:text-brand-300">{formatPKR(product.price_paisas)}</span>
          {product.compare_at_paisas && product.compare_at_paisas > product.price_paisas && (
            <span className="text-xs text-neutral-400 dark:text-neutral-500 line-through">{formatPKR(product.compare_at_paisas)}</span>
          )}
        </div>
        {product.status === 'low_stock' && (
          <p className="mt-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">Only {product.stock_units} left</p>
        )}
        {product.status === 'out_of_stock' && (
          <p className="mt-1 text-[11px] font-medium text-red-700 dark:text-red-400">Out of stock</p>
        )}
      </div>
    </Link>
  );
}
