'use client';
import { Select, SelectOption } from '@/components/select';
import { ui } from '@/lib/ui-styles';

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
    <Panel appearance="market-summary-card">
      <div
        data-ui="market-summary-name"
        className="flex items-center [gap:10px] [margin-bottom:18px] [@media(width<=1000px)]:[gap:7px] [@media(width<=640px)]:[margin-bottom:0] [@media(width<=640px)]:[margin-top:0] [@media(width<=640px)]:[margin-right:0] [@media(width<=640px)]:[margin-left:0] [&_>_strong]:flex [&_>_strong]:flex-col [&_>_strong]:[font-size:var(--text-sm)] [&_small]:[font-size:var(--text-xs)] [&_small]:font-normal [&_small]:[color:var(--muted)] [&_small]:[margin-top:2px] [&_>_[data-ui~='change']]:mr-auto [@media(width<=640px)]:[&_>_[data-ui~='change']]:[margin-right:12px] [@media(width<=1000px)]:[&_>_[data-ui~='change']]:[font-size:var(--text-xs)] [@media(width<=1000px)]:[&_[data-ui~='asset-icon']]:[width:29px] [@media(width<=1000px)]:[&_[data-ui~='asset-icon']]:[height:29px] [@media(width<=1000px)]:[&_[data-ui~='asset-icon']]:[font-size:20px] [@media(width<=1000px)]:[&_strong]:[font-size:var(--text-xs)]"
      >
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
      <div
        data-ui="market-summary-grid"
        className="grid [grid-template-columns:repeat(3,_1fr)] [gap:20px] [margin-bottom:25px] [@media(width<=640px)]:[grid-template-columns:1fr] [@media(width<=640px)]:[gap:10px] [@media(width<=640px)]:[margin-bottom:20px] [@media(width>640px)]:[@media(width<=800px)]:[gap:14px] [@media(width>800px)]:[@media(width<=1000px)]:[gap:12px]"
      >
        {(symbols.data?.symbols ?? ['USDT_IRT', 'BTC_IRT', 'ETH_IRT']).slice(0, 3).map((s) => (
          <MarketCard key={s} symbol={s} />
        ))}
      </div>
      <Panel>
        <div
          data-ui="table-toolbar"
          className="flex items-center justify-between [gap:16px] [padding-top:10px] [padding-right:20px] [padding-bottom:10px] [padding-left:20px] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--line)] [min-height:68px] flex-wrap [@media(width<=640px)]:[gap:14px] [@media(width<=640px)]:[padding-top:6px] [@media(width<=640px)]:[padding-right:16px] [@media(width<=640px)]:[padding-bottom:12px] [@media(width<=640px)]:[padding-left:16px]"
        >
          <div
            data-ui="tabs"
            className="flex [gap:23px] items-center [align-self:stretch] [@media(width<=640px)]:[gap:20px] [@media(width<=640px)]:[max-width:100%] [@media(width<=640px)]:[overflow-x:auto] [&_>_button]:flex [&_>_button]:items-center [&_>_button]:justify-center [&_>_button]:[gap:6px] [&_>_button]:[border-bottom-width:2px] [&_>_button]:[border-bottom-style:solid] [&_>_button]:[border-bottom-color:transparent] [&_>_button]:[padding-top:12px] [&_>_button]:[padding-right:0] [&_>_button]:[padding-bottom:12px] [&_>_button]:[padding-left:0] [&_>_button]:[font-size:var(--text-sm)] [&_>_button]:[color:#93a0ae] [&_>_button]:whitespace-nowrap [&_>_button[data-ui~='active']]:[color:var(--accent)] [&_>_button[data-ui~='active']]:[border-bottom-color:var(--accent)] [&_>_button[data-ui~='active']]:font-semibold [@media(width<=640px)]:[&_>_button]:[padding-top:13px] [@media(width<=640px)]:[&_>_button]:[padding-bottom:13px]"
          >
            <button {...ui(tab === 'all' ? 'active' : '')} onClick={() => setTab('all')}>
              همهٔ بازارها
            </button>
            <button
              {...ui(tab === 'favorites' ? 'active' : '')}
              onClick={() => setTab('favorites')}
            >
              <Star size={15} />
              علاقه‌مندی‌ها
            </button>
          </div>
          <div
            data-ui="table-filters"
            className="flex [gap:12px] items-center [@media(width<=640px)]:[gap:8px] [@media(width<=640px)]:[width:100%] [@media(width<=640px)]:justify-between [@media(width<=640px)]:flex-wrap [&_select]:[font-size:var(--text-sm)] [&_select]:[border-top-color:#e8edf2] [&_select]:[border-right-color:#e8edf2] [&_select]:[border-bottom-color:#e8edf2] [&_select]:[border-left-color:#e8edf2] [&_select]:[background:#fff] [&_select]:[padding-top:7px] [&_select]:[padding-right:9px] [&_select]:[padding-bottom:7px] [&_select]:[padding-left:9px] [&_[data-ui~='checkbox-label']]:[color:#66758a] [@media(width<=640px)]:[&_[data-ui~='search-field']]:[flex:1] [@media(width<=640px)]:[&_[data-ui~='search-field']]:min-w-0 [@media(width<=640px)]:[&_[data-ui~='checkbox-label']]:[font-size:var(--text-xs)] [@media(width<=640px)]:[&_[data-ui~='checkbox-label']]:whitespace-nowrap"
          >
            <label
              data-ui="search-field"
              className="flex items-center [gap:8px] [border-top-width:1px] [border-top-style:solid] [border-top-color:#e8edf2] [border-right-width:1px] [border-right-style:solid] [border-right-color:#e8edf2] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#e8edf2] [border-left-width:1px] [border-left-style:solid] [border-left-color:#e8edf2] [border-radius:7px] [padding-top:6px] [padding-right:10px] [padding-bottom:6px] [padding-left:10px] [color:#a0aab5] [&_input]:[border-top-width:0] [&_input]:[border-top-style:none] [&_input]:[border-top-color:currentColor] [&_input]:[border-right-width:0] [&_input]:[border-right-style:none] [&_input]:[border-right-color:currentColor] [&_input]:[border-bottom-width:0] [&_input]:[border-bottom-style:none] [&_input]:[border-bottom-color:currentColor] [&_input]:[border-left-width:0] [&_input]:[border-left-style:none] [&_input]:[border-left-color:currentColor] [&_input]:[background:none] [&_input]:[font-size:var(--text-sm)] [&_input]:[width:155px] [&_input]:[padding-top:2px] [&_input]:[padding-right:2px] [&_input]:[padding-bottom:2px] [&_input]:[padding-left:2px] [&_input::placeholder]:[color:#a2acb8] [@media(width<=640px)]:[&_input]:[font-size:var(--text-base)] [@media(width<=640px)]:[&_input]:[width:100%] [@media(width<=640px)]:[&_input]:min-w-0"
            >
              <Search size={16} />
              <input
                placeholder="نام ارز یا نماد…"
                aria-label="فیلتر بازارها"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <Select
              aria-label="مرتب‌سازی بازارها"
              value={sort}
              onValueChange={(value) => setSort(value)}
            >
              <SelectOption value="default">ترتیب پیش‌فرض</SelectOption>
              <SelectOption value="name">نام ارز</SelectOption>
            </Select>
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
          <p
            data-ui="table-note"
            className="[padding-top:15px] [padding-right:22px] [padding-bottom:15px] [padding-left:22px] [color:#66758a] [font-size:var(--text-xs)] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)]"
          >
            با انتخاب ستاره کنار نام ارز، بازار را به فهرست شخصی خود اضافه کنید.
          </p>
        )}
      </Panel>
      <div
        data-ui="info-line"
        className="flex items-center [gap:7px] [color:#66758a] [margin-top:18px] [margin-right:3px] [margin-bottom:18px] [margin-left:3px] [font-size:var(--text-xs)]"
      >
        <Activity size={15} />
        <span>قیمت‌ها به تومان هستند و به‌صورت زنده به‌روزرسانی می‌شوند.</span>
      </div>
    </>
  );
}
