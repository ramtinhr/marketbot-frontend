'use client';
import { ui } from '@/lib/ui-styles';

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
import { PaymentHistory } from './payment-history';
import { WalletActions } from './wallet-actions';
export function WalletPage() {
  const params = useSearchParams();
  const initial = params.get('action');
  const [action, setAction] = useState<'deposit' | 'withdraw' | null>(
    initial === 'deposit' || initial === 'withdraw' ? initial : null,
  );
  const [asset, setAsset] = useState('IRT');
  const [tab, setTab] = useState(params.get('payment') ? 'bank-deposits' : 'assets');
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
          <Link
            href="/bank-accounts"
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
          >
            <Landmark size={17} />
            حساب‌های بانکی
          </Link>
        }
      />
      <Panel appearance="wallet-summary">
        <div>
          <span
            data-ui="eyebrow"
            className="flex items-center [gap:7px] [color:#738377] [font-size:var(--text-sm)]"
          >
            ارزش کل دارایی‌ها{' '}
            <button
              data-ui="icon-button"
              className="inline-flex items-center justify-center [width:30px] [height:30px] [border-radius:7px] [color:#8d99a7] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [@media(width<=640px)]:[min-width:44px] [@media(width<=640px)]:[min-height:44px] [@media(width>640px)]:[@media(width<=800px)]:[min-width:34px] [@media(width>640px)]:[@media(width<=800px)]:[min-height:34px] [&:hover]:[background:#f3f6f7] [&:hover]:[color:var(--text)]"
              onClick={() => setShow(!show)}
              aria-label="نمایش یا پنهان کردن موجودی"
            >
              {show ? <Eye size={17} /> : <EyeOff size={17} />}
            </button>
          </span>
          <div
            data-ui="wallet-total"
            className="[font-size:34px] font-bold [letter-spacing:-1px] [margin-top:8px] [@media(width<=640px)]:[font-size:33px] [@media(width>640px)]:[@media(width<=1000px)]:[font-size:29px] [&_small]:[font-size:var(--text-sm)] [&_small]:[letter-spacing:0]"
          >
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
        <div
          data-ui="wallet-summary-actions"
          className="flex [gap:9px] [@media(width<=640px)]:grid [@media(width<=640px)]:[grid-template-columns:1fr_1fr] [@media(width<=640px)]:flex-wrap"
        >
          <Link
            href="/p2p"
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
          >
            همتا به همتا
          </Link>
          <button
            data-ui="button primary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={() => start('deposit')}
          >
            <Plus size={17} />
            افزایش موجودی
          </button>
          <button
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={() => start('withdraw')}
          >
            <ArrowUpLeft size={17} />
            برداشت
          </button>
        </div>
      </Panel>
      <Panel>
        <div
          data-ui="table-toolbar"
          className="flex items-center justify-between [gap:16px] [padding-top:10px] [padding-right:20px] [padding-bottom:10px] [padding-left:20px] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--line)] [min-height:68px] flex-wrap [@media(width<=640px)]:[gap:14px] [@media(width<=640px)]:[padding-top:6px] [@media(width<=640px)]:[padding-right:16px] [@media(width<=640px)]:[padding-bottom:12px] [@media(width<=640px)]:[padding-left:16px]"
        >
          <div
            data-ui="tabs wallet-tabs"
            className="flex [gap:23px] items-center [align-self:stretch] [max-width:100%] [overflow-x:auto] [@media(width<=640px)]:[gap:20px] [&_>_button]:flex [&_>_button]:items-center [&_>_button]:justify-center [&_>_button]:[gap:6px] [&_>_button]:[border-bottom-width:2px] [&_>_button]:[border-bottom-style:solid] [&_>_button]:[border-bottom-color:transparent] [&_>_button]:[padding-top:12px] [&_>_button]:[padding-right:0] [&_>_button]:[padding-bottom:12px] [&_>_button]:[padding-left:0] [&_>_button]:[font-size:var(--text-sm)] [&_>_button]:[color:#93a0ae] [&_>_button]:whitespace-nowrap [&_>_button[data-ui~='active']]:[color:var(--accent)] [&_>_button[data-ui~='active']]:[border-bottom-color:var(--accent)] [&_>_button[data-ui~='active']]:font-semibold [@media(width<=640px)]:[&_>_button]:[padding-top:13px] [@media(width<=640px)]:[&_>_button]:[padding-bottom:13px]"
          >
            {[
              ['assets', 'دارایی‌ها'],
              ['history', 'تاریخچهٔ کیف پول'],
              ['bank-deposits', 'واریز بانکی'],
              ['deposits', 'واریز رمزارز'],
              ['crypto-withdrawals', 'برداشت رمزارز'],
              ['withdrawals', 'برداشت تومان'],
            ].map(([key, label]) => (
              <button key={key} {...ui(tab === key ? 'active' : '')} onClick={() => setTab(key)}>
                {label}
              </button>
            ))}
          </div>
          {tab === 'assets' && (
            <div
              data-ui="table-filters"
              className="flex [gap:12px] items-center [@media(width<=640px)]:[gap:8px] [@media(width<=640px)]:[width:100%] [@media(width<=640px)]:justify-between [@media(width<=640px)]:flex-wrap [&_select]:[font-size:var(--text-sm)] [&_select]:[border-top-color:#e8edf2] [&_select]:[border-right-color:#e8edf2] [&_select]:[border-bottom-color:#e8edf2] [&_select]:[border-left-color:#e8edf2] [&_select]:[background:#fff] [&_select]:[padding-top:7px] [&_select]:[padding-right:9px] [&_select]:[padding-bottom:7px] [&_select]:[padding-left:9px] [&_[data-ui~='checkbox-label']]:[color:#66758a] [@media(width<=640px)]:[&_[data-ui~='search-field']]:[flex:1] [@media(width<=640px)]:[&_[data-ui~='search-field']]:min-w-0 [@media(width<=640px)]:[&_[data-ui~='checkbox-label']]:[font-size:var(--text-xs)] [@media(width<=640px)]:[&_[data-ui~='checkbox-label']]:whitespace-nowrap"
            >
              <label
                data-ui="checkbox-label"
                className="flex items-center [gap:7px] [font-size:var(--text-xs)] [color:#9aa5b1] [&_input]:[accent-color:var(--accent)]"
              >
                <input
                  type="checkbox"
                  checked={hideZero}
                  onChange={(e) => setHideZero(e.target.checked)}
                />
                پنهان کردن موجودی صفر
              </label>
              <label
                data-ui="search-field"
                className="flex items-center [gap:8px] [border-top-width:1px] [border-top-style:solid] [border-top-color:#e8edf2] [border-right-width:1px] [border-right-style:solid] [border-right-color:#e8edf2] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#e8edf2] [border-left-width:1px] [border-left-style:solid] [border-left-color:#e8edf2] [border-radius:7px] [padding-top:6px] [padding-right:10px] [padding-bottom:6px] [padding-left:10px] [color:#a0aab5] [&_input]:[border-top-width:0] [&_input]:[border-top-style:none] [&_input]:[border-top-color:currentColor] [&_input]:[border-right-width:0] [&_input]:[border-right-style:none] [&_input]:[border-right-color:currentColor] [&_input]:[border-bottom-width:0] [&_input]:[border-bottom-style:none] [&_input]:[border-bottom-color:currentColor] [&_input]:[border-left-width:0] [&_input]:[border-left-style:none] [&_input]:[border-left-color:currentColor] [&_input]:[background:none] [&_input]:[font-size:var(--text-sm)] [&_input]:[width:155px] [&_input]:[padding-top:2px] [&_input]:[padding-right:2px] [&_input]:[padding-bottom:2px] [&_input]:[padding-left:2px] [&_input::placeholder]:[color:#a2acb8] [@media(width<=640px)]:[&_input]:[font-size:var(--text-base)] [@media(width<=640px)]:[&_input]:[width:100%] [@media(width<=640px)]:[&_input]:min-w-0"
              >
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
        {tab === 'bank-deposits' && <PaymentHistory />}
        {tab === 'assets' && (
          <State
            loading={wallet.isPending}
            error={wallet.error}
            retry={() => wallet.refetch()}
            empty={!balances.length}
          >
            <div data-ui="table-scroll" className="[overflow-x:auto]">
              <table
                data-ui="data-table"
                className="[border-collapse:collapse] [width:100%] whitespace-nowrap text-right [@media(width<=640px)]:[min-width:520px] [&_th]:[font-size:var(--text-xs)] [&_th]:font-semibold [&_th]:[color:#66758a] [&_th]:[padding-top:12px] [&_th]:[padding-right:19px] [&_th]:[padding-bottom:12px] [&_th]:[padding-left:19px] [&_th]:[background:#fcfcfd] [&_th]:[border-top-width:1px] [&_th]:[border-top-style:solid] [&_th]:[border-top-color:#f0f2f5] [&_th]:[border-bottom-width:1px] [&_th]:[border-bottom-style:solid] [&_th]:[border-bottom-color:#f0f2f5] [&_td]:[padding-top:var(--space-4)] [&_td]:[padding-right:var(--space-5)] [&_td]:[padding-bottom:var(--space-4)] [&_td]:[padding-left:var(--space-5)] [&_td]:[font-size:var(--text-sm)]! [&_td]:[border-bottom-width:1px] [&_td]:[border-bottom-style:solid] [&_td]:[border-bottom-color:#f0f2f5] [&_td]:[color:#566273] [&_tbody_tr:last-child_td]:[border-bottom-width:0] [&_tbody_tr:last-child_td]:[border-bottom-style:none] [&_tbody_tr:last-child_td]:[border-bottom-color:currentColor] [&_tbody_tr:hover]:[background:#fcfdfd] [&_td_[data-ui~='money']]:[color:#3a4859] [&_td_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_td_[data-ui~='money']]:font-medium [&_td_small]:[font-size:var(--text-xs)] [&_td_small]:[color:#66758a] [@media(width>1650px)]:[&_td]:[padding-top:20px] [@media(width>1650px)]:[&_td]:[padding-bottom:20px]"
              >
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
                        <small
                          data-ui="table-unit"
                          className="[font-size:var(--text-xs)] [margin-right:5px] [color:#66758a]"
                        >
                          {b.asset}
                        </small>
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
                        <div
                          data-ui="row-actions"
                          className="flex [gap:14px] [font-size:var(--text-xs)] [color:#07806a] [&_>_*]:[padding-top:0] [&_>_*]:[padding-right:0] [&_>_*]:[padding-bottom:0] [&_>_*]:[padding-left:0] [&_>_*]:[font-size:inherit] [&_>_*_+_*]:[border-inline-start:1px_solid_#e3e9ee] [&_>_*_+_*]:[padding-inline-start:14px]"
                        >
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
            <div data-ui="table-scroll" className="[overflow-x:auto]">
              <table
                data-ui="data-table"
                className="[border-collapse:collapse] [width:100%] whitespace-nowrap text-right [@media(width<=640px)]:[min-width:520px] [&_th]:[font-size:var(--text-xs)] [&_th]:font-semibold [&_th]:[color:#66758a] [&_th]:[padding-top:12px] [&_th]:[padding-right:19px] [&_th]:[padding-bottom:12px] [&_th]:[padding-left:19px] [&_th]:[background:#fcfcfd] [&_th]:[border-top-width:1px] [&_th]:[border-top-style:solid] [&_th]:[border-top-color:#f0f2f5] [&_th]:[border-bottom-width:1px] [&_th]:[border-bottom-style:solid] [&_th]:[border-bottom-color:#f0f2f5] [&_td]:[padding-top:var(--space-4)] [&_td]:[padding-right:var(--space-5)] [&_td]:[padding-bottom:var(--space-4)] [&_td]:[padding-left:var(--space-5)] [&_td]:[font-size:var(--text-sm)]! [&_td]:[border-bottom-width:1px] [&_td]:[border-bottom-style:solid] [&_td]:[border-bottom-color:#f0f2f5] [&_td]:[color:#566273] [&_tbody_tr:last-child_td]:[border-bottom-width:0] [&_tbody_tr:last-child_td]:[border-bottom-style:none] [&_tbody_tr:last-child_td]:[border-bottom-color:currentColor] [&_tbody_tr:hover]:[background:#fcfdfd] [&_td_[data-ui~='money']]:[color:#3a4859] [&_td_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_td_[data-ui~='money']]:font-medium [&_td_small]:[font-size:var(--text-xs)] [&_td_small]:[color:#66758a] [@media(width>1650px)]:[&_td]:[padding-top:20px] [@media(width>1650px)]:[&_td]:[padding-bottom:20px]"
              >
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
            <div data-ui="table-scroll" className="[overflow-x:auto]">
              <table
                data-ui="data-table"
                className="[border-collapse:collapse] [width:100%] whitespace-nowrap text-right [@media(width<=640px)]:[min-width:520px] [&_th]:[font-size:var(--text-xs)] [&_th]:font-semibold [&_th]:[color:#66758a] [&_th]:[padding-top:12px] [&_th]:[padding-right:19px] [&_th]:[padding-bottom:12px] [&_th]:[padding-left:19px] [&_th]:[background:#fcfcfd] [&_th]:[border-top-width:1px] [&_th]:[border-top-style:solid] [&_th]:[border-top-color:#f0f2f5] [&_th]:[border-bottom-width:1px] [&_th]:[border-bottom-style:solid] [&_th]:[border-bottom-color:#f0f2f5] [&_td]:[padding-top:var(--space-4)] [&_td]:[padding-right:var(--space-5)] [&_td]:[padding-bottom:var(--space-4)] [&_td]:[padding-left:var(--space-5)] [&_td]:[font-size:var(--text-sm)]! [&_td]:[border-bottom-width:1px] [&_td]:[border-bottom-style:solid] [&_td]:[border-bottom-color:#f0f2f5] [&_td]:[color:#566273] [&_tbody_tr:last-child_td]:[border-bottom-width:0] [&_tbody_tr:last-child_td]:[border-bottom-style:none] [&_tbody_tr:last-child_td]:[border-bottom-color:currentColor] [&_tbody_tr:hover]:[background:#fcfdfd] [&_td_[data-ui~='money']]:[color:#3a4859] [&_td_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_td_[data-ui~='money']]:font-medium [&_td_small]:[font-size:var(--text-xs)] [&_td_small]:[color:#66758a] [@media(width>1650px)]:[&_td]:[padding-top:20px] [@media(width>1650px)]:[&_td]:[padding-bottom:20px]"
              >
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
                        <bdi
                          data-ui="destination-cell"
                          className="block [max-width:150px] [text-overflow:ellipsis] overflow-hidden"
                        >
                          {w.destination}
                        </bdi>
                      </td>
                      <td>{date(w.created_at)}</td>
                      <td>
                        <StatusBadge good={w.status === 'paid'}>
                          {statusLabel(w.status)}
                        </StatusBadge>
                      </td>
                      <td>
                        {w.status === 'pending' && (
                          <button
                            data-ui="cancel-link"
                            className="[color:#b74658] [font-size:var(--text-xs)] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0]"
                            onClick={() => setCancel(w)}
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
        size="compact"
        onOpenChange={(v) => !v && setCancel(null)}
        title="لغو درخواست برداشت"
        description="درخواست لغو و موجودی مسدودشدهٔ آن آزاد می‌شود."
      >
        <div
          data-ui="dialog-actions"
          className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
        >
          <button
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={() => setCancel(null)}
          >
            بازگشت
          </button>
          <button
            data-ui="button danger"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
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
