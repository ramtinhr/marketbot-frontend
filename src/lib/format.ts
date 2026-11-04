const names: Record<string, string> = {
  USDT: 'تتر',
  BTC: 'بیت‌کوین',
  ETH: 'اتریوم',
  IRT: 'تومان',
  TON: 'تون‌کوین',
  SOL: 'سولانا',
};
export const assetName = (asset: string) => names[asset] ?? asset;
export const number = (value: string | number, maximumFractionDigits = 0) =>
  new Intl.NumberFormat('fa-IR', { maximumFractionDigits }).format(Number(value) || 0);
export const date = (value: string) =>
  new Intl.DateTimeFormat('fa-IR', {
    timeZone: 'Asia/Tehran',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
export const digits = (value: string) =>
  value
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
export const statusLabel = (value: string) =>
  ({
    open: 'باز',
    partial: 'تکمیل جزئی',
    filled: 'تکمیل شده',
    cancelled: 'لغو شده',
    pending: 'در انتظار',
    paid: 'پرداخت شده',
    rejected: 'رد شده',
    processing: 'در حال بررسی',
  })[value] ?? value;
export function balanceValue(wallet: import('./types').Wallet | undefined) {
  return (
    wallet?.balances.reduce(
      (sum, b) =>
        sum +
        (Number(b.available) + Number(b.frozen) + Number(b.locked)) *
          (b.asset === 'IRT' ? 1 : (wallet.prices[b.asset] ?? 0)),
      0,
    ) ?? 0
  );
}

export const entryLabel = (kind: string) =>
  (
    ({
      credit: 'افزایش موجودی',
      debit: 'کاهش موجودی',
      charge: 'افزایش موجودی',
      trade: 'تسویهٔ معامله',
      freeze: 'مسدود شدن موجودی',
      unfreeze: 'آزاد شدن موجودی',
      withdrawal: 'برداشت',
    }) as Record<string, string>
  )[kind] ?? 'تغییر موجودی';
