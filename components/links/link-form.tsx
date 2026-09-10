'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CopyButton } from '@/components/ui/copy-button';
import { createLink, updateLink } from '@/features/links/actions';
import { shortUrlFor, shortHref } from '@/lib/domains';
import { Loader2, Sparkles, CheckCircle2, ExternalLink, Plus } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

type EditData = { id: string; title: string | null; destination_url: string; expires_at: string | null };

export function LinkForm({ edit }: { edit?: EditData }) {
  const router = useRouter();
  const [destination, setDestination] = useState(edit?.destination_url || '');
  const [title, setTitle] = useState(edit?.title || '');
  const [alias, setAlias] = useState('');
  const [expiresAt, setExpiresAt] = useState(edit?.expires_at ? edit.expires_at.slice(0, 10) : '');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<{ code: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    const expires = expiresAt ? new Date(expiresAt + 'T23:59:59').toISOString() : null;

    const res = edit
      ? await updateLink(edit.id, { destination, title, expiresAt: expires })
      : await createLink({ destination, title, alias, expiresAt: expires });

    if (!res.ok) {
      toast.error(res.error || 'Something went wrong');
      setLoading(false);
      return;
    }
    if (edit) {
      toast.success('Link updated');
      router.push('/dashboard/links');
      router.refresh();
    } else {
      setCreated({ code: res.code });
      toast.success('Short link created!');
    }
    setLoading(false);
  }

  if (created) {
    return (
      <div className="rounded-2xl border bg-card p-6 text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-green-100 text-green-600">
          <CheckCircle2 className="h-6 w-6" />
        </span>
        <h2 className="mt-4 text-lg font-semibold">Your short link is ready</h2>
        <div className="mx-auto mt-4 flex max-w-md items-center gap-2 rounded-xl border bg-background p-2 pl-4">
          <span className="flex-1 truncate text-left font-medium text-primary">{shortUrlFor(created.code)}</span>
          <CopyButton value={shortHref(created.code)} label="Copy" size="sm" variant="default" />
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild variant="outline" className="gap-2">
            <a href={shortHref(created.code)} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Test redirect</a>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => { setCreated(null); setDestination(''); setTitle(''); setAlias(''); setExpiresAt(''); }}>
            <Plus className="h-4 w-4" /> Create another
          </Button>
          <Button asChild className="gap-2"><Link href="/dashboard/links">Go to links</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-card p-6">
      <div className="space-y-2">
        <Label htmlFor="destination">Destination URL</Label>
        <Input id="destination" required value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="https://go-tik.com/event/example" />
        <p className="text-xs text-muted-foreground">Where the short link should send visitors. Must start with http:// or https://</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="title">Title <span className="text-muted-foreground">(optional)</span></Label>
        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Buy Tickets" />
      </div>
      {!edit && (
        <div className="space-y-2">
          <Label htmlFor="alias">Custom alias <span className="text-muted-foreground">(optional)</span></Label>
          <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring">
            <span className="select-none px-3 text-sm text-muted-foreground">o.go-tik.com/</span>
            <input id="alias" value={alias} onChange={(e) => setAlias(e.target.value.toLowerCase())} placeholder="konser" className="h-10 flex-1 rounded-r-md bg-transparent px-1 text-sm outline-none" />
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground"><Sparkles className="h-3 w-3" /> Leave blank to auto-generate a 7-character code</p>
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="expires">Expiration date <span className="text-muted-foreground">(optional)</span></Label>
        <Input id="expires" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
      </div>
      <div className="flex justify-end gap-2">
        <Button asChild type="button" variant="ghost"><Link href="/dashboard/links">Cancel</Link></Button>
        <Button type="submit" disabled={loading} className="gap-2">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} {edit ? 'Save changes' : 'Create short link'}
        </Button>
      </div>
    </form>
  );
}
