import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { BioEditor } from '@/components/bio/editor';
import { DEFAULT_THEME, type ThemeConfig, type SocialLink } from '@/types/db';
import type { PreviewBlock } from '@/components/bio/preview';

export const dynamic = 'force-dynamic';

export default async function EditBioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: page } = await supabase.from('bio_pages').select('*').eq('id', id).maybeSingle();
  if (!page) notFound();

  const { data: blockRows } = await supabase
    .from('bio_blocks').select('id, type, is_active, data, position')
    .eq('bio_page_id', id).order('position', { ascending: true });
  const blocks = (blockRows || []) as PreviewBlock[];

  return (
    <BioEditor
      page={{
        id: page.id,
        title: page.title,
        bio: page.bio,
        slug: page.slug,
        avatar_url: page.avatar_url,
        theme_config: (page.theme_config || DEFAULT_THEME) as ThemeConfig,
        socials: (page.socials || []) as SocialLink[],
        is_published: page.is_published,
      }}
      initialBlocks={blocks}
    />
  );
}
