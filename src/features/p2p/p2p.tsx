'use client';
import { useEffect, useRef, useState } from 'react';
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
    <article className="p2p-card">
      <div className="p2p-card-heading">
        <strong>
          <Money value={p.amount} />
        </strong>
        <StatusBadge good={p.status === 'settled'}>{paymentLabels[p.status]}</StatusBadge>
      </div>
      <p className="muted">
        {payer ? 'پرداخت ریال و دریافت موجودی ولت' : 'دریافت ریال و انتقال موجودی ولت'}
      </p>
      <p className="p2p-instructions" dir="auto">
        {p.description}
      </p>
      {p.status === 'reserved' && payer && (
        <form
          className="form-stack"
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
          <p role="timer" className="p2p-deadline">
            مهلت واریز و ثبت فیش: {number(left)} ثانیه
          </p>
          <p className="muted">
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
          {receipt && <img className="p2p-receipt" src={receipt} alt="پیش‌نمایش فیش انتخاب‌شده" />}
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
            className="button primary"
            disabled={busy || !left || !receipt || !reference.trim()}
          >
            ثبت فیش واریز
          </button>
        </form>
      )}
      {p.receipt && (
        <details className="p2p-evidence">
          <summary>مشاهدهٔ فیش و شماره پیگیری</summary>
          <p>{p.receipt_reference}</p>
          <a href={p.receipt} target="_blank" rel="noreferrer">
            <img className="p2p-receipt" src={p.receipt} alt="فیش واریز بانکی" />
          </a>
        </details>
      )}
      {p.status === 'awaiting_confirmation' && (
        <p className="muted">
          مهلت تأیید: {p.confirmation_due_at && date(p.confirmation_due_at)}؛ پس از ۳۰ دقیقه برای
          بررسی ادمین ارسال می‌شود.
        </p>
      )}
      {p.status === 'awaiting_confirmation' && !payer && (
        <div className="dialog-actions">
          <button
            className="button primary"
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
            className="button secondary"
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
      {p.review_reason && <p className="muted">نتیجه بررسی: {p.review_reason}</p>}
      {error && (
        <p className="form-error" role="alert">
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
        ['p2p-payments', 'p2p-orders', 'wallet', 'entries'].map((key) =>
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
        <p className="form-error p2p-alert" role="alert">
          {error}
        </p>
      )}
      <div className="p2p-grid">
        <Panel className="p2p-form-panel">
          <PanelTitle
            title="درخواست دریافت ریال"
            subtitle="معادل مبلغ درخواست از موجودی ولت شما مسدود می‌شود."
          />
          <form
            className="form-stack"
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
            <small className="muted">{number([...note].length)} / ۱۲۰ نویسه</small>
            {noteLong && (
              <p className="form-error" role="alert">
                توضیحات نباید بیشتر از ۱۲۰ نویسه باشد.
              </p>
            )}
            {receive && !amount && (
              <p className="form-error" role="alert">
                مبلغ تومان باید عدد صحیح و مثبت باشد.
              </p>
            )}
            {short && (
              <p className="form-error" role="alert">
                موجودی ولت برای این درخواست کافی نیست.
              </p>
            )}
            <button
              className="button primary"
              disabled={
                busy || !amount || short || !note || noteLong || wallet.isPending || !!wallet.error
              }
            >
              ثبت درخواست و مسدودکردن موجودی
            </button>
          </form>
        </Panel>
        <Panel className="p2p-form-panel">
          <PanelTitle
            title="پرداخت ریال و شارژ ولت"
            subtitle="مبلغ می‌تواند با یک یا چند درخواست در بازار پوشش داده شود."
          />
          <form
            className="form-stack"
            onSubmit={(e) => {
              e.preventDefault();
              if (payAmount)
                void run(
                  () => api('/p2p/reserve', { method: 'POST', body: { amount: payAmount } }),
                  'فهرست درخواست‌ها برای شما رزرو شد.',
                );
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
            <p className="p2p-instructions">
              درخواست‌های این مبلغ فقط برای شما به مدت <strong>۲ دقیقه</strong> رزرو می‌شوند. برای
              هر مقصد جداگانه واریز و فیش ثبت کنید. شارژ ولت پس از تأیید دریافت وجه انجام می‌شود.
            </p>
            {pay && !payAmount && (
              <p className="form-error" role="alert">
                مبلغ تومان باید عدد صحیح و مثبت باشد.
              </p>
            )}
            <button className="button primary" disabled={busy || !payAmount}>
              نمایش و رزرو درخواست‌های قابل پرداخت
            </button>
          </form>
        </Panel>
      </div>
      <Panel className="p2p-form-panel">
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
          <div className="p2p-grid">
            {payments.data?.payments.map((p) => (
              <PaymentCard key={p.id} p={p} now={now} busy={busy} run={run} ask={ask} />
            ))}
          </div>
        </State>
      </Panel>
      <Panel className="p2p-form-panel">
        <PanelTitle title="درخواست‌های دریافت من" />
        <State
          loading={orders.isPending}
          error={orders.error}
          retry={() => void orders.refetch()}
          empty={!orders.data?.orders.length}
        >
          <div className="table-scroll">
            <table className="data-table">
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
                    <td className="p2p-instructions">{o.description}</td>
                    <td>
                      {['open', 'partial'].includes(o.status) ? (
                        <button
                          className="cancel-link"
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
      <Modal
        open={!!decision}
        onOpenChange={(open) => {
          if (!open && !busy) setDecision(null);
        }}
        title={decision?.title ?? ''}
        description={decision?.text ?? ''}
      >
        <div className="dialog-actions">
          <button className="button secondary" disabled={busy} onClick={() => setDecision(null)}>
            بازگشت
          </button>
          <button
            className="button primary"
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
