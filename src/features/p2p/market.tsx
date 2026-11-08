'use client';

import { useState } from 'react';
import { ArrowLeft, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';
import { Field, Modal, Money, Panel, PanelTitle, State } from '@/components/ui';
import { api } from '@/lib/api';
import { date, number } from '@/lib/format';
import { formatAmountInput } from '@/lib/numbers';
import { tomanAmount } from '@/lib/p2p';
import { useResource } from '@/lib/use-data';
import styles from './p2p.module.css';

type Offer = { id: string; remaining: string; created_at: string };
export function P2PMarket({
  busy,
  error,
  run,
  onReserved,
}: {
  busy: boolean;
  error: string;
  run: (work: () => Promise<unknown>, success?: string) => Promise<void>;
  onReserved: () => void;
}) {
  const market = useResource<{ orders: Offer[] }>(
    'p2p-market',
    '/p2p/market',
    { orders: [] },
    5000,
  );
  const [minimum, setMinimum] = useState('');
  const [sort, setSort] = useState('newest');
  const [selected, setSelected] = useState<Offer | null>(null);
  const [amount, setAmount] = useState('');
  const floor = tomanAmount(minimum);
  const orders = (market.data?.orders ?? []).filter(
    (o) => !floor || BigInt(o.remaining) >= BigInt(floor),
  );
  if (sort !== 'newest')
    orders.sort((a, b) => {
      const comparison =
        BigInt(a.remaining) < BigInt(b.remaining)
          ? -1
          : BigInt(a.remaining) > BigInt(b.remaining)
            ? 1
            : 0;
      return sort === 'smallest' ? comparison : -comparison;
    });
  const value = tomanAmount(amount);
  const tooMuch = !!(value && selected && BigInt(value) > BigInt(selected.remaining));
  return (
    <>
      <div className={styles.guide}>
        <ShieldCheck size={24} aria-hidden="true" />
        <div>
          <strong>پرداخت مستقیم، دریافت اعتبار در ولت</strong>
          <p>
            ۱. درخواست را انتخاب کنید · ۲. به حساب مقصد واریز و فیش ثبت کنید · ۳. پس از تأیید، ولت
            شارژ می‌شود
          </p>
        </div>
      </div>
      <Panel>
        <PanelTitle
          title="درخواست‌های قابل پرداخت"
          subtitle="درخواست‌های فعال سایر کاربران؛ به‌روزرسانی خودکار هر ۵ ثانیه"
          action={
            <button
              className={styles.secondary}
              disabled={market.isFetching}
              onClick={() => void market.refetch()}
            >
              <RefreshCw size={16} aria-hidden="true" />
              به‌روزرسانی
            </button>
          }
        />
        <div className={styles.filters}>
          <Field label="حداقل مبلغ قابل پرداخت (تومان)">
            <input
              inputMode="numeric"
              placeholder="همه مبالغ"
              value={minimum}
              onChange={(e) => setMinimum(formatAmountInput(e.target.value))}
            />
          </Field>
          <Field label="مرتب‌سازی">
            <select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="newest">جدیدترین درخواست‌ها</option>
              <option value="smallest">کمترین مبلغ</option>
              <option value="largest">بیشترین مبلغ</option>
            </select>
          </Field>
          <span className={styles.count}>{number(orders.length)} درخواست</span>
        </div>
        <State loading={market.isPending} error={market.error} retry={() => void market.refetch()}>
          {orders.length === 0 ? (
            <div className={styles.empty}>
              <strong>
                {floor ? 'درخواستی با این مبلغ پیدا نشد' : 'فعلاً درخواست قابل پرداختی وجود ندارد'}
              </strong>
              <p>
                {floor
                  ? 'حداقل مبلغ را کاهش دهید یا فیلتر را پاک کنید.'
                  : 'درخواست‌های جدید به‌صورت خودکار اینجا نمایش داده می‌شوند.'}
              </p>
              {minimum && (
                <button className={styles.secondary} onClick={() => setMinimum('')}>
                  پاک‌کردن فیلتر
                </button>
              )}
            </div>
          ) : (
            <div className={styles.offers}>
              {orders.map((o) => (
                <article key={o.id} className={styles.offer}>
                  <div className={styles.offerTop}>
                    <span className={styles.available}>آماده پرداخت</span>
                    <time dateTime={o.created_at}>{date(o.created_at)}</time>
                  </div>
                  <div>
                    <span className={styles.label}>مبلغ قابل پرداخت</span>
                    <div className={styles.amount}>
                      <Money value={o.remaining} />
                    </div>
                  </div>
                  <p className={styles.caption}>امکان پرداخت تمام یا بخشی از مبلغ</p>
                  <button
                    className={styles.primary}
                    disabled={busy}
                    onClick={() => {
                      setSelected(o);
                      setAmount(formatAmountInput(o.remaining));
                    }}
                  >
                    انتخاب و پرداخت
                    <ArrowLeft size={18} aria-hidden="true" />
                  </button>
                </article>
              ))}
            </div>
          )}
        </State>
        <p className={styles.footnote}>
          <Clock3 size={16} aria-hidden="true" />
          رزرو پس از تأیید شما شروع می‌شود. اطلاعات حساب مقصد پس از رزرو نمایش داده می‌شود.
        </p>
      </Panel>
      <Modal
        open={!!selected}
        onOpenChange={(open) => {
          if (!open && !busy) setSelected(null);
        }}
        title="رزرو درخواست برای پرداخت"
        description="پس از رزرو، ۲ دقیقه برای واریز و ثبت فیش فرصت دارید."
      >
        <form
          className={styles.reserve}
          onSubmit={(e) => {
            e.preventDefault();
            if (!selected || !value || tooMuch) return;
            void run(async () => {
              await api('/p2p/reserve', {
                method: 'POST',
                body: { amount: value, offer_id: selected.id },
              });
              setSelected(null);
              onReserved();
            }, 'درخواست رزرو شد. اطلاعات واریز را بررسی و فیش را ثبت کنید.');
          }}
        >
          {error && <p role="alert">{error}</p>}
          <p>
            سقف پرداخت: <Money value={selected?.remaining ?? '0'} />
          </p>
          <Field label="مبلغ پرداخت (تومان)">
            <input
              required
              autoFocus
              inputMode="numeric"
              value={amount}
              disabled={busy}
              onChange={(e) => setAmount(formatAmountInput(e.target.value))}
            />
          </Field>
          {(tooMuch || (amount && !value)) && (
            <p role="alert">مبلغ باید عدد صحیح مثبت و حداکثر برابر مبلغ قابل پرداخت باشد.</p>
          )}
          <p className={styles.caption}>
            موجودی بازار ممکن است تغییر کند؛ رزرو نهایی هنگام تأیید بررسی می‌شود.
          </p>
          <button className={styles.primary} disabled={busy || !value || tooMuch}>
            {busy ? 'در حال رزرو…' : 'تأیید و دریافت اطلاعات واریز'}
          </button>
        </form>
      </Modal>
    </>
  );
}
