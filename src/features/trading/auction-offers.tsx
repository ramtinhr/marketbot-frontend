'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Field, Modal, Money, Panel, PanelTitle } from '@/components/ui';
import { api, errorText } from '@/lib/api';
import { number } from '@/lib/format';
import { decimalUnits, formatAmountInput, parseDecimal } from '@/lib/numbers';
import { useApp } from '@/providers/app-provider';
import type { Auction, Order } from '@/lib/types';

type Offer = Auction['offers'][number];
export function AuctionOffers({
  offers,
  orders,
  symbol,
}: {
  offers: Offer[];
  orders: Order[];
  symbol: string;
}) {
  const [selected, setSelected] = useState<Offer | null>(null);
  const [quantity, setQuantity] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const { demo, notify } = useApp();
  const client = useQueryClient();
  const amount = parseDecimal(quantity, 8);
  return (
    <Panel>
      <PanelTitle title="آگهی‌های مزایده" subtitle="معامله با همان آگهی و به قیمت درج‌شده" />
      <div className="space-y-3 p-4">
        {!offers.length && <p>هنوز آگهی بازی در این بازار وجود ندارد.</p>}
        {offers.map((offer) => {
          const own = orders.some((o) => o.id === offer.id);
          return (
            <div key={offer.id} className="rounded-lg border border-slate-200 p-4 space-y-2">
              <p>
                {offer.side === 'buy' ? 'خرید' : 'فروش'} {number(offer.remaining, 8)}{' '}
                {symbol.split('_')[0]} · <Money value={offer.price} />
              </p>
              {offer.description && <p className="text-sm text-slate-500">{offer.description}</p>}
              {own ? (
                <span>آگهی من · برای حذف از فهرست سفارش‌های باز استفاده کنید.</span>
              ) : (
                <button
                  className="text-emerald-700"
                  onClick={() => {
                    setSelected(offer);
                    setQuantity('');
                    setError('');
                  }}
                >
                  {offer.side === 'sell' ? 'از او می‌خرم' : 'به او می‌فروشم'}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Modal
        open={!!selected}
        onOpenChange={(open) => {
          if (!busy && !open) setSelected(null);
        }}
        title="تأیید معاملهٔ آگهی"
        description="این معامله فقط با آگهی انتخاب‌شده انجام می‌شود."
      >
        {selected && (
          <div className="space-y-4">
            <p>
              قیمت واحد: <Money value={selected.price} /> · مقدار باقی‌مانده:{' '}
              {number(selected.remaining, 8)}
            </p>
            <Field label="مقدار">
              <input
                dir="ltr"
                inputMode="decimal"
                value={quantity}
                onChange={(e) => setQuantity(formatAmountInput(e.target.value))}
              />
            </Field>
            <p>
              ارزش معامله: <Money value={Number(amount || 0) * Number(selected.price)} />
            </p>
            {error && <p role="alert">{error}</p>}
            <button
              data-ui="button primary"
              disabled={busy || demo}
              onClick={async () => {
                if (
                  !amount ||
                  decimalUnits(amount, 8)! > (decimalUnits(selected.remaining, 8) || 0n)
                ) {
                  setError('مقدار معتبر و حداکثر برابر با مقدار باقی‌مانده وارد کنید.');
                  return;
                }
                setBusy(true);
                try {
                  await api(`/auction/offers/${encodeURIComponent(selected.id)}/take`, {
                    method: 'POST',
                    body: { quantity: amount },
                  });
                  await client.invalidateQueries();
                  setSelected(null);
                  notify('معامله انجام شد.');
                } catch (e) {
                  setError(errorText(e));
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? 'در حال انجام…' : 'تأیید معامله'}
            </button>
          </div>
        )}
      </Modal>
    </Panel>
  );
}
