'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { api, errorText } from '@/lib/api';
import { useResource } from '@/lib/use-data';
import { useApp } from '@/providers/app-provider';
import { type Payment, paymentStatus } from '@/lib/payments';
import { Money, State } from '@/components/ui';
import { date } from '@/lib/format';

export function PaymentHistory() {
  const { demo } = useApp();
  const client = useQueryClient();
  const paymentId = useSearchParams().get('payment');
  const history = useResource<{ payments: Payment[] }>('payments', '/payments', { payments: [] });
  const [result, setResult] = useState<Payment | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  async function confirm(id: string) {
    setBusy(id);
    setError('');
    try {
      const response = await api<{ payment: Payment }>(
        `/payments/${encodeURIComponent(id)}/confirm`,
        { method: 'POST' },
      );
      setResult(response.payment);
      await Promise.all(
        ['payments', 'wallet', 'entries'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(null);
    }
  }
  useEffect(() => {
    if (!paymentId || demo || !/^[a-f0-9-]{36}$/i.test(paymentId)) return;
    let active = true;
    // Return parameters identify a charge only; success comes from API verification.
    api<{ payment: Payment }>(`/payments/${encodeURIComponent(paymentId)}/confirm`, {
      method: 'POST',
    })
      .then(async (response) => {
        if (!active) return;
        setResult(response.payment);
        await Promise.all(
          ['payments', 'wallet', 'entries'].map((key) =>
            client.invalidateQueries({ queryKey: [key] }),
          ),
        );
      })
      .catch((e) => {
        if (active) setError(errorText(e));
      });
    return () => {
      active = false;
    };
  }, [paymentId, demo, client]);
  const current = history.data?.payments.find((p) => p.id === result?.id) ?? result;
  return (
    <>
      {current && <p role="status">{paymentStatus[current.status]}</p>}
      {error && (
        <p
          data-ui="inline-error"
          className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
          role="alert"
        >
          {error}
        </p>
      )}
      <State
        loading={history.isPending}
        error={history.error}
        empty={!history.data?.payments.length}
        retry={() => void history.refetch()}
      >
        <div data-ui="table-scroll" className="[overflow-x:auto]">
          <table
            data-ui="data-table"
            className="[border-collapse:collapse] [width:100%] whitespace-nowrap text-right [@media(width<=640px)]:[min-width:520px] [&_th]:[font-size:var(--text-xs)] [&_th]:font-semibold [&_th]:[color:#66758a] [&_th]:[padding-top:12px] [&_th]:[padding-right:19px] [&_th]:[padding-bottom:12px] [&_th]:[padding-left:19px] [&_th]:[background:#fcfcfd] [&_th]:[border-top-width:1px] [&_th]:[border-top-style:solid] [&_th]:[border-top-color:#f0f2f5] [&_th]:[border-bottom-width:1px] [&_th]:[border-bottom-style:solid] [&_th]:[border-bottom-color:#f0f2f5] [&_td]:[padding-top:var(--space-4)] [&_td]:[padding-right:var(--space-5)] [&_td]:[padding-bottom:var(--space-4)] [&_td]:[padding-left:var(--space-5)] [&_td]:[font-size:var(--text-sm)]! [&_td]:[border-bottom-width:1px] [&_td]:[border-bottom-style:solid] [&_td]:[border-bottom-color:#f0f2f5] [&_td]:[color:#566273] [&_tbody_tr:last-child_td]:[border-bottom-width:0] [&_tbody_tr:last-child_td]:[border-bottom-style:none] [&_tbody_tr:last-child_td]:[border-bottom-color:currentColor] [&_tbody_tr:hover]:[background:#fcfdfd] [&_td_[data-ui~='money']]:[color:#3a4859] [&_td_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_td_[data-ui~='money']]:font-medium [&_td_small]:[font-size:var(--text-xs)] [&_td_small]:[color:#66758a] [@media(width>1650px)]:[&_td]:[padding-top:20px] [@media(width>1650px)]:[&_td]:[padding-bottom:20px]"
          >
            <thead>
              <tr>
                <th>مبلغ</th>
                <th>زمان</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {history.data?.payments.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Money value={p.amount} unit="تومان" />
                  </td>
                  <td>{date(p.created_at)}</td>
                  <td>{paymentStatus[p.status]}</td>
                  <td>
                    {['creating', 'pending', 'verified'].includes(p.status) && (
                      <button
                        data-ui="text-link"
                        className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
                        disabled={!!busy || demo}
                        onClick={() => void confirm(p.id)}
                      >
                        {busy === p.id ? 'در حال بررسی…' : 'بررسی پرداخت'}
                      </button>
                    )}
                    {p.status === 'pending' && p.url && (
                      <a
                        data-ui="text-link"
                        className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
                        href={p.url}
                      >
                        ادامهٔ پرداخت
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </State>
    </>
  );
}
