'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { api, errorText } from '@/lib/api';
import { useBanks, useResource, useWallet } from '@/lib/use-data';
import { useApp } from '@/providers/app-provider';
import { assetName, digits, number } from '@/lib/format';
import { validIban } from '@/lib/validation';
import { Field, Modal, Money } from '@/components/ui';
import { CryptoWalletActions } from './crypto-actions';
import { useCryptoAssets } from '@/lib/use-data';
import type { Withdrawal } from '@/lib/types';
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
  const charge = useResource<{ min_toman: number; max_toman: number }>(
    'charge-info',
    '/wallet/charge',
    { min_toman: 10000, max_toman: 100000000 },
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
    setError('');
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError('مقدار معتبر وارد کنید.');
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
        const result = await api<{ url: string }>('/wallet/charge', {
          method: 'POST',
          body: { amount: value },
        });
        const url = new URL(result.url, location.origin);
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
    if (value > Number(balance)) {
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
    if (step === 1) {
      if (resendAt > Date.now()) setStep(2);
      else await sendCode();
      return;
    }
    setBusy(true);
    try {
      await api('/wallet/withdrawals', {
        method: 'POST',
        body: {
          asset,
          amount,
          network: asset === 'IRT' ? null : network || networks[0],
          code,
          ...(asset === 'IRT' && bank !== 'other'
            ? { recipient_type: 'saved', bank_account_id: bank }
            : {
                destination,
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
      <form className="form-stack" onSubmit={submit}>
        {step === 1 ? (
          <>
            {
              <Field label="دارایی">
                <select
                  value={asset}
                  onChange={(e) => {
                    onAssetChange(e.target.value);
                    setAsset(e.target.value);
                    setNetwork('');
                  }}
                >
                  {assetOptions.map((a) => (
                    <option key={a} value={a}>
                      {assetName(a)} · {a}
                    </option>
                  ))}
                </select>
              </Field>
            }
            <Field
              label={
                action === 'deposit'
                  ? 'مبلغ (تومان)'
                  : `مقدار (${asset === 'IRT' ? 'تومان' : asset})`
              }
              hint={
                action === 'deposit' && charge.data
                  ? `از ${number(charge.data.min_toman)} تا ${number(charge.data.max_toman)} تومان`
                  : `موجودی قابل استفاده: ${number(balance, 8)}`
              }
            >
              <input
                required
                dir="ltr"
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(digits(e.target.value))}
              />
            </Field>
            {action === 'withdraw' &&
              (asset === 'IRT' ? (
                <>
                  <Field label="حساب مقصد">
                    <select value={bank} onChange={(e) => setBank(e.target.value)}>
                      <option value="other">وارد کردن حساب مقصد</option>
                      {banks.data?.accounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label} · {b.holder_name}
                        </option>
                      ))}
                    </select>
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
                  <Link className="text-link" href="/bank-accounts" onClick={onClose}>
                    مدیریت حساب‌های بانکی
                  </Link>
                </>
              ) : (
                <>
                  <Field label="شبکهٔ برداشت">
                    <select
                      required
                      value={network || networks[0] || ''}
                      onChange={(e) => setNetwork(e.target.value)}
                    >
                      {networks.map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
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
            <div className="security-message">
              <ShieldCheck size={24} />
              <div>
                <strong>تأیید درخواست برداشت</strong>
                <p>کد پیامکی را برای ثبت درخواست وارد کنید.</p>
              </div>
            </div>
            <div className="review-list">
              <div>
                <span>مقدار برداشت</span>
                <Money value={amount} unit={asset === 'IRT' ? 'تومان' : asset} decimals={8} />
              </div>
            </div>
            <div className="review-list">
              <div>
                <span>مقصد برداشت</span>
                <bdi className="destination-cell">
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
              className="text-link"
              onClick={() => {
                setStep(1);
                setCode('');
              }}
            >
              ویرایش اطلاعات برداشت
            </button>
            <Field label="کد ۶ رقمی پیامک">
              <input
                required
                dir="ltr"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                pattern="[0-9]{6}"
                value={code}
                onChange={(e) => setCode(digits(e.target.value))}
              />
            </Field>
            <button
              type="button"
              className="text-link"
              disabled={busy || wait > 0}
              onClick={sendCode}
            >
              {wait > 0 ? `ارسال دوباره تا ${number(wait)} ثانیه` : 'ارسال دوبارهٔ کد'}
            </button>
          </>
        )}
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        <div className="dialog-actions">
          <button type="button" className="button secondary" onClick={onClose}>
            انصراف
          </button>
          <button
            type="submit"
            className="button primary"
            disabled={busy || (action === 'deposit' && !charge.data)}
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
