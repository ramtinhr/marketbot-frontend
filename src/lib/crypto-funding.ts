import { decimalUnits } from './numbers.ts';
import { api, ApiError, errorText } from './api.ts';

export interface CryptoAsset {
  asset: string;
  network: string;
  decimals: number;
  contract?: string;
  deposit_enabled: boolean;
  deposit_disabled_reason?: string | null;
  withdrawal_enabled: boolean;
  withdrawal_fee: string;
}
export interface CryptoDeposit {
  id: string;
  asset: string;
  network: string;
  tx_id: string;
  address: string;
  amount: string;
  status: 'credited';
  created_at: string;
}
export interface CryptoWithdrawal {
  id: string;
  asset: string;
  network: string;
  destination: string;
  destination_tag: string | null;
  amount: string;
  status: string;
  created_at: string;
  payout_tx_id: string | null;
}
export interface DepositAddress {
  asset: string;
  network: string;
  address: string;
  contract: string | null;
  destination_tag: string | null;
}
export function depositDisabledText(reason?: string | null): string {
  if (reason === 'network_not_configured') return 'اتصال این شبکه هنوز توسط مجموعه فعال نشده است.';
  if (reason === 'wallet_not_enabled' || reason === 'wallet_registration_unavailable')
    return 'کیف پول واریز هنوز توسط مجموعه فعال نشده است. لطفاً کمی بعد دوباره بررسی کنید.';
  if (reason?.startsWith('wallet_'))
    return 'سرویس ایجاد آدرس واریز در دسترس نیست. لطفاً کمی بعد دوباره بررسی کنید.';
  return 'واریز این دارایی هنوز فعال نشده است.';
}
export const networkNames: Record<string, string> = {
  BEP20: 'BNB Smart Chain · BEP20',
  TRC20: 'Tron · TRC20',
  ERC20: 'Ethereum',
  BTC: 'Bitcoin',
  DOGE: 'Dogecoin',
  SOL: 'Solana',
  XRP: 'XRP Ledger',
  ADA: 'Cardano',
};
export function exactUnits(value: string, decimals: number): bigint | null {
  return decimalUnits(value, decimals);
}
export function sumDecimals(left: string, right: string): string {
  const a = exactUnits(left, 18),
    b = exactUnits(right, 18);
  if (a === null || b === null) return '—';
  const digits = (a + b).toString().padStart(19, '0');
  return `${digits.slice(0, -18)}.${digits.slice(-18)}`.replace(/\.?0+$/, '');
}
// Persist only a digest and UUID. Keep the same instruction across timeouts,
// closing/reopening a dialog, reloads, and browser restarts. Scope it to the user.
export async function fundingRequest<T>(userId: string, path: string, body?: unknown): Promise<T> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify([userId, path, body ?? null])),
  );
  const slot =
    'marketbot:customer-funding:' +
    Array.from(new Uint8Array(digest), (n) => n.toString(16).padStart(2, '0')).join('');
  const key = localStorage.getItem(slot) ?? crypto.randomUUID();
  localStorage.setItem(slot, key);
  const response = await api<T>(path, {
    method: 'POST',
    body,
    headers: { 'Idempotency-Key': key },
  });
  localStorage.removeItem(slot);
  return response;
}
export function fundingError(error: unknown, operation: 'deposit' | 'withdraw'): string {
  if (error instanceof ApiError) {
    if (error.status === 503)
      return 'این شبکه هنوز فعال نیست یا ارتباط با شبکه برقرار نشد. کمی بعد دوباره تلاش کنید.';
    if (error.status === 429) return 'تعداد درخواست‌ها زیاد است؛ یک دقیقه صبر کنید.';
    if (error.status === 422)
      return 'تراکنش با شبکه، دارایی، مقصد یا مقدار مورد انتظار مطابقت ندارد. اطلاعات را بررسی کنید.';
    if (error.status === 409)
      return operation === 'deposit'
        ? 'تراکنش هنوز تأیید کافی ندارد، قبلاً ثبت شده یا اطلاعات شبکه یکسان نیست. تاریخچه را بررسی و کمی بعد همین شناسه را دوباره ارسال کنید.'
        : 'موجودی کافی نیست یا وضعیت درخواست تغییر کرده است. موجودی و تاریخچه را تازه کنید.';
    if (error.status === 403) return 'حساب شما برای این عملیات فعال نیست.';
  }
  return errorText(error);
}
