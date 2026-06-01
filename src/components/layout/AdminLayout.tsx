import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Package, FolderTree, ScrollText, Store, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut, useAuth } from '@/features/auth/useAuth';
import { LogoMark } from '@/components/ui/Logo';

const links = [
  { to: '/admin', label: 'Dashboard', end: true, icon: LayoutDashboard },
  { to: '/admin/sections', label: 'Sections', icon: FolderTree },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ScrollText },
];

export function AdminLayout() {
  const { profile, user } = useAuth();
  return (
    <div className="min-h-screen bg-cream dark:bg-night-900 flex">
      <aside className="hidden md:flex w-64 flex-col bg-gradient-to-b from-ink via-brand-950 to-emerald-950 text-neutral-100">
        <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
          <LogoMark size={36} />
          <div>
            <p className="font-display text-xl text-white leading-none">Fujitex</p>
            <p className="text-xs text-gold-300 uppercase tracking-widest mt-1">Admin</p>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white shadow-lg shadow-brand-600/30'
                    : 'text-neutral-300 hover:bg-white/5',
                )
              }
            >
              <l.icon className="h-4 w-4" />
              {l.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-neutral-300 hover:bg-white/5"
          >
            <Store className="h-4 w-4" /> View storefront
          </Link>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-300 hover:bg-rose-500/10"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
        <div className="px-6 py-3 border-t border-white/10 text-xs text-neutral-400 truncate">
          {profile?.full_name || user?.email}
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white dark:bg-night-800 border-b border-neutral-200 dark:border-night-600 px-6 py-4 md:hidden flex items-center justify-between">
          <span className="inline-flex items-center gap-2">
            <LogoMark size={28} />
            <span className="font-display text-lg text-brand-700">Fujitex Admin</span>
          </span>
          <button onClick={() => signOut()} className="text-sm text-rose-700">Sign out</button>
        </header>
        <main className="flex-1 p-5 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
