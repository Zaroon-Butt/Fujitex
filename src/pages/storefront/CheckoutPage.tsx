import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { CreditCard, MapPin, Truck, User, CheckCircle2, Circle } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { useCart } from '@/features/cart/useCart';
import { placeOrder } from '@/features/checkout/placeOrder';
import { paymentProviders, enabledPaymentMethods } from '@/features/payments/registry';
import { ZONE_LABELS, useShippingRates, zoneForCity } from '@/features/shipping/useShippingRates';
import { formatPKR } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { PaymentMethod, ShippingZone } from '@/types/database';

const PAYMENT_ORDER: PaymentMethod[] = ['cod', 'jazzcash', 'nayapay'];

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.subtotalPaisas());
  const stitching = useCart((s) => s.stitchingTotalPaisas());
  const clear = useCart((s) => s.clear);
  const { data: rates = [] } = useShippingRates();

  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [line1, setLine1] = useState('');
  const [line2, setLine2] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [zone, setZone] = useState<ShippingZone>('rest_of_pakistan');
  const [carrierId, setCarrierId] = useState<string | null>(null);
  const [method, setMethod] = useState<PaymentMethod>('cod');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const zoneRates = useMemo(() => rates.filter((r) => r.zone === zone), [rates, zone]);
  const selectedRate = useMemo(
    () => zoneRates.find((r) => r.id === carrierId) ?? zoneRates[0],
    [zoneRates, carrierId],
  );
  const shippingPaisas = selectedRate?.base_paisas ?? 0;
  const total = subtotal + stitching + shippingPaisas;

  if (items.length === 0) {
    return (
      <section className="container-px mx-auto max-w-3xl py-16 text-center">
        <h1 className="font-display text-2xl text-ink dark:text-neutral-100">Your cart is empty</h1>
        <p className="mt-2 text-neutral-600 dark:text-neutral-400">Add something before checking out.</p>
        <Link to="/" className="btn-primary mt-6">Browse shop</Link>
      </section>
    );
  }

  function pickZone(z: ShippingZone) {
    setZone(z);
    setCarrierId(null);
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!fullName.trim()) e.fullName = 'Required';
    if (!/^[0-9+\-\s]{7,}$/.test(phone)) e.phone = 'Enter a valid phone number';
    if (!/^\S+@\S+\.\S+$/.test(email)) e.email = 'Enter a valid email';
    if (!line1.trim()) e.line1 = 'Required';
    if (!city.trim()) e.city = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate() || !selectedRate) return;
    setSubmitting(true);
    try {
      const order = await placeOrder({
        items,
        contactEmail: email,
        contactPhone: phone,
        shipFullName: fullName,
        shipLine1: line1,
        shipLine2: line2 || undefined,
        shipCity: city,
        shipProvince: province || undefined,
        shipZone: zone,
        shipCarrier: selectedRate.carrier,
        subtotalPaisas: subtotal,
        shippingPaisas,
        stitchingPaisas: stitching,
        totalPaisas: total,
        paymentMethod: method,
      });
      clear();
      navigate(
        `/order-confirmation?order=${encodeURIComponent(order.orderNumber)}&total=${total}&method=${method}`,
        { replace: true },
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Helmet><title>Checkout — Fujitex</title></Helmet>
      <section className="container-px mx-auto max-w-6xl py-8">
        <h1 className="font-display text-3xl text-ink dark:text-neutral-100">Checkout</h1>

        <form onSubmit={onSubmit} className="mt-6 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          {/* Left: form */}
          <div className="space-y-6">
            {/* Contact */}
            <Block title="Contact" icon={User}>
              <Field label="Full name" value={fullName} onChange={setFullName} error={errors.fullName} placeholder="Ahmed Khan" autoComplete="name" />
              <Field label="Phone" value={phone} onChange={setPhone} error={errors.phone} placeholder="03xx-xxxxxxx" type="tel" autoComplete="tel" />
              <Field label="Email" value={email} onChange={setEmail} error={errors.email} placeholder="you@example.com" type="email" autoComplete="email" />
            </Block>

            {/* Shipping address */}
            <Block title="Shipping address" icon={MapPin}>
              <Field label="Address line 1" value={line1} onChange={setLine1} error={errors.line1} placeholder="House, street, area" />
              <Field label="Address line 2 (optional)" value={line2} onChange={setLine2} placeholder="Apartment, landmark" />
              <div className="grid sm:grid-cols-2 gap-3">
                <Field
                  label="City"
                  value={city}
                  onChange={(v) => { setCity(v); pickZone(zoneForCity(v)); }}
                  error={errors.city}
                  placeholder="Lahore"
                />
                <Field label="Province" value={province} onChange={setProvince} placeholder="Punjab" />
              </div>
            </Block>

            {/* Delivery */}
            <Block title="Delivery" icon={Truck}>
              <div className="inline-flex rounded-full bg-neutral-100 dark:bg-night-700 p-1 gap-1">
                {(['lahore', 'rest_of_pakistan'] as ShippingZone[]).map((z) => (
                  <button
                    key={z}
                    type="button"
                    onClick={() => pickZone(z)}
                    className={cn(
                      'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                      zone === z
                        ? 'bg-brand-600 text-white'
                        : 'text-neutral-700 dark:text-neutral-300',
                    )}
                  >
                    {ZONE_LABELS[z]}
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                {zoneRates.length === 0 && (
                  <p className="text-sm text-neutral-500 dark:text-neutral-400">No shipping options configured for this zone yet.</p>
                )}
                {zoneRates.map((r) => {
                  const active = selectedRate?.id === r.id;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setCarrierId(r.id)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        active
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-500/10'
                          : 'border-neutral-200 dark:border-night-600 hover:border-neutral-300 dark:hover:border-night-500',
                      )}
                    >
                      {active ? <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400" /> : <Circle className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />}
                      <span className="flex-1">
                        <span className="block text-sm font-semibold text-ink dark:text-neutral-100">{r.carrier}</span>
                        <span className="block text-xs text-neutral-500 dark:text-neutral-400">{r.eta_days_min}–{r.eta_days_max} business days</span>
                      </span>
                      <span className="text-sm font-bold text-brand-700 dark:text-brand-300">{formatPKR(r.base_paisas)}</span>
                    </button>
                  );
                })}
              </div>
            </Block>

            {/* Payment */}
            <Block title="Payment" icon={CreditCard}>
              <div className="space-y-2">
                {PAYMENT_ORDER.map((m) => {
                  const p = paymentProviders[m];
                  const enabled = enabledPaymentMethods.includes(m);
                  const active = method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={!enabled}
                      onClick={() => enabled && setMethod(m)}
                      className={cn(
                        'w-full flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        active
                          ? 'border-brand-600 bg-brand-50 dark:bg-brand-500/10'
                          : 'border-neutral-200 dark:border-night-600 hover:border-neutral-300 dark:hover:border-night-500',
                        !enabled && 'opacity-55 cursor-not-allowed',
                      )}
                    >
                      {active ? <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400" /> : <Circle className="h-5 w-5 text-neutral-400 dark:text-neutral-500" />}
                      <span className="flex-1 text-sm font-semibold text-ink dark:text-neutral-100">
                        {p.label}
                        {!enabled && <span className="chip ml-2">Soon</span>}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Block>
          </div>

          {/* Right: summary */}
          <aside className="card p-5 lg:sticky lg:top-20">
            <h2 className="font-display text-lg text-ink dark:text-neutral-100">Order summary</h2>
            <ul className="mt-3 space-y-2 max-h-56 overflow-auto">
              {items.map((i) => (
                <li key={i.lineId} className="flex justify-between gap-3 text-sm">
                  <span className="text-neutral-700 dark:text-neutral-300 truncate">
                    {i.name} × {i.quantity}
                    {i.stitching && <span className="ml-1 text-gold-700 dark:text-gold-400">· stitched</span>}
                  </span>
                  <span className="font-medium text-ink dark:text-neutral-100 shrink-0">
                    {formatPKR((i.pricePaisas + (i.stitching?.feePaisas ?? 0)) * i.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-neutral-200 dark:border-night-600 pt-4 space-y-2 text-sm">
              <Row label="Subtotal" value={formatPKR(subtotal)} />
              {stitching > 0 && <Row label="Custom stitching" value={formatPKR(stitching)} />}
              <Row label={`Shipping${selectedRate ? ` · ${selectedRate.carrier}` : ''}`} value={formatPKR(shippingPaisas)} />
              <div className="flex justify-between pt-2 border-t border-neutral-200 dark:border-night-600">
                <span className="font-semibold text-ink dark:text-neutral-100">Total</span>
                <span className="font-bold text-brand-700 dark:text-brand-300">{formatPKR(total)}</span>
              </div>
            </div>
            <button type="submit" disabled={submitting} className="btn-gold mt-5 w-full justify-center">
              {submitting ? 'Placing order…' : 'Place order'}
            </button>
            <p className="mt-2 text-xs text-center text-neutral-500 dark:text-neutral-400">
              COD available · JazzCash &amp; NayaPay coming soon
            </p>
          </aside>
        </form>
      </section>
    </>
  );
}

function Block({ title, icon: Icon, children }: { title: string; icon: React.ComponentType<{ className?: string }>; children: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
        <h2 className="font-display text-lg text-ink dark:text-neutral-100">{title}</h2>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label, value, onChange, error, placeholder, type = 'text', autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className="input-label">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input"
      />
      {error && <p className="mt-1 text-xs text-rose-700 dark:text-rose-400">{error}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-600 dark:text-neutral-400">{label}</span>
      <span className="text-ink dark:text-neutral-100">{value}</span>
    </div>
  );
}
