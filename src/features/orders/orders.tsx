'use client';
import { Select, SelectOption } from '@/components/select';
import { ui } from '@/lib/ui-styles';

import { useState } from 'react';
import { useOrders, useResource } from '@/lib/use-data';
import { Panel, PageHeading, State } from '@/components/ui';
import { OrderTable } from './order-table';
import type { Order } from '@/lib/types';
export function Orders() {
  const [scope, setScope] = useState('open');
  const [side, setSide] = useState('all');
  const [venue, setVenue] = useState('exchange');
  const normal = useOrders();
  const auctions = useResource<{ orders: Order[] }>('auction-orders', '/auction/orders?scope=all', {
    orders: [],
  });
  const query = venue === 'exchange' ? normal : auctions;
  const orders =
    query.data?.orders.filter(
      (o) =>
        (scope === 'open'
          ? ['open', 'partial'].includes(o.status)
          : !['open', 'partial'].includes(o.status)) &&
        (side === 'all' || side === o.side),
    ) ?? [];
  return (
    <>
      <PageHeading
        title="سفارش‌های من"
        description="سفارش‌های باز و تاریخچهٔ معاملات خود را مدیریت کنید."
      />
      <Panel>
        <div
          data-ui="table-toolbar"
          className="flex items-center justify-between [gap:16px] [padding-top:10px] [padding-right:20px] [padding-bottom:10px] [padding-left:20px] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--line)] [min-height:68px] flex-wrap [@media(width<=640px)]:[gap:14px] [@media(width<=640px)]:[padding-top:6px] [@media(width<=640px)]:[padding-right:16px] [@media(width<=640px)]:[padding-bottom:12px] [@media(width<=640px)]:[padding-left:16px]"
        >
          <div
            data-ui="tabs"
            className="flex [gap:23px] items-center [align-self:stretch] [@media(width<=640px)]:[gap:20px] [@media(width<=640px)]:[max-width:100%] [@media(width<=640px)]:[overflow-x:auto] [&_>_button]:flex [&_>_button]:items-center [&_>_button]:justify-center [&_>_button]:[gap:6px] [&_>_button]:[border-bottom-width:2px] [&_>_button]:[border-bottom-style:solid] [&_>_button]:[border-bottom-color:transparent] [&_>_button]:[padding-top:12px] [&_>_button]:[padding-right:0] [&_>_button]:[padding-bottom:12px] [&_>_button]:[padding-left:0] [&_>_button]:[font-size:var(--text-sm)] [&_>_button]:[color:#93a0ae] [&_>_button]:whitespace-nowrap [&_>_button[data-ui~='active']]:[color:var(--accent)] [&_>_button[data-ui~='active']]:[border-bottom-color:var(--accent)] [&_>_button[data-ui~='active']]:font-semibold [@media(width<=640px)]:[&_>_button]:[padding-top:13px] [@media(width<=640px)]:[&_>_button]:[padding-bottom:13px]"
          >
            <button {...ui(scope === 'open' ? 'active' : '')} onClick={() => setScope('open')}>
              سفارش‌های باز
            </button>
            <button
              {...ui(scope === 'history' ? 'active' : '')}
              onClick={() => setScope('history')}
            >
              تاریخچهٔ سفارش‌ها
            </button>
          </div>
          <div
            data-ui="table-filters"
            className="flex [gap:12px] items-center [@media(width<=640px)]:[gap:8px] [@media(width<=640px)]:[width:100%] [@media(width<=640px)]:justify-between [@media(width<=640px)]:flex-wrap [&_select]:[font-size:var(--text-sm)] [&_select]:[border-top-color:#e8edf2] [&_select]:[border-right-color:#e8edf2] [&_select]:[border-bottom-color:#e8edf2] [&_select]:[border-left-color:#e8edf2] [&_select]:[background:#fff] [&_select]:[padding-top:7px] [&_select]:[padding-right:9px] [&_select]:[padding-bottom:7px] [&_select]:[padding-left:9px] [&_[data-ui~='checkbox-label']]:[color:#66758a] [@media(width<=640px)]:[&_[data-ui~='search-field']]:[flex:1] [@media(width<=640px)]:[&_[data-ui~='search-field']]:min-w-0 [@media(width<=640px)]:[&_[data-ui~='checkbox-label']]:[font-size:var(--text-xs)] [@media(width<=640px)]:[&_[data-ui~='checkbox-label']]:whitespace-nowrap"
          >
            <Select aria-label="نوع بازار" value={venue} onValueChange={(value) => setVenue(value)}>
              <SelectOption value="exchange">بازار معاملاتی</SelectOption>
              <SelectOption value="auction">مزایده</SelectOption>
            </Select>
            <Select aria-label="نوع سفارش" value={side} onValueChange={(value) => setSide(value)}>
              <SelectOption value="all">خرید و فروش</SelectOption>
              <SelectOption value="buy">خرید</SelectOption>
              <SelectOption value="sell">فروش</SelectOption>
            </Select>
          </div>
        </div>
        <State
          loading={query.isPending}
          error={query.error}
          retry={() => query.refetch()}
          empty={!orders.length}
        >
          <OrderTable orders={orders} auction={venue === 'auction'} />
        </State>
      </Panel>
    </>
  );
}
