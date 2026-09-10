import Link from 'next/link';
import { LinkForm } from '@/components/links/link-form';
import { ChevronLeft } from 'lucide-react';

export default function NewLinkPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/dashboard/links" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to links
      </Link>
      <h1 className="text-2xl font-bold tracking-tight">Create short link</h1>
      <p className="mb-6 mt-1 text-sm text-muted-foreground">Shorten any URL and start tracking clicks instantly.</p>
      <LinkForm />
    </div>
  );
}
