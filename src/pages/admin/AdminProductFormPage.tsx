import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ChevronDown, ChevronUp, ImagePlus, Star, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import {
  syncColors,
  syncImages,
  type DraftColor,
  type DraftImage,
} from '@/features/admin/productMedia';
import type { Category, Product, ProductColor, ProductImage, Section } from '@/types/database';

interface FormState {
  section_id: string;
  category_id: string;
  slug: string;
  name: string;
  description: string;
  fabric_type: string;
  fabric_blend: string;
  occasion: string;
  price_pkr: string;
  compare_at_pkr: string;
  stock_units: string;
  low_stock_threshold: string;
}

const empty: FormState = {
  section_id: '', category_id: '', slug: '', name: '', description: '',
  fabric_type: '', fabric_blend: '', occasion: '',
  price_pkr: '', compare_at_pkr: '', stock_units: '0', low_stock_threshold: '5',
};

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

const uid = () => crypto.randomUUID();

export function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();

  const [sections, setSections] = useState<Section[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState<FormState>(empty);
  const [colors, setColors] = useState<DraftColor[]>([]);
  const [images, setImages] = useState<DraftImage[]>([]);
  const [urlInput, setUrlInput] = useState('');
  // ids present in the DB at load time, so we know what to delete on save.
  const [originalColorIds, setOriginalColorIds] = useState<string[]>([]);
  const [originalImageIds, setOriginalImageIds] = useState<string[]>([]);
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
      .select('*, product_images(*), product_colors(*)')
      .eq('id', id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) { setError(error?.message ?? 'Product not found'); setLoading(false); return; }
        const p = data as Product & { product_images: ProductImage[]; product_colors: ProductColor[] };
        const cat = categories.find((c) => c.id === p.category_id) ?? null;

        const loadedColors = [...(p.product_colors ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map<DraftColor>((c) => ({ key: c.id, id: c.id, name: c.name, hex: c.hex ?? '#888888', is_default: c.is_default }));

        const loadedImages = [...(p.product_images ?? [])]
          .sort((a, b) => (a.is_primary === b.is_primary ? a.sort_order - b.sort_order : a.is_primary ? -1 : 1))
          .map<DraftImage>((img) => ({
            key: img.id, id: img.id, url: img.url, alt_text: img.alt_text ?? '',
            is_primary: img.is_primary, colorKey: img.color_id, // color id == that colour's draft key
          }));

        setForm({
          section_id: cat?.section_id ?? '',
          category_id: p.category_id,
          slug: p.slug,
          name: p.name,
          description: p.description ?? '',
          fabric_type: p.fabric_type ?? '',
          fabric_blend: p.fabric_blend ?? '',
          occasion: p.occasion ?? '',
          price_pkr: (p.price_paisas / 100).toString(),
          compare_at_pkr: p.compare_at_paisas ? (p.compare_at_paisas / 100).toString() : '',
          stock_units: p.stock_units.toString(),
          low_stock_threshold: p.low_stock_threshold.toString(),
        });
        setColors(loadedColors);
        setImages(loadedImages);
        setOriginalColorIds(loadedColors.map((c) => c.id!).filter(Boolean));
        setOriginalImageIds(loadedImages.map((i) => i.id!).filter(Boolean));
        setLoading(false);
      });
  }, [id, isNew, categories]);

  const filteredCategories = categories.filter((c) => !form.section_id || c.section_id === form.section_id);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // ---- colours ----
  function addColor() {
    setColors((cs) => [...cs, { key: uid(), name: '', hex: '#888888', is_default: cs.length === 0 }]);
  }
  function updateColor(key: string, patch: Partial<DraftColor>) {
    setColors((cs) => cs.map((c) => (c.key === key ? { ...c, ...patch } : c)));
  }
  function setDefaultColor(key: string) {
    setColors((cs) => cs.map((c) => ({ ...c, is_default: c.key === key })));
  }
  function removeColor(key: string) {
    setColors((cs) => {
      const next = cs.filter((c) => c.key !== key);
      if (!next.some((c) => c.is_default) && next.length) next[0].is_default = true;
      return next;
    });
    // detach any images that pointed at the removed colour
    setImages((imgs) => imgs.map((i) => (i.colorKey === key ? { ...i, colorKey: null } : i)));
  }

  // ---- images ----
  function addImagesFromFiles(files: FileList | null) {
    if (!files?.length) return;
    setImages((imgs) => {
      const additions = Array.from(files).map<DraftImage>((file, idx) => ({
        key: uid(), url: URL.createObjectURL(file), file, alt_text: '',
        is_primary: imgs.length === 0 && idx === 0, colorKey: null,
      }));
      return [...imgs, ...additions];
    });
  }
  function addImageUrl() {
    const url = urlInput.trim();
    if (!url) return;
    setImages((imgs) => [...imgs, { key: uid(), url, alt_text: '', is_primary: imgs.length === 0, colorKey: null }]);
    setUrlInput('');
  }
  function setPrimaryImage(key: string) {
    setImages((imgs) => imgs.map((i) => ({ ...i, is_primary: i.key === key })));
  }
  function updateImage(key: string, patch: Partial<DraftImage>) {
    setImages((imgs) => imgs.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }
  function removeImage(key: string) {
    setImages((imgs) => {
      const target = imgs.find((i) => i.key === key);
      if (target?.file) URL.revokeObjectURL(target.url);
      const next = imgs.filter((i) => i.key !== key);
      if (target?.is_primary && next.length) next[0].is_primary = true;
      return next;
    });
  }
  function moveImage(index: number, dir: -1 | 1) {
    setImages((imgs) => {
      const next = [...imgs];
      const target = index + dir;
      if (target < 0 || target >= next.length) return imgs;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
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

    // Keep the legacy products.color text in sync with the default colour so
    // older consumers (product list, mobile spec row) still show something.
    const defaultColor = colors.find((c) => c.is_default && c.name.trim()) ?? colors.find((c) => c.name.trim());

    const slug = form.slug || slugify(form.name);
    const payload = {
      category_id: form.category_id,
      slug,
      name: form.name,
      description: form.description || null,
      fabric_type: form.fabric_type || null,
      fabric_blend: form.fabric_blend || null,
      color: defaultColor?.name.trim() ?? null,
      occasion: form.occasion || null,
      price_paisas: Math.round(parseFloat(form.price_pkr || '0') * 100),
      compare_at_paisas: form.compare_at_pkr ? Math.round(parseFloat(form.compare_at_pkr) * 100) : null,
      stock_units: parseInt(form.stock_units, 10) || 0,
      low_stock_threshold: parseInt(form.low_stock_threshold, 10) || 5,
    };

    try {
      let productId = id!;
      if (isNew) {
        const { data, error } = await supabase.from('products').insert(payload).select('id').single();
        if (error) throw error;
        productId = (data as { id: string }).id;
      } else {
        const { error } = await supabase.from('products').update(payload).eq('id', id);
        if (error) throw error;
      }

      const colorKeyToId = await syncColors(productId, colors, originalColorIds);
      await syncImages(productId, images, originalImageIds, colorKeyToId);

      navigate('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product.');
      setSaving(false);
    }
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
            <div className="sm:col-span-2">
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

          {/* Colours */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="input-label mb-0">Colours</label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Shades this fabric comes in. Tag images to a colour below.</p>
              </div>
              <button type="button" onClick={addColor} className="btn-ghost text-sm">+ Add colour</button>
            </div>
            {colors.length === 0 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">No colours yet.</p>
            )}
            {colors.map((c) => (
              <div key={c.key} className="flex items-center gap-2">
                <input
                  type="color"
                  value={c.hex}
                  onChange={(e) => updateColor(c.key, { hex: e.target.value })}
                  className="h-9 w-9 shrink-0 rounded-md border border-neutral-300 dark:border-night-600 bg-transparent cursor-pointer"
                  title="Swatch colour"
                />
                <input
                  value={c.name}
                  onChange={(e) => updateColor(c.key, { name: e.target.value })}
                  placeholder="Colour name (e.g. Stone Beige)"
                  className="input flex-1"
                />
                <label className="inline-flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-300 shrink-0 cursor-pointer">
                  <input type="radio" name="default-color" checked={c.is_default} onChange={() => setDefaultColor(c.key)} />
                  Default
                </label>
                <button type="button" onClick={() => removeColor(c.key)} className="p-2 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0" title="Remove colour">
                  <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                </button>
              </div>
            ))}
          </div>

          {/* Images */}
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <label className="input-label mb-0">Images</label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">First image is the primary. Drag order with the arrows.</p>
              </div>
              <label className="btn-ghost text-sm cursor-pointer">
                <ImagePlus className="h-4 w-4" /> Upload
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => { addImagesFromFiles(e.target.files); e.target.value = ''; }}
                />
              </label>
            </div>

            <div className="flex gap-2">
              <input
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addImageUrl(); } }}
                className="input flex-1"
                placeholder="…or paste an image URL"
              />
              <button type="button" onClick={addImageUrl} className="btn-ghost shrink-0">Add</button>
            </div>

            {images.length === 0 && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400">No images yet. Upload one or more photos (WebP recommended).</p>
            )}

            <div className="space-y-2">
              {images.map((img, i) => (
                <div key={img.key} className="flex items-center gap-3 rounded-lg border border-neutral-200 dark:border-night-600 p-2">
                  <div className="h-16 w-16 shrink-0 rounded-md overflow-hidden bg-neutral-100 dark:bg-night-800">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <input
                      value={img.alt_text}
                      onChange={(e) => updateImage(img.key, { alt_text: e.target.value })}
                      placeholder="Alt text (optional)"
                      className="input text-xs py-1.5"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setPrimaryImage(img.key)}
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-medium',
                          img.is_primary ? 'text-gold-600 dark:text-gold-400' : 'text-neutral-500 dark:text-neutral-400 hover:text-ink dark:hover:text-neutral-200',
                        )}
                      >
                        <Star className={cn('h-3.5 w-3.5', img.is_primary && 'fill-current')} />
                        {img.is_primary ? 'Primary' : 'Set primary'}
                      </button>
                      {colors.some((c) => c.name.trim()) && (
                        <select
                          value={img.colorKey ?? ''}
                          onChange={(e) => updateImage(img.key, { colorKey: e.target.value || null })}
                          className="input text-xs py-1 w-auto"
                        >
                          <option value="">All colours</option>
                          {colors.filter((c) => c.name.trim()).map((c) => (
                            <option key={c.key} value={c.key}>{c.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col shrink-0">
                    <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="p-1 disabled:opacity-30 text-neutral-600 dark:text-neutral-300" title="Move up">
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1} className="p-1 disabled:opacity-30 text-neutral-600 dark:text-neutral-300" title="Move down">
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button type="button" onClick={() => removeImage(img.key)} className="p-2 rounded-md hover:bg-rose-50 dark:hover:bg-rose-500/10 shrink-0" title="Remove image">
                    <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  </button>
                </div>
              ))}
            </div>
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
