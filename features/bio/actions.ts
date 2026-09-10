'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateShortCode } from '@/lib/short-code';
import { validateDestination, normalizeAlias } from '@/lib/validation';
import { isReserved } from '@/lib/reserved';
import { DEFAULT_THEME, type ThemeConfig, type SocialLink, type BlockType } from '@/types/db';

export type BlockRow = { id: string; type: BlockType; is_active: boolean; data: Record<string, unknown> };

function validSlug(s: string) { return /^[a-z0-9-]{3,40}$/.test(s); }

export async function checkSlug(slug: string, excludeId?: string): Promise<{ available: boolean; reason?: string }> {
  const s = normalizeAlias(slug || '');
  if (!validSlug(s)) return { available: false, reason: 'Use 3-40 chars: a-z, 0-9, -' };
  if (isReserved(s)) return { available: false, reason: 'That slug is reserved' };
  const admin = createAdminClient();
  const { data } = await admin.from('bio_pages').select('id').eq('slug', s).maybeSingle();
  if (data && data.id !== excludeId) return { available: false, reason: 'Already taken' };
  return { available: true };
}

export async function createBioPage(input: { title: string; slug: string }): Promise<{ ok?: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in' };
  const slug = normalizeAlias(input.slug);
  if (!validSlug(slug)) return { error: 'Slug must be 3-40 chars: a-z, 0-9, -' };
  if (isReserved(slug)) return { error: 'That slug is reserved' };

  const { data, error } = await supabase.from('bio_pages').insert({
    user_id: user.id,
    slug,
    title: input.title.trim() || slug,
    theme_config: DEFAULT_THEME,
    socials: [],
  }).select('id').single();

  if (error) {
    if (error.code === '23505' || /duplicate|unique/i.test(error.message)) return { error: 'That slug is already taken' };
    return { error: error.message };
  }
  revalidatePath('/dashboard/pages');
  return { ok: true, id: data.id };
}

export async function updateBioMeta(id: string, input: {
  title?: string; bio?: string | null; slug?: string; avatar_url?: string | null;
  theme_config?: ThemeConfig; socials?: SocialLink[]; is_published?: boolean;
}): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in' };

  const patch: Record<string, unknown> = {};
  if (input.title !== undefined) patch.title = input.title.trim();
  if (input.bio !== undefined) patch.bio = input.bio;
  if (input.avatar_url !== undefined) patch.avatar_url = input.avatar_url;
  if (input.theme_config !== undefined) patch.theme_config = input.theme_config;
  if (input.socials !== undefined) patch.socials = input.socials.filter((s) => s.url && s.platform);
  if (input.is_published !== undefined) patch.is_published = input.is_published;

  if (input.slug !== undefined) {
    const slug = normalizeAlias(input.slug);
    if (!validSlug(slug)) return { error: 'Slug must be 3-40 chars: a-z, 0-9, -' };
    if (isReserved(slug)) return { error: 'That slug is reserved' };
    const chk = await checkSlug(slug, id);
    if (!chk.available) return { error: chk.reason || 'Slug unavailable' };
    patch.slug = slug;
  }

  const { error } = await supabase.from('bio_pages').update(patch).eq('id', id);
  if (error) {
    if (error.code === '23505') return { error: 'That slug is already taken' };
    return { error: error.message };
  }
  revalidatePath('/dashboard/pages');
  revalidatePath(`/dashboard/pages/${id}/edit`);
  return { ok: true };
}

export async function deleteBioPage(id: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('bio_pages').delete().eq('id', id);
  if (error) return { error: error.message };
  revalidatePath('/dashboard/pages');
  return { ok: true };
}

async function nextPosition(supabase: Awaited<ReturnType<typeof createClient>>, pageId: string) {
  const { data } = await supabase.from('bio_blocks').select('position').eq('bio_page_id', pageId).order('position', { ascending: false }).limit(1);
  return data && data.length ? (data[0].position as number) + 1 : 0;
}

