import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="min-h-[60vh] container-px mx-auto max-w-2xl py-20 text-center">
      <p className="text-7xl font-display bg-gradient-to-br from-brand-600 to-gold-500 bg-clip-text text-transparent">404</p>
      <h1 className="font-display text-3xl text-ink dark:text-neutral-100 mt-4">Page not found</h1>
      <p className="mt-2 text-neutral-600 dark:text-neutral-400">The page you're looking for isn't on this rack.</p>
      <Link to="/" className="btn-primary mt-6">Back to home</Link>
    </section>
  );
}
