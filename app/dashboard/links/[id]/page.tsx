import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { StatCard } from '@/components/dashboard/stat-card';
import { ClicksAreaChart } from '@/components/dashboard/clicks-chart';
import { BreakdownList } from '@/components/analytics/breakdown';
import { shortUrlFor, shortHref } from '@/lib/domains';
import { formatNumber, domainOf, bucketByDay } from '@/lib/format';
import type { ShortLink, ClickEvent } from '@/types/db';
import { ChevronLeft, MousePointerClick, CalendarClock, ExternalLink, Pencil } from 'lucide-react';

export const dynamic = 'force-dynamic';

function countBy(rows: ClickEvent[], key: keyof ClickEvent, fallback = 'Unknown') {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = (r[key] as string | null) || fallback;
    map.set(v, (map.get(v) || 0) + 1);
  }
  return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
}

function referrerLabel(ref: string | null): string {
  if (!ref) return 'Direct';
  try { return new URL(ref).hostname.replace(/^www\./, ''); } catch { return ref; }
}

export default async function LinkAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: linkData } = await supabase.from('short_links').select('*').eq('id', id).maybeSingle();
  if (!linkData) notFound();
  const link = linkData as ShortLink;

  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: evData } = await supabase
    .from('click_events').select('*').eq('short_link_id', id).gte('clicked_at', since)
    .order('clicked_at', { ascending: false });
  const events = (evData || []) as ClickEvent[];

  const series = bucketByDay(events.map((e) => e.clicked_at), 30);
  const referrers = countBy(events.map((e) => ({ ...e, referrer: referrerLabel(e.referrer) })) as ClickEvent[], 'referrer', 'Direct');
  const devices = countBy(events, 'device_type', 'desktop');
  const browsers = countBy(events, 'browser', 'Unknown');
  const countries = countBy(events, 'country', 'Unknown');

  return (
    <div className="space-y-6">
      <Link href="/dashboard/links" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4" /> Back to links
      </Link>

      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-bold tracking-tight">{link.title || domainOf(link.destination_url)}</h1>
            <Badge variant={link.is_active ? 'default' : 'secondary'}>{link.is_active ? 'Active' : 'Disabled'}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm">
            <a href={shortHref(link.short_code)} target="_blank" rel="noreferrer" className="font-medium text-primary hover:underline">{shortUrlFor(link.short_code)}</a>
            <CopyButton value={shortHref(link.short_code)} size="icon" variant="ghost" className="h-7 w-7" />
          </div>
          <div className="mt-1 truncate text-xs text-muted-foreground">→ {link.destination_url}</div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button asChild variant="outline" className="gap-2"><a href={link.destination_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Open</a></Button>
          <Button asChild className="gap-2"><Link href={`/dashboard/links/${id}/edit`}><Pencil className="h-4 w-4" /> Edit</Link></Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Clicks" value={formatNumber(link.total_clicks || 0)} icon={MousePointerClick} accent="orange" />
        <StatCard label="Last 30 days" value={formatNumber(events.length)} icon={MousePointerClick} accent="blue" />
        <StatCard label="Status" value={link.is_active ? 'Active' : 'Off'} icon={CalendarClock} accent="gray" />
        <StatCard label="Expires" value={link.expires_at ? new Date(link.expires_at).toLocaleDateString() : 'Never'} icon={CalendarClock} accent="gray" />
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4"><h2 className="font-semibold">Clicks over time</h2><p className="text-xs text-muted-foreground">Last 30 days</p></div>
        <ClicksAreaChart data={series} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <BreakdownList title="Top referrers" items={referrers} />
        <BreakdownList title="Device breakdown" items={devices} />
        <BreakdownList title="Browser breakdown" items={browsers} />
        <BreakdownList title="Country breakdown" items={countries} emptyLabel="No country data available" />
      </div>
    </div>
  );
}
