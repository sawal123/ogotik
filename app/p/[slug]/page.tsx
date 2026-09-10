import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { extractMeta } from '@/lib/ua';
import { headers } from 'next/headers';
import { BioPreview, type PreviewBlock } from '@/components/bio/preview';
import { DEFAULT_THEME, type ThemeConfig, type SocialLink } from '@/types/db';

export const dynamic = 'force-dynamic';

async function loadPage(slug: string) {
  const admin = createAdminClient();
  const { data: page } = await admin.from('bio_pages').select('*').eq('slug', slug.toLowerCase()).maybeSingle();
  return page;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await loadPage(slug);
  if (!page) return { title: 'Not found — Go Tik Links' };
  return { title: `${page.title} — Go Tik Links`, description: page.bio || undefined };
}

function NotFoundView() {
  return (
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <div className="w-full max-w-sm rounded-2xl border bg-card p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary text-lg font-bold">?</div>
        <h1 className="mt-4 text-lg font-semibold">Page not found</h1>
        <p className="mt-1 text-sm text-muted-foreground">This bio page doesn&apos;t exist or isn&apos;t published yet.</p>
        <Link href="/" className="mt-5 inline-block rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">Go to Go Tik Links</Link>
      </div>
    </div>
  );
}

export default async function PublicBioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const page = await loadPage(slug);
  if (!page) return <NotFoundView />;

  // Unpublished pages: only the owner may preview.
  if (!page.is_published) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== page.user_id) return <NotFoundView />;
  }

  const { data: blockRows } = await admin
    .from('bio_blocks').select('id, type, is_active, data, position')
    .eq('bio_page_id', page.id).order('position', { ascending: true });
  const blocks = (blockRows || []) as PreviewBlock[];

  // Record a page view for published public pages (never blocks the render).
  if (page.is_published) {
    try {
      const meta = extractMeta(await headers() as unknown as Headers);
      await admin.rpc('record_page_view', {
        p_bio_page_id: page.id,
        p_referrer: meta.referrer,
        p_country: meta.country,
        p_device_type: meta.device_type,
      });
    } catch { /* analytics must not break the page */ }
  }

  const theme = (page.theme_config || DEFAULT_THEME) as ThemeConfig;
  const socials = (page.socials || []) as SocialLink[];

  return (
    <main className="min-h-screen">
      {!page.is_published && (
        <div className="bg-brand-dark px-4 py-2 text-center text-xs font-medium text-white">Preview mode · this page is not published yet</div>
      )}
      <div className="min-h-screen">
        <BioPreview
          title={page.title}
          bio={page.bio}
          avatarUrl={page.avatar_url}
          theme={theme}
          socials={socials}
          blocks={blocks}
          interactive
        />
      </div>
    </main>
  );
}
