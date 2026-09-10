import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { LinksList } from '@/components/links/links-list';
import { Button } from '@/components/ui/button';
import type { ShortLink } from '@/types/db';
import { Plus, Link2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LinksPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('short_links').select('*').order('created_at', { ascending: false });
  const links = (data || []) as ShortLink[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Short Links</h1>
          <p className="text-sm text-muted-foreground">{links.length} link{links.length !== 1 ? 's' : ''} · manage and track all your links.</p>
        </div>
        <Button asChild className="gap-2"><Link href="/dashboard/links/new"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Link</span></Link></Button>
      </div>

      {links.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><Link2 className="h-7 w-7" /></span>
          <h2 className="mt-4 text-lg font-semibold">No links yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Create your first short link to start sharing and tracking clicks.</p>
          <Button asChild className="mt-5 gap-2"><Link href="/dashboard/links/new"><Plus className="h-4 w-4" /> Create short link</Link></Button>
        </div>
      ) : (
        <LinksList links={links} />
      )}
    </div>
  );
}
