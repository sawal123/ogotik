'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createBioPage } from '@/features/bio/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function NewBioPage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const res = await createBioPage({ title, slug });
    if (!res.ok) { toast.error(res.error || 'Failed'); setLoading(false); return; }
    toast.success('Bio page created!');
    router.push(`/dashboard/pages/${res.id}/edit`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Link href="/dashboard/pages" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</Link>
      <h1 className="text-2xl font-bold tracking-tight">Create bio page</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Pick a name and a public link. You can customize everything next.</p>
      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-6">
        <div className="space-y-2">
          <Label htmlFor="title">Page title</Label>
          <Input id="title" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Go Tik" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Public link</Label>
          <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring">
            <span className="select-none px-3 text-sm text-muted-foreground">bio.go-tik.com/</span>
            <input id="slug" required value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="gotik" className="h-10 flex-1 rounded-r-md bg-transparent px-1 text-sm outline-none" />
          </div>
          <p className="text-xs text-muted-foreground">3-40 characters, a-z, 0-9 and dashes.</p>
        </div>
        <div className="flex justify-end gap-2">
          <Button asChild type="button" variant="ghost"><Link href="/dashboard/pages">Cancel</Link></Button>
          <Button type="submit" disabled={loading} className="gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />} Create &amp; edit</Button>
        </div>
      </form>
    </div>
  );
}
