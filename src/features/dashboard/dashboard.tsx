'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpLeft,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Plus,
  Wallet,
  ShieldCheck,
  ChevronLeft,
} from 'lucide-react';
import {
  useWallet,
  useOrders,
  useSymbols,
  useMarket,
  useEntries,
  useSession,
} from '@/lib/use-data';
import { balanceValue, number, assetName, date } from '@/lib/format';
import {
  AssetIcon,
  Money,
  MoreLink,
  PageHeading,
  Panel,
  PanelTitle,
  State,
  StatusBadge,
} from '@/components/ui';
import { MarketTable } from '@/features/markets/market-table';
import { PriceChart } from '@/components/price-chart';
export function Dashboard() {
  const wallet = useWallet();
  const orders = useOrders();
  const symbols = useSymbols();
  const entries = useEntries();
  const market = useMarket('USDT_IRT');
  const [visible, setVisible] = useState(true);
  const session = useSession();
  const total = balanceValue(wallet.data);
  const irt = wallet.data?.balances.find((b) => b.asset === 'IRT');
  const frozen =
    wallet.data?.balances.reduce(
      (sum, b) =>
        sum + Number(b.frozen) * (b.asset === 'IRT' ? 1 : (wallet.data?.prices[b.asset] ?? 0)),
      0,
    ) ?? 0;
  const openOrders =
    orders.data?.orders.filter((o) => ['open', 'partial'].includes(o.status)) ?? [];
  const points =
    market.data?.trades
      .slice()
      .sort((a, b) => a.executed_at.localeCompare(b.executed_at))
      .map((t) => ({
        label: new Date(t.executed_at).toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: Number(t.price),
      })) ?? [];
  return (
    <>
      <PageHeading
        title={`سلام، ${session.data?.user.first_name ?? 'به مارکت‌بات خوش آمدید'}${session.data?.user.first_name ? ' 👋' : ''}`}
        description="نگاهی به دارایی‌ها، بازار و فعالیت‌های اخیر شما."
        actions={
          <>
            <Link href="/wallet?action=withdraw" className="button secondary">
              <ArrowUpLeft size={17} />
              برداشت
            </Link>
            <Link href="/wallet?action=deposit" className="button primary">
              <Plus size={17} />
              افزایش موجودی
            </Link>
          </>
        }
      />
      <div className="dashboard-top">
        <Panel className="portfolio-card">
          <div className="portfolio-topline">
            <span className="eyebrow">
              <Wallet size={17} />
              ارزش کل دارایی‌ها
            </span>
            <button
              className="icon-button"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? 'پنهان کردن موجودی' : 'نمایش موجودی'}
            >
              {visible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <div className="portfolio-total">
            {wallet.isPending ? '…' : visible ? <Money value={total} /> : <span>••••••••</span>}
          </div>
          <p className="portfolio-caption">برآورد دارایی‌ها بر اساس قیمت فعلی بازار</p>
          <div className="portfolio-details">
            <div>
              <span>موجودی تومان</span>
              <strong>
                {visible ? number(irt?.available ?? 0) : '••••••'} <small>تومان</small>
              </strong>
            </div>
            <div>
              <span>در سفارش‌های باز</span>
              <strong>
                {visible ? number(frozen) : '••••••'} <small>تومان</small>
              </strong>
            </div>
          </div>
          {wallet.error && (
            <p className="inline-error">
              دریافت موجودی انجام نشد.{' '}
              <button className="text-link" onClick={() => wallet.refetch()}>
                تلاش دوباره
              </button>
            </p>
          )}
        </Panel>
        <Panel className="market-overview">
          <PanelTitle
            title="نبض بازار تتر"
            subtitle="تتر / تومان"
            action={<MoreLink href="/trade/USDT_IRT">ورود به بازار</MoreLink>}
          />
          <div className="market-overview-price">
            <AssetIcon asset="USDT" />
            <Money value={market.data?.summary?.close ?? 0} />
            <span className="muted">تومان</span>
          </div>
          {points.length > 1 ? (
            <PriceChart height={124} compact data={points} />
          ) : (
            <State
              loading={market.isPending}
              error={market.error}
              retry={() => market.refetch()}
              empty
            >
              <span />
            </State>
          )}
          <div className="chart-footnote">
            <span>روند معاملات اخیر</span>
            <span className="live-indicator">
              <span />
              به‌روزرسانی دوره‌ای
            </span>
          </div>
        </Panel>
      </div>
      <div className="metric-grid">
        <Panel className="metric">
          <span className="metric-icon teal">
            <ArrowLeftRight size={20} />
          </span>
          <div>
            <span>سفارش‌های باز</span>
            <strong>
              {number(openOrders.length)} <small>سفارش</small>
            </strong>
          </div>
          <Link href="/orders" className="icon-button" aria-label="مشاهده سفارش‌ها">
            <ChevronLeft size={18} />
          </Link>
        </Panel>
        <Panel className="metric">
          <span className="metric-icon blue">
            <Wallet size={20} />
          </span>
          <div>
            <span>سبد دارایی شما</span>
            <strong>
              {number(
                wallet.data?.balances.filter(
                  (b) => Number(b.available) + Number(b.frozen) + Number(b.locked) > 0,
                ).length ?? 0,
              )}{' '}
              <small>دارایی</small>
            </strong>
          </div>
          <Link href="/wallet" className="icon-button" aria-label="مشاهده دارایی‌ها">
            <ChevronLeft size={18} />
          </Link>
        </Panel>
        <Panel className="metric">
          <span className="metric-icon purple">
            <ShieldCheck size={20} />
          </span>
          <div>
            <span>امنیت حساب</span>
            <strong className="metric-text">
              تأیید پیامکی <StatusBadge good>فعال</StatusBadge>
            </strong>
          </div>
          <Link href="/settings" className="icon-button" aria-label="مشاهده امنیت حساب">
            <ChevronLeft size={18} />
          </Link>
        </Panel>
      </div>
      <div className="dashboard-bottom">
        <div className="dashboard-main">
          <Panel>
            <PanelTitle
              title="بازارهای معاملاتی"
              subtitle="قیمت‌ها و تغییرات بازار در یک نگاه"
              action={<MoreLink href="/markets">همهٔ بازارها</MoreLink>}
            />
            <State
              loading={symbols.isPending}
              error={symbols.error}
              retry={() => symbols.refetch()}
              empty={!symbols.data?.symbols.length}
            >
              <MarketTable symbols={symbols.data?.symbols.slice(0, 4) ?? []} />
            </State>
          </Panel>
          <Panel className="activity-panel">
            <PanelTitle
              title="فعالیت‌های اخیر"
              action={<MoreLink href="/wallet">تاریخچهٔ کیف پول</MoreLink>}
            />
            <State
              loading={entries.isPending}
              error={entries.error}
              retry={() => entries.refetch()}
              empty={!entries.data?.entries.length}
            >
              <div className="activity-list">
                {entries.data?.entries.slice(0, 3).map((e) => (
                  <div className="activity-row" key={e.id}>
                    <span className="activity-icon">
                      <ArrowDownLeft size={17} />
                    </span>
                    <div>
                      <strong>
                        {e.kind === 'charge'
                          ? 'افزایش موجودی'
                          : e.kind === 'trade'
                            ? 'تسویهٔ معامله'
                            : 'تغییر موجودی'}{' '}
                        {assetName(e.asset)}
                      </strong>
                      <small>{date(e.created_at)}</small>
                    </div>
                    <Money
                      value={e.amount}
                      unit={e.asset === 'IRT' ? 'تومان' : e.asset}
                      decimals={e.asset === 'IRT' ? 0 : 6}
                    />
                    <StatusBadge good>ثبت شده</StatusBadge>
                  </div>
                ))}
              </div>
            </State>
          </Panel>
        </div>
        <Panel className="allocation-panel">
          <PanelTitle title="ترکیب دارایی‌ها" subtitle="سهم هر دارایی از ارزش کل سبد" />
          <State
            loading={wallet.isPending}
            error={wallet.error}
            retry={() => wallet.refetch()}
            empty={!total}
          >
            <div
              className="allocation-donut"
              style={{
                background: `conic-gradient(${(wallet.data?.balances ?? [])
                  .filter((b) => Number(b.available) + Number(b.frozen) + Number(b.locked) > 0)
                  .map((b, i, all) => {
                    const value = (item: typeof b) =>
                      (((Number(item.available) + Number(item.frozen) + Number(item.locked)) *
                        (item.asset === 'IRT' ? 1 : (wallet.data?.prices[item.asset] ?? 0))) /
                        total) *
                      100;
                    const start = all.slice(0, i).reduce((sum, x) => sum + value(x), 0);
                    return `${['#0ba88a', '#4675df', '#f3b342', '#9780d8', '#4bb8d3'][i % 5]} ${start}% ${start + value(b)}%`;
                  })
                  .join(',')})`,
              }}
            >
              <span>
                <strong>{number(wallet.data?.balances.length ?? 0)}</strong>
                <small>دارایی</small>
              </span>
            </div>
            <div className="allocation-list">
              {wallet.data?.balances
                .filter((b) => Number(b.available) + Number(b.frozen) + Number(b.locked) > 0)
                .map((b, i) => {
                  const value =
                    (Number(b.available) + Number(b.frozen) + Number(b.locked)) *
                    (b.asset === 'IRT' ? 1 : (wallet.data?.prices[b.asset] ?? 0));
                  return (
                    <div key={b.asset}>
                      <span
                        className="allocation-dot"
                        style={{
                          background: ['#0ba88a', '#4675df', '#f3b342', '#9780d8', '#4bb8d3'][
                            i % 5
                          ],
                        }}
                      />
                      <span>{assetName(b.asset)}</span>
                      <strong>{number(total ? (value / total) * 100 : 0, 1)}٪</strong>
                    </div>
                  );
                })}
            </div>
          </State>
          <Link href="/wallet" className="allocation-link">
            مدیریت دارایی‌ها <ArrowUpLeft size={15} />
          </Link>
        </Panel>
      </div>
    </>
  );
}
