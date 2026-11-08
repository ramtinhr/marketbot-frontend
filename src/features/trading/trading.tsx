'use client';
import { AuctionOffers } from './auction-offers';
import { useTradingLive } from '@/lib/use-trading-live';
import { Select, SelectOption } from '@/components/select';
import { ui } from '@/lib/ui-styles';

import Link from 'next/link';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, Info } from 'lucide-react';
import {
  useMarket,
  useOrders,
  useWallet,
  useSymbols,
  useAuction,
  useResource,
} from '@/lib/use-data';
import { parseDecimal, decimalUnits, formatAmountInput } from '@/lib/numbers';
import { api, errorText } from '@/lib/api';
import { useApp } from '@/providers/app-provider';
import { assetName, number } from '@/lib/format';
import {
  AssetLabel,
  Change,
  Field,
  Modal,
  Money,
  Panel,
  PanelTitle,
  State,
  MoreLink,
} from '@/components/ui';
import { PriceChart } from '@/components/price-chart';
import { OrderTable } from '@/features/orders/order-table';
import type { Order } from '@/lib/types';
export function Trading({ symbol }: { symbol: string }) {
  useTradingLive(symbol);
  const market = useMarket(symbol);
  const wallet = useWallet();
  const normalOrders = useOrders();
  const auctionOrders = useResource<{ orders: Order[] }>(
    'auction-orders',
    '/auction/orders?scope=all',
    { orders: [] },
  );
  const symbols = useSymbols();
  const auction = useAuction(symbol);
  const client = useQueryClient();
  const { demo, notify } = useApp();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [type, setType] = useState<'limit' | 'market' | 'auction'>('limit');
  const orders = type === 'auction' ? auctionOrders : normalOrders;
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [description, setDescription] = useState('');
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const base = symbol.split('_')[0];
  const summary = market.data?.summary;
  const depth = type === 'auction' ? auction.data?.book : market.data?.depth;
  const reference = side === 'buy' ? depth?.asks[0]?.price : depth?.bids[0]?.price;
  const quantityValue = parseDecimal(quantity, 8);
  const priceValue = parseDecimal(price, 8);
  const effectivePrice =
    type === 'market'
      ? Number(reference ?? summary?.close ?? 0)
      : Number(priceValue ?? (price ? 0 : reference || summary?.close || 0));
  const available = Number(
    wallet.data?.balances.find((b) => b.asset === (side === 'buy' ? 'IRT' : base))?.available ?? 0,
  );
  const estimate = Number(quantityValue) * effectivePrice;
  const points =
    (type === 'auction' ? auction.data?.trades : market.data?.trades)
      ?.slice()
      .sort((a, b) => a.executed_at.localeCompare(b.executed_at))
      .map((t) => ({
        label: new Date(t.executed_at).toLocaleTimeString('fa-IR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: Number(t.price),
      })) ?? [];
  const prepare = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !quantityValue ||
      (type !== 'market' && !!price && !priceValue) ||
      !Number.isFinite(effectivePrice) ||
      effectivePrice <= 0
    ) {
      setFormError(
        !quantityValue
          ? 'مقدار باید مثبت و با حداکثر ۸ رقم اعشار باشد.'
          : 'قیمت باید مثبت و با حداکثر ۸ رقم اعشار باشد.',
      );
      return;
    }
    const quantityUnits = decimalUnits(quantityValue!, 8)!;
    const priceUnits = decimalUnits(
      type === 'market'
        ? String(reference ?? summary?.close ?? 0)
            .replace(/(\.\d*?)0+$/, '$1')
            .replace(/\.$/, '')
        : (priceValue ?? String(effectivePrice)),
      8,
    );
    const balanceString =
      wallet.data?.balances.find((b) => b.asset === (side === 'buy' ? 'IRT' : base))?.available ??
      '0';
    const balanceUnits = decimalUnits(balanceString, 18) ?? 0n;
    if (
      !priceUnits ||
      (side === 'buy' ? quantityUnits * priceUnits * 100n : quantityUnits * 10000000000n) >
        balanceUnits
    ) {
      setFormError('موجودی کافی برای این سفارش ندارید.');
      return;
    }
    setFormError('');
    if (type !== 'market') setPrice(formatAmountInput(priceValue ?? String(effectivePrice)));
    setReview(true);
  };
  return (
    <>
      <div
        data-ui="trading-market-header"
        className="flex items-center [gap:30px] [background:white] [border-top-width:1px] [border-top-style:solid] [border-top-color:#e9edf2] [border-right-width:1px] [border-right-style:solid] [border-right-color:#e9edf2] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#e9edf2] [border-left-width:1px] [border-left-style:solid] [border-left-color:#e9edf2] [border-radius:12px] [padding-top:18px] [padding-right:22px] [padding-bottom:18px] [padding-left:22px] [margin-bottom:20px] flex-wrap [@media(width<=640px)]:[gap:16px] [@media(width<=640px)]:[padding-top:17px] [@media(width<=640px)]:[padding-right:17px] [@media(width<=640px)]:[padding-bottom:17px] [@media(width<=640px)]:[padding-left:17px] [@media(width<=640px)]:justify-between [@media(width>640px)]:[@media(width<=1000px)]:[gap:15px] [@media(width>1000px)]:[@media(width<=1250px)]:[gap:20px]"
      >
        <div
          data-ui="pair-selector"
          className="flex items-center [gap:16px] [@media(width<=640px)]:[width:100%] [@media(width<=640px)]:justify-between [&_select]:[font-size:var(--text-xs)] [&_select]:[direction:ltr] [&_select]:[border-top-width:0] [&_select]:[border-top-style:none] [&_select]:[border-top-color:currentColor] [&_select]:[border-right-width:0] [&_select]:[border-right-style:none] [&_select]:[border-right-color:currentColor] [&_select]:[border-bottom-width:0] [&_select]:[border-bottom-style:none] [&_select]:[border-bottom-color:currentColor] [&_select]:[border-left-width:0] [&_select]:[border-left-style:none] [&_select]:[border-left-color:currentColor] [&_select]:[padding-top:0] [&_select]:[padding-right:0] [&_select]:[padding-bottom:0] [&_select]:[padding-left:0] [&_select]:[color:#8794a4] [@media(width<=640px)]:[&_[data-ui~='pair-divider']]:hidden"
        >
          <AssetLabel asset={base} />
          <span
            data-ui="pair-divider"
            className="[height:26px] [border-left-width:1px] [border-left-style:solid] [border-left-color:var(--line)]"
          />
          <Select
            aria-label="انتخاب بازار"
            value={symbol}
            onValueChange={(value) => location.assign(`/trade/${value}`)}
          >
            {(symbols.data?.symbols ?? [symbol]).map((s) => (
              <SelectOption key={s} value={s}>
                {s.replace('_', ' / ')}
              </SelectOption>
            ))}
          </Select>
        </div>
        <div
          data-ui="market-stat primary-stat"
          className="flex flex-row [gap:10px] items-center ml-auto [@media(width<=640px)]:[margin-left:0] [@media(width<=640px)]:[width:100%] [@media(width<=640px)]:[margin-top:0] [@media(width<=640px)]:[margin-right:0] [@media(width<=640px)]:[margin-bottom:0] [@media(width<=640px)]:[border-bottom-width:1px] [@media(width<=640px)]:[border-bottom-style:solid] [@media(width<=640px)]:[border-bottom-color:var(--line)] [@media(width<=640px)]:[padding-bottom:15px] [@media(width<=640px)]:justify-between [&_>_span]:[font-size:var(--text-xs)] [&_>_span]:[color:#66758a] [&_>_strong]:[font-size:22px] [&_>_strong]:font-semibold [&_[data-ui~='money']_small]:[font-size:var(--text-xs)]"
        >
          <strong>{summary ? <Money value={summary.close} /> : '—'}</strong>
          {summary && <Change value={summary.change_pct} />}
        </div>
        <div
          data-ui="market-stat"
          className="flex flex-col [gap:5px] [&_>_span]:[font-size:var(--text-xs)] [&_>_span]:[color:#66758a] [&_>_strong]:[font-size:var(--text-sm)] [&_>_strong]:font-semibold"
        >
          <span>بالاترین ۲۴ ساعت</span>
          <strong>{summary ? number(summary.high) : '—'}</strong>
        </div>
        <div
          data-ui="market-stat"
          className="flex flex-col [gap:5px] [&_>_span]:[font-size:var(--text-xs)] [&_>_span]:[color:#66758a] [&_>_strong]:[font-size:var(--text-sm)] [&_>_strong]:font-semibold"
        >
          <span>پایین‌ترین ۲۴ ساعت</span>
          <strong>{summary ? number(summary.low) : '—'}</strong>
        </div>
        <div
          data-ui="market-stat"
          className="flex flex-col [gap:5px] [&_>_span]:[font-size:var(--text-xs)] [&_>_span]:[color:#66758a] [&_>_strong]:[font-size:var(--text-sm)] [&_>_strong]:font-semibold"
        >
          <span>حجم ۲۴ ساعت ({base})</span>
          <strong>{summary ? number(summary.volume, 2) : '—'}</strong>
        </div>
      </div>
      <div
        data-ui="trading-grid"
        className="grid [grid-template-columns:minmax(0,_1fr)_230px_280px] [gap:16px] [align-items:start] [@media(width<=640px)]:flex [@media(width<=640px)]:flex-col [@media(width<=1250px)]:[grid-template-columns:minmax(0,_1fr)_240px] [@media(width>1650px)]:[grid-template-columns:minmax(0,_1fr)_260px_300px] [@media(width<=640px)]:[&_>_[data-ui~='panel']]:[width:100%]"
      >
        <Panel appearance="trading-chart">
          <PanelTitle
            title={`نمودار معاملات ${assetName(base)}`}
            subtitle="داده‌های ثبت‌شدهٔ معاملات اخیر"
            action={
              <span
                data-ui="subtle-badge"
                className="[font-size:var(--text-xs)] [color:#9ba5b2] [padding-top:4px] [padding-right:7px] [padding-bottom:4px] [padding-left:7px] [background:#f6f8fa] [border-radius:5px] [direction:ltr]"
              >
                {symbol.replace('_', ' / ')}
              </span>
            }
          />
          <State
            loading={type === 'auction' ? auction.isPending : market.isPending}
            error={type === 'auction' ? auction.error : market.error}
            retry={() => (type === 'auction' ? auction.refetch() : market.refetch())}
            empty={!points.length}
          >
            <PriceChart height={300} data={points} />
          </State>
        </Panel>
        <Panel appearance="orderbook">
          <PanelTitle
            title="دفتر سفارش"
            action={
              <span data-ui="muted" className="[color:var(--muted)]">
                {type === 'auction' ? 'مزایده' : 'بازار'}
              </span>
            }
          />
          <div
            data-ui="book-columns"
            className="flex justify-between [font-size:var(--text-xs)] [color:#66758a] [padding-top:0] [padding-right:17px] [padding-bottom:12px] [padding-left:17px]"
          >
            <span>قیمت (تومان)</span>
            <span>مقدار ({base})</span>
          </div>
          <State
            loading={type === 'auction' ? auction.isPending : market.isPending}
            error={type === 'auction' ? auction.error : market.error}
            retry={() => (type === 'auction' ? auction.refetch() : market.refetch())}
            empty={!depth}
          >
            <div
              data-ui="book-levels sell"
              className="flex flex-col [gap:1px] [padding-right:8px] [padding-left:8px] [&_>_button]:flex [&_>_button]:justify-between [&_>_button]:[gap:10px] [&_>_button]:[font-size:var(--text-xs)] [&_>_button]:[padding-top:6px] [&_>_button]:[padding-right:9px] [&_>_button]:[padding-bottom:6px] [&_>_button]:[padding-left:9px] [&_>_button]:[background-position:left] [&_>_button]:[background-repeat:no-repeat] [&_>_button]:[border-radius:2px] [&[data-ui~='sell']_>_button]:[background-image:linear-gradient(#fdf1f2,_#fdf1f2)] [&[data-ui~='buy']_>_button]:[background-image:linear-gradient(#edf9f4,_#edf9f4)] [&[data-ui~='sell']_>_button_>_bdi:first-child]:[color:#b6495e] [&[data-ui~='buy']_>_button_>_bdi:first-child]:[color:#087d64] [&_>_button_>_bdi:last-child]:[color:#67768a]"
            >
              {depth?.asks
                .slice(0, 7)
                .reverse()
                .map((l, i) => (
                  <button
                    key={`ask-${i}`}
                    onClick={() => {
                      setPrice(formatAmountInput(l.price));
                      setType(type === 'auction' ? 'auction' : 'limit');
                    }}
                    style={{
                      backgroundSize: `${Math.min(100, 20 + (Number(l.quantity) % 80))}% 100%`,
                    }}
                    aria-label={`قیمت ${l.price}`}
                  >
                    <bdi>{number(l.price)}</bdi>
                    <bdi>{number(l.quantity, 5)}</bdi>
                  </button>
                ))}
            </div>
            <div
              data-ui="book-mid"
              className="flex justify-center items-center [gap:7px] [padding-top:15px] [padding-right:8px] [padding-bottom:15px] [padding-left:8px] [margin-top:8px] [margin-right:0] [margin-bottom:8px] [margin-left:0] [border-block:1px_solid_var(--line)] [color:var(--accent)] [&_strong]:[font-size:var(--text-base)] [&_strong]:font-semibold [&_small]:[font-size:var(--text-xs)] [&_small]:[color:var(--muted)]"
            >
              <strong>
                {type === 'auction'
                  ? number(auction.data?.book.last_price || 0)
                  : summary
                    ? number(summary.close)
                    : '—'}
              </strong>
              <ArrowLeftRight size={15} />
              <small>تومان</small>
            </div>
            <div
              data-ui="book-levels buy"
              className="flex flex-col [gap:1px] [padding-right:8px] [padding-left:8px] [&_>_button]:flex [&_>_button]:justify-between [&_>_button]:[gap:10px] [&_>_button]:[font-size:var(--text-xs)] [&_>_button]:[padding-top:6px] [&_>_button]:[padding-right:9px] [&_>_button]:[padding-bottom:6px] [&_>_button]:[padding-left:9px] [&_>_button]:[background-position:left] [&_>_button]:[background-repeat:no-repeat] [&_>_button]:[border-radius:2px] [&[data-ui~='sell']_>_button]:[background-image:linear-gradient(#fdf1f2,_#fdf1f2)] [&[data-ui~='buy']_>_button]:[background-image:linear-gradient(#edf9f4,_#edf9f4)] [&[data-ui~='sell']_>_button_>_bdi:first-child]:[color:#b6495e] [&[data-ui~='buy']_>_button_>_bdi:first-child]:[color:#087d64] [&_>_button_>_bdi:last-child]:[color:#67768a]"
            >
              {depth?.bids.slice(0, 7).map((l, i) => (
                <button
                  key={`bid-${i}`}
                  onClick={() => {
                    setPrice(formatAmountInput(l.price));
                    setType(type === 'auction' ? 'auction' : 'limit');
                  }}
                  style={{
                    backgroundSize: `${Math.min(100, 20 + (Number(l.quantity) % 80))}% 100%`,
                  }}
                  aria-label={`قیمت ${l.price}`}
                >
                  <bdi>{number(l.price)}</bdi>
                  <bdi>{number(l.quantity, 5)}</bdi>
                </button>
              ))}
            </div>
          </State>
        </Panel>
        <Panel appearance="order-entry">
          <div
            data-ui="side-switch"
            className="grid [grid-template-columns:1fr_1fr] [gap:4px] [background:#f5f7f9] [padding-top:4px] [padding-right:4px] [padding-bottom:4px] [padding-left:4px] [border-radius:8px] [&_button]:[font-size:var(--text-sm)] [&_button]:[padding-top:8px] [&_button]:[padding-right:4px] [&_button]:[padding-bottom:8px] [&_button]:[padding-left:4px] [&_button]:[color:#8c9aaa] [&_button]:[border-radius:6px] [&_[data-ui~='active'][data-ui~='buy']]:[background:#fff] [&_[data-ui~='active'][data-ui~='buy']]:[box-shadow:0_1px_5px_#15293d10] [&_[data-ui~='active'][data-ui~='buy']]:[color:var(--accent)] [&_[data-ui~='active'][data-ui~='sell']]:[background:#fff] [&_[data-ui~='active'][data-ui~='sell']]:[color:var(--red)] [&_[data-ui~='active'][data-ui~='sell']]:[box-shadow:0_1px_5px_#15293d10]"
          >
            <button {...ui(side === 'buy' ? 'active buy' : '')} onClick={() => setSide('buy')}>
              خرید {assetName(base)}
            </button>
            <button {...ui(side === 'sell' ? 'active sell' : '')} onClick={() => setSide('sell')}>
              فروش {assetName(base)}
            </button>
          </div>
          <div
            data-ui="tabs order-type-tabs"
            className="flex [gap:20px] items-center [align-self:stretch] [margin-top:9px] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--line)] justify-center [@media(width<=640px)]:[gap:30px] [@media(width<=640px)]:[max-width:100%] [@media(width<=640px)]:[overflow-x:auto] [&_>_button]:flex [&_>_button]:items-center [&_>_button]:justify-center [&_>_button]:[gap:6px] [&_>_button]:[border-bottom-width:2px] [&_>_button]:[border-bottom-style:solid] [&_>_button]:[border-bottom-color:transparent] [&_>_button]:[padding-top:12px] [&_>_button]:[padding-right:0] [&_>_button]:[padding-bottom:12px] [&_>_button]:[padding-left:0] [&_>_button]:[font-size:var(--text-sm)] [&_>_button]:[color:#93a0ae] [&_>_button]:whitespace-nowrap [&_>_button[data-ui~='active']]:[color:var(--accent)] [&_>_button[data-ui~='active']]:[border-bottom-color:var(--accent)] [&_>_button[data-ui~='active']]:font-semibold [@media(width<=640px)]:[&_>_button]:[padding-top:13px] [@media(width<=640px)]:[&_>_button]:[padding-bottom:13px] [&_button]:[font-size:var(--text-sm)]"
          >
            {(['limit', 'market', 'auction'] as const).map((t) => (
              <button key={t} {...ui(type === t ? 'active' : '')} onClick={() => setType(t)}>
                {t === 'limit' ? 'محدود' : t === 'market' ? 'قیمت بازار' : 'مزایده'}
              </button>
            ))}
          </div>
          <form noValidate onSubmit={prepare}>
            <div
              data-ui="available-row"
              className="flex justify-between [gap:5px] [margin-top:21px] [margin-right:0] [margin-bottom:16px] [margin-left:0] [font-size:var(--text-xs)] [color:#66758a] [&_strong]:font-semibold [&_strong]:[color:#6f7f90] [&_small]:[font-size:var(--text-xs)] [&_small]:[color:#66758a]"
            >
              <span>موجودی قابل استفاده</span>
              <strong>
                {number(available, side === 'buy' ? 0 : 6)}{' '}
                <small>{side === 'buy' ? 'تومان' : base}</small>
              </strong>
            </div>
            {type !== 'market' ? (
              <Field label="قیمت واحد">
                <div
                  data-ui="input-unit"
                  className="flex items-center [border-top-width:1px] [border-top-style:solid] [border-top-color:#e3e9ef] [border-right-width:1px] [border-right-style:solid] [border-right-color:#e3e9ef] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#e3e9ef] [border-left-width:1px] [border-left-style:solid] [border-left-color:#e3e9ef] [border-radius:8px] overflow-hidden [&:focus-within]:[border-top-color:var(--accent)] [&:focus-within]:[border-right-color:var(--accent)] [&:focus-within]:[border-bottom-color:var(--accent)] [&:focus-within]:[border-left-color:var(--accent)] [&:focus-within]:[box-shadow:0_0_0_3px_#079a7c0c] [&_input]:[width:100%] [&_input]:min-w-0 [&_input]:[padding-top:10px] [&_input]:[padding-right:12px] [&_input]:[padding-bottom:10px] [&_input]:[padding-left:12px] [&_input]:[border-top-width:0] [&_input]:[border-top-style:none] [&_input]:[border-top-color:currentColor] [&_input]:[border-right-width:0] [&_input]:[border-right-style:none] [&_input]:[border-right-color:currentColor] [&_input]:[border-bottom-width:0] [&_input]:[border-bottom-style:none] [&_input]:[border-bottom-color:currentColor] [&_input]:[border-left-width:0] [&_input]:[border-left-style:none] [&_input]:[border-left-color:currentColor] [&_input]:[background:none] [&_input]:[order:2] [&_input]:[font-size:var(--text-sm)] [&_span]:[font-size:var(--text-xs)] [&_span]:[color:#66758a] [&_span]:[padding-right:11px] [&_span]:[order:1] [@media(width<=640px)]:[&_input]:[font-size:var(--text-base)]"
                >
                  <input
                    dir="ltr"
                    inputMode="decimal"
                    aria-label="قیمت واحد"
                    value={price}
                    placeholder={String(reference ?? summary?.close ?? '')}
                    onChange={(e) => {
                      setPrice(formatAmountInput(e.target.value));
                      setFormError('');
                    }}
                  />
                  <span>تومان</span>
                </div>
              </Field>
            ) : (
              <div
                data-ui="market-price-notice"
                className="flex [gap:8px] items-center [padding-top:12px] [padding-right:12px] [padding-bottom:12px] [padding-left:12px] [background:#f6f9fb] [border-radius:8px] [font-size:var(--text-xs)] [color:#8e9cac] [margin-bottom:16px]"
              >
                <Info size={16} />
                سفارش با قیمت موجود در دفتر سفارش اجرا می‌شود.
              </div>
            )}
            <Field label="مقدار">
              <div
                data-ui="input-unit"
                className="flex items-center [border-top-width:1px] [border-top-style:solid] [border-top-color:#e3e9ef] [border-right-width:1px] [border-right-style:solid] [border-right-color:#e3e9ef] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#e3e9ef] [border-left-width:1px] [border-left-style:solid] [border-left-color:#e3e9ef] [border-radius:8px] overflow-hidden [&:focus-within]:[border-top-color:var(--accent)] [&:focus-within]:[border-right-color:var(--accent)] [&:focus-within]:[border-bottom-color:var(--accent)] [&:focus-within]:[border-left-color:var(--accent)] [&:focus-within]:[box-shadow:0_0_0_3px_#079a7c0c] [&_input]:[width:100%] [&_input]:min-w-0 [&_input]:[padding-top:10px] [&_input]:[padding-right:12px] [&_input]:[padding-bottom:10px] [&_input]:[padding-left:12px] [&_input]:[border-top-width:0] [&_input]:[border-top-style:none] [&_input]:[border-top-color:currentColor] [&_input]:[border-right-width:0] [&_input]:[border-right-style:none] [&_input]:[border-right-color:currentColor] [&_input]:[border-bottom-width:0] [&_input]:[border-bottom-style:none] [&_input]:[border-bottom-color:currentColor] [&_input]:[border-left-width:0] [&_input]:[border-left-style:none] [&_input]:[border-left-color:currentColor] [&_input]:[background:none] [&_input]:[order:2] [&_input]:[font-size:var(--text-sm)] [&_span]:[font-size:var(--text-xs)] [&_span]:[color:#66758a] [&_span]:[padding-right:11px] [&_span]:[order:1] [@media(width<=640px)]:[&_input]:[font-size:var(--text-base)]"
              >
                <input
                  dir="ltr"
                  inputMode="decimal"
                  aria-label="مقدار سفارش"
                  value={quantity}
                  placeholder="0.00"
                  onChange={(e) => {
                    setQuantity(formatAmountInput(e.target.value));
                    setFormError('');
                  }}
                />
                <span>{base}</span>
              </div>
            </Field>
            <div
              data-ui="amount-presets"
              className="grid [grid-template-columns:repeat(4,_1fr)] [gap:5px] [margin-top:-6px] [margin-bottom:20px] [&_button]:[background:#f7f9fb] [&_button]:[color:#95a1b0] [&_button]:[font-size:var(--text-xs)] [&_button]:[border-radius:4px] [&_button]:[padding-top:4px] [&_button]:[padding-right:0] [&_button]:[padding-bottom:4px] [&_button]:[padding-left:0] [&_button:hover]:[color:var(--accent)] [&_button:hover]:[background:var(--accent-soft)]"
            >
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    const value =
                      (available * p) / 100 / (side === 'buy' ? effectivePrice || 1 : 1);
                    const floored = Math.floor(value * 1e8) / 1e8;
                    setQuantity(formatAmountInput(floored.toFixed(8).replace(/\.?0+$/, '')));
                    setFormError('');
                  }}
                >
                  {number(p)}٪
                </button>
              ))}
            </div>
            {type === 'auction' && (
              <Field label="توضیح آگهی (اختیاری)">
                <input
                  maxLength={120}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </Field>
            )}
            <div
              data-ui="order-summary"
              className="flex justify-between [gap:5px] [padding-top:17px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [font-size:var(--text-xs)] [color:#8d9aa9] [&_[data-ui~='money']]:[font-size:var(--text-sm)] [&_[data-ui~='money']]:font-semibold [&_[data-ui~='money']]:[color:#596c7e] [&_small]:[font-size:var(--text-xs)]"
            >
              <span>ارزش تقریبی سفارش</span>
              <strong>
                <Money value={estimate} />
              </strong>
            </div>
            <p
              data-ui="order-disclaimer"
              className="[font-size:var(--text-xs)] [color:#66758a] [margin-top:12px] [margin-right:0] [margin-bottom:20px] [margin-left:0] [line-height:1.9]"
            >
              مبلغ نهایی بر اساس اجرای واقعی سفارش تعیین می‌شود.
            </p>
            {formError && (
              <p
                data-ui="inline-error"
                className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
                role="alert"
              >
                {formError}
              </p>
            )}
            <button
              type="submit"
              {...ui(`button full ${side === 'sell' ? 'sell-button' : 'primary'}`)}
              disabled={
                (type === 'auction'
                  ? auction.isPending || !!auction.error
                  : market.isPending || !!market.error) ||
                wallet.isPending ||
                !!wallet.error
              }
            >
              {side === 'buy' ? 'خرید' : 'فروش'} {assetName(base)}
            </button>
            <Link
              data-ui="fund-wallet-link"
              className="[font-size:var(--text-xs)] [color:#66758a] block text-center [margin-top:13px]"
              href="/wallet?action=deposit"
            >
              افزایش موجودی کیف پول
            </Link>
          </form>
        </Panel>
        <Panel appearance="trading-orders">
          <PanelTitle
            title="سفارش‌های باز این بازار"
            action={<MoreLink href="/orders">همهٔ سفارش‌ها</MoreLink>}
          />
          <State
            loading={orders.isPending}
            error={orders.error}
            retry={() => orders.refetch()}
            empty={
              !orders.data?.orders.some(
                (o) => o.symbol === symbol && ['open', 'partial'].includes(o.status),
              )
            }
          >
            <OrderTable
              auction={type === 'auction'}
              orders={
                orders.data?.orders.filter(
                  (o) => o.symbol === symbol && ['open', 'partial'].includes(o.status),
                ) ?? []
              }
            />
          </State>
        </Panel>
      </div>
      {type === 'auction' && (
        <AuctionOffers
          symbol={symbol}
          offers={auction.data?.offers ?? []}
          orders={auctionOrders.data?.orders ?? []}
        />
      )}
      <Modal
        open={review}
        onOpenChange={setReview}
        title="بررسی و تأیید سفارش"
        description="جزئیات سفارش را پیش از ثبت بررسی کنید."
      >
        <div
          data-ui="review-list"
          className="flex flex-col [&_>_div]:flex [&_>_div]:justify-between [&_>_div]:[gap:15px] [&_>_div]:[padding-top:15px] [&_>_div]:[padding-right:0] [&_>_div]:[padding-bottom:15px] [&_>_div]:[padding-left:0] [&_>_div]:[border-bottom-width:1px] [&_>_div]:[border-bottom-style:solid] [&_>_div]:[border-bottom-color:var(--line)] [&_>_div]:[font-size:var(--text-xs)] [&_>_div_>_span]:[color:#94a0ad] [&_strong]:[font-size:var(--text-xs)] [&_strong]:font-semibold"
        >
          <div>
            <span>بازار</span>
            <strong>{assetName(base)} / تومان</strong>
          </div>
          <div>
            <span>نوع سفارش</span>
            <strong>
              {side === 'buy' ? 'خرید' : 'فروش'} ·{' '}
              {type === 'market' ? 'قیمت بازار' : type === 'auction' ? 'مزایده' : 'محدود'}
            </strong>
          </div>
          <div>
            <span>مقدار</span>
            <strong>
              {number(quantityValue ?? '0', 8)} {base}
            </strong>
          </div>
          <div>
            <span>{type === 'market' ? 'قیمت مرجع واحد' : 'قیمت واحد'}</span>
            <Money value={effectivePrice} />
          </div>
          <div>
            <span>ارزش تقریبی</span>
            <Money value={estimate} />
          </div>
        </div>
        {demo && (
          <p
            data-ui="demo-notice"
            className="[background:#f5f8fa] [border-radius:7px] [padding-top:11px] [padding-right:11px] [padding-bottom:11px] [padding-left:11px] [font-size:var(--text-xs)] [color:#66758a] [margin-top:14px]"
          >
            این سفارش فقط در محیط نمایشی ثبت می‌شود.
          </p>
        )}
        <div
          data-ui="dialog-actions"
          className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
        >
          <button
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={() => setReview(false)}
          >
            ویرایش
          </button>
          <button
            data-ui="button primary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                if (demo) {
                  const o: Order = {
                    id: `demo-${Date.now()}`,
                    symbol,
                    side,
                    price: priceValue ?? String(effectivePrice),
                    quantity: quantityValue!,
                    filled_quantity: '0',
                    status: 'open',
                    created_at: new Date().toISOString(),
                  };
                  client.setQueryData<{ orders: Order[] }>(
                    [type === 'auction' ? 'auction-orders' : 'orders'],
                    (old) => ({ orders: [o, ...(old?.orders ?? [])] }),
                  );
                } else
                  await api(type === 'auction' ? '/auction/orders' : '/orders', {
                    method: 'POST',
                    body: {
                      symbol,
                      side,
                      ...(type === 'auction' ? { description } : { type }),
                      ...(type !== 'market' ? { price: priceValue ?? String(effectivePrice) } : {}),
                      quantity: quantityValue!,
                    },
                  });
                if (!demo) await client.invalidateQueries();
                notify(demo ? 'سفارش نمونه ثبت شد.' : 'سفارش ثبت شد.');
                setReview(false);
                setQuantity('');
              } catch (e) {
                notify(errorText(e), true);
              } finally {
                setBusy(false);
              }
            }}
          >
            {busy ? 'در حال ثبت…' : 'تأیید و ثبت سفارش'}
          </button>
        </div>
      </Modal>
    </>
  );
}
