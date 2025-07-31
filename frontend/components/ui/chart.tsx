'use client';

import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

interface ChartDataItem {
  name: string;
  [key: string]: string | number;
}

interface ChartProps extends HTMLAttributes<HTMLDivElement> {
  data: ChartDataItem[];
  lines: {
    dataKey: string;
    stroke: string;
  }[];
  className?: string;
}

export function ChartContainer({
  data,
  lines,
  className,
  ...props
}: ChartProps) {
  return (
    <div className={cn('w-full h-[350px]', className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend content={<ChartLegendContent />} />
          {lines.map((line, idx) => (
            <Line
              key={idx}
              type="monotone"
              dataKey={line.dataKey}
              stroke={line.stroke}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ChartTooltipContent({
  active,
  payload = [],
  label,
  className,
}: {
  active?: boolean;
  payload?: {
    color?: string;
    dataKey?: string;
    name?: string;
    value?: number;
  }[];
  label?: string;
  className?: string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div
      className={cn(
        'rounded-lg border bg-background p-2 shadow-sm',
        className
      )}
      style={{ minWidth: '8rem', maxWidth: '12rem' } as React.CSSProperties}
    >
      <p className="text-sm font-semibold">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center justify-between text-sm">
          <span className="flex items-center gap-2">
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.name}
          </span>
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

function ChartLegendContent({
  payload,
  className,
}: {
  payload?: {
    value?: string;
    color?: string;
  }[];
  className?: string;
}) {
  if (!payload || payload.length === 0) return null;

  return (
    <ul className={cn('flex flex-wrap gap-4', className)}>
      {payload.map((entry, index) => (
        <li key={index} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          {entry.value}
        </li>
      ))}
    </ul>
  );
}

export const ChartTooltip = Tooltip;
export const ChartLegend = Legend;
export const ChartStyle = ResponsiveContainer;
