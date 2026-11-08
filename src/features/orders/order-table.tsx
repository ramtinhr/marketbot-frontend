'use client';
import { ui } from '@/lib/ui-styles';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, errorText } from '@/lib/api';
import { useApp } from '@/providers/app-provider';
import { date, number, statusLabel } from '@/lib/format';
import { AssetLabel, Modal, Money, StatusBadge } from '@/components/ui';
import type { Order } from '@/lib/types';
export function OrderTable({ orders, auction = false }: { orders: Order[]; auction?: boolean }) {
  const [selected, setSelected] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);
  const { demo, notify } = useApp();
  const client = useQueryClient();
  return (
    <>
      <div data-ui="table-scroll" className="[overflow-x:auto]">
        <table
          data-ui="data-table"
          className="[border-collapse:collapse] [width:100%] whitespace-nowrap text-right [@media(width<=640px)]:[min-width:520px] [&_th]:[font-size:var(--text-xs)] [&_th]:font-semibold [&_th]:[color:#66758a] [&_th]:[padding-top:12px] [&_th]:[padding-right:19px] [&_th]:[padding-bottom:12px] [&_th]:[padding-left:19px] [&_th]:[background:#fcfcfd] [&_th]:[border-top-width:1px] [&_th]:[border-top-style:solid] [&_th]:[border-top-color:#f0f2f5] [&_th]:[border-bottom-width:1px] [&_th]:[border-bottom-style:solid] [&_th]:[border-bottom-color:#f0f2f5] [&_td]:[padding-top:var(--space-4)] [&_td]:[padding-right:var(--space-5)] [&_td]:[padding-bottom:var(--space-4)] [&_td]:[padding-left:var(--space-5)] [&_td]:[font-size:var(--text-sm)]! [&_td]:[border-bottom-width:1px] [&_td]:[border-bottom-style:solid] [&_td]:[border-bottom-color:#f0f2f5] [&_td]:[color:#566273] [&_tbody_tr:last-child_td]:[border-bottom-width:0] [&_tbody_tr:last-child_td]:[border-bottom-style:none] [&_tbody_tr:last-child_td]:[border-bottom-color:currentColor] [&_tbody_tr:hover]:[background:#fcfdfd] [&_td_[data-ui~='money']]:[color:#3a4859] [&_td_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_td_[data-ui~='money']]:font-medium [&_td_small]:[font-size:var(--text-xs)] [&_td_small]:[color:#66758a] [@media(width>1650px)]:[&_td]:[padding-top:20px] [@media(width>1650px)]:[&_td]:[padding-bottom:20px]"
        >
          <thead>
            <tr>
              <th>بازار</th>
              <th>نوع</th>
              <th>قیمت</th>
              <th>مقدار / تکمیل شده</th>
              <th>زمان ثبت</th>
              <th>وضعیت</th>
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
            {orders.map((o) => (
              <tr key={o.id}>
                <td>
                  <AssetLabel asset={o.symbol.split('_')[0]} />
                </td>
                <td>
                  <span {...ui(`side-label ${o.side}`)}>{o.side === 'buy' ? 'خرید' : 'فروش'}</span>
                </td>
                <td>
                  <Money value={o.price} />
                </td>
                <td>
                  <div
                    data-ui="stacked-cell"
                    className="flex flex-col [gap:4px] [&_small]:[color:#a5aeba] [&_small]:[font-size:var(--text-xs)]"
                  >
                    <bdi>{number(o.quantity, 8)}</bdi>
                    <small>{number(o.filled_quantity, 8)} تکمیل شده</small>
                  </div>
                </td>
                <td data-ui="date-cell" className="[font-size:var(--text-xs)]! [color:#8e9baa]!">
                  {date(o.created_at)}
                </td>
                <td>
                  <StatusBadge good={o.status === 'filled'}>{statusLabel(o.status)}</StatusBadge>
                </td>
                <td>
                  {['open', 'partial'].includes(o.status) && (
                    <button
                      data-ui="cancel-link"
                      className="[color:#b74658] [font-size:var(--text-xs)] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0]"
                      onClick={() => setSelected(o)}
                    >
                      لغو
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal
        open={!!selected}
        size="compact"
        onOpenChange={(open) => !open && setSelected(null)}
        title="لغو سفارش"
        description="بخش تکمیل‌نشدهٔ سفارش لغو و موجودی مسدودشدهٔ آن آزاد می‌شود."
      >
        <div
          data-ui="dialog-actions"
          className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
        >
          <button
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={() => setSelected(null)}
          >
            بازگشت
          </button>
          <button
            data-ui="button danger"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={busy}
            onClick={async () => {
              if (!selected) return;
              setBusy(true);
              try {
                if (demo) {
                  client.setQueryData<{ orders: Order[] }>(
                    [auction ? 'auction-orders' : 'orders'],
                    (old) => ({
                      orders:
                        old?.orders.map((o) =>
                          o.id === selected.id ? { ...o, status: 'cancelled' } : o,
                        ) ?? [],
                    }),
                  );
                } else {
                  await api(`/${auction ? 'auction/orders' : 'orders'}/${selected.id}/cancel`, {
                    method: 'POST',
                  });
                  await client.invalidateQueries();
                }
                notify(demo ? 'سفارش نمونه لغو شد.' : 'سفارش لغو شد.');
                setSelected(null);
              } catch (e) {
                notify(errorText(e), true);
              } finally {
                setBusy(false);
              }
            }}
          >
            تأیید لغو سفارش
          </button>
        </div>
      </Modal>
    </>
  );
}
