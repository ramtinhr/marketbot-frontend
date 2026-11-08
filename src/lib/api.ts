export class ApiError extends Error {
  code: string;
  status: number;
  data: Record<string, unknown>;
  constructor(code: string, status: number, data: Record<string, unknown> = {}) {
    super(code);
    this.code = code;
    this.status = status;
    this.data = data;
  }
}
export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    signal?: AbortSignal;
    headers?: Record<string, string>;
  } = {},
): Promise<T> {
  const response = await fetch(`/api/gateway${path}`, {
    method: options.method ?? 'GET',
    credentials: 'same-origin',
    signal: options.signal,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const body = response.status === 204 ? {} : await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(body.code ?? 'internal', response.status, body);
  return body;
}
const messages: Record<string, string> = {
  payment_rate_limit: 'تعداد درخواست‌های پرداخت زیاد است؛ کمی بعد دوباره تلاش کنید.',
  gateway_unavailable: 'درگاه پرداخت در دسترس نیست؛ کمی بعد دوباره تلاش کنید.',
  market_short: 'درخواست کافی برای این مبلغ موجود نیست؛ مبلغ کمتری وارد کنید.',
  reservation_expired: 'مهلت رزرو تمام شده یا فیش قبلاً ثبت شده است. وضعیت را بازخوانی کنید.',
  invalid_receipt: 'تصویر فیش و شماره پیگیری معتبر لازم است.',
  invalid_description: 'اطلاعات واریز را در حداکثر ۱۲۰ نویسه بنویسید.',
  invalid_amount: 'مبلغ باید عدد صحیح و مثبت به تومان باشد.',
  payment_pending: 'پرداخت در انتظار بررسی است یا وضعیت آن تغییر کرده؛ اطلاعات را بازخوانی کنید.',
  order_closed: 'این درخواست بسته شده است.',
  user_inactive: 'برای ادامه، حساب کاربری فعال لازم است.',

  unauthorized: 'نشست شما پایان یافته است. دوباره وارد شوید.',
  otp_wrong: 'کد وارد شده درست نیست.',
  otp_expired: 'کد منقضی شده است. کد جدید بگیرید.',
  otp_locked: 'تعداد تلاش‌ها بیش از حد مجاز است. کد جدید بگیرید.',
  otp_too_soon: 'برای دریافت دوبارهٔ کد کمی صبر کنید.',
  otp_too_many: 'تعداد درخواست‌ها زیاد است. بعداً امتحان کنید.',
  phone_not_iranian: 'شمارهٔ موبایل ایران را درست وارد کنید.',
  insufficient_balance: 'موجودی کافی نیست.',
  api_route_missing: 'سرویس ورود روی سرور در دسترس نیست. لطفاً با پشتیبانی تماس بگیرید.',
  sms_failed: 'ارسال پیامک انجام نشد. لطفاً کمی بعد دوباره تلاش کنید.',
  sms_unavailable: 'سرویس پیامک در حال حاضر در دسترس نیست.',
  api_unavailable: 'ارتباط با سرویس برقرار نشد. دوباره تلاش کنید.',
  demo_readonly: 'در محیط نمایشی تراکنش واقعی انجام نمی‌شود.',
  invalid_sheba: 'شمارهٔ شبا معتبر نیست.',
  invalid_bank_account:
    'عنوان حساب (حداکثر ۸۰ نویسه) و نام صاحب حساب (حداکثر ۱۲۰ نویسه) الزامی است.',
  bank_account_exists: 'این حساب بانکی قبلاً ثبت شده است.',
  invalid_quantity: 'مقدار باید عدد مثبت با حداکثر ۸ رقم اعشار باشد.',
  invalid_price: 'قیمت باید عدد مثبت با حداکثر ۸ رقم اعشار باشد.',
  invalid_address: 'آدرس مقصد معتبر نیست؛ آدرس و شبکه را بررسی کنید.',
  invalid_network: 'شبکهٔ معتبر انتخاب کنید.',
  invalid_tag: 'تگ مقصد معتبر نیست.',
  invalid_order: 'اطلاعات سفارش معتبر نیست.',
  otp_invalid: 'کد تأیید باید ۶ رقم باشد.',
  amount_out_of_range: 'مبلغ خارج از محدودهٔ مجاز است.',
  wallet_inactive: 'کیف پول این دارایی غیرفعال است.',
  otp_required: 'برای ادامه تأیید پیامکی لازم است.',
};
export const errorText = (error: unknown) =>
  error instanceof ApiError
    ? (messages[error.code] ?? 'درخواست انجام نشد. اطلاعات را بررسی و دوباره تلاش کنید.')
    : 'ارتباط برقرار نشد. اتصال خود را بررسی کنید.';
