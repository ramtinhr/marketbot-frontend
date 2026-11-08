'use client';
import { ui } from '@/lib/ui-styles';

import { useId, useState, useRef, useEffect } from 'react';
import { Area, AreaChart, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { number } from '@/lib/format';
export function PriceChart({
  data,
  height = 220,
  compact = false,
}: {
  data: { label: string; value: number }[];
  height?: number;
  compact?: boolean;
}) {
  const id = useId().replace(/:/g, '');
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const [period, setPeriod] = useState('all');
  const visible = period === 'recent' ? data.slice(-12) : data;
  return (
    <div {...ui(`price-chart ${compact ? 'compact' : ''}`)} dir="ltr">
      {!compact && (
        <div
          data-ui="chart-tools"
          className="flex items-center justify-between [padding-top:0] [padding-right:22px] [padding-bottom:12px] [padding-left:22px] [gap:10px] [@media(width<=640px)]:[padding-right:16px] [@media(width<=640px)]:[padding-left:16px] [&_>_[data-ui~='muted']]:[font-size:var(--text-xs)] [&_>_[data-ui~='muted']]:[color:#66758a]"
          dir="rtl"
        >
          <div
            data-ui="segmented"
            className="inline-flex [background:#f5f7f9] [padding-top:3px] [padding-right:3px] [padding-bottom:3px] [padding-left:3px] [border-radius:7px] [gap:3px] [&_button]:[font-size:var(--text-xs)] [&_button]:[color:#66758a] [&_button]:[padding-top:4px] [&_button]:[padding-right:9px] [&_button]:[padding-bottom:4px] [&_button]:[padding-left:9px] [&_button]:[border-radius:5px] [&_button[data-ui~='active']]:[background:white] [&_button[data-ui~='active']]:[box-shadow:0_1px_4px_#1829380d] [&_button[data-ui~='active']]:[color:#5e6c7d]"
          >
            <button
              onClick={() => setPeriod('recent')}
              {...ui(period === 'recent' ? 'active' : '')}
            >
              ۱۲ معاملهٔ اخیر
            </button>
            <button onClick={() => setPeriod('all')} {...ui(period === 'all' ? 'active' : '')}>
              همهٔ معاملات
            </button>
          </div>
          <span data-ui="muted" className="[color:var(--muted)]">
            قیمت به تومان
          </span>
        </div>
      )}
      <div ref={container} style={{ height }} role="img" aria-label="نمودار قیمت معاملات اخیر">
        <>
          {width > 0 && (
            <AreaChart
              width={width}
              height={height}
              data={visible}
              margin={{ top: 16, right: compact ? 0 : 12, left: compact ? 0 : 10, bottom: 0 }}
            >
              <defs>
                <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10a88a" stopOpacity={0.19} />
                  <stop offset="100%" stopColor="#10a88a" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              {!compact && (
                <CartesianGrid stroke="#edf0f3" vertical={false} strokeDasharray="4 4" />
              )}
              <XAxis
                dataKey="label"
                hide={compact}
                tickLine={false}
                axisLine={false}
                minTickGap={60}
                tick={{ fontSize: 11, fill: '#929ba8' }}
              />
              <YAxis hide domain={['dataMin', 'dataMax']} />
              <Tooltip
                contentStyle={{
                  border: '1px solid #e8edf0',
                  borderRadius: 12,
                  fontFamily: 'Vazirmatn',
                  fontSize: 12,
                }}
                formatter={(value) => [`${number(Number(value))} تومان`, 'قیمت']}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#10a88a"
                strokeWidth={compact ? 1.7 : 2.2}
                fill={`url(#${id})`}
                isAnimationActive={false}
              />
            </AreaChart>
          )}
        </>
      </div>
    </div>
  );
}
