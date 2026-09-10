import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { LinkForm } from '@/components/links/link-form';
import { ChevronLeft } from 'lucide-react';
import type { ShortLink } from '@/types/db';

export const dynamic = 'force-dynamic';

export default async function EditLinkPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('short_links').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const link = data as ShortLink;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={`/dashboard/links/${id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Edit link</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Update the destination or details. The short code stays the same.</p>
      <LinkForm edit={{ id: link.id, title: link.title, destination_url: link.destination_url, expires_at: link.expires_at }} />
    </div>
  );
}
