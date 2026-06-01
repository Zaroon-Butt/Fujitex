import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronDown, MapPin, Shield, Truck, Sparkles } from 'lucide-react';
import { useNavigation } from '@/features/nav/useNavigation';
import { useProducts } from '@/features/catalog/useProducts';
import { ProductCard } from '@/components/ui/ProductCard';
import { env } from '@/lib/env';

export function HomePage() {
  const { data: sections = [], isLoading: navLoading, error: navError } = useNavigation();
  const { data: products = [], isLoading: prodLoading } = useProducts();

  const heroBg = env.HERO_IMAGE_URL
    ? { backgroundImage: `url("${env.HERO_IMAGE_URL}")` }
    : undefined;

  return (
    <>
      <Helmet>
        <title>{env.STORE_NAME} — Premium Men's Fabric, Lahore</title>
        <meta
          name="description"
          content="Premium unstitched and stitched fabrics from Lahore — Cotton, Karandi, Latha, Wash & Wear. Cash on Delivery, JazzCash, NayaPay. Pan-Pakistan shipping."
        />
        <meta property="og:title" content={`${env.STORE_NAME} — Premium Men's Fabric`} />
        <meta property="og:type" content="website" />
        <meta property="og:description" content="Premium fabric for the Pakistani gentleman. Pan-Pakistan delivery." />
      </Helmet>

      {/* ============ FULL-SCREEN HERO ============ */}
      <section
        className="relative min-h-[100svh] flex items-center overflow-hidden bg-cover bg-center"
        style={heroBg}
      >
        {/* Vibrant gradient fallback / overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900 via-brand-800 to-emerald-950" />
        {/* Decorative gold blobs */}
        <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full bg-gold-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-rose-600/20 blur-3xl" />
        {/* Dark vignette so hero text always pops on top of any background image */}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/40" />

        <div className="container-px relative mx-auto max-w-7xl py-20 sm:py-24">
          <div className="max-w-3xl text-white animate-fade-up">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold-500/20 border border-gold-400/30 px-4 py-1.5 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-gold-200">
              <Sparkles className="h-3.5 w-3.5" />
              Crafted in Lahore
            </span>

            <h1 style={{ lineHeight: 1.3 }} className="font-display text-4xl xs:text-5xl sm:text-6xl lg:text-7xl mt-6">
              Fabric woven with
              <span className="block bg-gradient-to-r from-gold-300 via-gold-400 to-gold-200 bg-clip-text text-transparent">
                heritage &amp; soul.
              </span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-white/85 max-w-xl leading-relaxed">
              Discover the finest Cotton, Karandi, Latha and Wash &amp; Wear — hand-selected for the
              modern Pakistani gentleman. Delivered across the country with COD, JazzCash &amp; NayaPay.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {sections[0] && (
                <Link to={`/s/${sections[0].slug}`} className="btn-gold">
                  Shop {sections[0].name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
              <Link to="/outlet" className="btn-ghost-light">
                <MapPin className="h-4 w-4" />
                Visit Outlet
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/80">
              <li className="flex items-center gap-2"><Truck className="h-4 w-4 text-gold-300" />Pan-Pakistan delivery</li>
              <li className="flex items-center gap-2"><Shield className="h-4 w-4 text-gold-300" />Cash on Delivery</li>
              <li className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-gold-300" />Premium curated fabrics</li>
            </ul>
          </div>
        </div>

        {/* Scroll indicator */}
        <a
          href="#shop"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/70 hover:text-white animate-bounce-slow"
          aria-label="Scroll to shop"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ChevronDown className="h-5 w-5" />
        </a>
      </section>

      {/* ============ CATEGORIES ============ */}
      <section id="shop" className="container-px mx-auto max-w-7xl py-16 sm:py-24">
        <div className="text-center max-w-2xl mx-auto">
          <p className="section-eyebrow">Shop by category</p>
          <h2 className="section-title mt-2">Find your perfect fabric.</h2>
          <p className="mt-3 text-neutral-600 dark:text-neutral-400">
            From breezy summer cottons to warm winter karandi — every cut, hand-picked.
          </p>
        </div>

        {navError && (
          <div className="mt-8 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 p-4 text-sm text-rose-900 dark:text-rose-200 max-w-2xl mx-auto">
            Couldn't load navigation. Check that your Supabase env vars are set and the SQL migrations have been applied.
          </div>
        )}

        {navLoading && <p className="text-center mt-8 text-neutral-500 dark:text-neutral-400">Loading sections…</p>}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-10">
          {sections.flatMap((s, sIdx) =>
            s.categories.map((c, cIdx) => {
              const palettes = [
                'from-brand-600 to-emerald-700',
                'from-gold-500 to-gold-700',
                'from-rose-600 to-rose-800',
                'from-emerald-700 to-brand-900',
              ];
              const palette = palettes[(sIdx + cIdx) % palettes.length];
              return (
                <Link
                  key={c.id}
                  to={`/s/${s.slug}/${c.slug}`}
                  className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${palette} aspect-square sm:aspect-[4/5] p-5 sm:p-6 text-white shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all`}
                >
                  <div className="absolute -bottom-12 -right-12 w-44 h-44 rounded-full bg-white/10 group-hover:scale-125 transition-transform" />
                  <div className="absolute -top-8 -left-8 w-28 h-28 rounded-full bg-white/5" />
                  <div className="relative h-full flex flex-col justify-between">
                    <p className="text-[10px] sm:text-xs uppercase tracking-[0.18em] opacity-80">{s.name}</p>
                    <div>
                      <p className="font-display text-xl sm:text-2xl leading-tight">{c.name}</p>
                      <div className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium opacity-90 group-hover:opacity-100">
                        Shop now
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            }),
          )}
        </div>
      </section>

      {/* ============ FEATURED PRODUCTS ============ */}
      <section className="bg-white dark:bg-night-800 border-y border-neutral-200 dark:border-night-600">
        <div className="container-px mx-auto max-w-7xl py-16 sm:py-24">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="section-eyebrow">Fresh arrivals</p>
              <h2 className="section-title mt-2">New this week.</h2>
            </div>
            {sections[0] && (
              <Link to={`/s/${sections[0].slug}`} className="text-sm font-semibold text-brand-700 dark:text-brand-300 hover:text-brand-800 dark:hover:text-brand-200 inline-flex items-center gap-1">
                View all
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>

          {prodLoading && <p className="mt-8 text-neutral-500 dark:text-neutral-400">Loading products…</p>}

          {!prodLoading && products.length === 0 && (
            <div className="mt-8 rounded-xl bg-gold-50 dark:bg-gold-400/10 border border-gold-200 dark:border-gold-400/30 p-6 text-center text-gold-900 dark:text-gold-200">
              <p className="font-semibold">No products yet.</p>
              <p className="text-sm mt-1">Apply the SQL migrations (seed file included) to populate the catalog.</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mt-10">
            {products.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* ============ BRAND STORY ============ */}
      <section className="container-px mx-auto max-w-7xl py-16 sm:py-24">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="section-eyebrow">Our story</p>
            <h2 className="section-title mt-2">Premium fabric, fairly priced.</h2>
            <p className="mt-4 text-neutral-700 dark:text-neutral-300 leading-relaxed">
              We source directly from Pakistan's finest mills, skip the markup, and pass the value to you.
              Every cut is inspected by hand — what arrives at your door is what you saw online, in the same
              colour, in the same weave.
            </p>
            <div className="grid grid-cols-3 gap-4 mt-8">
              {[
                { num: '100%', label: 'Hand-inspected' },
                { num: '24h',  label: 'Lahore dispatch' },
                { num: '3–5d', label: 'Pan-PK delivery' },
              ].map((s) => (
                <div key={s.label} className="card p-4 text-center">
                  <p className="font-display text-2xl text-brand-700 dark:text-brand-300">{s.num}</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-gradient-to-br from-brand-700 via-emerald-800 to-gold-700 shadow-2xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(252,211,77,0.3),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(190,24,93,0.25),transparent_60%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-display text-white/90 text-2xl text-center px-8 leading-snug">
                "Texture you can feel. Craft you can trust."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ OUTLET CTA ============ */}
      <section className="bg-gradient-to-br from-ink via-brand-950 to-emerald-950 text-white">
        <div className="container-px mx-auto max-w-7xl py-16 sm:py-20 text-center">
          <p className="section-eyebrow !text-gold-300">Lahore outlet</p>
          <h2 className="font-display text-3xl sm:text-4xl mt-2">Touch the fabric in person.</h2>
          <p className="mt-3 text-white/75 max-w-xl mx-auto">
            Drop by our outlet — see the weave, feel the weight, and pick what speaks to you.
          </p>
          <Link to="/outlet" className="btn-gold mt-8">
            <MapPin className="h-4 w-4" />
            Get directions
          </Link>
        </div>
      </section>
    </>
  );
}