export async function addBlock(pageId: string, type: 'heading' | 'text' | 'divider'): Promise<{ ok?: boolean; block?: BlockRow; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in' };
  const defaults: Record<string, Record<string, unknown>> = {
    heading: { text: 'New heading' }, text: { text: 'Add your text here.' }, divider: {},
  };
  const pos = await nextPosition(supabase, pageId);
  const { data, error } = await supabase.from('bio_blocks').insert({
    bio_page_id: pageId, type, position: pos, data: defaults[type],
  }).select('id').single();
  if (error) return { error: error.message };
  revalidatePath(`/dashboard/pages/${pageId}/edit`);
  return { ok: true, block: { id: data.id, type, is_active: true, data: defaults[type] } };
}

export async function addLinkBlock(pageId: string, input: { label: string; destination: string }): Promise<{ ok?: boolean; block?: BlockRow; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in' };
  const dest = validateDestination(input.destination);
  if (!dest.ok) return { error: dest.error };
  const label = (input.label || '').trim();
  if (!label) return { error: 'Label is required' };

  // Create the underlying short link (same engine powers analytics).
  let code = generateShortCode();
  let linkId: string | null = null;
  for (let i = 0; i < 6; i++) {
    const { data, error } = await supabase.from('short_links')
      .insert({ user_id: user.id, short_code: code, destination_url: dest.url, title: label })
      .select('id').single();
    if (!error && data) { linkId = data.id; break; }
    if (error && error.code === '23505') { code = generateShortCode(); continue; }
    return { error: error?.message || 'Failed to create link' };
  }
  if (!linkId) return { error: 'Could not create link' };

  const pos = await nextPosition(supabase, pageId);
  const data = { label, shortCode: code, destination: dest.url, style: 'solid' };
  const { data: blk, error: be } = await supabase.from('bio_blocks').insert({
    bio_page_id: pageId, type: 'link', position: pos, short_link_id: linkId, data,
  }).select('id').single();
  if (be) return { error: be.message };
  revalidatePath(`/dashboard/pages/${pageId}/edit`);
  return { ok: true, block: { id: blk.id, type: 'link', is_active: true, data } };
}

export async function updateBlock(blockId: string, patch: { data?: Record<string, unknown>; is_active?: boolean }): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const update: Record<string, unknown> = {};
  if (patch.data !== undefined) update.data = patch.data;
  if (patch.is_active !== undefined) update.is_active = patch.is_active;

  // If a link block's destination changed, update the underlying short link too.
  if (patch.data && typeof patch.data.destination === 'string') {
    const dest = validateDestination(patch.data.destination as string);
    if (!dest.ok) return { error: dest.error };
    const { data: block } = await supabase.from('bio_blocks').select('short_link_id').eq('id', blockId).maybeSingle();
    if (block?.short_link_id) {
      await supabase.from('short_links').update({ destination_url: dest.url, title: (patch.data.label as string) || null }).eq('id', block.short_link_id);
    }
  }

  const { error } = await supabase.from('bio_blocks').update(update).eq('id', blockId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteBlock(blockId: string): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from('bio_blocks').delete().eq('id', blockId);
  if (error) return { error: error.message };
  return { ok: true };
}

export async function reorderBlocks(pageId: string, orderedIds: string[]): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc('reorder_blocks', { p_bio_page_id: pageId, p_block_ids: orderedIds });
  if (error) return { error: error.message };
  return { ok: true };
}

export async function uploadBioAvatar(pageId: string, formData: FormData): Promise<{ ok?: boolean; url?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You must be signed in' };
  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) return { error: 'No file provided' };
  if (file.size > 5 * 1024 * 1024) return { error: 'Image must be under 5MB' };
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) return { error: 'Use JPG, PNG, WEBP or GIF' };

  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
  const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { contentType: file.type, upsert: false });
  if (upErr) return { error: upErr.message };
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path);
  await supabase.from('bio_pages').update({ avatar_url: pub.publicUrl }).eq('id', pageId);
  revalidatePath(`/dashboard/pages/${pageId}/edit`);
  return { ok: true, url: pub.publicUrl };
}
