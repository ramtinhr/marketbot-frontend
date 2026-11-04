'use client';
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
    <div className={`price-chart ${compact ? 'compact' : ''}`} dir="ltr">
      {!compact && (
        <div className="chart-tools" dir="rtl">
          <div className="segmented">
            <button
              onClick={() => setPeriod('recent')}
              className={period === 'recent' ? 'active' : ''}
            >
              ۱۲ معاملهٔ اخیر
            </button>
            <button onClick={() => setPeriod('all')} className={period === 'all' ? 'active' : ''}>
              همهٔ معاملات
            </button>
          </div>
          <span className="muted">قیمت به تومان</span>
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
