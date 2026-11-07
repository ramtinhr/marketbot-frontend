'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, CheckCircle2 } from 'lucide-react';
import { parseDecimal, formatAmountInput } from '@/lib/numbers';
import { api } from '@/lib/api';
import {
  depositDisabledText,
  exactUnits,
  fundingRequest,
  fundingError,
  networkNames,
  type CryptoAsset,
  type CryptoDeposit,
  type CryptoWithdrawal,
  type DepositAddress,
} from '@/lib/crypto-funding';
import { useSession, useWallet } from '@/lib/use-data';
import { assetName, digits } from '@/lib/format';
import { Field, Modal, State } from '@/components/ui';
import { useApp } from '@/providers/app-provider';

export function CryptoWalletActions({
  action,
  asset,
  assets,
  options,
  onAssetChange,
  onClose,
  loading,
  error,
  retry,
}: {
  action: 'deposit' | 'withdraw';
  asset: string;
  assets: CryptoAsset[];
  options: string[];
  onAssetChange: (asset: string) => void;
  onClose: () => void;
  loading: boolean;
  error: unknown;
  retry: () => void;
}) {
  const networks = assets.filter((a) => a.asset === asset);
  const [network, setNetwork] = useState('');
  const selected = networks.find((a) => a.network === network) ?? networks[0];
  const [locked, setLocked] = useState(false);
  return (
    <Modal
      open
      onOpenChange={(open) => !open && !locked && onClose()}
      title={action === 'deposit' ? 'واریز رمزارز' : 'برداشت رمزارز'}
      description={
        action === 'deposit'
          ? 'ابتدا آدرس واریز خود را دریافت کنید؛ پس از انتقال، شناسهٔ تراکنش را برای بررسی وارد کنید.'
          : 'درخواست برداشت برای بررسی و ارسال دستی ثبت می‌شود.'
      }
    >
      <div className="form-stack">
        <Field label="دارایی">
          <select value={asset} disabled={locked} onChange={(e) => onAssetChange(e.target.value)}>
            {options.map((value) => (
              <option key={value} value={value}>
                {assetName(value)} · {value}
              </option>
            ))}
          </select>
        </Field>
        <State loading={loading} error={error} retry={retry}>
          <Field label="شبکه">
            <select
              value={selected?.network ?? ''}
              disabled={locked}
              onChange={(e) => setNetwork(e.target.value)}
            >
              {!networks.length && <option value="">شبکه‌ای در دسترس نیست</option>}
              {networks.map((a) => (
                <option key={a.network} value={a.network}>
                  {networkNames[a.network] ?? a.network}
                  {!(action === 'deposit' ? a.deposit_enabled : a.withdrawal_enabled)
                    ? ' · غیرفعال'
                    : ''}
                </option>
              ))}
            </select>
          </Field>
          {selected ? (
            <CryptoForm
              key={`${asset}:${selected.network}:${action}`}
              asset={selected}
              action={action}
              onClose={onClose}
              onBusy={setLocked}
            />
          ) : (
            <p className="form-note">این دارایی هنوز برای انتقال رمزارز فعال نشده است.</p>
          )}
        </State>
      </div>
    </Modal>
  );
}
function CryptoForm({
  asset,
  action,
  onClose,
  onBusy,
}: {
  asset: CryptoAsset;
  action: 'deposit' | 'withdraw';
  onClose: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const { demo, notify } = useApp();
  const session = useSession(),
    wallet = useWallet(),
    client = useQueryClient();
  const [address, setAddress] = useState<DepositAddress | null>(null);
  const [tx, setTx] = useState(''),
    [amount, setAmount] = useState(''),
    [destination, setDestination] = useState(''),
    [tag, setTag] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [review, setReview] = useState(false),
    [credited, setCredited] = useState<CryptoDeposit | null>(null);
  const submitting = useRef(false);
  const enabled =
    (action === 'deposit' ? asset.deposit_enabled : asset.withdrawal_enabled) && !demo;
  const balance = wallet.data?.balances.find((b) => b.asset === asset.asset)?.available ?? '0';
  async function perform(work: () => Promise<void>) {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    onBusy(true);
    setError('');
    try {
      await work();
    } catch (e) {
      setError(fundingError(e, action));
    } finally {
      submitting.current = false;
      setBusy(false);
      onBusy(false);
    }
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!enabled || !session.data?.user.id) return;
    const userId = String(session.data.user.id);
    if (action === 'deposit') {
      if (!address || !tx.trim()) { setError('ابتدا آدرس واریز را دریافت و سپس شناسهٔ تراکنش را وارد کنید.'); return; }
      await perform(async () => {
        const result = await fundingRequest<{ deposit: CryptoDeposit }>(
          userId,
          '/crypto/deposits',
          { asset: asset.asset, network: asset.network, tx_id: tx.trim() },
        );
        setCredited(result.deposit);
        void client.invalidateQueries({ queryKey: ['wallet'] });
        void client.invalidateQueries({ queryKey: ['entries'] });
        void client.invalidateQueries({ queryKey: ['crypto-deposits'] });
      });
      return;
    }
    const canonical = parseDecimal(amount, asset.decimals, 18);
    const units = canonical ? exactUnits(canonical, asset.decimals) : null;
    const available = exactUnits(balance, 18);
    if (units === null || units <= 0n) {
      setError(`مقدار مثبت با حداکثر ${asset.decimals} رقم اعشار وارد کنید.`);
      return;
    }
    if (available === null || units * 10n ** BigInt(18 - asset.decimals) > available) {
      setError('موجودی قابل استفاده کافی نیست.');
      return;
    }
    if (!destination.trim()) {
      setError('آدرس مقصد را وارد کنید.');
      return;
    }
    if (tag && (!/^\d{1,10}$/.test(tag) || BigInt(tag) > 4294967295n)) {
      setError('تگ مقصد باید عددی بین صفر و ۴۲۹۴۹۶۷۲۹۵ باشد.');
      return;
    }
    if (!review) {
      setError('');
      setReview(true);
      return;
    }
    await perform(async () => {
      await fundingRequest<{ withdrawal: CryptoWithdrawal }>(userId, '/crypto/withdrawals', {
        asset: asset.asset,
        network: asset.network,
        amount: canonical,
        destination: destination.trim(),
        ...(tag ? { destination_tag: tag } : {}),
      });
      void client.invalidateQueries({ queryKey: ['wallet'] });
      void client.invalidateQueries({ queryKey: ['entries'] });
      void client.invalidateQueries({ queryKey: ['crypto-withdrawals'] });
      notify('درخواست برداشت ثبت و مبلغ آن رزرو شد.');
      onClose();
    });
  }
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      notify('کپی شد.');
    } catch {
      setError('کپی انجام نشد؛ متن را انتخاب و کپی کنید.');
    }
  };
  if (credited)
    return (
      <div className="crypto-success" role="status">
        <CheckCircle2 size={30} />
        <strong>واریز تأیید و به کیف پول اضافه شد.</strong>
        <bdi>
          {credited.amount} {credited.asset}
        </bdi>
        <p className="crypto-code" dir="ltr">
          {credited.tx_id}
        </p>
        <button className="button primary" onClick={onClose}>
          بازگشت به کیف پول
        </button>
      </div>
    );
  return (
    <form noValidate className="form-stack" onSubmit={submit}>
      {!enabled && (
        <p className="form-note" role="status">
          {demo
            ? 'در محیط نمایشی انتقال واقعی انجام نمی‌شود.'
            : action === 'deposit'
              ? depositDisabledText(asset.deposit_disabled_reason)
              : 'برداشت این شبکه هنوز فعال نشده است.'}
        </p>
      )}
      {action === 'deposit' ? (
        <>
          <p className="form-note">
            فقط {asset.asset} روی شبکهٔ {networkNames[asset.network]} به این آدرس ارسال کنید. مقدار
            واریز از شبکه محاسبه می‌شود.
          </p>
          {asset.contract && (
            <div className="crypto-address">
              <span>قرارداد تأییدشدهٔ توکن</span>
              <bdi>{asset.contract}</bdi>
              <small>این قرارداد، آدرس واریز شما نیست.</small>
            </div>
          )}
          {!address ? (
            <button
              className="button primary"
              type="button"
              disabled={!enabled || busy || !session.data}
              onClick={() =>
                void perform(async () => {
                  setAddress(
                    await api<DepositAddress>('/crypto/deposit-address', {
                      method: 'POST',
                      body: { asset: asset.asset, network: asset.network },
                    }),
                  );
                })
              }
            >
              {busy ? 'در حال دریافت آدرس…' : 'دریافت آدرس واریز من'}
            </button>
          ) : (
            <>
              <div className="crypto-address">
                <span>آدرس واریز شما · {networkNames[asset.network]}</span>
                <bdi>{address.address}</bdi>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => void copy(address.address)}
                >
                  <Copy size={15} /> کپی آدرس
                </button>
              </div>
              <Field
                label="شناسهٔ تراکنش (TX ID)"
                hint="پس از تأیید کافی در شبکه بررسی می‌شود. اگر هنوز تأیید نشده، کمی بعد همین شناسه را دوباره ارسال کنید."
              >
                <input
                  required
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  value={tx}
                  disabled={busy}
                  onChange={(e) => {
                    setTx(e.target.value);
                    setError('');
                  }}
                />
              </Field>
              <button className="button primary" disabled={busy || !tx.trim()}>
                {busy ? 'در حال بررسی تراکنش…' : 'بررسی تراکنش و افزایش موجودی'}
              </button>
            </>
          )}
        </>
      ) : (
        <>
          {review ? (
            <div className="review-list">
              <div>
                <span>مقدار دریافتی مقصد</span>
                <bdi>
                  {amount} {asset.asset}
                </bdi>
              </div>
              <div>
                <span>شبکه</span>
                <bdi>{networkNames[asset.network]}</bdi>
              </div>
              <div>
                <span>آدرس مقصد</span>
                <bdi className="crypto-code">{destination}</bdi>
              </div>
              {tag && (
                <div>
                  <span>تگ مقصد</span>
                  <bdi>{tag}</bdi>
                </div>
              )}
              <p className="form-note">
                کارمزد شبکه با مجموعه است. مبلغ پس از ثبت، تا بررسی و پرداخت رزرو می‌شود.
              </p>
              <button
                type="button"
                className="text-link"
                disabled={busy}
                onClick={() => setReview(false)}
              >
                ویرایش اطلاعات
              </button>
            </div>
          ) : (
            <>
              <Field
                label={`مقدار (${asset.asset})`}
                hint={`موجودی قابل استفاده: ${balance} ${asset.asset}`}
              >
                <input
                  required
                  inputMode="decimal"
                  dir="ltr"
                  value={amount}
                  onChange={(e) => setAmount(formatAmountInput(e.target.value))}
                />
              </Field>
              <Field label="آدرس مقصد" hint="شبکهٔ آدرس مقصد باید با شبکهٔ انتخاب‌شده یکسان باشد.">
                <input
                  required
                  dir="ltr"
                  autoComplete="off"
                  spellCheck={false}
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                />
              </Field>
              {asset.network === 'XRP' && (
                <Field label="تگ مقصد (در صورت نیاز گیرنده)">
                  <input
                    dir="ltr"
                    inputMode="numeric"
                    value={tag}
                    onChange={(e) => setTag(digits(e.target.value))}
                  />
                </Field>
              )}
              <p className="form-note">
                کارمزد برداشت: {asset.withdrawal_fee} {asset.asset} · هزینهٔ شبکه با مجموعه است.
              </p>
            </>
          )}
          <button className="button primary" disabled={!enabled || busy || !session.data}>
            {busy ? 'در حال ثبت…' : review ? 'تأیید و ثبت درخواست برداشت' : 'بررسی اطلاعات برداشت'}
          </button>
        </>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      <p className="form-note">
        اگر ارتباط قطع شد، ابتدا تاریخچه را بررسی کنید؛ تلاش دوباره با همین اطلاعات، همان درخواست را
        پیگیری می‌کند.
      </p>
    </form>
  );
}
