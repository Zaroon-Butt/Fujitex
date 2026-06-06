// Admin helpers for persisting a product's colours and image gallery.
//
// Both are edited as local "draft" arrays in the form and synced on save:
// rows that gained an id are updated, brand-new rows inserted, and rows the admin
// removed are deleted. Images carry an optional File (just-picked, not yet uploaded)
// which is pushed to Supabase Storage before the DB row is written.

import { supabase } from '@/lib/supabase';

export const PRODUCT_IMAGE_BUCKET = 'product-images';

/** A colour row being edited. `key` is a stable client id so images can reference
 *  a colour that doesn't have a DB id yet. `id` is set once it exists in the DB. */
export interface DraftColor {
  key: string;
  id?: string;
  name: string;
  hex: string;
  is_default: boolean;
}

/** An image row being edited. `url` is either a remote URL or a local object URL
 *  preview for a just-picked `file`. `colorKey` references a DraftColor.key. */
export interface DraftImage {
  key: string;
  id?: string;
  url: string;
  file?: File;
  alt_text: string;
  is_primary: boolean;
  colorKey: string | null;
}

/** Upload one image to the product-images bucket and return its public URL. */
export async function uploadProductImage(productId: string, file: File): Promise<string> {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${productId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(PRODUCT_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: '31536000', contentType: file.type || undefined });
  if (error) throw error;
  return supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Insert/update/delete product_colors to match `colors`. Colours with a blank
 * name are skipped. Returns a map of DraftColor.key -> DB id for image linking.
 */
export async function syncColors(
  productId: string,
  colors: DraftColor[],
  originalIds: string[],
): Promise<Map<string, string>> {
  const keyToId = new Map<string, string>();
  const valid = colors.filter((c) => c.name.trim());

  const keptIds = new Set(valid.filter((c) => c.id).map((c) => c.id!));
  const removed = originalIds.filter((id) => !keptIds.has(id));
  if (removed.length) {
    const { error } = await supabase.from('product_colors').delete().in('id', removed);
    if (error) throw error;
  }

  for (let i = 0; i < valid.length; i++) {
    const c = valid[i];
    const row = {
      product_id: productId,
      name: c.name.trim(),
      hex: c.hex || null,
      sort_order: i,
      is_default: c.is_default,
    };
    if (c.id) {
      const { error } = await supabase.from('product_colors').update(row).eq('id', c.id);
      if (error) throw error;
      keyToId.set(c.key, c.id);
    } else {
      const { data, error } = await supabase.from('product_colors').insert(row).select('id').single();
      if (error) throw error;
      keyToId.set(c.key, (data as { id: string }).id);
    }
  }
  return keyToId;
}

/**
 * Insert/update/delete product_images to match `images`, uploading any pending
 * files first. Exactly one image is persisted as primary (the flagged one, or the
 * first). `colorKeyToId` maps a draft colour key to its DB id.
 */
export async function syncImages(
  productId: string,
  images: DraftImage[],
  originalIds: string[],
  colorKeyToId: Map<string, string>,
): Promise<void> {
  const usable = images.filter((img) => img.file || img.url.trim());
  if (usable.length && !usable.some((img) => img.is_primary)) usable[0].is_primary = true;

  const keptIds = new Set(usable.filter((img) => img.id).map((img) => img.id!));
  const removed = originalIds.filter((id) => !keptIds.has(id));
  if (removed.length) {
    const { error } = await supabase.from('product_images').delete().in('id', removed);
    if (error) throw error;
  }

  // Clear primary up-front so per-row writes never trip the one-primary unique index.
  await supabase.from('product_images').update({ is_primary: false }).eq('product_id', productId);

  for (let i = 0; i < usable.length; i++) {
    const img = usable[i];
    const url = img.file ? await uploadProductImage(productId, img.file) : img.url.trim();
    const row = {
      product_id: productId,
      url,
      alt_text: img.alt_text.trim() || null,
      sort_order: i,
      is_primary: img.is_primary,
      color_id: img.colorKey ? colorKeyToId.get(img.colorKey) ?? null : null,
    };
    if (img.id) {
      const { error } = await supabase.from('product_images').update(row).eq('id', img.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('product_images').insert(row);
      if (error) throw error;
    }
  }
}
