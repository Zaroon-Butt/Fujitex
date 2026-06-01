import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatPKR } from '@/lib/utils';
import type { Product, ProductStatus } from '@/types/database';

interface ProductRow extends Product {
  categories: { name: string; sections: { name: string } } | null;
}

const statusStyle: Record<ProductStatus, string> = {
  active: 'chip-brand',
  low_stock: 'chip',
  out_of_stock: 'chip-rose',
  archived: 'chip-rose',
};

export function AdminProductsPage() {
  const [rows, setRows] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name, sections(name))')
      .order('updated_at', { ascending: false });
    if (!error) setRows((data ?? []) as unknown as ProductRow[]);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    setRows((r) => r.filter((p) => p.id !== id));
  }

  const filtered = rows.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div>
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-display text-2xl text-ink dark:text-neutral-100">Products</h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">{rows.length} total · stock auto-updates status</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          <Plus className="h-4 w-4" /> New product
        </Link>
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search products by name…"
        className="input mt-5 max-w-md"
      />

      {loading && <p className="mt-6 text-neutral-500 dark:text-neutral-400">Loading products…</p>}

      <div className="mt-5 overflow-x-auto card">
        <table className="w-full text-sm">
          <thead className="bg-neutral-50 dark:bg-night-700 text-neutral-600 dark:text-neutral-400">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium w-px"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-neutral-100 dark:border-night-700">
                <td className="px-4 py-3">
                  <p className="font-medium text-ink dark:text-neutral-100">{p.name}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{p.fabric_type ?? '—'}</p>
                </td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">
                  {p.categories?.sections?.name ? `${p.categories.sections.name} · ` : ''}
                  {p.categories?.name ?? '—'}
                </td>
                <td className="px-4 py-3 font-medium text-ink dark:text-neutral-100">{formatPKR(p.price_paisas)}</td>
                <td className="px-4 py-3 text-neutral-700 dark:text-neutral-300">{p.stock_units}</td>
                <td className="px-4 py-3"><span className={statusStyle[p.status]}>{p.status.replace('_', ' ')}</span></td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <Link to={`/admin/products/${p.id}`} className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-night-700" title="Edit">
                      <Pencil className="h-4 w-4 text-neutral-700 dark:text-neutral-300" />
                    </Link>
                    <button onClick={() => handleDelete(p.id)} className="p-2 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10" title="Delete">
                      <Trash2 className="h-4 w-4 text-rose-700 dark:text-rose-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-neutral-500 dark:text-neutral-400">No products match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
