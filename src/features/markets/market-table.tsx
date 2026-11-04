'use client';
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
        <div className="market-asset-cell">
          <button
            className={`favorite ${favorite ? 'selected' : ''}`}
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
        {data?.summary ? <Money value={data.summary.close} /> : <span className="muted">—</span>}
      </td>
      <td>{data?.summary ? <Change value={data.summary.change_pct} /> : '—'}</td>
      <td className="volume-cell">
        {data?.summary ? (
          <>
            <bdi>{number(data.summary.volume, 2)}</bdi> <small>{base}</small>
          </>
        ) : (
          '—'
        )}
      </td>
      <td className="spark-cell">
        {points.length > 1 ? (
          <PriceChart compact height={42} data={points} />
        ) : (
          <span className="muted">—</span>
        )}
      </td>
      <td>
        <Link href={`/trade/${symbol}`} className="trade-link">
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
    <div className="table-scroll">
      <table className="data-table market-table">
        <thead>
          <tr>
            <th>نام ارز</th>
            <th>آخرین قیمت</th>
            <th>تغییر ۲۴ ساعته</th>
            <th className="volume-cell">حجم معاملات</th>
            <th className="spark-cell">روند اخیر</th>
            <th>
              <span className="sr-only">عملیات</span>
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
