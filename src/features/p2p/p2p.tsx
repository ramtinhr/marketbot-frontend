'use client';
import { useEffect, useRef, useState } from 'react';
import { P2PMarket } from './market';
import styles from './p2p.module.css';
import { useQueryClient } from '@tanstack/react-query';
import { formatAmountInput } from '@/lib/numbers';
import { api, ApiError, errorText } from '@/lib/api';
import { fundingRequest } from '@/lib/crypto-funding';
import { useResource, useSession, useWallet } from '@/lib/use-data';
import { useApp } from '@/providers/app-provider';
import { date, number } from '@/lib/format';
import {
  paymentLabels,
  reservationSeconds,
  tomanAmount,
  validReceiptFile,
  type P2POrder,
  type P2PPayment,
} from '@/lib/p2p';
import {
  Field,
  Modal,
  Money,
  PageHeading,
  Panel,
  PanelTitle,
  State,
  StatusBadge,
} from '@/components/ui';

type Run = (work: () => Promise<unknown>, success?: string) => Promise<void>;
function PaymentCard({
  p,
  now,
  busy,
  run,
  ask,
}: {
  p: P2PPayment;
  now: number;
  busy: boolean;
  run: Run;
  ask: (title: string, text: string, work: () => Promise<unknown>) => void;
}) {
  const [receipt, setReceipt] = useState(''),
    [reference, setReference] = useState(''),
    [error, setError] = useState('');
  const left = reservationSeconds(p.expires_at, now);
  const payer = p.role === 'payer';
  function read(file?: File) {
    setError('');
    setReceipt('');
    if (!file) return;
    if (!validReceiptFile(file)) {
      setError('تصویر JPG، PNG یا WebP با حجم حداکثر ۵۳۰ کیلوبایت انتخاب کنید.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setReceipt(String(reader.result));
    reader.onerror = () => setError('خواندن تصویر ناموفق بود.');
    reader.readAsDataURL(file);
  }
  return (
    <article
      data-ui="p2p-card"
      className="[padding-top:20px] [padding-right:20px] [padding-bottom:20px] [padding-left:20px] [border-top-width:1px] [border-top-style:solid] [border-top-color:#e8edf0] [border-right-width:1px] [border-right-style:solid] [border-right-color:#e8edf0] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#e8edf0] [border-left-width:1px] [border-left-style:solid] [border-left-color:#e8edf0] [border-radius:16px] flex flex-col [gap:14px] min-w-0"
    >
      <div
        data-ui="p2p-card-heading"
        className="flex justify-between items-center flex-wrap [gap:12px]"
      >
        <strong>
          <Money value={p.amount} />
        </strong>
        <StatusBadge good={p.status === 'settled'}>{paymentLabels[p.status]}</StatusBadge>
      </div>
      <p data-ui="muted" className="[color:var(--muted)]">
        {payer ? 'پرداخت ریال و دریافت موجودی ولت' : 'دریافت ریال و انتقال موجودی ولت'}
      </p>
      <p
        data-ui="p2p-instructions"
        className="[white-space:pre-wrap] [overflow-wrap:anywhere] [line-height:2]"
        dir="auto"
      >
        {p.description}
      </p>
      {p.status === 'reserved' && payer && (
        <form
          data-ui="form-stack"
          className="flex flex-col [gap:19px]"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () =>
                api(`/p2p/payments/${p.id}/receipt`, {
                  method: 'POST',
                  body: { receipt, reference },
                }),
              'فیش برای بررسی دریافت‌کننده ثبت شد.',
            );
          }}
        >
          <p role="timer" data-ui="p2p-deadline" className="[color:#a76213] font-bold tabular-nums">
            مهلت واریز و ثبت فیش: {number(left)} ثانیه
          </p>
          <p data-ui="muted" className="[color:var(--muted)]">
            پس از پایان مهلت واریز نکنید. هر درخواست، مقصد و فیش جداگانه دارد.
          </p>
          <Field label="تصویر فیش">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={busy || !left}
              onChange={(e) => read(e.target.files?.[0])}
            />
          </Field>
          {receipt && (
            <img
              data-ui="p2p-receipt"
              className="[max-width:100%] [max-height:320px] [object-fit:contain] block [margin-top:12px]"
              src={receipt}
              alt="پیش‌نمایش فیش انتخاب‌شده"
            />
          )}
          <Field label="شماره پیگیری بانکی">
            <input
              required
              maxLength={120}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              disabled={busy || !left}
            />
          </Field>
          <button
            data-ui="button primary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={busy || !left || !receipt || !reference.trim()}
          >
            ثبت فیش واریز
          </button>
        </form>
      )}
      {p.receipt && (
        <details
          data-ui="p2p-evidence"
          className="[&_summary]:[cursor:pointer] [&_summary]:[color:#16826b]"
        >
          <summary>مشاهدهٔ فیش و شماره پیگیری</summary>
          <p>{p.receipt_reference}</p>
          <a href={p.receipt} target="_blank" rel="noreferrer">
            <img
              data-ui="p2p-receipt"
              className="[max-width:100%] [max-height:320px] [object-fit:contain] block [margin-top:12px]"
              src={p.receipt}
              alt="فیش واریز بانکی"
            />
          </a>
        </details>
      )}
      {p.status === 'awaiting_confirmation' && (
        <p data-ui="muted" className="[color:var(--muted)]">
          مهلت تأیید: {p.confirmation_due_at && date(p.confirmation_due_at)}؛ پس از ۳۰ دقیقه برای
          بررسی ادمین ارسال می‌شود.
        </p>
      )}
      {p.status === 'awaiting_confirmation' && !payer && (
        <div
          data-ui="dialog-actions"
          className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
        >
          <button
            data-ui="button primary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={busy}
            onClick={() =>
              ask(
                'تأیید دریافت وجه',
                'واریز را در حساب بانکی خود بررسی کنید. با تأیید، مبلغ مسدودشده به ولت پرداخت‌کننده منتقل می‌شود.',
                () => api(`/p2p/payments/${p.id}/confirm`, { method: 'POST' }),
              )
            }
          >
            وجه را دریافت کردم
          </button>
          <button
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={busy}
            onClick={() =>
              ask(
                'ارجاع به ادمین',
                'وجه دریافت نشده یا فیش نیاز به بررسی دارد؟ مبلغ تا تصمیم ادمین مسدود می‌ماند.',
                () => api(`/p2p/payments/${p.id}/dispute`, { method: 'POST' }),
              )
            }
          >
            اعتراض / دریافت نکردم
          </button>
        </div>
      )}
      {p.review_reason && (
        <p data-ui="muted" className="[color:var(--muted)]">
          نتیجه بررسی: {p.review_reason}
        </p>
      )}
      {error && (
        <p
          data-ui="form-error"
          className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
          role="alert"
        >
          {error}
        </p>
      )}
    </article>
  );
}

