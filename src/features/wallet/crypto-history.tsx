'use client';
import { useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AssetLabel, Modal, State, StatusBadge } from '@/components/ui';
import { date, statusLabel } from '@/lib/format';
import { useCryptoDeposits, useCryptoWithdrawals, useSession } from '@/lib/use-data';
import {
  fundingRequest,
  fundingError,
  networkNames,
  type CryptoWithdrawal,
} from '@/lib/crypto-funding';
import { useApp } from '@/providers/app-provider';
export function CryptoDepositHistory() {
  const query = useCryptoDeposits();
  return (
    <State
      loading={query.isPending}
      error={query.error}
      retry={() => void query.refetch()}
      empty={!query.data?.deposits.length}
    >
      <div data-ui="table-scroll" className="[overflow-x:auto]">
        <table
          data-ui="data-table"
          className="[border-collapse:collapse] [width:100%] whitespace-nowrap text-right [@media(width<=640px)]:[min-width:520px] [&_th]:[font-size:var(--text-xs)] [&_th]:font-semibold [&_th]:[color:#66758a] [&_th]:[padding-top:12px] [&_th]:[padding-right:19px] [&_th]:[padding-bottom:12px] [&_th]:[padding-left:19px] [&_th]:[background:#fcfcfd] [&_th]:[border-top-width:1px] [&_th]:[border-top-style:solid] [&_th]:[border-top-color:#f0f2f5] [&_th]:[border-bottom-width:1px] [&_th]:[border-bottom-style:solid] [&_th]:[border-bottom-color:#f0f2f5] [&_td]:[padding-top:var(--space-4)] [&_td]:[padding-right:var(--space-5)] [&_td]:[padding-bottom:var(--space-4)] [&_td]:[padding-left:var(--space-5)] [&_td]:[font-size:var(--text-sm)]! [&_td]:[border-bottom-width:1px] [&_td]:[border-bottom-style:solid] [&_td]:[border-bottom-color:#f0f2f5] [&_td]:[color:#566273] [&_tbody_tr:last-child_td]:[border-bottom-width:0] [&_tbody_tr:last-child_td]:[border-bottom-style:none] [&_tbody_tr:last-child_td]:[border-bottom-color:currentColor] [&_tbody_tr:hover]:[background:#fcfdfd] [&_td_[data-ui~='money']]:[color:#3a4859] [&_td_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_td_[data-ui~='money']]:font-medium [&_td_small]:[font-size:var(--text-xs)] [&_td_small]:[color:#66758a] [@media(width>1650px)]:[&_td]:[padding-top:20px] [@media(width>1650px)]:[&_td]:[padding-bottom:20px]"
        >
          <thead>
            <tr>
              <th>دارایی / شبکه</th>
              <th>مقدار</th>
              <th>شناسهٔ تراکنش</th>
              <th>زمان</th>
              <th>وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {query.data?.deposits.map((d) => (
              <tr key={d.id}>
                <td>
                  <AssetLabel asset={d.asset} />
                  <small>{networkNames[d.network]}</small>
                </td>
                <td>
                  <bdi>{d.amount}</bdi>
                </td>
                <td>
                  <bdi
                    data-ui="crypto-code"
                    className="[overflow-wrap:anywhere] [word-break:break-word] [font-family:monospace] [direction:ltr] [unicode-bidi:isolate] block [max-width:360px] [font-size:var(--text-sm)]"
                  >
                    {d.tx_id}
                  </bdi>
                </td>
                <td>{date(d.created_at)}</td>
                <td>
                  <StatusBadge good>اضافه شده به موجودی</StatusBadge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </State>
  );
}
export function CryptoWithdrawalHistory() {
  const query = useCryptoWithdrawals(),
    session = useSession(),
    client = useQueryClient();
  const { demo, notify } = useApp();
  const [selection, setSelection] = useState<CryptoWithdrawal | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const submitting = useRef(false);
  async function cancel() {
    if (!selection || !session.data?.user.id || demo || submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      await fundingRequest(
        String(session.data.user.id),
        `/crypto/withdrawals/${selection.id}/cancel`,
      );
      void client.invalidateQueries({ queryKey: ['wallet'] });
      void client.invalidateQueries({ queryKey: ['entries'] });
      void query.refetch();
      setSelection(null);
      notify('درخواست لغو و موجودی رزروشده آزاد شد.');
    } catch (e) {
      setError(fundingError(e, 'withdraw'));
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }
  return (
    <>
      <State
        loading={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
        empty={!query.data?.withdrawals.length}
      >
        <div data-ui="table-scroll" className="[overflow-x:auto]">
          <table
            data-ui="data-table"
            className="[border-collapse:collapse] [width:100%] whitespace-nowrap text-right [@media(width<=640px)]:[min-width:520px] [&_th]:[font-size:var(--text-xs)] [&_th]:font-semibold [&_th]:[color:#66758a] [&_th]:[padding-top:12px] [&_th]:[padding-right:19px] [&_th]:[padding-bottom:12px] [&_th]:[padding-left:19px] [&_th]:[background:#fcfcfd] [&_th]:[border-top-width:1px] [&_th]:[border-top-style:solid] [&_th]:[border-top-color:#f0f2f5] [&_th]:[border-bottom-width:1px] [&_th]:[border-bottom-style:solid] [&_th]:[border-bottom-color:#f0f2f5] [&_td]:[padding-top:var(--space-4)] [&_td]:[padding-right:var(--space-5)] [&_td]:[padding-bottom:var(--space-4)] [&_td]:[padding-left:var(--space-5)] [&_td]:[font-size:var(--text-sm)]! [&_td]:[border-bottom-width:1px] [&_td]:[border-bottom-style:solid] [&_td]:[border-bottom-color:#f0f2f5] [&_td]:[color:#566273] [&_tbody_tr:last-child_td]:[border-bottom-width:0] [&_tbody_tr:last-child_td]:[border-bottom-style:none] [&_tbody_tr:last-child_td]:[border-bottom-color:currentColor] [&_tbody_tr:hover]:[background:#fcfdfd] [&_td_[data-ui~='money']]:[color:#3a4859] [&_td_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_td_[data-ui~='money']]:font-medium [&_td_small]:[font-size:var(--text-xs)] [&_td_small]:[color:#66758a] [@media(width>1650px)]:[&_td]:[padding-top:20px] [@media(width>1650px)]:[&_td]:[padding-bottom:20px]"
          >
            <thead>
              <tr>
                <th>دارایی / شبکه</th>
                <th>مقدار</th>
                <th>مقصد / تراکنش پرداخت</th>
                <th>زمان</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {query.data?.withdrawals.map((w) => (
                <tr key={w.id}>
                  <td>
                    <AssetLabel asset={w.asset} />
                    <small>{networkNames[w.network]}</small>
                  </td>
                  <td>
                    <bdi>{w.amount}</bdi>
                  </td>
                  <td>
                    <bdi
                      data-ui="crypto-code"
                      className="[overflow-wrap:anywhere] [word-break:break-word] [font-family:monospace] [direction:ltr] [unicode-bidi:isolate] block [max-width:360px] [font-size:var(--text-sm)]"
                    >
                      {w.destination}
                    </bdi>
                    {w.destination_tag !== null && (
                      <small>
                        تگ: <bdi>{w.destination_tag}</bdi>
                      </small>
                    )}
                    {w.payout_tx_id && (
                      <bdi
                        data-ui="crypto-code"
                        className="[overflow-wrap:anywhere] [word-break:break-word] [font-family:monospace] [direction:ltr] [unicode-bidi:isolate] block [max-width:360px] [font-size:var(--text-sm)]"
                      >
                        {w.payout_tx_id}
                      </bdi>
                    )}
                  </td>
                  <td>{date(w.created_at)}</td>
                  <td>
                    <StatusBadge good={w.status === 'paid'}>{statusLabel(w.status)}</StatusBadge>
                  </td>
                  <td>
                    {w.status === 'pending' && (
                      <button
                        data-ui="cancel-link"
                        className="[color:#b74658] [font-size:var(--text-xs)] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0]"
                        onClick={() => {
                          setError('');
                          setSelection(w);
                        }}
                      >
                        لغو درخواست
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </State>
      <Modal
        open={!!selection}
        size="compact"
        onOpenChange={(open) => !open && !busy && setSelection(null)}
        title="لغو برداشت رمزارز"
        description="فقط درخواست در انتظار بررسی لغو می‌شود و مبلغ رزروشده به موجودی قابل استفاده برمی‌گردد."
      >
        <div data-ui="form-stack" className="flex flex-col [gap:19px]">
          {selection && (
            <p dir="ltr">
              {selection.amount} {selection.asset} · {networkNames[selection.network]}
            </p>
          )}
          {error && (
            <p
              data-ui="inline-error"
              className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
              role="alert"
            >
              {error}
            </p>
          )}
          <div
            data-ui="dialog-actions"
            className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
          >
            <button
              data-ui="button secondary"
              className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
              disabled={busy}
              onClick={() => setSelection(null)}
            >
              بازگشت
            </button>
            <button
              data-ui="button danger"
              className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
              disabled={busy || !session.data || demo}
              onClick={() => void cancel()}
            >
              {busy ? 'در حال لغو…' : 'تأیید لغو درخواست'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
