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
      <div className="table-scroll">
        <table className="data-table">
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
                  <bdi className="crypto-code">{d.tx_id}</bdi>
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
        <div className="table-scroll">
          <table className="data-table">
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
                    <bdi className="crypto-code">{w.destination}</bdi>
                    {w.destination_tag !== null && (
                      <small>
                        تگ: <bdi>{w.destination_tag}</bdi>
                      </small>
                    )}
                    {w.payout_tx_id && <bdi className="crypto-code">{w.payout_tx_id}</bdi>}
                  </td>
                  <td>{date(w.created_at)}</td>
                  <td>
                    <StatusBadge good={w.status === 'paid'}>{statusLabel(w.status)}</StatusBadge>
                  </td>
                  <td>
                    {w.status === 'pending' && (
                      <button
                        className="cancel-link"
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
        onOpenChange={(open) => !open && !busy && setSelection(null)}
        title="لغو برداشت رمزارز"
        description="فقط درخواست در انتظار بررسی لغو می‌شود و مبلغ رزروشده به موجودی قابل استفاده برمی‌گردد."
      >
        <div className="form-stack">
          {selection && (
            <p dir="ltr">
              {selection.amount} {selection.asset} · {networkNames[selection.network]}
            </p>
          )}
          {error && (
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button className="button secondary" disabled={busy} onClick={() => setSelection(null)}>
              بازگشت
            </button>
            <button
              className="button danger"
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
