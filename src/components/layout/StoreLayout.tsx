import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Menu, ShoppingBag, User, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigation } from '@/features/nav/useNavigation';
import { useCart } from '@/features/cart/useCart';
import { useAuth, signOut } from '@/features/auth/useAuth';
import { env } from '@/lib/env';
import { cn } from '@/lib/utils';
import { Logo, LogoMark } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

export function StoreLayout() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: sections = [], isLoading } = useNavigation();
  const itemCount = useCart((s) => s.itemCount());
  const { user, profile, isStaff } = useAuth();
  const location = useLocation();

  const isHome = location.pathname === '/';

  useEffect(() => {
    function onScroll() { setScrolled(window.scrollY > 40); }
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Transparent overlay header only on the home hero, before scroll.
  const overlay = isHome && !scrolled;

  return (
    <div className="min-h-screen flex flex-col bg-cream dark:bg-night-900">
      <header
        className={cn(
          'fixed top-0 inset-x-0 z-40 transition-all duration-300',
          overlay
            ? 'bg-transparent text-white'
            : 'bg-white/95 dark:bg-night-900/95 backdrop-blur border-b border-neutral-200 dark:border-night-600 text-neutral-900 dark:text-neutral-100 shadow-sm',
        )}
      >
        <div className="container-px mx-auto max-w-7xl flex items-center justify-between h-16">
          <button
            type="button"
            className={cn(
              'md:hidden -ml-2 p-2 rounded-md',
              overlay ? 'hover:bg-white/10' : 'hover:bg-neutral-100 dark:hover:bg-night-700',
            )}
            aria-label="Open menu"
            onClick={() => setOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/" aria-label={env.STORE_NAME} className="inline-flex items-center">
            <Logo
              size={34}
              textClassName={cn(overlay ? 'text-white' : 'text-brand-700 dark:text-brand-300')}
            />
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium">
            {sections.map((s) => (
              <NavLink
                key={s.id}
                to={`/s/${s.slug}`}
                className={({ isActive }) =>
                  cn(
                    'transition-colors',
                    overlay
                      ? 'text-white/85 hover:text-white'
                      : 'text-neutral-700 hover:text-brand-700 dark:text-neutral-300 dark:hover:text-brand-300',
                    isActive &&
                      (overlay
                        ? 'text-white font-semibold'
                        : 'text-brand-700 dark:text-brand-300 font-semibold'),
                  )
                }
              >
                {s.name}
              </NavLink>
            ))}
            <NavLink
              to="/outlet"
              className={
                overlay
                  ? 'text-white/85 hover:text-white'
                  : 'text-neutral-700 hover:text-brand-700 dark:text-neutral-300 dark:hover:text-brand-300'
              }
            >
              Visit Outlet
            </NavLink>
          </nav>

          <div className="flex items-center gap-1">
            <ThemeToggle
              className={cn(overlay ? 'hover:bg-white/10' : 'hover:bg-neutral-100 dark:hover:bg-night-700')}
            />

            {/* User menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className={cn(
                    'p-2 rounded-full inline-flex items-center gap-2 text-sm font-medium',
                    overlay ? 'hover:bg-white/10' : 'hover:bg-neutral-100 dark:hover:bg-night-700',
                  )}
                  aria-label="Account menu"
                >
                  <div className={cn(
                    'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold',
                    overlay ? 'bg-gold-400 text-ink' : 'bg-brand-600 text-white',
                  )}>
                    {(profile?.full_name || user.email || '?').slice(0, 1).toUpperCase()}
                  </div>
                </button>
                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-night-800 shadow-xl border border-neutral-200 dark:border-night-600 py-1 z-40 text-neutral-900 dark:text-neutral-100">
                      <div className="px-4 py-3 border-b border-neutral-100 dark:border-night-700">
                        <p className="text-sm font-semibold truncate">{profile?.full_name || 'Welcome'}</p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate">{user.email}</p>
                      </div>
                      <Link
                        to="/account"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-night-700"
                      >
                        <User className="h-4 w-4" /> My account
                      </Link>
                      {isStaff && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-night-700"
                        >
                          Admin dashboard
                        </Link>
                      )}
                      <button
                        onClick={() => { setUserMenuOpen(false); signOut(); }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/signin"
                className={cn(
                  'hidden sm:inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
                  overlay
                    ? 'border border-white/30 text-white hover:bg-white/10'
                    : 'text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-night-700',
                )}
              >
                Sign in
              </Link>
            )}

            <Link
              to="/cart"
              className={cn(
                'relative -mr-2 p-2 rounded-full',
                overlay ? 'hover:bg-white/10' : 'hover:bg-neutral-100 dark:hover:bg-night-700',
              )}
              aria-label={`Cart, ${itemCount} item${itemCount === 1 ? '' : 's'}`}
            >
              <ShoppingBag className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-gold-500 text-ink text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1 flex items-center justify-center ring-2 ring-white dark:ring-night-900">
                  {itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white dark:bg-night-800 shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-night-600 bg-gradient-to-br from-brand-700 to-emerald-900 text-white">
              <span className="inline-flex items-center gap-2.5">
                <LogoMark size={30} />
                <span className="font-display text-xl">{env.STORE_NAME}</span>
              </span>
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="p-2 -mr-2 rounded-md hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            {!user && (
              <div className="p-4 border-b border-neutral-200 dark:border-night-600 grid grid-cols-2 gap-2">
                <Link to="/signin" onClick={() => setOpen(false)} className="btn-ghost !py-2 !text-xs justify-center">Sign in</Link>
                <Link to="/signup" onClick={() => setOpen(false)} className="btn-primary !py-2 !text-xs justify-center">Sign up</Link>
              </div>
            )}
            {user && (
              <div className="p-4 border-b border-neutral-200 dark:border-night-600">
                <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">{profile?.full_name || user.email}</p>
                <Link to="/account" onClick={() => setOpen(false)} className="mt-2 inline-flex items-center gap-1 text-sm text-brand-700 dark:text-brand-300">
                  <User className="h-4 w-4" /> My account
                </Link>
              </div>
            )}

            <nav className="flex-1 overflow-y-auto p-2">
              {isLoading && <p className="p-3 text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>}
              {sections.map((section) => (
                <div key={section.id} className="mb-3">
                  <Link
                    to={`/s/${section.slug}`}
                    onClick={() => setOpen(false)}
                    className="block px-3 py-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-night-700 rounded-md"
                  >
                    {section.name}
                  </Link>
                  <ul className="mt-1 pl-2">
                    {section.categories.map((c) => (
                      <li key={c.id}>
                        <Link
                          to={`/s/${section.slug}/${c.slug}`}
                          onClick={() => setOpen(false)}
                          className="block px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-night-700 rounded-md"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <Link
                to="/outlet"
                onClick={() => setOpen(false)}
                className="block px-3 py-2 mt-2 text-base font-semibold text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-night-700 rounded-md border-t border-neutral-100 dark:border-night-700 pt-4"
              >
                Visit Outlet
              </Link>
              {isStaff && (
                <Link
                  to="/admin"
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2 mt-1 text-base font-semibold text-brand-700 dark:text-brand-300 hover:bg-brand-50 dark:hover:bg-brand-500/10 rounded-md"
                >
                  Admin dashboard
                </Link>
              )}
              {user && (
                <button
                  onClick={() => { setOpen(false); signOut(); }}
                  className="w-full text-left px-3 py-2 mt-2 text-base font-semibold text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-md"
                >
                  Sign out
                </button>
              )}
            </nav>
          </aside>
        </div>
      )}

      <main className={cn('flex-1', !isHome && 'pt-16')}>
        <Outlet />
      </main>

      <footer className="bg-ink text-white/80">
        <div className="container-px mx-auto max-w-7xl py-12 grid sm:grid-cols-3 gap-8">
          <div>
            <span className="inline-flex items-center gap-2.5">
              <LogoMark size={34} />
              <span className="font-display text-2xl text-white">{env.STORE_NAME}</span>
            </span>
            <p className="mt-3 text-sm">Premium men's fabric, crafted in Lahore. Delivered across Pakistan.</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Shop</p>
            <ul className="mt-3 space-y-2 text-sm">
              {sections.map((s) => (
                <li key={s.id}><Link to={`/s/${s.slug}`} className="hover:text-white">{s.name}</Link></li>
              ))}
              <li><Link to="/outlet" className="hover:text-white">Visit Outlet</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-gold-400">Account</p>
            <ul className="mt-3 space-y-2 text-sm">
              {user ? (
                <li><Link to="/account" className="hover:text-white">My Account</Link></li>
              ) : (
                <>
                  <li><Link to="/signin" className="hover:text-white">Sign in</Link></li>
                  <li><Link to="/signup" className="hover:text-white">Create account</Link></li>
                </>
              )}
              <li><Link to="/cart" className="hover:text-white">Cart</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="container-px mx-auto max-w-7xl py-5 text-xs text-white/50 flex flex-col sm:flex-row justify-between gap-2">
            <p>&copy; {new Date().getFullYear()} {env.STORE_NAME}. Lahore, Pakistan.</p>
            <p>Prices in PKR. COD · JazzCash · NayaPay.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
