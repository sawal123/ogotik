import { createAdminClient } from '@/lib/supabase/admin';
import { extractMeta } from '@/lib/ua';
import { linkErrorResponse } from '@/lib/link-errors';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Fast redirect resolver. Uses the server-only admin client so we never expose
// an anonymous policy over all short_links. Analytics failures never block the
// redirect itself.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params;
  const normalized = (code || '').trim().toLowerCase();
  if (!normalized || !/^[a-z0-9-]{1,40}$/.test(normalized)) {
    return linkErrorResponse('not-found');
  }

  const admin = createAdminClient();
  const { data: link, error } = await admin
    .from('short_links')
    .select('id, destination_url, is_active, expires_at')
    .eq('short_code', normalized)
    .maybeSingle();

  if (error || !link) return linkErrorResponse('not-found');
  if (!link.is_active) return linkErrorResponse('disabled');
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    return linkErrorResponse('expired');
  }

  // Record analytics atomically; ignore failures.
  try {
    const meta = extractMeta(request.headers);
    await admin.rpc('record_click', {
      p_short_link_id: link.id,
      p_referrer: meta.referrer,
      p_country: meta.country,
      p_device_type: meta.device_type,
      p_browser: meta.browser,
      p_os: meta.os,
    });
  } catch {
    // analytics must never break the redirect
  }

  return NextResponse.redirect(link.destination_url, 302);
}
