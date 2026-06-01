import { useEffect, useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Category, Section } from '@/types/database';

interface SectionWithChildren extends Section {
  categories: Category[];
}

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function AdminSectionsPage() {
  const [data, setData] = useState<SectionWithChildren[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSection, setNewSection] = useState('');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('sections')
      .select('*, categories(*)')
      .order('sort_order');
    setData((data ?? []) as SectionWithChildren[]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function addSection(e: FormEvent) {
    e.preventDefault();
    const name = newSection.trim();
    if (!name) return;
    const { error } = await supabase.from('sections').insert({
      name,
      slug: slugify(name),
      sort_order: data.length + 1,
    });
    if (error) { alert(error.message); return; }
    setNewSection('');
    load();
  }

  async function toggleSection(id: string, is_active: boolean) {
    await supabase.from('sections').update({ is_active: !is_active }).eq('id', id);
    load();
  }

  async function deleteSection(id: string) {
    if (!confirm('Delete this section and all its categories? Products in it will block deletion.')) return;
    const { error } = await supabase.from('sections').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    load();
  }

  async function addCategory(sectionId: string, name: string, sortOrder: number) {
    const slug = slugify(name);
    if (!name.trim() || !slug) return;
    const { error } = await supabase.from('categories').insert({
      section_id: sectionId, name: name.trim(), slug, sort_order: sortOrder,
    });
    if (error) alert(error.message);
    load();
  }

  async function deleteCategory(id: string) {
    if (!confirm('Delete this category? Products in it will block deletion.')) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { alert(error.message); return; }
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl text-ink dark:text-neutral-100">Sections &amp; Categories</h1>
      <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">Add a top-level section like <em>Women</em> or <em>Kids</em> — storefront tabs auto-update.</p>

      <form onSubmit={addSection} className="card p-4 mt-5 flex gap-3 items-end max-w-xl">
        <div className="flex-1">
          <label className="input-label">New section name</label>
          <input
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            className="input"
            placeholder="e.g. Women, Kids, Accessories"
          />
        </div>
        <button className="btn-primary"><Plus className="h-4 w-4" /> Add section</button>
      </form>

      {loading && <p className="mt-6 text-neutral-500 dark:text-neutral-400">Loading…</p>}

      <div className="mt-6 grid gap-5">
        {data.map((s) => (
          <SectionCard
            key={s.id}
            section={s}
            onToggle={() => toggleSection(s.id, s.is_active)}
            onDelete={() => deleteSection(s.id)}
            onAddCategory={(name) => addCategory(s.id, name, s.categories.length + 1)}
            onDeleteCategory={deleteCategory}
          />
        ))}
      </div>
    </div>
  );
}

interface SectionCardProps {
  section: SectionWithChildren;
  onToggle: () => void;
  onDelete: () => void;
  onAddCategory: (name: string) => void;
  onDeleteCategory: (id: string) => void;
}

function SectionCard({ section, onToggle, onDelete, onAddCategory, onDeleteCategory }: SectionCardProps) {
  const [newCat, setNewCat] = useState('');
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <p className="font-display text-xl text-ink dark:text-neutral-100">{section.name}</p>
          <span className="text-xs font-mono text-neutral-500 dark:text-neutral-400">/s/{section.slug}</span>
          <span className={section.is_active ? 'chip-brand' : 'chip-rose'}>
            {section.is_active ? 'live' : 'hidden'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggle} className="text-sm text-neutral-700 dark:text-neutral-300 hover:text-ink dark:hover:text-neutral-100">
            {section.is_active ? 'Hide' : 'Show'}
          </button>
          <button onClick={onDelete} className="text-sm text-rose-700 hover:text-rose-800 inline-flex items-center gap-1">
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
      </div>

      <ul className="mt-4 grid sm:grid-cols-2 gap-2">
        {section.categories.sort((a, b) => a.sort_order - b.sort_order).map((c) => (
          <li key={c.id} className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200 dark:border-night-600 px-3 py-2 text-sm">
            <div>
              <p className="font-medium text-ink dark:text-neutral-100">{c.name}</p>
              <p className="text-xs font-mono text-neutral-500 dark:text-neutral-400">{c.slug}</p>
            </div>
            <button onClick={() => onDeleteCategory(c.id)} className="p-1.5 rounded hover:bg-rose-50 text-rose-700">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </li>
        ))}
      </ul>

      <form
        onSubmit={(e) => { e.preventDefault(); onAddCategory(newCat); setNewCat(''); }}
        className="mt-4 flex gap-2 items-end max-w-md"
      >
        <input
          value={newCat}
          onChange={(e) => setNewCat(e.target.value)}
          placeholder="New category name…"
          className="input"
        />
        <button className="btn-ghost"><Plus className="h-4 w-4" /> Add</button>
      </form>
    </div>
  );
}
