'use client';
import { walletAddressError } from '@/lib/wallet-address';
import { Select, SelectOption } from '@/components/select';
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
      size="wide"
      onOpenChange={(open) => !open && !locked && onClose()}
      title={action === 'deposit' ? 'واریز رمزارز' : 'برداشت رمزارز'}
      description={
        action === 'deposit'
          ? 'ابتدا آدرس واریز خود را دریافت کنید؛ پس از انتقال، شناسهٔ تراکنش را برای بررسی وارد کنید.'
          : 'درخواست برداشت برای بررسی و ارسال دستی ثبت می‌شود.'
      }
    >
      <div data-ui="form-stack" className="flex flex-col [gap:19px]">
        <Field label="دارایی">
          <Select value={asset} disabled={locked} onValueChange={(value) => onAssetChange(value)}>
            {options.map((value) => (
              <SelectOption key={value} value={value}>
                {assetName(value)} · {value}
              </SelectOption>
            ))}
          </Select>
        </Field>
        <State loading={loading} error={error} retry={retry}>
          <Field label="شبکه">
            <Select
              value={selected?.network ?? ''}
              disabled={locked}
              onValueChange={(value) => setNetwork(value)}
            >
              {!networks.length && <SelectOption value="">شبکه‌ای در دسترس نیست</SelectOption>}
              {networks.map((a) => (
                <SelectOption key={a.network} value={a.network}>
                  {networkNames[a.network] ?? a.network}
                  {!(action === 'deposit' ? a.deposit_enabled : a.withdrawal_enabled)
                    ? ' · غیرفعال'
                    : ''}
                </SelectOption>
              ))}
            </Select>
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
            <p
              data-ui="form-note"
              className="[background:#f5f8fa] [border-radius:7px] [padding-top:11px] [padding-right:11px] [padding-bottom:11px] [padding-left:11px] [font-size:var(--text-xs)] [color:#66758a] [margin-top:14px]"
            >
              این دارایی هنوز برای انتقال رمزارز فعال نشده است.
            </p>
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
      if (!address || !tx.trim()) {
        setError('ابتدا آدرس واریز را دریافت و سپس شناسهٔ تراکنش را وارد کنید.');
        return;
      }
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
    const addressError = walletAddressError(asset.network, destination);
    if (addressError) {
      setError(addressError);
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
      <div
        data-ui="crypto-success"
        className="grid [gap:16px] [justify-items:start] [padding-top:20px] [padding-right:0] [padding-bottom:20px] [padding-left:0] [&_svg]:[color:#19885c] [&_>_bdi]:[font-family:monospace] [&_>_bdi]:[font-size:20px]"
        role="status"
      >
        <CheckCircle2 size={30} />
        <strong>واریز تأیید و به کیف پول اضافه شد.</strong>
        <bdi>
          {credited.amount} {credited.asset}
        </bdi>
        <p
          data-ui="crypto-code"
          className="[overflow-wrap:anywhere] [word-break:break-word] [font-family:monospace] [direction:ltr] [unicode-bidi:isolate] block [max-width:360px] [font-size:var(--text-sm)]"
          dir="ltr"
        >
          {credited.tx_id}
        </p>
        <button
          data-ui="button primary"
          className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
          onClick={onClose}
        >
          بازگشت به کیف پول
        </button>
      </div>
    );
  return (
    <form noValidate data-ui="form-stack" className="flex flex-col [gap:19px]" onSubmit={submit}>
      {!enabled && (
        <p
          data-ui="form-note"
          className="[background:#f5f8fa] [border-radius:7px] [padding-top:11px] [padding-right:11px] [padding-bottom:11px] [padding-left:11px] [font-size:var(--text-xs)] [color:#66758a] [margin-top:14px]"
          role="status"
        >
          {demo
            ? 'در محیط نمایشی انتقال واقعی انجام نمی‌شود.'
            : action === 'deposit'
              ? depositDisabledText(asset.deposit_disabled_reason)
              : 'برداشت این شبکه هنوز فعال نشده است.'}
        </p>
      )}
      {action === 'deposit' ? (
        <>
          <p
            data-ui="form-note"
            className="[background:#f5f8fa] [border-radius:7px] [padding-top:11px] [padding-right:11px] [padding-bottom:11px] [padding-left:11px] [font-size:var(--text-xs)] [color:#66758a] [margin-top:14px]"
          >
            فقط {asset.asset} روی شبکهٔ {networkNames[asset.network]} به این آدرس ارسال کنید. مقدار
            واریز از شبکه محاسبه می‌شود.
          </p>
          {asset.contract && (
            <div
              data-ui="crypto-address"
              className="grid [gap:10px] [padding-top:16px] [padding-right:16px] [padding-bottom:16px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [border-right-width:1px] [border-right-style:solid] [border-right-color:var(--line)] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--line)] [border-left-width:1px] [border-left-style:solid] [border-left-color:var(--line)] [border-radius:10px] [background:#f6f9f8] [&_>_span]:[font-size:var(--text-sm)] [&_>_span]:font-semibold [&_bdi]:[overflow-wrap:anywhere] [&_bdi]:[word-break:break-word] [&_bdi]:[font-family:monospace] [&_bdi]:[direction:ltr] [&_bdi]:[unicode-bidi:isolate] [&_bdi]:[user-select:all] [&_bdi]:[font-size:var(--text-sm)]"
            >
              <span>قرارداد تأییدشدهٔ توکن</span>
              <bdi>{asset.contract}</bdi>
              <small>این قرارداد، آدرس واریز شما نیست.</small>
            </div>
          )}
          {!address ? (
            <button
              data-ui="button primary"
              className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
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
              <div
                data-ui="crypto-address"
                className="grid [gap:10px] [padding-top:16px] [padding-right:16px] [padding-bottom:16px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [border-right-width:1px] [border-right-style:solid] [border-right-color:var(--line)] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:var(--line)] [border-left-width:1px] [border-left-style:solid] [border-left-color:var(--line)] [border-radius:10px] [background:#f6f9f8] [&_>_span]:[font-size:var(--text-sm)] [&_>_span]:font-semibold [&_bdi]:[overflow-wrap:anywhere] [&_bdi]:[word-break:break-word] [&_bdi]:[font-family:monospace] [&_bdi]:[direction:ltr] [&_bdi]:[unicode-bidi:isolate] [&_bdi]:[user-select:all] [&_bdi]:[font-size:var(--text-sm)]"
              >
                <span>آدرس واریز شما · {networkNames[asset.network]}</span>
                <bdi>{address.address}</bdi>
                <button
                  type="button"
                  data-ui="text-link"
                  className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
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
              <button
                data-ui="button primary"
                className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
                disabled={busy || !tx.trim()}
              >
                {busy ? 'در حال بررسی تراکنش…' : 'بررسی تراکنش و افزایش موجودی'}
              </button>
            </>
          )}
        </>
      ) : (
        <>
          {review ? (
            <div
              data-ui="review-list"
              className="flex flex-col [&_>_div]:flex [&_>_div]:justify-between [&_>_div]:[gap:15px] [&_>_div]:[padding-top:15px] [&_>_div]:[padding-right:0] [&_>_div]:[padding-bottom:15px] [&_>_div]:[padding-left:0] [&_>_div]:[border-bottom-width:1px] [&_>_div]:[border-bottom-style:solid] [&_>_div]:[border-bottom-color:var(--line)] [&_>_div]:[font-size:var(--text-xs)] [&_>_div_>_span]:[color:#94a0ad] [&_strong]:[font-size:var(--text-xs)] [&_strong]:font-semibold"
            >
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
                <bdi
                  data-ui="crypto-code"
                  className="[overflow-wrap:anywhere] [word-break:break-word] [font-family:monospace] [direction:ltr] [unicode-bidi:isolate] block [max-width:360px] [font-size:var(--text-sm)]"
                >
                  {destination}
                </bdi>
              </div>
              {tag && (
                <div>
                  <span>تگ مقصد</span>
                  <bdi>{tag}</bdi>
                </div>
              )}
              <p
                data-ui="form-note"
                className="[background:#f5f8fa] [border-radius:7px] [padding-top:11px] [padding-right:11px] [padding-bottom:11px] [padding-left:11px] [font-size:var(--text-xs)] [color:#66758a] [margin-top:14px]"
              >
                کارمزد شبکه با مجموعه است. مبلغ پس از ثبت، تا بررسی و پرداخت رزرو می‌شود.
              </p>
              <button
                type="button"
                data-ui="text-link"
                className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
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
                  onChange={(e) => {
                    setDestination(e.target.value);
                    setError('');
                  }}
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
              <p
                data-ui="form-note"
                className="[background:#f5f8fa] [border-radius:7px] [padding-top:11px] [padding-right:11px] [padding-bottom:11px] [padding-left:11px] [font-size:var(--text-xs)] [color:#66758a] [margin-top:14px]"
              >
                کارمزد برداشت: {asset.withdrawal_fee} {asset.asset} · هزینهٔ شبکه با مجموعه است.
              </p>
            </>
          )}
          <button
            data-ui="button primary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={!enabled || busy || !session.data}
          >
            {busy ? 'در حال ثبت…' : review ? 'تأیید و ثبت درخواست برداشت' : 'بررسی اطلاعات برداشت'}
          </button>
        </>
      )}
      {error && (
        <p
          data-ui="inline-error"
          className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
          role="alert"
        >
          {error}
        </p>
      )}
      <p
        data-ui="form-note"
        className="[background:#f5f8fa] [border-radius:7px] [padding-top:11px] [padding-right:11px] [padding-bottom:11px] [padding-left:11px] [font-size:var(--text-xs)] [color:#66758a] [margin-top:14px]"
      >
        اگر ارتباط قطع شد، ابتدا تاریخچه را بررسی کنید؛ تلاش دوباره با همین اطلاعات، همان درخواست را
        پیگیری می‌کند.
      </p>
    </form>
  );
}
