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
            <Link
              href="/wallet?action=withdraw"
              data-ui="button secondary"
              className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            >
              <ArrowUpLeft size={17} />
              برداشت
            </Link>
            <Link
              href="/wallet?action=deposit"
              data-ui="button primary"
              className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            >
              <Plus size={17} />
              افزایش موجودی
            </Link>
          </>
        }
      />
      <div
        data-ui="dashboard-top"
        className="grid [grid-template-columns:minmax(0,_1.02fr)_minmax(0,_1fr)] [gap:20px] [@media(width<=1000px)]:[grid-template-columns:minmax(0,_1fr)] [@media(width<=800px)]:[gap:16px] [@media(width>1650px)]:[gap:24px]"
      >
        <Panel appearance="portfolio-card">
          <div data-ui="portfolio-topline" className="flex items-center justify-between">
            <span
              data-ui="eyebrow"
              className="flex items-center [gap:7px] [color:#738377] [font-size:var(--text-sm)]"
            >
              <Wallet size={17} />
              ارزش کل دارایی‌ها
            </span>
            <button
              data-ui="icon-button"
              className="inline-flex items-center justify-center [width:30px] [height:30px] [border-radius:7px] [color:#8d99a7] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [@media(width<=640px)]:[min-width:44px] [@media(width<=640px)]:[min-height:44px] [@media(width>640px)]:[@media(width<=800px)]:[min-width:34px] [@media(width>640px)]:[@media(width<=800px)]:[min-height:34px] [&:hover]:[background:#f3f6f7] [&:hover]:[color:var(--text)]"
              onClick={() => setVisible(!visible)}
              aria-label={visible ? 'پنهان کردن موجودی' : 'نمایش موجودی'}
            >
              {visible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>
          </div>
          <div
            data-ui="portfolio-total"
            className="[margin-top:22px] [font-size:37px] font-bold [letter-spacing:-1.5px] [line-height:1.5] [@media(width<=640px)]:[font-size:36px] [@media(width>640px)]:[@media(width<=1000px)]:[font-size:27px] [@media(width>1000px)]:[@media(width<=1250px)]:[font-size:31px] [@media(width>1650px)]:[font-size:42px] [&_[data-ui~='money']]:[gap:9px] [&_small]:[font-size:var(--text-sm)] [&_small]:[letter-spacing:0] [&_small]:[color:#8b9d93]"
          >
            {wallet.isPending ? '…' : visible ? <Money value={total} /> : <span>••••••••</span>}
          </div>
          <p
            data-ui="portfolio-caption"
            className="[font-size:var(--text-xs)] [color:#66758a] [margin-top:4px]"
          >
            برآورد دارایی‌ها بر اساس قیمت فعلی بازار
          </p>
          <div
            data-ui="portfolio-details"
            className="grid [grid-template-columns:1fr_1fr] [gap:20px] [margin-top:25px] [padding-top:21px] [border-top-width:1px] [border-top-style:solid] [border-top-color:#e9efeb] [@media(width>640px)]:[@media(width<=1000px)]:[gap:10px] [@media(width<=640px)]:[margin-top:23px] [@media(width>1650px)]:[margin-top:30px] [&_>_div]:flex [&_>_div]:flex-col [&_>_div]:[gap:5px] [&_>_div_+_div]:[border-right-width:1px] [&_>_div_+_div]:[border-right-style:solid] [&_>_div_+_div]:[border-right-color:#e5ede8] [&_>_div_+_div]:[padding-right:27px] [&_span]:[font-size:var(--text-xs)] [&_span]:[color:#66758a] [&_strong]:[font-size:var(--text-base)] [&_strong]:font-semibold [&_small]:[font-size:var(--text-xs)] [&_small]:[color:#66758a] [&_small]:font-normal [@media(width<=640px)]:[&_>_div_+_div]:[padding-right:23px] [@media(width>640px)]:[@media(width<=1000px)]:[&_>_div_+_div]:[padding-right:15px]"
          >
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
            <p
              data-ui="inline-error"
              className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
              role="alert"
            >
              دریافت موجودی انجام نشد.{' '}
              <button
                data-ui="text-link"
                className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
                onClick={() => wallet.refetch()}
              >
                تلاش دوباره
              </button>
            </p>
          )}
        </Panel>
        <Panel appearance="market-overview">
          <PanelTitle
            title="نبض بازار تتر"
            subtitle="تتر / تومان"
            action={<MoreLink href="/trade/USDT_IRT">ورود به بازار</MoreLink>}
          />
          <div
            data-ui="market-overview-price"
            className="flex items-center [gap:10px] [padding-top:0] [padding-right:24px] [padding-bottom:0] [padding-left:24px] [&_[data-ui~='money']]:[font-size:22px] [&_[data-ui~='money']]:font-semibold [&_[data-ui~='money']_small]:hidden [&_>_[data-ui~='muted']]:[font-size:var(--text-xs)] [&_[data-ui~='asset-icon']]:[width:26px] [&_[data-ui~='asset-icon']]:[height:26px] [&_[data-ui~='asset-icon']]:[font-size:17px] [@media(width<=1250px)]:[&_[data-ui~='money']]:[font-size:20px]"
          >
            <AssetIcon asset="USDT" />
            <Money value={market.data?.summary?.close ?? 0} />
            <span data-ui="muted" className="[color:var(--muted)]">
              تومان
            </span>
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
          <div
            data-ui="chart-footnote"
            className="flex justify-between [border-top-width:1px] [border-top-style:solid] [border-top-color:#f0f3f5] [padding-top:var(--space-3)] [padding-right:var(--space-5)] [padding-bottom:var(--space-3)] [padding-left:var(--space-5)] [font-size:var(--text-xs)] [color:#66758a]"
          >
            <span>روند معاملات اخیر</span>
            <span
              data-ui="live-indicator"
              className="flex items-center [gap:5px] [&_>_span]:[width:4px] [&_>_span]:[height:4px] [&_>_span]:[border-radius:50%] [&_>_span]:[background:#9ac2b2]"
            >
              <span />
              به‌روزرسانی دوره‌ای
            </span>
          </div>
        </Panel>
      </div>
      <div
        data-ui="metric-grid"
        className="grid [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:20px] [margin-top:20px] [margin-right:0] [margin-bottom:25px] [margin-left:0] [@media(width<=1000px)]:[grid-template-columns:repeat(auto-fit,_minmax(min(100%,_220px),_1fr))] [@media(width<=640px)]:[gap:10px] [@media(width<=640px)]:[margin-bottom:20px] [@media(width>640px)]:[@media(width<=1000px)]:[gap:12px] [@media(width>1650px)]:[margin-top:24px] [@media(width>1650px)]:[margin-bottom:28px]"
      >
        <Panel appearance="metric">
          <span
            data-ui="metric-icon teal"
            className="inline-flex items-center justify-center [width:41px] [height:41px] [border-radius:12px] shrink-0 [color:#19a488] [background:#effaf5] [@media(width<=640px)]:[width:31px] [@media(width<=640px)]:[height:31px] [@media(width>640px)]:[@media(width<=1000px)]:[width:30px] [@media(width>640px)]:[@media(width<=1000px)]:[height:30px] [@media(width>1000px)]:[@media(width<=1250px)]:[width:35px] [@media(width>1000px)]:[@media(width<=1250px)]:[height:35px] [@media(width<=1250px)]:[border-radius:10px]"
          >
            <ArrowLeftRight size={20} />
          </span>
          <div>
            <span>سفارش‌های باز</span>
            <strong>
              {number(openOrders.length)} <small>سفارش</small>
            </strong>
          </div>
          <Link
            href="/orders"
            data-ui="icon-button"
            className="inline-flex items-center justify-center [width:30px] [height:30px] [border-radius:7px] [color:#8d99a7] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [@media(width<=640px)]:[min-width:44px] [@media(width<=640px)]:[min-height:44px] [@media(width>640px)]:[@media(width<=800px)]:[min-width:34px] [@media(width>640px)]:[@media(width<=800px)]:[min-height:34px] [&:hover]:[background:#f3f6f7] [&:hover]:[color:var(--text)]"
            aria-label="مشاهده سفارش‌ها"
          >
            <ChevronLeft size={18} />
          </Link>
        </Panel>
        <Panel appearance="metric">
          <span
            data-ui="metric-icon blue"
            className="inline-flex items-center justify-center [width:41px] [height:41px] [border-radius:12px] shrink-0 [color:#5e83d5] [background:#f0f4fe] [@media(width<=640px)]:[width:31px] [@media(width<=640px)]:[height:31px] [@media(width>640px)]:[@media(width<=1000px)]:[width:30px] [@media(width>640px)]:[@media(width<=1000px)]:[height:30px] [@media(width>1000px)]:[@media(width<=1250px)]:[width:35px] [@media(width>1000px)]:[@media(width<=1250px)]:[height:35px] [@media(width<=1250px)]:[border-radius:10px]"
          >
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
          <Link
            href="/wallet"
            data-ui="icon-button"
            className="inline-flex items-center justify-center [width:30px] [height:30px] [border-radius:7px] [color:#8d99a7] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [@media(width<=640px)]:[min-width:44px] [@media(width<=640px)]:[min-height:44px] [@media(width>640px)]:[@media(width<=800px)]:[min-width:34px] [@media(width>640px)]:[@media(width<=800px)]:[min-height:34px] [&:hover]:[background:#f3f6f7] [&:hover]:[color:var(--text)]"
            aria-label="مشاهده دارایی‌ها"
          >
            <ChevronLeft size={18} />
          </Link>
        </Panel>
        <Panel appearance="metric">
          <span
            data-ui="metric-icon purple"
            className="inline-flex items-center justify-center [width:41px] [height:41px] [border-radius:12px] shrink-0 [color:#9a7fd2] [background:#f6f2fe] [@media(width<=640px)]:[width:31px] [@media(width<=640px)]:[height:31px] [@media(width>640px)]:[@media(width<=1000px)]:[width:30px] [@media(width>640px)]:[@media(width<=1000px)]:[height:30px] [@media(width>1000px)]:[@media(width<=1250px)]:[width:35px] [@media(width>1000px)]:[@media(width<=1250px)]:[height:35px] [@media(width<=1250px)]:[border-radius:10px]"
          >
            <ShieldCheck size={20} />
          </span>
          <div>
            <span>امنیت حساب</span>
            <strong data-ui="metric-text" className="">
              تأیید پیامکی <StatusBadge good>فعال</StatusBadge>
            </strong>
          </div>
          <Link
            href="/settings"
            data-ui="icon-button"
            className="inline-flex items-center justify-center [width:30px] [height:30px] [border-radius:7px] [color:#8d99a7] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [@media(width<=640px)]:[min-width:44px] [@media(width<=640px)]:[min-height:44px] [@media(width>640px)]:[@media(width<=800px)]:[min-width:34px] [@media(width>640px)]:[@media(width<=800px)]:[min-height:34px] [&:hover]:[background:#f3f6f7] [&:hover]:[color:var(--text)]"
            aria-label="مشاهده امنیت حساب"
          >
            <ChevronLeft size={18} />
          </Link>
        </Panel>
      </div>
      <div
        data-ui="dashboard-bottom"
        className="grid [grid-template-columns:minmax(0,_2.5fr)_minmax(235px,_1fr)] [gap:20px] [align-items:start] [@media(width<=640px)]:[grid-template-columns:minmax(0,_1fr)] [@media(width<=640px)]:[gap:18px] [@media(width>640px)]:[@media(width<=800px)]:[grid-template-columns:minmax(0,_1fr)_225px] [@media(width>800px)]:[@media(width<=1000px)]:[grid-template-columns:1fr] [@media(width>1000px)]:[@media(width<=1250px)]:[grid-template-columns:minmax(0,_1fr)_225px] [@media(width>1650px)]:[grid-template-columns:minmax(0,_2.6fr)_minmax(270px,_1fr)] [@media(width>1650px)]:[gap:24px] [@media(width<=800px)]:[&_[data-ui~='volume-cell']]:hidden [@media(width>800px)]:[@media(width<=1000px)]:[&_[data-ui~='volume-cell']]:[display:table-cell] [@media(width>1000px)]:[@media(width<=1250px)]:[&_[data-ui~='volume-cell']]:hidden"
      >
        <div
          data-ui="dashboard-main"
          className="flex flex-col [gap:20px] min-w-0 [@media(width<=1250px)]:[&_[data-ui~='spark-cell']]:[width:70px] [@media(width<=1250px)]:[&_[data-ui~='spark-cell']]:[min-width:65px]"
        >
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
          <Panel appearance="activity-panel">
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
              <div
                data-ui="activity-list"
                className="[padding-top:0] [padding-right:var(--space-5)] [padding-bottom:0] [padding-left:var(--space-5)] [@media(width<=640px)]:[padding-right:18px] [@media(width<=640px)]:[padding-left:18px]"
              >
                {entries.data?.entries.slice(0, 3).map((e) => (
                  <div
                    data-ui="activity-row"
                    className="flex items-center [gap:11px] [padding-top:16px] [padding-right:0] [padding-bottom:16px] [padding-left:0] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#f0f2f5] [@media(width<=640px)]:grid [@media(width<=640px)]:[gap:var(--space-2)_var(--space-3)] [@media(width<=640px)]:[grid-template-columns:auto_minmax(0,_1fr)] [&:last-child]:[border-bottom-width:0] [&:last-child]:[border-bottom-style:none] [&:last-child]:[border-bottom-color:currentColor] [&_>_div]:flex [&_>_div]:flex-col [&_>_div]:[gap:3px] [&_>_div]:[flex:1] [&_strong]:[font-size:var(--text-sm)] [&_strong]:font-semibold [&_small]:[font-size:var(--text-xs)] [&_small]:[color:#66758a] [&_>_[data-ui~='money']]:[font-size:var(--text-sm)] [&_>_[data-ui~='money']]:[color:#5c6a7b] [&_>_[data-ui~='money']]:[margin-left:12px] [@media(width<=640px)]:[&_>_[data-ui~='money']]:[margin-left:0] [@media(width<=640px)]:[&_>_[data-ui~='money']]:[margin-top:0] [@media(width<=640px)]:[&_>_[data-ui~='money']]:[margin-right:0] [@media(width<=640px)]:[&_>_[data-ui~='money']]:[margin-bottom:0] [@media(width<=640px)]:[&_>_[data-ui~='money']]:[grid-column:2] [@media(width<=640px)]:[&_>_[data-ui~='money']]:[justify-self:start] [@media(width<=640px)]:[&_>_[data-ui~='status-badge']]:hidden"
                    key={e.id}
                  >
                    <span
                      data-ui="activity-icon"
                      className="[width:32px] [height:32px] [background:#eff8f4] [border-radius:9px] [color:#49a98e] grid place-items-center"
                    >
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
        <Panel appearance="allocation-panel">
          <PanelTitle title="ترکیب دارایی‌ها" subtitle="سهم هر دارایی از ارزش کل سبد" />
          <State
            loading={wallet.isPending}
            error={wallet.error}
            retry={() => wallet.refetch()}
            empty={!total}
          >
            <div
              data-ui="allocation-donut"
              className="[width:148px] [height:148px] [border-radius:50%] [margin-top:14px] mr-auto [margin-bottom:23px] ml-auto grid place-items-center [transform:rotate(-90deg)] [@media(width>1650px)]:[width:170px] [@media(width>1650px)]:[height:170px] [@media(width>1650px)]:[margin-top:23px] [@media(width>1650px)]:[margin-bottom:30px] [@media(width<=640px)]:[margin-top:5px] [@media(width<=640px)]:[margin-bottom:22px] [&_>_span]:flex [&_>_span]:items-center [&_>_span]:justify-center [&_>_span]:flex-col [&_>_span]:[background:white] [&_>_span]:[width:117px] [&_>_span]:[height:117px] [&_>_span]:[border-radius:50%] [&_>_span]:[transform:rotate(90deg)] [&_strong]:[font-size:27px] [&_strong]:font-semibold [&_strong]:[line-height:1.5] [&_small]:[font-size:var(--text-xs)] [&_small]:[color:#66758a] [@media(width>1650px)]:[&_>_span]:[width:137px] [@media(width>1650px)]:[&_>_span]:[height:137px]"
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
            <div
              data-ui="allocation-list"
              className="[padding-top:0] [padding-right:var(--space-5)] [padding-bottom:0] [padding-left:var(--space-5)] [@media(width<=640px)]:grid [@media(width<=640px)]:[grid-template-columns:1fr_1fr] [@media(width<=640px)]:[gap:10px_25px] [&_>_div]:flex [&_>_div]:items-center [&_>_div]:[gap:7px] [&_>_div]:[font-size:var(--text-sm)] [&_>_div]:[margin-bottom:16px] [&_>_div]:[color:#66758a] [&_strong]:mr-auto [&_strong]:[font-size:var(--text-sm)] [&_strong]:font-medium [&_strong]:[color:#596878] [@media(width<=640px)]:[&_>_div]:[margin-bottom:6px] [@media(width>1650px)]:[&_>_div]:[margin-bottom:19px]"
            >
              {wallet.data?.balances
                .filter((b) => Number(b.available) + Number(b.frozen) + Number(b.locked) > 0)
                .map((b, i) => {
                  const value =
                    (Number(b.available) + Number(b.frozen) + Number(b.locked)) *
                    (b.asset === 'IRT' ? 1 : (wallet.data?.prices[b.asset] ?? 0));
                  return (
                    <div key={b.asset}>
                      <span
                        data-ui="allocation-dot"
                        className="block [width:6px] [height:6px] [border-radius:2px]"
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
          <Link
            href="/wallet"
            data-ui="allocation-link"
            className="flex items-center justify-center [gap:7px] [margin-top:19px] [margin-right:20px] [margin-bottom:9px] [margin-left:20px] [padding-top:12px] [padding-right:12px] [padding-bottom:12px] [padding-left:12px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [color:#66758a] [font-size:var(--text-sm)] [@media(width<=640px)]:[margin-top:20px]"
          >
            مدیریت دارایی‌ها <ArrowUpLeft size={15} />
          </Link>
        </Panel>
      </div>
    </>
  );
}
