import { parseDecimal } from './numbers.ts';
export interface P2POrder {
  id: string;
  amount: string;
  remaining: string;
  held: string;
  description: string;
  status: 'open' | 'partial' | 'filled' | 'cancelled';
  created_at: string;
}
export interface P2PPayment {
  id: string;
  offer_id: string;
  amount: string;
  description: string;
  role: 'payer' | 'receiver';
  status:
    'reserved' | 'expired' | 'awaiting_confirmation' | 'admin_review' | 'settled' | 'rejected';
  expires_at: string;
  confirmation_due_at: string | null;
  receipt: string | null;
  receipt_reference: string | null;
  review_reason: string | null;
}
export const paymentLabels: Record<P2PPayment['status'], string> = {
  reserved: 'رزرو برای پرداخت',
  expired: 'رزرو منقضی‌شده',
  awaiting_confirmation: 'در انتظار تأیید دریافت وجه',
  admin_review: 'در حال بررسی ادمین',
  settled: 'تسویه‌شده',
  rejected: 'ردشده؛ موجودی درخواست‌کننده آزاد شد',
};
export function tomanAmount(raw: string): string | null {
  return parseDecimal(raw, 0);
}
export function reservationSeconds(expires: string, now: number): number {
  return Math.max(0, Math.ceil((new Date(expires).getTime() - now) / 1000));
}
export const validReceiptFile = (file: { type: string; size: number }) =>
  ['image/png', 'image/jpeg', 'image/webp'].includes(file.type) &&
  file.size > 0 &&
  file.size <= 530000;
