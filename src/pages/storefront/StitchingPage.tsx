import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Ruler, Scissors } from 'lucide-react';
import { useProduct, isPurchasable, supportsStitching } from '@/features/catalog/useProduct';
import { useStitchingPrice } from '@/features/stitching/useStitchingPrice';
import { productToStitchedCartItem } from '@/features/stitching/mapper';
import {
  allMeasurementFields,
  convertValue,
  validateMeasurements,
  type MeasurementKey,
  type MeasurementUnit,
  type MeasurementValues,
} from '@/features/stitching/measurements';
import { MeasurementDiagram } from '@/components/stitching/MeasurementDiagram';
import { MeasurementForm } from '@/components/stitching/MeasurementForm';
import { useCart } from '@/features/cart/useCart';
import { formatPKR } from '@/lib/utils';
import { cn } from '@/lib/utils';

const UNITS: { id: MeasurementUnit; label: string }[] = [
  { id: 'in', label: 'Inches' },
  { id: 'cm', label: 'Cm' },
];

export function StitchingPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading } = useProduct(slug);
  const { pricePaisas } = useStitchingPrice();
  const add = useCart((s) => s.add);

  const [unit, setUnit] = useState<MeasurementUnit>('in');
  const [values, setValues] = useState<MeasurementValues>({});
  const [errors, setErrors] = useState<Partial<Record<MeasurementKey, string>>>({});
  const [activeField, setActiveField] = useState<MeasurementKey | null>(null);

  const activeLabel = useMemo(
    () => allMeasurementFields.find((f) => f.key === activeField)?.label,
    [activeField],
  );

  if (isLoading) {
    return (
      <section className="container-px mx-auto max-w-5xl py-10">
        <div className="h-44 w-full rounded-2xl bg-neutral-100 dark:bg-night-800 animate-pulse" />
        <div className="mt-6 h-64 w-full rounded-2xl bg-neutral-100 dark:bg-night-800 animate-pulse" />
      </section>
    );
  }

  // Stitching is men's-only and requires a buyable product.
  if (!product || !supportsStitching(product) || !isPurchasable(product)) {
    return (
      <section className="container-px mx-auto max-w-2xl py-20 text-center">
        <h1 className="font-display text-3xl text-ink dark:text-neutral-100">Stitching unavailable</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">
          Custom stitching isn’t offered for this item.
        </p>
        <Link to={product ? `/p/${product.slug}` : '/'} className="btn-primary mt-6">
          Back to product
        </Link>
      </section>
    );
  }

  function changeUnit(next: MeasurementUnit) {
    if (next === unit) return;
    setValues((prev) => {
      const converted: MeasurementValues = {};
      for (const f of allMeasurementFields) {
        const v = prev[f.key as MeasurementKey];
        if (v !== undefined) converted[f.key as MeasurementKey] = convertValue(v, unit, next);
      }
      return converted;
    });
    setErrors({});
    setUnit(next);
  }

  function handleChange(key: MeasurementKey, value: number | undefined) {
    setValues((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function handleAdd() {
    if (!product) return;
    const found = validateMeasurements(values, unit);
    if (Object.keys(found).length > 0) {
      setErrors(found);
      const firstKey = allMeasurementFields.find((f) => found[f.key as MeasurementKey])?.key;
      if (firstKey) {
        document.getElementById(`m-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setActiveField(firstKey as MeasurementKey);
      }
      return;
    }
    add(productToStitchedCartItem(product, { unit, values, feePaisas: pricePaisas }), 1);
    navigate('/cart');
  }

  const lineTotal = product.price_paisas + pricePaisas;

  return (
    <>
      <Helmet><title>Stitch to size — {product.name} — Fujitex</title></Helmet>
      <section className="container-px mx-auto max-w-5xl py-6 sm:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-5">
          <Link to="/" className="hover:text-brand-700 dark:hover:text-brand-300">Home</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to={`/p/${product.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300 truncate">
            {product.name}
          </Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-neutral-700 dark:text-neutral-300">Stitching</span>
        </nav>

        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          <h1 className="font-display text-2xl sm:text-3xl text-ink dark:text-neutral-100">Custom stitching</h1>
        </div>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Enter your measurements for <span className="font-semibold">{product.name}</span>. Tailored to size,
          stitched & delivered with your fabric.
        </p>

        <div className="mt-6 grid lg:grid-cols-[340px_1fr] gap-6 lg:gap-8 items-start">
          {/* Diagram + unit toggle (sticky on desktop so the highlight stays visible) */}
          <aside className="lg:sticky lg:top-20 space-y-3">
            <MeasurementDiagram activeField={activeField} activeLabel={activeLabel} />
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400">
                <Ruler className="h-4 w-4" /> Units
              </span>
              <div className="inline-flex rounded-full bg-neutral-100 dark:bg-night-700 p-1 gap-1">
                {UNITS.map((u) => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => changeUnit(u.id)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                      unit === u.id ? 'bg-brand-600 text-white' : 'text-neutral-700 dark:text-neutral-300',
                    )}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Form */}
          <div>
            <MeasurementForm
              unit={unit}
              values={values}
              errors={errors}
              onChange={handleChange}
              onFocusField={setActiveField}
              activeField={activeField}
            />

            {/* Price summary */}
            <div className="card mt-6 p-5">
              <Row label="Fabric" value={formatPKR(product.price_paisas)} />
              <Row label="Custom stitching" value={`+ ${formatPKR(pricePaisas)}`} />
              <div className="mt-3 flex justify-between border-t border-neutral-200 dark:border-night-600 pt-3">
                <span className="font-semibold text-ink dark:text-neutral-100">Total per suit</span>
                <span className="font-bold text-brand-700 dark:text-brand-300">{formatPKR(lineTotal)}</span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={handleAdd} className="btn-gold flex-1 min-w-[220px] justify-center">
                <Scissors className="h-4 w-4" /> Add stitched to cart · {formatPKR(lineTotal)}
              </button>
              <Link to={`/p/${product.slug}`} className="btn-ghost justify-center">
                <ArrowLeft className="h-4 w-4" /> Back
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm py-1">
      <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
      <span className="text-ink dark:text-neutral-100 font-medium">{value}</span>
    </div>
  );
}
