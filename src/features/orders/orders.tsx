'use client';
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
        <div className="table-toolbar">
          <div className="tabs">
            <button className={scope === 'open' ? 'active' : ''} onClick={() => setScope('open')}>
              سفارش‌های باز
            </button>
            <button
              className={scope === 'history' ? 'active' : ''}
              onClick={() => setScope('history')}
            >
              تاریخچهٔ سفارش‌ها
            </button>
          </div>
          <div className="table-filters">
            <select aria-label="نوع بازار" value={venue} onChange={(e) => setVenue(e.target.value)}>
              <option value="exchange">بازار معاملاتی</option>
              <option value="auction">مزایده</option>
            </select>
            <select aria-label="نوع سفارش" value={side} onChange={(e) => setSide(e.target.value)}>
              <option value="all">خرید و فروش</option>
              <option value="buy">خرید</option>
              <option value="sell">فروش</option>
            </select>
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