export function P2PPage() {
  const { demo, notify } = useApp();
  const client = useQueryClient(),
    wallet = useWallet(),
    session = useSession();
  const payments = useResource<{ payments: P2PPayment[] }>(
    'p2p-payments',
    '/p2p/payments',
    { payments: [] },
    5000,
  );
  const orders = useResource<{ orders: P2POrder[] }>(
    'p2p-orders',
    '/p2p/orders',
    { orders: [] },
    5000,
  );
  const [view, setView] = useState<'market' | 'create' | 'activity'>('market');
  const [receive, setReceive] = useState(''),
    [pay, setPay] = useState(''),
    [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [now, setNow] = useState(Date.now());
  const [decision, setDecision] = useState<{
    title: string;
    text: string;
    work: () => Promise<unknown>;
  } | null>(null);
  const submitting = useRef(false);
  const available = wallet.data?.balances.find((b) => b.asset === 'IRT')?.available ?? '0';
  const signature = payments.data?.payments.map((p) => `${p.id}:${p.status}`).join('|');
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    void client.invalidateQueries({ queryKey: ['wallet'] });
    void client.invalidateQueries({ queryKey: ['entries'] });
  }, [signature, client]);
  const run: Run = async (work, success = 'تغییرات ثبت شد.') => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError('');
    try {
      if (demo) throw new ApiError('demo_readonly', 403);
      await work();
      await Promise.all(
        ['p2p-payments', 'p2p-orders', 'p2p-market', 'wallet', 'entries'].map((key) =>
          client.invalidateQueries({ queryKey: [key] }),
        ),
      );
      notify(success);
    } catch (e) {
      setError(errorText(e));
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  const ask = (title: string, text: string, work: () => Promise<unknown>) =>
    setDecision({ title, text, work });
  const amount = tomanAmount(receive),
    payAmount = tomanAmount(pay);
  const short = amount ? BigInt(amount) > BigInt(available.split('.')[0]) : false;
  const note = description.replace(/\s+/g, ' ').trim(),
    noteLong = [...note].length > 120;
  return (
    <>
      <PageHeading
        title="همتا به همتا"
        description="دریافت ریال در حساب بانکی یا پرداخت ریال و دریافت معادل آن در کیف پول؛ با ثبت فیش و تأیید دریافت وجه."
      />
      {error && (
        <p
          data-ui="form-error p2p-alert"
          className="[margin-bottom:20px] [font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
          role="alert"
        >
          {error}
        </p>
      )}
      <nav className={styles.navigation} aria-label="بخش‌های همتا به همتا">
        {(
          [
            ['market', 'بازار درخواست‌ها'],
            ['create', 'ثبت درخواست دریافت'],
            ['activity', 'درخواست‌ها و پرداخت‌های من'],
          ] as const
        ).map(([key, label]) => (
          <button key={key} aria-pressed={view === key} onClick={() => setView(key)}>
            {label}
          </button>
        ))}
      </nav>
      {view === 'market' && (
        <P2PMarket busy={busy} error={error} run={run} onReserved={() => setView('activity')} />
      )}
      <div hidden={view !== 'create'}>
        <div
          data-ui="p2p-grid"
          className="grid [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:20px] [margin-bottom:24px] [@media(width<=900px)]:[grid-template-columns:1fr] [&_>_[data-ui~='p2p-form-panel']]:[margin-bottom:0]"
        >
          <Panel appearance="p2p-form-panel">
            <PanelTitle
              title="درخواست دریافت ریال"
              subtitle="معادل مبلغ درخواست از موجودی ولت شما مسدود می‌شود."
            />
            <form
              data-ui="form-stack"
              className="flex flex-col [gap:19px]"
              onSubmit={(e) => {
                e.preventDefault();
                if (!amount || short || !note || noteLong) return;
                void run(async () => {
                  if (!session.data) throw new ApiError('unauthorized', 401);
                  await fundingRequest(String(session.data.user.id), '/p2p/orders', {
                    amount,
                    description: note,
                  });
                  setReceive('');
                  setDescription('');
                  setView('activity');
                }, 'درخواست دریافت ریال ثبت و مبلغ در ولت مسدود شد.');
              }}
            >
              <Field
                label="مبلغ دریافت (تومان)"
                hint={`موجودی قابل استفاده: ${number(available)} تومان`}
              >
                <input
                  required
                  inputMode="numeric"
                  value={receive}
                  onChange={(e) => setReceive(formatAmountInput(e.target.value))}
                  disabled={busy}
                />
              </Field>
              <Field
                label="محل دریافت و اطلاعات واریز (الزامی)"
                hint="نام صاحب حساب، شماره حساب یا کارت و توضیحات لازم برای پرداخت را بنویسید."
              >
                <textarea
                  required
                  maxLength={140}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={busy}
                />
              </Field>
              <small data-ui="muted" className="[color:var(--muted)]">
                {number([...note].length)} / ۱۲۰ نویسه
              </small>
              {noteLong && (
                <p
                  data-ui="form-error"
                  className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
                  role="alert"
                >
                  توضیحات نباید بیشتر از ۱۲۰ نویسه باشد.
                </p>
              )}
              {receive && !amount && (
                <p
                  data-ui="form-error"
                  className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
                  role="alert"
                >
                  مبلغ تومان باید عدد صحیح و مثبت باشد.
                </p>
              )}
              {short && (
                <p
                  data-ui="form-error"
                  className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
                  role="alert"
                >
                  موجودی ولت برای این درخواست کافی نیست.
                </p>
              )}
              <button
                data-ui="button primary"
                className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
                disabled={
                  busy ||
                  !amount ||
                  short ||
                  !note ||
                  noteLong ||
                  wallet.isPending ||
                  !!wallet.error
                }
              >
                ثبت درخواست و مسدودکردن موجودی
              </button>
            </form>
          </Panel>
          <Panel appearance="p2p-form-panel">
            <PanelTitle
              title="پرداخت ریال و شارژ ولت"
              subtitle="مبلغ می‌تواند با یک یا چند درخواست در بازار پوشش داده شود."
            />
            <form
              data-ui="form-stack"
              className="flex flex-col [gap:19px]"
              onSubmit={(e) => {
                e.preventDefault();
                if (payAmount)
                  void run(async () => {
                    await api('/p2p/reserve', { method: 'POST', body: { amount: payAmount } });
                    setView('activity');
                  }, 'فهرست درخواست‌ها برای شما رزرو شد.');
              }}
            >
              <Field label="مبلغی که پرداخت می‌کنید (تومان)">
                <input
                  required
                  inputMode="numeric"
                  value={pay}
                  onChange={(e) => setPay(formatAmountInput(e.target.value))}
                  disabled={busy}
                />
              </Field>
              <p
                data-ui="p2p-instructions"
                className="[white-space:pre-wrap] [overflow-wrap:anywhere] [line-height:2]"
              >
                درخواست‌های این مبلغ فقط برای شما به مدت <strong>۲ دقیقه</strong> رزرو می‌شوند. برای
                هر مقصد جداگانه واریز و فیش ثبت کنید. شارژ ولت پس از تأیید دریافت وجه انجام می‌شود.
              </p>
              {pay && !payAmount && (
                <p
                  data-ui="form-error"
                  className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
                  role="alert"
                >
                  مبلغ تومان باید عدد صحیح و مثبت باشد.
                </p>
              )}
              <button
                data-ui="button primary"
                className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
                disabled={busy || !payAmount}
              >
                نمایش و رزرو درخواست‌های قابل پرداخت
              </button>
            </form>
          </Panel>
        </div>
      </div>
      <div hidden={view !== 'activity'}>
        <Panel appearance="p2p-form-panel">
          <PanelTitle
            title="پرداخت‌ها و دریافت‌های من"
            subtitle="رزروها، فیش‌ها و نتیجهٔ بررسی دریافت‌کننده یا ادمین"
          />
          <State
            loading={payments.isPending}
            error={payments.error}
            retry={() => void payments.refetch()}
            empty={!payments.data?.payments.length}
          >
            <div
              data-ui="p2p-grid"
              className="grid [grid-template-columns:repeat(2,_minmax(0,_1fr))] [gap:20px] [margin-bottom:24px] [@media(width<=900px)]:[grid-template-columns:1fr] [&_>_[data-ui~='p2p-form-panel']]:[margin-bottom:0]"
            >
              {payments.data?.payments.map((p) => (
                <PaymentCard key={p.id} p={p} now={now} busy={busy} run={run} ask={ask} />
              ))}
            </div>
          </State>
        </Panel>
        <Panel appearance="p2p-form-panel">
          <PanelTitle title="درخواست‌های دریافت من" />
          <State
            loading={orders.isPending}
            error={orders.error}
            retry={() => void orders.refetch()}
            empty={!orders.data?.orders.length}
          >
            <div data-ui="table-scroll" className="[overflow-x:auto]">
              <table
                data-ui="data-table"
                className="[border-collapse:collapse] [width:100%] whitespace-nowrap text-right [@media(width<=640px)]:[min-width:520px] [&_th]:[font-size:var(--text-xs)] [&_th]:font-semibold [&_th]:[color:#66758a] [&_th]:[padding-top:12px] [&_th]:[padding-right:19px] [&_th]:[padding-bottom:12px] [&_th]:[padding-left:19px] [&_th]:[background:#fcfcfd] [&_th]:[border-top-width:1px] [&_th]:[border-top-style:solid] [&_th]:[border-top-color:#f0f2f5] [&_th]:[border-bottom-width:1px] [&_th]:[border-bottom-style:solid] [&_th]:[border-bottom-color:#f0f2f5] [&_td]:[padding-top:var(--space-4)] [&_td]:[padding-right:var(--space-5)] [&_td]:[padding-bottom:var(--space-4)] [&_td]:[padding-left:var(--space-5)] [&_td]:[font-size:var(--text-sm)]! [&_td]:[border-bottom-width:1px] [&_td]:[border-bottom-style:solid] [&_td]:[border-bottom-color:#f0f2f5] [&_td]:[color:#566273] [&_tbody_tr:last-child_td]:[border-bottom-width:0] [&_tbody_tr:last-child_td]:[border-bottom-style:none] [&_tbody_tr:last-child_td]:[border-bottom-color:currentColor] [&_tbody_tr:hover]:[background:#fcfdfd] [&_td_[data-ui~='money']]:[color:#3a4859] [&_td_[data-ui~='money']]:[font-size:var(--text-sm)]! [&_td_[data-ui~='money']]:font-medium [&_td_small]:[font-size:var(--text-xs)] [&_td_small]:[color:#66758a] [@media(width>1650px)]:[&_td]:[padding-top:20px] [@media(width>1650px)]:[&_td]:[padding-bottom:20px]"
              >
                <thead>
                  <tr>
                    <th>مبلغ درخواست</th>
                    <th>باقی‌مانده</th>
                    <th>مسدود</th>
                    <th>اطلاعات واریز</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.data?.orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <Money value={o.amount} />
                      </td>
                      <td>
                        <Money value={o.remaining} />
                      </td>
                      <td>
                        <Money value={o.held} />
                      </td>
                      <td
                        data-ui="p2p-instructions"
                        className="[white-space:pre-wrap] [overflow-wrap:anywhere] [line-height:2]"
                      >
                        {o.description}
                      </td>
                      <td>
                        {['open', 'partial'].includes(o.status) ? (
                          <button
                            data-ui="cancel-link"
                            className="[color:#b74658] [font-size:var(--text-xs)] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0]"
                            disabled={busy}
                            onClick={() =>
                              ask(
                                'لغو درخواست',
                                'در صورت نداشتن پرداخت در انتظار بررسی، درخواست لغو و موجودی باقی‌مانده آزاد می‌شود.',
                                () => api(`/p2p/orders/${o.id}/cancel`, { method: 'POST' }),
                              )
                            }
                          >
                            لغو درخواست
                          </button>
                        ) : o.status === 'cancelled' ? (
                          'لغوشده'
                        ) : (
                          'تخصیص کامل'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </State>
        </Panel>
      </div>
      <Modal
        open={!!decision}
        size="compact"
        onOpenChange={(open) => {
          if (!open && !busy) setDecision(null);
        }}
        title={decision?.title ?? ''}
        description={decision?.text ?? ''}
      >
        <div
          data-ui="dialog-actions"
          className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
        >
          <button
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={busy}
            onClick={() => setDecision(null)}
          >
            بازگشت
          </button>
          <button
            data-ui="button primary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={busy}
            onClick={() => {
              if (decision)
                void run(async () => {
                  await decision.work();
                  setDecision(null);
                });
            }}
          >
            تأیید
          </button>
        </div>
      </Modal>
    </>
  );
}
