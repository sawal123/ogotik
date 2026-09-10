'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

export function ClicksAreaChart({
  data,
  label = 'Clicks',
  color = '#EC5B00',
}: {
  data: { date: string; value: number }[];
  label?: string;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f3" />
        <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} minTickGap={24} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} width={36} />
        <Tooltip
          contentStyle={{ borderRadius: 12, border: '1px solid #eceef2', fontSize: 12, boxShadow: '0 8px 24px rgba(0,0,0,.06)' }}
          labelStyle={{ color: '#2F2E2E', fontWeight: 600 }}
          formatter={(v: number) => [v, label]}
        />
        <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill="url(#fill)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
