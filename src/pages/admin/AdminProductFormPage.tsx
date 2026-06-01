import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, Product, Section } from '@/types/database';

interface FormState {
  section_id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string;
  fabric_type: string;
  fabric_blend: string;
  color: string;
  occasion: string;
  price_pkr: string;
  compare_at_pkr: string;
  stock_units: string;
  low_stock_threshold: string;
  image_url: string;
}

const empty: FormState = {
  section_id: '', category_id: '', slug: '', name: '', description: '',
  fabric_type: '', fabric_blend: '', color: '', occasion: '',
  price_pkr: '', compare_at_pkr: '', stock_units: '0', low_stock_threshold: '5',
  image_url: '',
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.from('sections').select('*').order('sort_order').then(({ data }) => setSections((data ?? []) as Section[]));
    supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCategories((data ?? []) as Category[]));
  }, []);

  useEffect(() => {
    if (isNew) return;
    supabase
      .from('products')
      .select('*, product_images(url, is_primary)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setError(error?.message ?? 'Product not found'); setLoading(false); return; }
        const p = data as Product & { product_images: { url: string; is_primary: boolean }[] };
        const primary = p.product_images.find((i) => i.is_primary) ?? p.product_images[0];
        const cat = (categories.find((c) => c.id === p.category_id)) ?? null;
        setForm({
          section_id: cat?.section_id ?? '',
          category_id: p.category_id,
          slug: p.slug,
          name: p.name,
          description: p.description ?? '',
          fabric_type: p.fabric_type ?? '',
          fabric_blend: p.fabric_blend ?? '',
          color: p.color ?? '',
          occasion: p.occasion ?? '',
          price_pkr: (p.price_paisas / 100).toString(),
          compare_at_pkr: p.compare_at_paisas ? (p.compare_at_paisas / 100).toString() : '',
          stock_units: p.stock_units.toString(),
          low_stock_threshold: p.low_stock_threshold.toString(),
          image_url: primary?.url ?? '',
        });
        setLoading(false);
      });
  }, [id, isNew, categories]);

  const filteredCategories = categories.filter((c) => !form.section_id || c.section_id === form.section_id);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const priceNum = parseFloat(form.price_pkr || '0');
    const compareNum = form.compare_at_pkr ? parseFloat(form.compare_at_pkr) : null;
    if (compareNum !== null && compareNum < priceNum) {
      setError('Compare-at must be greater than or equal to price. It\'s the original "was" price shown as strike-through.');
      setSaving(false);
      return;
    }

    const slug = form.slug || slugify(form.name);
    const payload = {
      category_id: form.category_id,
      slug,
      name: form.name,
      description: form.description || null,
      fabric_type: form.fabric_type || null,
      fabric_blend: form.fabric_blend || null,
      color: form.color || null,
      occasion: form.occasion || null,
      price_paisas: Math.round(parseFloat(form.price_pkr || '0') * 100),
      compare_at_paisas: form.compare_at_pkr ? Math.round(parseFloat(form.compare_at_pkr) * 100) : null,
      stock_units: parseInt(form.stock_units, 10) || 0,
      low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 5,
    };

    let productId = id;
    if (isNew) {
      const { data, error } = await supabase.from('products').insert(payload).select('id').single();
      if (error) { setError(error.message); setSaving(false); return; }
      productId = (data as { id: string }).id;
    } else {
      const { error } = await supabase.from('products').update(payload).eq('id', id);
      if (error) { setError(error.message); setSaving(false); return; }
    }

    // Image: upsert a single primary image record from the URL field.
    if (productId && form.image_url) {
      const { data: existing } = await supabase
        .from('product_images')
        .select('id')
        .eq('product_id', productId)
        .eq('is_primary', true)
        .maybeSingle();
      if (existing) {
        await supabase.from('product_images').update({ url: form.image_url }).eq('id', (existing as { id: string }).id);
      } else {
        await supabase.from('product_images').insert({ product_id: productId, url: form.image_url, is_primary: true, sort_order: 0 });
      }
    }

    setSaving(false);
    navigate('/admin/products');
  }

  if (loading) return <p className="text-neutral-500 dark:text-neutral-400">Loading…</p>;

  return (
    <div>
      <Link to="/admin/products" className="inline-flex items-center gap-1 text-sm text-neutral-600 dark:text-neutral-400 hover:text-ink dark:hover:text-neutral-100">
        <ArrowLeft className="h-4 w-4" /> Back to products
      </Link>
      <h1 className="font-display text-2xl text-ink dark:text-neutral-100 mt-2">{isNew ? 'New product' : 'Edit product'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 space-y-4">
            <div>
              <label className="input-label">Product name</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)} className="input" />
            </div>
            <div>
              <label className="input-label">Slug</label>
              <input
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                onBlur={() => !form.slug && set('slug', slugify(form.name))}
                className="input font-mono text-xs"
                placeholder="auto-generated from name"
              />
            </div>
            <div>
              <label className="input-label">Description</label>
              <textarea
                rows={4}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="input"
              />
            </div>
          </div>

          <div className="card p-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="input-label">Fabric type</label>
              <input value={form.fabric_type} onChange={(e) => set('fabric_type', e.target.value)} className="input" placeholder="Cotton, Karandi, Latha…" />
            </div>
            <div>
              <label className="input-label">Blend</label>
              <input value={form.fabric_blend} onChange={(e) => set('fabric_blend', e.target.value)} className="input" placeholder="100% Cotton" />
            </div>
            <div>
              <label className="input-label">Color</label>
              <input value={form.color} onChange={(e) => set('color', e.target.value)} className="input" />
            </div>
            <div>
              <label className="input-label">Occasion</label>
              <select value={form.occasion} onChange={(e) => set('occasion', e.target.value)} className="input">
                <option value="">—</option>
                <option>Formal</option>
                <option>Casual</option>
                <option>Eid Collection</option>
                <option>Wedding</option>
              </select>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div>
              <label className="input-label">Primary image URL</label>
              <input
                value={form.image_url}
                onChange={(e) => set('image_url', e.target.value)}
                className="input"
                placeholder="https://… (WebP recommended)"
              />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Drop-zone upload to Supabase Storage coming next. URL works for now.</p>
            </div>
            {form.image_url && (
              <div className="rounded-lg border border-neutral-200 dark:border-night-600 overflow-hidden max-w-xs aspect-[3/4]">
                <img src={form.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <div className="card p-5 space-y-4">
            <div>
              <label className="input-label">Section</label>
              <select required value={form.section_id} onChange={(e) => { set('section_id', e.target.value); set('category_id', ''); }} className="input">
                <option value="">Choose a section…</option>
                {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Category</label>
              <select required value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className="input">
                <option value="">Choose a category…</option>
                {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="card p-5 space-y-4">
            <div>
              <label className="input-label">Price (PKR)</label>
              <input required type="number" min={0} step="any" value={form.price_pkr} onChange={(e) => set('price_pkr', e.target.value)} className="input" />
            </div>
            <div>
              <label className="input-label">Compare-at / "was" price (PKR)</label>
              <input type="number" min={0} step="any" value={form.compare_at_pkr} onChange={(e) => set('compare_at_pkr', e.target.value)} className="input" placeholder="Optional — must be higher than price" />
              <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">Original price shown as strike-through. Leave blank for no discount badge.</p>
            </div>
            <div>
              <label className="input-label">Stock (units / suits)</label>
              <input required type="number" min={0} value={form.stock_units} onChange={(e) => set('stock_units', e.target.value)} className="input" />
            </div>
            <div>
              <label className="input-label">Low-stock threshold</label>
              <input required type="number" min={0} value={form.low_stock_threshold} onChange={(e) => set('low_stock_threshold', e.target.value)} className="input" />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">Status (active / low_stock / out_of_stock) is set automatically from stock.</p>
          </div>

          {error && <div className="card p-4 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30 text-sm text-rose-800 dark:text-rose-300">{error}</div>}

          <button type="submit" disabled={saving} className="btn-primary w-full">
            {saving ? 'Saving…' : isNew ? 'Create product' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
