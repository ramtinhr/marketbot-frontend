'use client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search, Star, Activity } from 'lucide-react';
import { useSymbols, useMarket } from '@/lib/use-data';
import { AssetIcon, Change, Money, PageHeading, Panel, State } from '@/components/ui';
import { assetName } from '@/lib/format';
import { MarketTable } from './market-table';
function MarketCard({ symbol }: { symbol: string }) {
  const { data } = useMarket(symbol);
  const base = symbol.split('_')[0];
  return (
    <Panel className="market-summary-card">
      <div className="market-summary-name">
        <AssetIcon asset={base} />
        <strong>
          {assetName(base)}
          <small>{base} / IRT</small>
        </strong>
        {data?.summary && <Change value={data.summary.change_pct} />}
      </div>
      <div>{data?.summary ? <Money value={data.summary.close} /> : <span>—</span>}</div>
    </Panel>
  );
}
export function Markets() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('q') ?? '');
  const [tab, setTab] = useState('all');
  const [sort, setSort] = useState('default');
  const symbols = useSymbols();
  const filtered = (symbols.data?.symbols ?? []).filter((s) =>
    `${s} ${assetName(s.split('_')[0])}`.toLowerCase().includes(search.toLowerCase()),
  );
  if (sort === 'name') filtered.sort();
  return (
    <>
      <PageHeading
        title="بازارها"
        description="بازار را دنبال کنید؛ فرصت بعدی را آگاهانه انتخاب کنید."
      />
      <div className="market-summary-grid">
        {(symbols.data?.symbols ?? ['USDT_IRT', 'BTC_IRT', 'ETH_IRT']).slice(0, 3).map((s) => (
          <MarketCard key={s} symbol={s} />
        ))}
      </div>
      <Panel>
        <div className="table-toolbar">
          <div className="tabs">
            <button className={tab === 'all' ? 'active' : ''} onClick={() => setTab('all')}>
              همهٔ بازارها
            </button>
            <button
              className={tab === 'favorites' ? 'active' : ''}
              onClick={() => setTab('favorites')}
            >
              <Star size={15} />
              علاقه‌مندی‌ها
            </button>
          </div>
          <div className="table-filters">
            <label className="search-field">
              <Search size={16} />
              <input
                placeholder="نام ارز یا نماد…"
                aria-label="فیلتر بازارها"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <select
              aria-label="مرتب‌سازی بازارها"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="default">ترتیب پیش‌فرض</option>
              <option value="name">نام ارز</option>
            </select>
          </div>
        </div>
        <State
          loading={symbols.isPending}
          error={symbols.error}
          retry={() => symbols.refetch()}
          empty={!filtered.length}
        >
          <MarketTable symbols={filtered} watchlist={tab === 'favorites'} />
        </State>
        {tab === 'favorites' && (
          <p className="table-note">
            با انتخاب ستاره کنار نام ارز، بازار را به فهرست شخصی خود اضافه کنید.
          </p>
        )}
      </Panel>
      <div className="info-line">
        <Activity size={15} />
        <span>قیمت‌ها به تومان هستند و به‌صورت دوره‌ای به‌روزرسانی می‌شوند.</span>
      </div>
    </>
  );
}
