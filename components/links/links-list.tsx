'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toggleLink, deleteLink } from '@/features/links/actions';
import { shortUrlFor, shortHref } from '@/lib/domains';
import { formatNumber, domainOf, timeAgo } from '@/lib/format';
import type { ShortLink } from '@/types/db';
import {
  MoreHorizontal, Pencil, BarChart3, ExternalLink, Power, Trash2, Link2,
} from 'lucide-react';
import { toast } from 'sonner';

function statusBadge(l: ShortLink) {
  const expired = l.expires_at && new Date(l.expires_at).getTime() < Date.now();
  if (expired) return <Badge variant="secondary">Expired</Badge>;
  if (!l.is_active) return <Badge variant="secondary">Disabled</Badge>;
  return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Active</Badge>;
}

export function LinksList({ links }: { links: ShortLink[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ShortLink | null>(null);
  const [refWarn, setRefWarn] = useState<{ link: ShortLink; count: number } | null>(null);

  async function onToggle(l: ShortLink) {
    setPending(l.id);
    const res = await toggleLink(l.id, !l.is_active);
    if (res.error) toast.error(res.error);
    else { toast.success(l.is_active ? 'Link disabled' : 'Link enabled'); router.refresh(); }
    setPending(null);
  }

  async function doDelete(l: ShortLink, force: boolean) {
    setPending(l.id);
    const res = await deleteLink(l.id, force);
    setPending(null);
    if (res.error === 'referenced') {
      setConfirm(null);
      setRefWarn({ link: l, count: res.referencedCount || 0 });
      return;
    }
    if (res.error) { toast.error(res.error); return; }
    toast.success('Link deleted');
    setConfirm(null);
    setRefWarn(null);
    router.refresh();
  }

  function ActionMenu({ l }: { l: ShortLink }) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={pending === l.id}><MoreHorizontal className="h-4 w-4" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild><Link href={`/dashboard/links/${l.id}`}><BarChart3 className="mr-2 h-4 w-4" /> View analytics</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><Link href={`/dashboard/links/${l.id}/edit`}><Pencil className="mr-2 h-4 w-4" /> Edit</Link></DropdownMenuItem>
          <DropdownMenuItem asChild><a href={l.destination_url} target="_blank" rel="noreferrer"><ExternalLink className="mr-2 h-4 w-4" /> Open destination</a></DropdownMenuItem>
          <DropdownMenuItem onClick={() => onToggle(l)}><Power className="mr-2 h-4 w-4" /> {l.is_active ? 'Disable' : 'Enable'}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm(l)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border bg-card md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-secondary/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-3 font-medium">Link</th>
              <th className="px-4 py-3 font-medium">Destination</th>
              <th className="px-4 py-3 text-right font-medium">Clicks</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Created</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {links.map((l) => (
              <tr key={l.id} className="hover:bg-secondary/30">
                <td className="px-5 py-3.5">
                  <div className="font-medium">{l.title || domainOf(l.destination_url)}</div>
                  <div className="flex items-center gap-1.5 text-xs text-primary">
                    {shortUrlFor(l.short_code)}
                    <CopyButton value={shortHref(l.short_code)} size="icon" variant="ghost" className="h-6 w-6" />
                  </div>
                </td>
                <td className="max-w-[220px] px-4 py-3.5"><span className="block truncate text-muted-foreground">{domainOf(l.destination_url)}</span></td>
                <td className="px-4 py-3.5 text-right font-semibold">{formatNumber(l.total_clicks || 0)}</td>
                <td className="px-4 py-3.5">{statusBadge(l)}</td>
                <td className="px-4 py-3.5 text-muted-foreground">{timeAgo(l.created_at)}</td>
                <td className="px-4 py-3.5 text-right"><ActionMenu l={l} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {links.map((l) => (
          <div key={l.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Link2 className="h-4 w-4" /></span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{l.title || domainOf(l.destination_url)}</div>
                <div className="truncate text-xs text-primary">{shortUrlFor(l.short_code)}</div>
              </div>
              <ActionMenu l={l} />
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">{statusBadge(l)}<span className="text-xs text-muted-foreground">{formatNumber(l.total_clicks || 0)} clicks</span></div>
              <CopyButton value={shortHref(l.short_code)} label="Copy" size="sm" variant="outline" />
            </div>
          </div>
        ))}
      </div>

      {/* Delete confirm */}
      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this link?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm && (<>The short link <b>{shortUrlFor(confirm.short_code)}</b> will stop working immediately. This cannot be undone.</>)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => confirm && doDelete(confirm, false)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Referenced warning */}
      <AlertDialog open={!!refWarn} onOpenChange={(o) => !o && setRefWarn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>This link is used on a bio page</AlertDialogTitle>
            <AlertDialogDescription>
              {refWarn && (<>It&apos;s referenced by <b>{refWarn.count}</b> bio block{refWarn.count > 1 ? 's' : ''}. Deleting it will remove those buttons from your published page. Continue?</>)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep link</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => refWarn && doDelete(refWarn.link, true)}>Delete &amp; unlink</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
