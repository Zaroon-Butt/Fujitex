import { useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useProducts } from '@/features/catalog/useProducts';
import { ProductCard } from '@/components/ui/ProductCard';

export function SectionPage() {
  const { sectionSlug, categorySlug } = useParams();
  const { data: products = [], isLoading } = useProducts({ sectionSlug, categorySlug });
  const title = categorySlug ?? sectionSlug ?? 'Catalog';

  return (
    <>
      <Helmet><title>{title} — Fujitex</title></Helmet>
      <section className="container-px mx-auto max-w-7xl py-8">
        <h1 className="font-display text-2xl text-neutral-900 dark:text-neutral-100 capitalize">{title.replace(/-/g, ' ')}</h1>
        {isLoading && <p className="mt-4 text-neutral-500 dark:text-neutral-400">Loading products…</p>}
        {!isLoading && products.length === 0 && (
          <p className="mt-4 text-neutral-500 dark:text-neutral-400">No products in this category yet.</p>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 mt-6">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>
    </>
  );
}
