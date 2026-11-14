'use client';
import { walletAddressError } from '@/lib/wallet-address';
import { VerificationCodeInput } from '@/components/verification-code-input';
import { Select, SelectOption } from '@/components/select';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { parseDecimal, decimalUnits, formatAmountInput } from '@/lib/numbers';
import { api, errorText } from '@/lib/api';
import { useBanks, useResource, useWallet, useSession } from '@/lib/use-data';
import { useApp } from '@/providers/app-provider';
import { assetName, digits, number } from '@/lib/format';
import { validIban } from '@/lib/validation';
import { Field, Modal, Money } from '@/components/ui';
import { CryptoWalletActions } from './crypto-actions';
import { useCryptoAssets } from '@/lib/use-data';
import { fundingRequest } from '@/lib/crypto-funding';
import type { Payment, PaymentConfig } from '@/lib/payments';
import type { Withdrawal } from '@/lib/types';
const MIN_WITHDRAWAL_TOMAN = 5000;

function FiatWalletActions({
  action,
  onClose,
  initialAsset = 'IRT',
  onAssetChange,
  assetOptions,
}: {
  action: 'deposit' | 'withdraw' | null;
  onClose: () => void;
  initialAsset?: string;
  onAssetChange: (asset: string) => void;
  assetOptions: string[];
}) {
  const { demo, notify } = useApp();
  const wallet = useWallet();
  const session = useSession();
  const [provider, setProvider] = useState('');
  const banks = useBanks();
  const [asset, setAsset] = useState(initialAsset);
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [beneficiary, setBeneficiary] = useState('');
  const [bank, setBank] = useState('other');
  const [network, setNetwork] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  const charge = useResource<PaymentConfig>(
    'charge-info',
    '/payments/config',
    { min_toman: 10000, max_toman: 100000000, providers: [], default_provider: null },
    60000,
  );
  const withdrawals = useResource<{
    networks: Record<string, string[]>;
    withdrawals: Withdrawal[];
  }>('withdrawals', '/wallet/withdrawals', {
    networks: { USDT: ['TRC20', 'ERC20'], BTC: ['BTC'], ETH: ['ERC20'], TON: ['TON'] },
    withdrawals: [],
  });
  useEffect(() => {
    setAsset(initialAsset);
  }, [initialAsset, action]);
  useEffect(() => {
    if (!resendAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt]);
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const balance = wallet.data?.balances.find((b) => b.asset === asset)?.available ?? '0';
  const networks = withdrawals.data?.networks[asset] ?? [];
  const sendCode = async () => {
    setBusy(true);
    setError('');
    try {
      if (demo) throw new Error('demo');
      const res = await api<{ resend_in: number }>('/wallet/withdrawals/otp', { method: 'POST' });
      setCode('');
      setNow(Date.now());
      setResendAt(Date.now() + res.resend_in * 1000);
      setStep(2);
    } catch (e) {
      setError(demo ? 'در محیط نمایشی پیامک واقعی ارسال نمی‌شود.' : errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setError('');
    const canonical = parseDecimal(amount, asset === 'IRT' || action === 'deposit' ? 0 : 8);
    const value = Number(canonical);
    if (!canonical) {
      setError(
        asset === 'IRT' || action === 'deposit'
          ? 'مبلغ تومان باید عدد صحیح و مثبت باشد.'
          : 'مقدار مثبت با حداکثر ۸ رقم اعشار وارد کنید.',
      );
      return;
    }
    if (action === 'deposit') {
      if (
        !Number.isInteger(value) ||
        !charge.data ||
        value < charge.data.min_toman ||
        value > charge.data.max_toman
      ) {
        setError('مبلغ باید در بازهٔ مجاز درگاه باشد.');
        return;
      }
      setBusy(true);
      try {
        if (demo) {
          setError('در محیط نمایشی درگاه پرداخت باز نمی‌شود.');
          return;
        }
        if (!session.data?.user.id) throw new Error('no session');
        const result = await fundingRequest<{ payment: Payment }>(
          String(session.data.user.id),
          '/payments',
          {
            amount: canonical,
            provider: provider || charge.data.default_provider,
          },
        );
        if (!result.payment.url) throw new Error('no checkout URL');
        const url = new URL(result.payment.url);
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error('invalid gateway');
        location.assign(url.toString());
      } catch (e) {
        setError(errorText(e));
      } finally {
        setBusy(false);
      }
      return;
    }
    if (asset === 'IRT' && !Number.isInteger(value)) {
      setError('مبلغ تومان باید عدد صحیح باشد.');
      return;
    }
    if (asset === 'IRT' && value < MIN_WITHDRAWAL_TOMAN) {
      setError('حداقل برداشت ۵٬۰۰۰ تومان (۵۰٬۰۰۰ ریال) است.');
      return;
    }
    if (decimalUnits(canonical)! > (decimalUnits(String(balance)) ?? 0n)) {
      setError('مقدار از موجودی قابل استفاده بیشتر است.');
      return;
    }
    if (asset === 'IRT' && bank === 'other' && (!validIban(destination) || !beneficiary.trim())) {
      setError('نام صاحب حساب و شمارهٔ شبای معتبر وارد کنید.');
      return;
    }
    if (asset !== 'IRT' && (!destination.trim() || !(network || networks[0]))) {
      setError('آدرس و شبکهٔ مقصد را وارد کنید.');
      return;
    }
    if (asset !== 'IRT') {
      const addressError = walletAddressError(network || networks[0], destination);
      if (addressError) {
        setError(addressError);
        return;
      }
    }
    if (step === 1) {
      if (resendAt > Date.now()) setStep(2);
      else await sendCode();
      return;
    }
    if (!/^\d{6}$/.test(digits(code))) {
      setError('کد تأیید باید ۶ رقم باشد.');
      return;
    }
    setBusy(true);
    try {
      await api('/wallet/withdrawals', {
        method: 'POST',
        body: {
          asset,
          amount: canonical,
          network: asset === 'IRT' ? null : network || networks[0],
          code: digits(code),
          ...(asset === 'IRT' && bank !== 'other'
            ? { recipient_type: 'saved', bank_account_id: bank }
            : {
                destination: asset === 'IRT' ? destination : destination.trim(),
                ...(asset === 'IRT'
                  ? { recipient_type: 'other', beneficiary_name: beneficiary }
                  : {}),
              }),
        },
      });
      notify('درخواست برداشت ثبت شد و برای بررسی در انتظار است.');
      await wallet.refetch();
      await withdrawals.refetch();
      onClose();
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      open={!!action}
      onOpenChange={(open) => !open && onClose()}
      title={action === 'deposit' ? 'افزایش موجودی تومان' : 'درخواست برداشت'}
      description={
        action === 'deposit'
          ? 'مبلغ را وارد کنید و از طریق درگاه بانکی پرداخت کنید.'
          : 'برداشت پس از تأیید پیامکی ثبت می‌شود و برای بررسی در انتظار می‌ماند.'
      }
    >
      <form noValidate data-ui="form-stack" className="flex flex-col [gap:19px]" onSubmit={submit}>
        {step === 1 ? (
          <>
            {
              <Field label="دارایی">
                <Select
                  value={asset}
                  onValueChange={(value) => {
                    onAssetChange(value);
                    setAsset(value);
                    setNetwork('');
                  }}
                >
                  {assetOptions.map((a) => (
                    <SelectOption key={a} value={a}>
                      {assetName(a)} · {a}
                    </SelectOption>
                  ))}
                </Select>
              </Field>
            }
            {action === 'deposit' && (
              <Field label="درگاه پرداخت">
                <Select
                  value={provider || charge.data?.default_provider || ''}
                  onValueChange={(value) => setProvider(value)}
                >
                  {charge.data?.providers.map((p) => (
                    <SelectOption key={p.id} value={p.id}>
                      {p.id === 'payment_intents' ? 'درگاه بانکی' : p.id}
                    </SelectOption>
                  ))}
                </Select>
                {charge.error && (
                  <p
                    data-ui="inline-error"
                    className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
                    role="alert"
                  >
                    {errorText(charge.error)}
                  </p>
                )}
                {!charge.isPending && !charge.error && !charge.data?.providers.length && (
                  <p role="status">درگاه بانکی هنوز فعال نشده است.</p>
                )}
              </Field>
            )}
            <Field
              label={
                action === 'deposit'
                  ? 'مبلغ (تومان)'
                  : `مقدار (${asset === 'IRT' ? 'تومان' : asset})`
              }
              hint={
                action === 'deposit' && charge.data
                  ? `از ${number(charge.data.min_toman)} تا ${number(charge.data.max_toman)} تومان`
                  : `موجودی قابل برداشت: ${number(balance, 8)} ${assetName(asset)}${asset === 'IRT' ? ' · حداقل برداشت: ۵٬۰۰۰ تومان (۵۰٬۰۰۰ ریال)' : ''}`
              }
            >
              <input
                required
                dir="ltr"
                inputMode={asset === 'IRT' ? 'numeric' : 'decimal'}
                value={amount}
                onChange={(e) => setAmount(formatAmountInput(e.target.value))}
              />
            </Field>
            {action === 'withdraw' &&
              (asset === 'IRT' ? (
                <>
                  <Field label="حساب مقصد">
                    <Select value={bank} onValueChange={(value) => setBank(value)}>
                      <SelectOption value="other">وارد کردن حساب مقصد</SelectOption>
                      {banks.data?.accounts.map((b) => (
                        <SelectOption key={b.id} value={b.id}>
                          {b.label} · {b.holder_name}
                        </SelectOption>
                      ))}
                    </Select>
                  </Field>
                  {bank === 'other' && (
                    <>
                      <Field label="نام صاحب حساب">
                        <input
                          required
                          value={beneficiary}
                          onChange={(e) => setBeneficiary(e.target.value)}
                        />
                      </Field>
                      <Field label="شمارهٔ شبا">
                        <input
                          required
                          dir="ltr"
                          placeholder="IR…"
                          value={destination}
                          onChange={(e) => setDestination(digits(e.target.value))}
                        />
                      </Field>
                    </>
                  )}
                  <Link
                    data-ui="text-link"
                    className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
                    href="/bank-accounts"
                    onClick={onClose}
                  >
                    مدیریت حساب‌های بانکی
                  </Link>
                </>
              ) : (
                <>
                  <Field label="شبکهٔ برداشت">
                    <Select
                      required
                      value={network || networks[0] || ''}
                      onValueChange={(value) => setNetwork(value)}
                    >
                      {networks.map((n) => (
                        <SelectOption key={n} value={n}>
                          {n}
                        </SelectOption>
                      ))}
                    </Select>
                  </Field>
                  <Field label="آدرس مقصد" hint="شبکهٔ مقصد باید با شبکهٔ برداشت یکسان باشد.">
                    <input
                      required
                      dir="ltr"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                    />
                  </Field>
                </>
              ))}
          </>
        ) : (
          <>
            <div
              data-ui="security-message"
              className="flex items-center [gap:12px] [color:var(--accent)] [&_strong]:[font-size:var(--text-sm)] [&_p]:[font-size:var(--text-xs)] [&_p]:[color:#9aa7b2] [&_p]:[margin-top:4px]"
            >
              <ShieldCheck size={24} />
              <div>
                <strong>تأیید درخواست برداشت</strong>
                <p>کد پیامکی را برای ثبت درخواست وارد کنید.</p>
              </div>
            </div>
            <div
              data-ui="review-list"
              className="flex flex-col [&_>_div]:flex [&_>_div]:justify-between [&_>_div]:[gap:15px] [&_>_div]:[padding-top:15px] [&_>_div]:[padding-right:0] [&_>_div]:[padding-bottom:15px] [&_>_div]:[padding-left:0] [&_>_div]:[border-bottom-width:1px] [&_>_div]:[border-bottom-style:solid] [&_>_div]:[border-bottom-color:var(--line)] [&_>_div]:[font-size:var(--text-xs)] [&_>_div_>_span]:[color:#94a0ad] [&_strong]:[font-size:var(--text-xs)] [&_strong]:font-semibold"
            >
              <div>
                <span>مقدار برداشت</span>
                <Money
                  value={parseDecimal(amount, 8) ?? '0'}
                  unit={asset === 'IRT' ? 'تومان' : asset}
                  decimals={8}
                />
              </div>
            </div>
            <div
              data-ui="review-list"
              className="flex flex-col [&_>_div]:flex [&_>_div]:justify-between [&_>_div]:[gap:15px] [&_>_div]:[padding-top:15px] [&_>_div]:[padding-right:0] [&_>_div]:[padding-bottom:15px] [&_>_div]:[padding-left:0] [&_>_div]:[border-bottom-width:1px] [&_>_div]:[border-bottom-style:solid] [&_>_div]:[border-bottom-color:var(--line)] [&_>_div]:[font-size:var(--text-xs)] [&_>_div_>_span]:[color:#94a0ad] [&_strong]:[font-size:var(--text-xs)] [&_strong]:font-semibold"
            >
              <div>
                <span>مقصد برداشت</span>
                <bdi
                  data-ui="destination-cell"
                  className="block [min-width:0] text-left [overflow-wrap:anywhere]"
                >
                  {asset === 'IRT' && bank !== 'other'
                    ? banks.data?.accounts.find((b) => b.id === bank)?.iban
                    : destination}
                </bdi>
              </div>
              {asset === 'IRT' ? (
                <div>
                  <span>صاحب حساب</span>
                  <strong>
                    {bank !== 'other'
                      ? banks.data?.accounts.find((b) => b.id === bank)?.holder_name
                      : beneficiary}
                  </strong>
                </div>
              ) : (
                <div>
                  <span>شبکه</span>
                  <strong>{network || networks[0]}</strong>
                </div>
              )}
            </div>
            <button
              type="button"
              data-ui="text-link"
              className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
              disabled={busy}
              onClick={() => {
                setStep(1);
                setCode('');
                setError('');
              }}
            >
              ویرایش اطلاعات برداشت
            </button>
            <Field label="کد ۶ رقمی پیامک">
              <VerificationCodeInput
                value={code}
                disabled={busy}
                invalid={Boolean(error)}
                describedBy={error ? 'withdrawal-error' : undefined}
                onChange={(value) => {
                  setCode(value);
                  setError('');
                }}
              />
            </Field>
            <button
              type="button"
              data-ui="text-link"
              className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
              disabled={busy || wait > 0}
              onClick={sendCode}
            >
              {wait > 0 ? `ارسال دوباره تا ${number(wait)} ثانیه` : 'ارسال دوبارهٔ کد'}
            </button>
          </>
        )}
        {error && (
          <p
            id="withdrawal-error"
            data-ui="inline-error"
            className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
            role="alert"
          >
            {error}
          </p>
        )}
        <div
          data-ui="dialog-actions"
          className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
        >
          <button
            type="button"
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={onClose}
          >
            انصراف
          </button>
          <button
            type="submit"
            data-ui="button primary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={
              busy ||
              (action === 'withdraw' && step === 2 && code.length !== 6) ||
              (action === 'deposit' &&
                (!charge.data?.providers.length || !session.data?.user.id || !!charge.error))
            }
          >
            {busy
              ? 'در حال پردازش…'
              : action === 'deposit'
                ? 'ادامه و پرداخت'
                : step === 1
                  ? 'ادامه و دریافت کد'
                  : 'ثبت درخواست برداشت'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function WalletActions({
  action,
  onClose,
  initialAsset = 'IRT',
}: {
  action: 'deposit' | 'withdraw' | null;
  onClose: () => void;
  initialAsset?: string;
}) {
  const [asset, setAsset] = useState(initialAsset);
  const crypto = useCryptoAssets();
  const options = [
    ...new Set(['IRT', initialAsset, ...(crypto.data?.assets.map((a) => a.asset) ?? [])]),
  ];
  if (!action) return null;
  if (asset === 'IRT')
    return (
      <FiatWalletActions
        action={action}
        onClose={onClose}
        initialAsset="IRT"
        onAssetChange={setAsset}
        assetOptions={options}
      />
    );
  return (
    <CryptoWalletActions
      key={asset}
      action={action}
      asset={asset}
      assets={crypto.data?.assets ?? []}
      options={options}
      onAssetChange={setAsset}
      onClose={onClose}
      loading={crypto.isPending}
      error={crypto.error}
      retry={() => void crypto.refetch()}
    />
  );
}
