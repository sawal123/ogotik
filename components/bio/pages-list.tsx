'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { deleteBioPage } from '@/features/bio/actions';
import { bioUrlFor, bioHref } from '@/lib/domains';
import { timeAgo } from '@/lib/format';
import type { BioPage } from '@/types/db';
import { MoreHorizontal, Pencil, ExternalLink, Trash2, Eye } from 'lucide-react';
import { toast } from 'sonner';

export function PagesList({ pages }: { pages: BioPage[] }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState<BioPage | null>(null);

  async function doDelete(p: BioPage) {
    const res = await deleteBioPage(p.id);
    if (res.error) { toast.error(res.error); return; }
    toast.success('Bio page deleted');
    setConfirm(null);
    router.refresh();
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {pages.map((p) => {
          const theme = p.theme_config;
          const bg = theme?.bgGradient ? `linear-gradient(160deg, ${theme.bgColor}, ${theme.bgColor2 || theme.bgColor})` : theme?.bgColor || '#F7F8FA';
          return (
            <div key={p.id} className="overflow-hidden rounded-2xl border bg-card">
              <div className="relative h-28" style={{ background: bg }}>
                <div className="absolute right-3 top-3">
                  <Badge variant={p.is_published ? 'default' : 'secondary'}>{p.is_published ? 'Live' : 'Draft'}</Badge>
                </div>
                <div className="absolute -bottom-6 left-4 grid h-12 w-12 place-items-center rounded-full border-4 border-card bg-primary/15 text-sm font-bold text-primary">
                  {(p.title || 'GT').slice(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="px-4 pb-4 pt-8">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <div className="truncate font-semibold">{p.title}</div>
                    <div className="truncate text-xs text-muted-foreground">{bioUrlFor(p.slug)}</div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem asChild><Link href={`/dashboard/pages/${p.id}/edit`}><Pencil className="mr-2 h-4 w-4" /> Edit</Link></DropdownMenuItem>
                      <DropdownMenuItem asChild><a href={bioHref(p.slug)} target="_blank" rel="noreferrer"><Eye className="mr-2 h-4 w-4" /> View page</a></DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirm(p)}><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Button asChild size="sm" variant="outline" className="flex-1 gap-1.5"><Link href={`/dashboard/pages/${p.id}/edit`}><Pencil className="h-3.5 w-3.5" /> Edit</Link></Button>
                  <CopyButton value={bioHref(p.slug)} size="sm" variant="outline" />
                  <Button asChild size="sm" variant="outline"><a href={bioHref(p.slug)} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a></Button>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground">Updated {timeAgo(p.updated_at)}</div>
              </div>
            </div>
          );
        })}
      </div>

      <AlertDialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bio page?</AlertDialogTitle>
            <AlertDialogDescription>{confirm && (<>&ldquo;{confirm.title}&rdquo; and all its blocks will be permanently removed. This cannot be undone.</>)}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => confirm && doDelete(confirm)}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
