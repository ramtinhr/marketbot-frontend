'use client';
import { ui } from '@/lib/ui-styles';

import Link from 'next/link';
import { ArrowUpLeft, Star } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMarket } from '@/lib/use-data';
import { AssetLabel, Change, Money } from '@/components/ui';
import { PriceChart } from '@/components/price-chart';
import { number } from '@/lib/format';
export function MarketRow({ symbol, watchlist = false }: { symbol: string; watchlist?: boolean }) {
  const { data } = useMarket(symbol);
  const [favorite, setFavorite] = useState(false);
  const base = symbol.split('_')[0];
  useEffect(() => {
    try {
      setFavorite(JSON.parse(localStorage.getItem('marketbot-watchlist') ?? '[]').includes(symbol));
    } catch {}
  }, [symbol]);
  const toggle = () => {
    try {
      const saved: string[] = JSON.parse(localStorage.getItem('marketbot-watchlist') ?? '[]');
      localStorage.setItem(
        'marketbot-watchlist',
        JSON.stringify(favorite ? saved.filter((s) => s !== symbol) : [...saved, symbol]),
      );
      setFavorite(!favorite);
    } catch {}
  };
  if (watchlist && !favorite) return null;
  const points =
    data?.trades
      .slice()
      .sort((a, b) => a.executed_at.localeCompare(b.executed_at))
      .map((t) => ({ label: t.executed_at, value: Number(t.price) })) ?? [];
  return (
    <tr>
      <td>
        <div data-ui="market-asset-cell" className="flex items-center [gap:8px]">
          <button
            {...ui(`favorite ${favorite ? 'selected' : ''}`)}
            aria-label={favorite ? 'حذف از علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی‌ها'}
            aria-pressed={favorite}
            onClick={toggle}
          >
            <Star size={15} fill={favorite ? 'currentColor' : 'none'} />
          </button>
          <AssetLabel asset={base} />
        </div>
      </td>
      <td>
        {data?.summary ? (
          <Money value={data.summary.close} />
        ) : (
          <span data-ui="muted" className="[color:var(--muted)]">
            —
          </span>
        )}
      </td>
      <td>{data?.summary ? <Change value={data.summary.change_pct} /> : '—'}</td>
      <td
        data-ui="volume-cell"
        className="[&_small]:[font-size:var(--text-xs)] [&_small]:[color:#a3acb8]"
      >
        {data?.summary ? (
          <>
            <bdi>{number(data.summary.volume, 2)}</bdi> <small>{base}</small>
          </>
        ) : (
          '—'
        )}
      </td>
      <td
        data-ui="spark-cell"
        className="[width:100px] [min-width:80px] [padding-right:8px]! [padding-left:8px]!"
      >
        {points.length > 1 ? (
          <PriceChart compact height={42} data={points} />
        ) : (
          <span data-ui="muted" className="[color:var(--muted)]">
            —
          </span>
        )}
      </td>
      <td>
        <Link
          href={`/trade/${symbol}`}
          data-ui="trade-link"
          className="[font-size:var(--text-xs)] inline-flex [gap:4px] items-center [color:#07806a] whitespace-nowrap"
        >
          معامله <ArrowUpLeft size={14} />
        </Link>
      </td>
    </tr>
  );
}
export function MarketTable({
  symbols,
  watchlist = false,
}: {
  symbols: string[];
  watchlist?: boolean;
}) {
  return (
    <div data-ui="table-scroll" className="[overflow-x:auto]">
      <table
        data-ui="data-table market-table"
        className="[border-collapse:collapse] [width:100%] whitespace-nowrap text-right [@media(width<=640px)]:[min-width:420px] [&_th]:[font-size:var(--text-xs)] [&_th]:font-semibold [&_th]:[color:#66758a] [&_th]:[padding-top:12px] [&_th]:[padding-right:13px] [&_th]:[padding-bottom:12px] [&_th]:[padding-left:13px] [&_th]:[background:#fcfcfd] [&_th]:[border-top-width:1px] [&_th]:[border-top-style:solid] [&_th]:[border-top-color:#f0f2f5] [&_th]:[border-bottom-width:1px] [&_th]:[border-bottom-style:solid] [&_th]:[border-bottom-color:#f0f2f5] [&_td]:[padding-top:var(--space-4)] [&_td]:[padding-right:13px] [&_td]:[padding-bottom:var(--space-4)] [&_td]:[padding-left:13px] [&_td]:[font-size:var(--text-sm)]! [&_td]:[border-bottom-width:1px] [&_td]:[border-bottom-style:solid] [&_td]:[border-bottom-color:#f0f2f5] [&_td]:[color:#566273] [&_tbody_tr:last-child_td]:[border-bottom-width:0] [&_tbody_tr:last-child_td]:[border-bottom-style:none] [&_tbody_tr:last-child_td]:[border-bottom-color:currentColor] [&_tbody_tr:hover]:[background:#fcfdfd] [&_td_[data-ui~='money']]:[color:#3a4859] [&_td_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_td_[data-ui~='money']]:font-medium [&_td_small]:[font-size:var(--text-xs)] [&_td_small]:[color:#66758a] [@media(width>1650px)]:[&_td]:[padding-top:20px] [@media(width>1650px)]:[&_td]:[padding-bottom:20px] [&_[data-ui~='data-table']_th]:[padding-right:14px] [&_[data-ui~='data-table']_th]:[padding-left:14px] [&_td:first-child]:[padding-right:20px] [&_th:first-child]:[padding-right:20px] [&_td:last-child]:[padding-left:20px] [&_th:last-child]:[padding-left:20px] [&_[data-ui~='asset-label']]:[min-width:91px] [&_[data-ui~='asset-label']]:[gap:8px] [&_[data-ui~='asset-icon']]:[width:29px] [&_[data-ui~='asset-icon']]:[height:29px] [&_[data-ui~='asset-icon']]:[font-size:21px] [&_[data-ui~='asset-label']_strong]:[font-size:var(--text-sm)] [&_[data-ui~='asset-label']_strong]:font-semibold [&_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_[data-ui~='money']_small]:[font-size:var(--text-xs)] [&_[data-ui~='change']]:[font-size:var(--text-xs)] [@media(width>1650px)]:[&_td]:[padding-right:20px] [@media(width>1650px)]:[&_td]:[padding-left:20px] [@media(width>1650px)]:[&_th]:[padding-right:20px] [@media(width>1650px)]:[&_th]:[padding-left:20px] [@media(width<=640px)]:[&_[data-ui~='asset-label']]:[min-width:80px] [@media(width<=640px)]:[&_[data-ui~='spark-cell']]:hidden [@media(width<=640px)]:[&_[data-ui~='volume-cell']]:hidden"
      >
        <thead>
          <tr>
            <th>نام ارز</th>
            <th>آخرین قیمت</th>
            <th>تغییر ۲۴ ساعته</th>
            <th
              data-ui="volume-cell"
              className="[&_small]:[font-size:var(--text-xs)] [&_small]:[color:#a3acb8]"
            >
              حجم معاملات
            </th>
            <th
              data-ui="spark-cell"
              className="[width:100px] [min-width:80px] [padding-right:8px]! [padding-left:8px]!"
            >
              روند اخیر
            </th>
            <th>
              <span
                data-ui="sr-only"
                className="absolute [width:1px] [height:1px] [margin-top:-1px] [margin-right:-1px] [margin-bottom:-1px] [margin-left:-1px] overflow-hidden [clip:rect(0,_0,_0,_0)]"
              >
                عملیات
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {symbols.map((s) => (
            <MarketRow key={s} symbol={s} watchlist={watchlist} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
