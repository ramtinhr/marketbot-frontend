'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Plus, ArrowUpLeft, Search, Eye, EyeOff, Landmark } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useWallet, useEntries, useResource } from '@/lib/use-data';
import { balanceValue, date, number, statusLabel, entryLabel } from '@/lib/format';
import { AssetLabel, Money, PageHeading, Panel, State, StatusBadge, Modal } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { useApp } from '@/providers/app-provider';
import type { Withdrawal } from '@/lib/types';
import { CryptoDepositHistory, CryptoWithdrawalHistory } from './crypto-history';
import { useCryptoAssets } from '@/lib/use-data';
import { sumDecimals } from '@/lib/crypto-funding';
import { WalletActions } from './wallet-actions';
export function WalletPage() {
  const params = useSearchParams();
  const initial = params.get('action');
  const [action, setAction] = useState<'deposit' | 'withdraw' | null>(
    initial === 'deposit' || initial === 'withdraw' ? initial : null,
  );
  const [asset, setAsset] = useState('IRT');
  const [tab, setTab] = useState('assets');
  const [search, setSearch] = useState('');
  const [hideZero, setHideZero] = useState(false);
  const [show, setShow] = useState(true);
  const [cancel, setCancel] = useState<Withdrawal | null>(null);
  const [busy, setBusy] = useState(false);
  const { demo, notify } = useApp();
  const client = useQueryClient();
  const wallet = useWallet();
  const entries = useEntries();
  const withdrawals = useResource<{
    networks: Record<string, string[]>;
    withdrawals: Withdrawal[];
  }>('withdrawals', '/wallet/withdrawals', {
    networks: { USDT: ['TRC20', 'ERC20'] },
    withdrawals: [],
  });
  const cryptoAssets = useCryptoAssets();
  const allBalances = [
    ...(wallet.data?.balances ?? []),
    ...(cryptoAssets.data?.assets ?? [])
      .map((a) => a.asset)
      .filter(
        (a, i, rows) => rows.indexOf(a) === i && !wallet.data?.balances.some((b) => b.asset === a),
      )
      .map((asset) => ({ asset, available: '0', frozen: '0', locked: '0' })),
  ];
  const balances =
    allBalances.filter(
      (b) =>
        (!hideZero || Number(b.available) + Number(b.frozen) + Number(b.locked) > 0) &&
        b.asset.toLowerCase().includes(search.toLowerCase()),
    ) ?? [];
  const start = (next: 'deposit' | 'withdraw', asset = 'IRT') => {
    setAsset(asset);
    setAction(next);
  };
  return (
    <>
      <PageHeading
        title="کیف پول"
        description="موجودی، واریزها و برداشت‌های خود را در یک فضای واحد مدیریت کنید."
        actions={
          <Link href="/bank-accounts" className="button secondary">
            <Landmark size={17} />
            حساب‌های بانکی
          </Link>
        }
      />
      <Panel className="wallet-summary">
        <div>
          <span className="eyebrow">
            ارزش کل دارایی‌ها{' '}
            <button
              className="icon-button"
              onClick={() => setShow(!show)}
              aria-label="نمایش یا پنهان کردن موجودی"
            >
              {show ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
          </span>
          <div className="wallet-total">
            {wallet.isPending ? (
              '…'
            ) : show ? (
              <Money value={balanceValue(wallet.data)} />
            ) : (
              '••••••••'
            )}
          </div>
          <p>ارزش تقریبی بر اساس قیمت فعلی بازار</p>
        </div>
        <div className="wallet-summary-actions">
          <button className="button primary" onClick={() => start('deposit')}>
            <Plus size={17} />
            افزایش موجودی
          </button>
          <button className="button secondary" onClick={() => start('withdraw')}>
            <ArrowUpLeft size={17} />
            برداشت
          </button>
        </div>
      </Panel>
      <Panel>
        <div className="table-toolbar">
          <div className="tabs wallet-tabs">
            {[
              ['assets', 'دارایی‌ها'],
              ['history', 'تاریخچهٔ کیف پول'],
              ['deposits', 'واریز رمزارز'],
              ['crypto-withdrawals', 'برداشت رمزارز'],
              ['withdrawals', 'برداشت تومان'],
            ].map(([key, label]) => (
              <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'assets' && (
            <div className="table-filters">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={hideZero}
                  onChange={(e) => setHideZero(e.target.checked)}
                />
                پنهان کردن موجودی صفر
              </label>
              <label className="search-field">
                <Search size={16} />
                <input
                  aria-label="جست‌وجوی دارایی"
                  placeholder="نماد دارایی…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            </div>
          )}
        </div>
        {tab === 'assets' && (
          <State
            loading={wallet.isPending}
            error={wallet.error}
            retry={() => wallet.refetch()}
            empty={!balances.length}
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>دارایی</th>
                    <th>قابل استفاده</th>
                    <th>مسدود / قفل‌شده</th>
                    <th>ارزش تقریبی</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {balances.map((b) => (
                    <tr key={b.asset}>
                      <td>
                        <AssetLabel asset={b.asset} />
                      </td>
                      <td>
                        <bdi>
                          {show
                            ? b.asset === 'IRT'
                              ? number(b.available)
                              : b.available
                            : '••••••'}
                        </bdi>
                        <small className="table-unit">{b.asset}</small>
                      </td>
                      <td>
                        <bdi>
                          {show
                            ? b.asset === 'IRT'
                              ? number(sumDecimals(b.frozen, b.locked))
                              : sumDecimals(b.frozen, b.locked)
                            : '••••••'}
                        </bdi>
                      </td>
                      <td>
                        {show ? (
                          <Money
                            value={
                              (Number(b.available) + Number(b.frozen) + Number(b.locked)) *
                              (b.asset === 'IRT' ? 1 : (wallet.data?.prices[b.asset] ?? 0))
                            }
                          />
                        ) : (
                          '••••••'
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          <button onClick={() => start('deposit', b.asset)}>واریز</button>
                          {b.asset !== 'IRT' && <Link href={`/trade/${b.asset}_IRT`}>معامله</Link>}
                          <button onClick={() => start('withdraw', b.asset)}>برداشت</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </State>
        )}
        {tab === 'deposits' && <CryptoDepositHistory />}
        {tab === 'crypto-withdrawals' && <CryptoWithdrawalHistory />}
        {tab === 'history' && (
          <State
            loading={entries.isPending}
            error={entries.error}
            retry={() => entries.refetch()}
            empty={!entries.data?.entries.length}
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>دارایی</th>
                    <th>نوع فعالیت</th>
                    <th>مقدار</th>
                    <th>زمان</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.data?.entries.map((e) => (
                    <tr key={e.id}>
                      <td>
                        <AssetLabel asset={e.asset} />
                      </td>
                      <td>{entryLabel(e.kind)}</td>
                      <td>
                        {e.asset === 'IRT' ? (
                          <Money value={e.amount} />
                        ) : (
                          <bdi>
                            {e.amount} {e.asset}
                          </bdi>
                        )}
                      </td>
                      <td>{date(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </State>
        )}
        {tab === 'withdrawals' && (
          <State
            loading={withdrawals.isPending}
            error={withdrawals.error}
            retry={() => withdrawals.refetch()}
            empty={!withdrawals.data?.withdrawals.length}
          >
            <div className="table-scroll">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>دارایی</th>
                    <th>مقدار</th>
                    <th>مقصد</th>
                    <th>زمان ثبت</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.data?.withdrawals.map((w) => (
                    <tr key={w.id}>
                      <td>
                        <AssetLabel asset={w.asset} />
                      </td>
                      <td>{number(w.amount, 8)}</td>
                      <td>
                        <bdi className="destination-cell">{w.destination}</bdi>
                      </td>
                      <td>{date(w.created_at)}</td>
                      <td>
                        <StatusBadge good={w.status === 'paid'}>
                          {statusLabel(w.status)}
                        </StatusBadge>
                      </td>
                      <td>
                        {w.status === 'pending' && (
                          <button className="cancel-link" onClick={() => setCancel(w)}>
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
        )}
      </Panel>
      {action && (
        <WalletActions
          key={`${action}-${asset}`}
          action={action}
          onClose={() => setAction(null)}
          initialAsset={asset}
        />
      )}
      <Modal
        open={!!cancel}
        onOpenChange={(v) => !v && setCancel(null)}
        title="لغو درخواست برداشت"
        description="درخواست لغو و موجودی مسدودشدهٔ آن آزاد می‌شود."
      >
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setCancel(null)}>
            بازگشت
          </button>
          <button
            className="button danger"
            disabled={busy}
            onClick={async () => {
              if (!cancel) return;
              setBusy(true);
              try {
                if (demo) throw new Error();
                await api(`/wallet/withdrawals/${cancel.id}/cancel`, { method: 'POST' });
                await client.invalidateQueries();
                notify('درخواست لغو شد.');
                setCancel(null);
              } catch (e) {
                notify(errorText(e), true);
              } finally {
                setBusy(false);
              }
            }}
          >
            تأیید لغو
          </button>
        </div>
      </Modal>
    </>
  );
}
