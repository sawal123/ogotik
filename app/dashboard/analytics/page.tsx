import { createClient } from '@/lib/supabase/server';
import { StatCard } from '@/components/dashboard/stat-card';
import { ClicksAreaChart } from '@/components/dashboard/clicks-chart';
import { BreakdownList } from '@/components/analytics/breakdown';
import { formatNumber, domainOf, bucketByDay } from '@/lib/format';
import { shortUrlFor } from '@/lib/domains';
import { MousePointerClick, Eye, TrendingUp, Percent } from 'lucide-react';
import type { ShortLink } from '@/types/db';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  const [{ data: linkData }, { data: pageData }] = await Promise.all([
    supabase.from('short_links').select('*').order('total_clicks', { ascending: false }),
    supabase.from('bio_pages').select('id, title, slug'),
  ]);
  const links = (linkData || []) as ShortLink[];
  const pages = pageData || [];
  const linkIds = links.map((l) => l.id);
  const pageIds = pages.map((p) => p.id);

  const totalClicks = links.reduce((s, l) => s + (l.total_clicks || 0), 0);

  let clickSeries = bucketByDay([], 30);
  if (linkIds.length) {
    const { data: ev } = await supabase.from('click_events').select('clicked_at').in('short_link_id', linkIds).gte('clicked_at', since);
    clickSeries = bucketByDay((ev || []).map((e) => e.clicked_at), 30);
  }

  let totalViews = 0;
  let viewSeries = bucketByDay([], 30);
  let bioLinkClicks = 0;
  if (pageIds.length) {
    const { data: pv } = await supabase.from('page_views').select('viewed_at').in('bio_page_id', pageIds).gte('viewed_at', since);
    const all = pv || [];
    viewSeries = bucketByDay(all.map((e) => e.viewed_at), 30);
    const { count } = await supabase.from('page_views').select('*', { count: 'exact', head: true }).in('bio_page_id', pageIds);
    totalViews = count || 0;

    const { data: blocks } = await supabase.from('bio_blocks').select('short_link_id').in('bio_page_id', pageIds).not('short_link_id', 'is', null);
    const refIds = new Set((blocks || []).map((b) => b.short_link_id));
    bioLinkClicks = links.filter((l) => refIds.has(l.id)).reduce((s, l) => s + (l.total_clicks || 0), 0);
  }

  const ctr = totalViews > 0 ? Math.round((bioLinkClicks / totalViews) * 100) : 0;
  const topLinks = links.filter((l) => (l.total_clicks || 0) > 0).slice(0, 6)
    .map((l) => ({ label: l.title || shortUrlFor(l.short_code), value: l.total_clicks || 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Performance across all your links and pages · last 30 days.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Clicks" value={formatNumber(totalClicks)} icon={MousePointerClick} accent="orange" />
        <StatCard label="Page Views" value={formatNumber(totalViews)} icon={Eye} accent="blue" />
        <StatCard label="Bio Link Clicks" value={formatNumber(bioLinkClicks)} icon={TrendingUp} accent="gray" />
        <StatCard label="CTR" value={`${ctr}%`} icon={Percent} accent="gray" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4"><h2 className="font-semibold">Clicks over time</h2><p className="text-xs text-muted-foreground">Short link clicks</p></div>
          <ClicksAreaChart data={clickSeries} />
        </div>
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-4"><h2 className="font-semibold">Page views over time</h2><p className="text-xs text-muted-foreground">Bio page visits</p></div>
          <ClicksAreaChart data={viewSeries} label="Views" color="#5170FF" />
        </div>
      </div>

      <BreakdownList title="Top performing links" items={topLinks} emptyLabel="No clicks recorded yet" />
    </div>
  );
}
