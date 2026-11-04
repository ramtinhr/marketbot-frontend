'use client';
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
import { api, errorText } from '@/lib/api';
import { useApp } from '@/providers/app-provider';
import { assetName, number, digits } from '@/lib/format';
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
  const effectivePrice =
    type === 'market'
      ? Number(reference ?? summary?.close ?? 0)
      : Number(price || reference || summary?.close || 0);
  const available = Number(
    wallet.data?.balances.find((b) => b.asset === (side === 'buy' ? 'IRT' : base))?.available ?? 0,
  );
  const estimate = Number(quantity) * effectivePrice;
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
  const prepare = (event: React.FormEvent) => {
    event.preventDefault();
    if (
      !Number.isFinite(Number(quantity)) ||
      Number(quantity) <= 0 ||
      !Number.isFinite(effectivePrice) ||
      effectivePrice <= 0
    ) {
      setFormError('مقدار و قیمت معتبر وارد کنید.');
      return;
    }
    if ((side === 'buy' ? estimate : Number(quantity)) > available) {
      setFormError('موجودی کافی برای این سفارش ندارید.');
      return;
    }
    setFormError('');
    if (type !== 'market') setPrice(String(effectivePrice));
    setReview(true);
  };
  return (
    <>
      <div className="trading-market-header">
        <div className="pair-selector">
          <AssetLabel asset={base} />
          <span className="pair-divider" />
          <select
            aria-label="انتخاب بازار"
            value={symbol}
            onChange={(e) => location.assign(`/trade/${e.target.value}`)}
          >
            {(symbols.data?.symbols ?? [symbol]).map((s) => (
              <option key={s} value={s}>
                {s.replace('_', ' / ')}
              </option>
            ))}
          </select>
        </div>
        <div className="market-stat primary-stat">
          <strong>{summary ? <Money value={summary.close} /> : '—'}</strong>
          {summary && <Change value={summary.change_pct} />}
        </div>
        <div className="market-stat">
          <span>بالاترین ۲۴ ساعت</span>
          <strong>{summary ? number(summary.high) : '—'}</strong>
        </div>
        <div className="market-stat">
          <span>پایین‌ترین ۲۴ ساعت</span>
          <strong>{summary ? number(summary.low) : '—'}</strong>
        </div>
        <div className="market-stat">
          <span>حجم ۲۴ ساعت ({base})</span>
          <strong>{summary ? number(summary.volume, 2) : '—'}</strong>
        </div>
      </div>
      <div className="trading-grid">
        <Panel className="trading-chart">
          <PanelTitle
            title={`نمودار معاملات ${assetName(base)}`}
            subtitle="داده‌های ثبت‌شدهٔ معاملات اخیر"
            action={<span className="subtle-badge">{symbol.replace('_', ' / ')}</span>}
          />
          <State
            loading={market.isPending}
            error={market.error}
            retry={() => market.refetch()}
            empty={!points.length}
          >
            <PriceChart height={300} data={points} />
          </State>
        </Panel>
        <Panel className="orderbook">
          <PanelTitle
            title="دفتر سفارش"
            action={<span className="muted">{type === 'auction' ? 'مزایده' : 'بازار'}</span>}
          />
          <div className="book-columns">
            <span>قیمت (تومان)</span>
            <span>مقدار ({base})</span>
          </div>
          <State
            loading={type === 'auction' ? auction.isPending : market.isPending}
            error={type === 'auction' ? auction.error : market.error}
            retry={() => (type === 'auction' ? auction.refetch() : market.refetch())}
            empty={!depth}
          >
            <div className="book-levels sell">
              {depth?.asks
                .slice(0, 7)
                .reverse()
                .map((l, i) => (
                  <button
                    key={`ask-${i}`}
                    onClick={() => {
                      setPrice(l.price);
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
            <div className="book-mid">
              <strong>{summary ? number(summary.close) : '—'}</strong>
              <ArrowLeftRight size={15} />
              <small>تومان</small>
            </div>
            <div className="book-levels buy">
              {depth?.bids.slice(0, 7).map((l, i) => (
                <button
                  key={`bid-${i}`}
                  onClick={() => {
                    setPrice(l.price);
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
        <Panel className="order-entry">
          <div className="side-switch">
            <button className={side === 'buy' ? 'active buy' : ''} onClick={() => setSide('buy')}>
              خرید {assetName(base)}
            </button>
            <button
              className={side === 'sell' ? 'active sell' : ''}
              onClick={() => setSide('sell')}
            >
              فروش {assetName(base)}
            </button>
          </div>
          <div className="tabs order-type-tabs">
            {(['limit', 'market', 'auction'] as const).map((t) => (
              <button key={t} className={type === t ? 'active' : ''} onClick={() => setType(t)}>
                {t === 'limit' ? 'محدود' : t === 'market' ? 'قیمت بازار' : 'مزایده'}
              </button>
            ))}
          </div>
          <form onSubmit={prepare}>
            <div className="available-row">
              <span>موجودی قابل استفاده</span>
              <strong>
                {number(available, side === 'buy' ? 0 : 6)}{' '}
                <small>{side === 'buy' ? 'تومان' : base}</small>
              </strong>
            </div>
            {type !== 'market' ? (
              <Field label="قیمت واحد">
                <div className="input-unit">
                  <input
                    dir="ltr"
                    inputMode="decimal"
                    aria-label="قیمت واحد"
                    value={price}
                    placeholder={String(reference ?? summary?.close ?? '')}
                    onChange={(e) => setPrice(digits(e.target.value))}
                  />
                  <span>تومان</span>
                </div>
              </Field>
            ) : (
              <div className="market-price-notice">
                <Info size={16} />
                سفارش با قیمت موجود در دفتر سفارش اجرا می‌شود.
              </div>
            )}
            <Field label="مقدار">
              <div className="input-unit">
                <input
                  dir="ltr"
                  inputMode="decimal"
                  aria-label="مقدار سفارش"
                  value={quantity}
                  placeholder="0.00"
                  onChange={(e) => setQuantity(digits(e.target.value))}
                />
                <span>{base}</span>
              </div>
            </Field>
            <div className="amount-presets">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() =>
                    setQuantity(
                      String(
                        Number(
                          (
                            (available * p) /
                            100 /
                            (side === 'buy' ? effectivePrice || 1 : 1)
                          ).toFixed(8),
                        ),
                      ),
                    )
                  }
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
            <div className="order-summary">
              <span>ارزش تقریبی سفارش</span>
              <strong>
                <Money value={estimate} />
              </strong>
            </div>
            <p className="order-disclaimer">مبلغ نهایی بر اساس اجرای واقعی سفارش تعیین می‌شود.</p>
            {formError && (
              <p className="inline-error" role="alert">
                {formError}
              </p>
            )}
            <button
              type="submit"
              className={`button full ${side === 'sell' ? 'sell-button' : 'primary'}`}
              disabled={market.isPending || wallet.isPending || !!wallet.error}
            >
              {side === 'buy' ? 'خرید' : 'فروش'} {assetName(base)}
            </button>
            <Link className="fund-wallet-link" href="/wallet?action=deposit">
              افزایش موجودی کیف پول
            </Link>
          </form>
        </Panel>
        <Panel className="trading-orders">
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
      <Modal
        open={review}
        onOpenChange={setReview}
        title="بررسی و تأیید سفارش"
        description="جزئیات سفارش را پیش از ثبت بررسی کنید."
      >
        <div className="review-list">
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
              {number(quantity, 8)} {base}
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
        {demo && <p className="demo-notice">این سفارش فقط در محیط نمایشی ثبت می‌شود.</p>}
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setReview(false)}>
            ویرایش
          </button>
          <button
            className="button primary"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                if (demo) {
                  const o: Order = {
                    id: `demo-${Date.now()}`,
                    symbol,
                    side,
                    price: String(effectivePrice),
                    quantity,
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
                      ...(type !== 'market' ? { price: String(effectivePrice) } : {}),
                      quantity,
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
