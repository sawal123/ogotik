'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateShortCode } from '@/lib/short-code';
import { validateDestination, normalizeAlias } from '@/lib/validation';
import { isReserved } from '@/lib/reserved';

export type LinkResult =
  | { ok: true; id: string; code: string }
  | { ok?: false; error: string; referencedCount?: number };

function validAliasFormat(a: string) {
  return /^[a-z0-9-]{3,40}$/.test(a);
}

export async function checkAlias(alias: string): Promise<{ available: boolean; reason?: string }> {
  const a = normalizeAlias(alias || '');
  if (!validAliasFormat(a)) return { available: false, reason: 'Use 3-40 chars: a-z, 0-9, -' };
  if (isReserved(a)) return { available: false, reason: 'That alias is reserved' };
  const admin = createAdminClient();
  const { data } = await admin.from('short_links').select('id').eq('short_code', a).maybeSingle();
  return data ? { available: false, reason: 'Already taken' } : { available: true };
}

export async function createLink(input: {
  destination: string;
  title?: string;
  alias?: string;
  expiresAt?: string | null;
}): Promise<LinkResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in' };

  const dest = validateDestination(input.destination);
  if (!dest.ok) return { error: dest.error };

  let code: string;
  let custom = false;
  if (input.alias && input.alias.trim()) {
    const a = normalizeAlias(input.alias);
    if (!validAliasFormat(a)) return { error: 'Alias must be 3-40 chars: a-z, 0-9, -' };
    if (isReserved(a)) return { error: 'That alias is reserved' };
    code = a;
    custom = true;
  } else {
    code = generateShortCode();
  }

  const base = {
    user_id: user.id,
    destination_url: dest.url,
    title: input.title?.trim() || null,
    expires_at: input.expiresAt || null,
  };

  let attempts = 0;
  // Rely on DB UNIQUE constraint; retry generated codes on collision.
  while (true) {
    const { data, error } = await supabase
      .from('short_links')
      .insert({ ...base, short_code: code })
      .select('id, short_code')
      .single();

    if (!error && data) {
      revalidatePath('/dashboard/links');
      revalidatePath('/dashboard');
      return { ok: true, id: data.id, code: data.short_code };
    }
    if (error && (error.code === '23505' || /duplicate|unique/i.test(error.message))) {
      if (custom) return { error: 'That alias is already taken' };
      if (++attempts > 6) return { error: 'Could not generate a unique code. Please try again.' };
      code = generateShortCode();
      continue;
    }
    return { error: error?.message || 'Failed to create link' };
  }
}

export async function updateLink(
  id: string,
  input: { destination: string; title?: string; expiresAt?: string | null },
): Promise<LinkResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in' };

  const dest = validateDestination(input.destination);
  if (!dest.ok) return { error: dest.error };

  const { data, error } = await supabase
    .from('short_links')
    .update({ destination_url: dest.url, title: input.title?.trim() || null, expires_at: input.expiresAt || null })
    .eq('id', id)
    .select('id, short_code')
    .single();

  if (error || !data) return { error: error?.message || 'Link not found' };
  revalidatePath('/dashboard/links');
  revalidatePath(`/dashboard/links/${id}`);
  return { ok: true, id: data.id, code: data.short_code };
}

export async function toggleLink(id: string, isActive: boolean): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('short_links').update({ is_active: isActive }).eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/links');
  return { ok: true };
}

export async function deleteLink(id: string, force = false): Promise<{ ok?: boolean; error?: string; referencedCount?: number }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in' };

  // Detect references from bio blocks (owned pages only via RLS).
  const { data: refs } = await supabase.from('bio_blocks').select('id').eq('short_link_id', id);
  const count = refs?.length || 0;

  if (count > 0 && !force) {
    return { error: 'referenced', referencedCount: count };
  }
  if (count > 0 && force) {
    // Safely unlink: deactivate the referencing blocks first.
    await supabase.from('bio_blocks').update({ is_active: false, short_link_id: null }).eq('short_link_id', id);
  }

  const { error } = await supabase.from('short_links').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/links');
  revalidatePath('/dashboard');
  return { ok: true };
}
