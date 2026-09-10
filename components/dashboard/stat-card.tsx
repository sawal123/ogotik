'use client';

import { cn } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon: Icon,
  accent = 'orange',
}: {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: 'orange' | 'blue' | 'gray';
}) {
  const accents = {
    orange: 'bg-primary/10 text-primary',
    blue: 'bg-brand-blue/10 text-brand-blue',
    gray: 'bg-secondary text-muted-foreground',
  };
  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className={cn('grid h-9 w-9 place-items-center rounded-lg', accents[accent])}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
