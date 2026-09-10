import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { PagesList } from '@/components/bio/pages-list';
import { Button } from '@/components/ui/button';
import type { BioPage } from '@/types/db';
import { Plus, LayoutTemplate } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function BioPagesPage() {
  const supabase = await createClient();
  const { data } = await supabase.from('bio_pages').select('*').order('created_at', { ascending: false });
  const pages = (data || []) as BioPage[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bio Pages</h1>
          <p className="text-sm text-muted-foreground">{pages.length} page{pages.length !== 1 ? 's' : ''} · your link-in-bio profiles.</p>
        </div>
        <Button asChild className="gap-2"><Link href="/dashboard/pages/new"><Plus className="h-4 w-4" /> <span className="hidden sm:inline">New Page</span></Link></Button>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-card p-12 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary"><LayoutTemplate className="h-7 w-7" /></span>
          <h2 className="mt-4 text-lg font-semibold">No bio pages yet</h2>
          <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">Create a beautiful link-in-bio page to share all your links in one place.</p>
          <Button asChild className="mt-5 gap-2"><Link href="/dashboard/pages/new"><Plus className="h-4 w-4" /> Create bio page</Link></Button>
        </div>
      ) : (
        <PagesList pages={pages} />
      )}
    </div>
  );
}
