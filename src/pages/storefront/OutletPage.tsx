import { Helmet } from 'react-helmet-async';
import { MapPin, ExternalLink, Phone, Clock } from 'lucide-react';
import { env } from '@/lib/env';

export function OutletPage() {
  return (
    <>
      <Helmet>
        <title>Visit Our Outlet — {env.STORE_NAME}, Lahore</title>
      </Helmet>

      <section className="container-px mx-auto max-w-7xl py-12">
        <p className="section-eyebrow">Lahore outlet</p>
        <h1 className="section-title mt-2">Touch the fabric in person.</h1>
        <p className="mt-3 text-neutral-700 dark:text-neutral-300 max-w-xl">
          Stop by our outlet to feel the weave, see the colours in natural light, and pick what speaks to you.
        </p>

        <div className="mt-8 grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 aspect-video rounded-2xl overflow-hidden border border-neutral-200 dark:border-night-600 bg-gradient-to-br from-brand-700 via-emerald-800 to-gold-700 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(252,211,77,0.3),transparent_60%)]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
              <MapPin className="h-10 w-10 text-gold-300" />
              <p className="mt-3 font-display text-2xl">Lahore, Pakistan</p>
              <p className="text-sm text-white/80 mt-1">Drop your Google Maps embed iframe here when ready.</p>
              <a
                href={env.STORE_OUTLET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gold mt-5"
              >
                <ExternalLink className="h-4 w-4" /> Open in Google Maps
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <InfoCard icon={MapPin} title="Address" body="Lahore, Pakistan — see Google Maps for exact pin." />
            <InfoCard icon={Clock} title="Hours" body="Mon–Sat 11:00–21:00 · Closed Sundays" />
            <InfoCard icon={Phone} title="Phone" body="Call ahead for tailored consultations." />
          </div>
        </div>
      </section>
    </>
  );
}

function InfoCard({ icon: Icon, title, body }: { icon: React.ComponentType<{ className?: string }>; title: string; body: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-brand-700 dark:text-brand-300">
        <Icon className="h-4 w-4" />
        <p className="text-xs font-bold uppercase tracking-widest">{title}</p>
      </div>
      <p className="mt-2 text-sm text-neutral-700 dark:text-neutral-300">{body}</p>
    </div>
  );
}
