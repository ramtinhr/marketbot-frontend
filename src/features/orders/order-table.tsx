'use client';
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
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>بازار</th>
              <th>نوع</th>
              <th>قیمت</th>
              <th>مقدار / تکمیل شده</th>
              <th>زمان ثبت</th>
              <th>وضعیت</th>
              <th>
                <span className="sr-only">عملیات</span>
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
                  <span className={`side-label ${o.side}`}>
                    {o.side === 'buy' ? 'خرید' : 'فروش'}
                  </span>
                </td>
                <td>
                  <Money value={o.price} />
                </td>
                <td>
                  <div className="stacked-cell">
                    <bdi>{number(o.quantity, 8)}</bdi>
                    <small>{number(o.filled_quantity, 8)} تکمیل شده</small>
                  </div>
                </td>
                <td className="date-cell">{date(o.created_at)}</td>
                <td>
                  <StatusBadge good={o.status === 'filled'}>{statusLabel(o.status)}</StatusBadge>
                </td>
                <td>
                  {['open', 'partial'].includes(o.status) && (
                    <button className="cancel-link" onClick={() => setSelected(o)}>
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
        onOpenChange={(open) => !open && setSelected(null)}
        title="لغو سفارش"
        description="بخش تکمیل‌نشدهٔ سفارش لغو و موجودی مسدودشدهٔ آن آزاد می‌شود."
      >
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setSelected(null)}>
            بازگشت
          </button>
          <button
            className="button danger"
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
