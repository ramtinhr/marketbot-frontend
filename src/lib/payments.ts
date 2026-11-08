export interface PaymentConfig {
  min_toman: number;
  max_toman: number;
  providers: { id: string }[];
  default_provider: string | null;
}
export interface Payment {
  id: string;
  provider: string;
  amount: string;
  status: 'creating' | 'pending' | 'verified' | 'paid' | 'failed' | 'cancelled';
  url: string | null;
  created_at: string;
}
export const paymentStatus: Record<Payment['status'], string> = {
  creating: 'در حال ایجاد پرداخت',
  pending: 'در انتظار پرداخت یا تأیید بانک',
  verified: 'پرداخت تأیید شد؛ افزایش موجودی در انتظار است',
  paid: 'موفق؛ موجودی افزایش یافت',
  failed: 'ناموفق',
  cancelled: 'لغوشده',
};
