import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Minus,
  Plus,
  RefreshCcw,
  Scissors,
  ShoppingBag,
  Shield,
  Truck,
} from 'lucide-react';
import { useProduct, orderedImages, isPurchasable, discountPct, supportsStitching } from '@/features/catalog/useProduct';
import { useCart } from '@/features/cart/useCart';
import { useStitchingPrice } from '@/features/stitching/useStitchingPrice';
import { formatPKR } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function ProductDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, error } = useProduct(slug);
  const add = useCart((s) => s.add);
  const inCart = useCart((s) => s.items.some((i) => i.slug === slug));
  const { pricePaisas: stitchingPaisas } = useStitchingPrice();

  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);

  const images = useMemo(() => (product ? orderedImages(product) : []), [product]);

  if (isLoading) {
    return (
      <section className="container-px mx-auto max-w-6xl py-10">
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="aspect-[3/4] rounded-2xl bg-neutral-100 dark:bg-night-800 animate-pulse" />
          <div className="space-y-4">
            <div className="h-5 w-24 rounded bg-neutral-100 dark:bg-night-800 animate-pulse" />
            <div className="h-8 w-2/3 rounded bg-neutral-100 dark:bg-night-800 animate-pulse" />
            <div className="h-6 w-1/3 rounded bg-neutral-100 dark:bg-night-800 animate-pulse" />
            <div className="h-24 w-full rounded bg-neutral-100 dark:bg-night-800 animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (error || !product) {
    return (
      <section className="container-px mx-auto max-w-2xl py-20 text-center">
        <h1 className="font-display text-3xl text-ink dark:text-neutral-100">Product not found</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          This product may have been removed or is no longer available.
        </p>
        <Link to="/" className="btn-primary mt-6">Back to home</Link>
      </section>
    );
  }

  const off = discountPct(product.price_paisas, product.compare_at_paisas);
  const purchasable = isPurchasable(product);
  const lineTotal = product.price_paisas * qty;

  const meta = [
    { label: 'Fabric', value: product.fabric_type },
    { label: 'Blend', value: product.fabric_blend },
    { label: 'Color', value: product.color },
    { label: 'Occasion', value: product.occasion },
  ].filter((m) => !!m.value);

  function handleAdd() {
    if (!product || !purchasable) return;
    const primary = images[0];
    add(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        pricePaisas: product.price_paisas,
        comparePaisas: product.compare_at_paisas,
        imageUrl: primary?.url,
        fabricType: product.fabric_type,
        maxStock: product.stock_units,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  return (
    <>
      <Helmet><title>{product.name} — Fujitex</title></Helmet>
      <section className="container-px mx-auto max-w-6xl py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-5">
          <Link to="/" className="hover:text-brand-700 dark:hover:text-brand-300">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-neutral-700 dark:text-neutral-300 truncate">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div>
            <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-neutral-100 dark:bg-night-800 border border-neutral-200 dark:border-night-600 relative">
              {images[activeImg] ? (
                <img
                  src={images[activeImg].url}
                  alt={images[activeImg].alt_text ?? product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 dark:text-neutral-500 text-sm">
                  No image
                </div>
              )}
              {off != null && (
                <span className="absolute top-3 left-3 chip bg-gold-500 text-ink dark:bg-gold-500 dark:text-ink">
                  {off}% OFF
                </span>
              )}
            </div>

            {images.length > 1 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImg(i)}
                    className={cn(
                      'h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors',
                      i === activeImg
                        ? 'border-brand-600'
                        : 'border-transparent hover:border-neutral-300 dark:hover:border-night-500',
                    )}
                  >
                    <img src={img.url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div>
            {!!product.fabric_type && (
              <p className="section-eyebrow">{product.fabric_type}</p>
            )}
            <h1 className="font-display text-3xl sm:text-4xl text-ink dark:text-neutral-100 mt-1">
              {product.name}
            </h1>

            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-2xl font-bold text-brand-700 dark:text-brand-300">
                {formatPKR(product.price_paisas)}
              </span>
              {off != null && (
                <span className="text-lg text-neutral-400 dark:text-neutral-500 line-through">
                  {formatPKR(product.compare_at_paisas!)}
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="mt-3 flex flex-wrap gap-2">
              {product.status === 'low_stock' && purchasable && (
                <span className="chip-rose">Hurry — only {product.stock_units} left</span>
              )}
              {!purchasable && <span className="chip-rose">Out of stock</span>}
            </div>

            {!!product.description && (
              <p className="mt-5 text-neutral-700 dark:text-neutral-300 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Spec table */}
            {meta.length > 0 && (
              <div className="card mt-6 divide-y divide-neutral-200 dark:divide-night-600">
                {meta.map((m) => (
                  <div key={m.label} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-neutral-500 dark:text-neutral-400">{m.label}</span>
                    <span className="text-sm font-semibold text-ink dark:text-neutral-100">{m.value}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Quantity + add */}
            {purchasable && (
              <div className="mt-6 flex items-center gap-4">
                <div className="inline-flex items-center rounded-full border border-neutral-300 dark:border-night-600 bg-white dark:bg-night-800">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    disabled={qty <= 1}
                    className="p-2.5 disabled:opacity-40 text-neutral-700 dark:text-neutral-200"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-ink dark:text-neutral-100">{qty}</span>
                  <button
                    onClick={() => setQty((q) => Math.min(product.stock_units, q + 1))}
                    disabled={qty >= product.stock_units}
                    className="p-2.5 disabled:opacity-40 text-neutral-700 dark:text-neutral-200"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
                <span className="text-sm text-neutral-500 dark:text-neutral-400">{product.stock_units} in stock</span>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleAdd}
                disabled={!purchasable}
                className={cn('btn-gold flex-1 min-w-[200px] justify-center', !purchasable && 'opacity-50 cursor-not-allowed')}
              >
                {added ? (
                  <><Check className="h-4 w-4" /> Added to cart</>
                ) : purchasable ? (
                  <><ShoppingBag className="h-4 w-4" /> Add to cart · {formatPKR(lineTotal)}</>
                ) : (
                  'Sold out'
                )}
              </button>
              {inCart && (
                <Link to="/cart" className="btn-ghost justify-center">View cart</Link>
              )}
            </div>

            {/* Custom stitching offer — men's products only */}
            {purchasable && supportsStitching(product) && (
              <Link
                to={`/stitch/${product.slug}`}
                className="mt-4 flex items-center gap-3 rounded-2xl border border-gold-300 bg-gold-50 dark:border-gold-400/30 dark:bg-gold-400/10 p-4 transition-colors hover:border-gold-400"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold-500 text-ink">
                  <Scissors className="h-5 w-5" />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-ink dark:text-neutral-100">
                    Get it stitched to your size
                  </span>
                  <span className="block text-xs text-neutral-600 dark:text-neutral-300">
                    Custom Shalwar Kameez tailoring · +{formatPKR(stitchingPaisas)}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 text-gold-700 dark:text-gold-300" />
              </Link>
            )}

            {/* Trust row */}
            <div className="mt-8 grid grid-cols-3 gap-3">
              {[
                { icon: Truck, label: 'Pan-PK delivery' },
                { icon: Shield, label: 'COD available' },
                { icon: RefreshCcw, label: 'Hand-inspected' },
              ].map((t) => (
                <div key={t.label} className="card p-3 text-center">
                  <t.icon className="h-5 w-5 mx-auto text-brand-600 dark:text-brand-400" />
                  <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400">{t.label}</p>
                </div>
              ))}
            </div>

            <button
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/'))}
              className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-brand-700 dark:hover:text-brand-300"
            >
              <ArrowLeft className="h-4 w-4" /> Continue shopping
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
