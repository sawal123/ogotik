'use client';

export function BreakdownList({
  title,
  items,
  emptyLabel = 'No data yet',
}: {
  title: string;
  items: { label: string; value: number }[];
  emptyLabel?: string;
}) {
  const total = items.reduce((s, i) => s + i.value, 0);
  const top = [...items].sort((a, b) => b.value - a.value).slice(0, 6);
  return (
    <div className="rounded-xl border bg-card p-5">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      {top.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <div className="space-y-3">
          {top.map((i) => {
            const pct = total ? Math.round((i.value / total) * 100) : 0;
            return (
              <div key={i.label}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="truncate pr-2 capitalize">{i.label}</span>
                  <span className="shrink-0 font-medium text-muted-foreground">{i.value} · {pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div className="h-full rounded-full bg-primary/70" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
