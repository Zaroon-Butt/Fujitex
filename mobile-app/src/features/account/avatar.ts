// Pick + upload a profile avatar to the public `avatars` Supabase bucket.
//
// Flow: `pickAvatarImage()` opens the photo library (square crop), returning a
// local preview the edit screen shows immediately; on save, `uploadAvatar()`
// pushes the bytes to `avatars/<uid>/<timestamp>.<ext>` and returns the public
// URL. Objects live under the user's own uid folder, which is all the storage
// RLS policy lets them write (see 20260606000007_profile_avatars.sql).

import * as ImagePicker from 'expo-image-picker';
import { supabase } from '@/lib/supabase';

const AVATAR_BUCKET = 'avatars';

export interface PickedAvatar {
  uri: string;
  base64: string;
  mimeType: string;
}

/** Open the photo library and let the user crop a square avatar. Returns null
 *  if permission is denied or the user cancels. */
export async function pickAvatarImage(): Promise<
  { ok: true; asset: PickedAvatar } | { ok: false; reason: 'denied' | 'canceled' }
> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return { ok: false, reason: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.6,
    base64: true,
  });

  if (result.canceled || !result.assets?.length) return { ok: false, reason: 'canceled' };
  const a = result.assets[0];
  if (!a.base64) return { ok: false, reason: 'canceled' };

  return {
    ok: true,
    asset: { uri: a.uri, base64: a.base64, mimeType: a.mimeType ?? 'image/jpeg' },
  };
}

/** Decode a base64 string to bytes for Supabase Storage. RN provides a global
 *  `atob`; supabase-js uploads an ArrayBuffer/Uint8Array reliably (a Blob from
 *  fetch() can upload as 0 bytes on React Native). */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Upload the picked avatar and return its public URL. */
export async function uploadAvatar(userId: string, asset: PickedAvatar): Promise<string> {
  const ext = asset.mimeType.includes('png') ? 'png' : asset.mimeType.includes('webp') ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, base64ToBytes(asset.base64), {
      contentType: asset.mimeType,
      cacheControl: '3600',
      upsert: true,
    });
  if (error) throw error;

  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}
