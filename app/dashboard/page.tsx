import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard/stat-card';
import { ClicksAreaChart } from '@/components/dashboard/clicks-chart';
import { CopyButton } from '@/components/ui/copy-button';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatNumber, domainOf, bucketByDay, timeAgo } from '@/lib/format';
import { shortUrlFor, shortHref, bioUrlFor } from '@/lib/domains';
import {
  Link2, MousePointerClick, Eye, TrendingUp, Plus, LayoutTemplate,
  ArrowUpRight, ExternalLink,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: links }, { data: pages }] = await Promise.all([
    supabase.from('short_links').select('*').order('created_at', { ascending: false }),
    supabase.from('bio_pages').select('*').order('created_at', { ascending: false }),
  ]);

  const allLinks = links || [];
  const allPages = pages || [];
  const totalLinks = allLinks.length;
  const totalClicks = allLinks.reduce((s, l) => s + (l.total_clicks || 0), 0);

  const pageIds = allPages.map((p) => p.id);
  const linkIds = allLinks.map((l) => l.id);

  let bioViews = 0;
  let bioLinkClicks = 0;
  let series = bucketByDay([], 14);

  if (pageIds.length) {
    const { count } = await supabase
      .from('page_views').select('*', { count: 'exact', head: true })
      .in('bio_page_id', pageIds);
    bioViews = count || 0;

    const { data: blocks } = await supabase
      .from('bio_blocks').select('short_link_id')
      .in('bio_page_id', pageIds).not('short_link_id', 'is', null);
    const refIds = new Set((blocks || []).map((b) => b.short_link_id));
    bioLinkClicks = allLinks.filter((l) => refIds.has(l.id)).reduce((s, l) => s + (l.total_clicks || 0), 0);
  }

  if (linkIds.length) {
    const since = new Date(Date.now() - 14 * 86400000).toISOString();
    const { data: events } = await supabase
      .from('click_events').select('clicked_at')
      .in('short_link_id', linkIds).gte('clicked_at', since);
    series = bucketByDay((events || []).map((e) => e.clicked_at), 14);
  }

  const recentLinks = allLinks.slice(0, 5);
  const recentPages = allPages.slice(0, 3);
  const name = (user?.email || '').split('@')[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome back{name ? `, ${name}` : ''}</h1>
          <p className="text-sm text-muted-foreground">Here&apos;s how your links are performing.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/pages/new"><LayoutTemplate className="h-4 w-4" /> Bio Page</Link>
          </Button>
          <Button asChild className="gap-2">
            <Link href="/dashboard/links/new"><Plus className="h-4 w-4" /> Short Link</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Links" value={formatNumber(totalLinks)} icon={Link2} accent="orange" />
        <StatCard label="Total Clicks" value={formatNumber(totalClicks)} icon={MousePointerClick} accent="blue" />
        <StatCard label="Bio Page Views" value={formatNumber(bioViews)} icon={Eye} accent="gray" />
        <StatCard label="Bio Link Clicks" value={formatNumber(bioLinkClicks)} icon={TrendingUp} accent="gray" />
      </div>

      <div className="rounded-xl border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Clicks over time</h2>
            <p className="text-xs text-muted-foreground">Last 14 days</p>
          </div>
        </div>
        <ClicksAreaChart data={series} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent links */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Recent links</h2>
            <Link href="/dashboard/links" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {recentLinks.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">No links yet.</p>
                <Button asChild size="sm" className="mt-3 gap-2"><Link href="/dashboard/links/new"><Plus className="h-4 w-4" /> Create your first link</Link></Button>
              </div>
            )}
            {recentLinks.map((l) => (
              <div key={l.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{l.title || domainOf(l.destination_url)}</span>
                    {!l.is_active && <Badge variant="secondary" className="text-[10px]">Disabled</Badge>}
                  </div>
                  <span className="truncate text-xs text-primary">{shortUrlFor(l.short_code)}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{formatNumber(l.total_clicks || 0)}</div>
                  <div className="text-[11px] text-muted-foreground">clicks</div>
                </div>
                <CopyButton value={shortHref(l.short_code)} size="icon" variant="ghost" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent pages */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h2 className="font-semibold">Bio pages</h2>
            <Link href="/dashboard/pages" className="text-sm text-primary hover:underline">View all</Link>
          </div>
          <div className="divide-y">
            {recentPages.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-muted-foreground">No bio pages yet.</p>
                <Button asChild size="sm" variant="outline" className="mt-3 gap-2"><Link href="/dashboard/pages/new"><LayoutTemplate className="h-4 w-4" /> Create a bio page</Link></Button>
              </div>
            )}
            {recentPages.map((p) => (
              <div key={p.id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{p.title || p.slug}</span>
                    <Badge variant={p.is_published ? 'default' : 'secondary'} className="text-[10px]">{p.is_published ? 'Live' : 'Draft'}</Badge>
                  </div>
                  <span className="truncate text-xs text-muted-foreground">{bioUrlFor(p.slug)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground">{timeAgo(p.created_at)}</div>
                <Button asChild size="icon" variant="ghost"><Link href={`/dashboard/pages/${p.id}/edit`}><ArrowUpRight className="h-4 w-4" /></Link></Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
