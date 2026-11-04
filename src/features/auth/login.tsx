'use client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ChartNoAxesCombined,
  Check,
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Wallet,
} from 'lucide-react';
import { api, errorText } from '@/lib/api';
import { digits, number } from '@/lib/format';
import { safeNext } from '@/lib/validation';
import { useApp } from '@/providers/app-provider';
import { Field } from '@/components/ui';
export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const client = useQueryClient();
  const { demo } = useApp();
  const [phone, setPhone] = useState('');
  const [challenge, setChallenge] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!resendAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt]);
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const send = async () => {
    setBusy(true);
    setError('');
    try {
      const result = await api<{ challenge_id: string; resend_in: number }>('/auth/web/send', {
        method: 'POST',
        body: { phone },
      });
      setChallenge(result.challenge_id);
      setNow(Date.now());
      setResendAt(Date.now() + result.resend_in * 1000);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challenge) {
      await send();
      return;
    }
    setBusy(true);
    setError('');
    try {
      await api('/auth/web/verify', { method: 'POST', body: { challenge_id: challenge, code } });
      await client.invalidateQueries({ queryKey: ['session'] });
      router.replace(safeNext(params.get('next')));
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="login-layout">
      <div className="login-form-side">
        <Link href="/login" className="brand">
          <span className="brand-mark">
            <ChartNoAxesCombined size={23} />
          </span>
          <span>
            مارکت‌بات<small>MARKETBOT</small>
          </span>
        </Link>
        <div className="login-form-wrap">
          <span className="login-symbol">
            <Smartphone size={25} />
          </span>
          <h1>{challenge ? 'تأیید شمارهٔ موبایل' : 'به مارکت‌بات خوش آمدید'}</h1>
          <p>
            {challenge
              ? `کد ۶ رقمی ارسال‌شده به ${phone} را وارد کنید.`
              : 'با شمارهٔ موبایل خود وارد فضای معاملات شوید.'}
          </p>
          <form className="form-stack" onSubmit={submit}>
            {challenge ? (
              <>
                <Field label="کد تأیید">
                  <input
                    className="otp-field"
                    dir="ltr"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    autoFocus
                    maxLength={6}
                    pattern="[0-9]{6}"
                    value={code}
                    onChange={(e) => setCode(digits(e.target.value))}
                  />
                </Field>
                <div className="otp-links">
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => {
                      setChallenge('');
                      setCode('');
                      setError('');
                    }}
                  >
                    <ChevronRight size={14} />
                    تغییر شماره
                  </button>
                  <button
                    type="button"
                    className="text-link"
                    disabled={wait > 0 || busy}
                    onClick={send}
                  >
                    {wait > 0 ? `ارسال دوباره تا ${number(wait)} ثانیه` : 'ارسال دوبارهٔ کد'}
                  </button>
                </div>
              </>
            ) : (
              <Field label="شمارهٔ موبایل">
                <input
                  type="tel"
                  dir="ltr"
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0912 123 4567"
                  required
                  maxLength={20}
                  value={phone}
                  onChange={(e) => setPhone(digits(e.target.value))}
                />
              </Field>
            )}
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
            <button className="button primary full" disabled={busy} type="submit">
              {busy ? 'در حال پردازش…' : challenge ? 'تأیید و ورود' : 'دریافت کد ورود'}
              <ArrowLeft size={17} />
            </button>
          </form>
          <div className="login-security">
            <ShieldCheck size={17} />
            <span>ورود با کد یک‌بارمصرف، بدون نیاز به رمز عبور</span>
          </div>
          {demo && (
            <div className="login-demo">
              <p>محیط نمایشی فعال است. برای دیدن طراحی بدون ورود:</p>
              <Link className="button secondary full" href="/">
                مشاهدهٔ پنل نمونه
              </Link>
            </div>
          )}
        </div>
        <footer className="login-footer">مارکت‌بات · کیف پول و بازار معاملات</footer>
      </div>
      <aside className="login-story">
        <div className="story-grid" />
        <div className="story-content">
          <span className="story-eyebrow">یک فضای روشن برای تصمیم‌های بهتر</span>
          <h2>
            دید کامل به بازار.
            <br />
            کنترل کامل دارایی.
          </h2>
          <p>
            از اولین نگاه به بازار تا مدیریت سبد دارایی؛
            <br />
            همه چیز در یک فضای ساده و منظم.
          </p>
          <div className="story-portfolio">
            <span className="story-wallet-icon">
              <Wallet size={21} />
            </span>
            <div>
              <span>تمام دارایی‌ها، یک تصویر روشن</span>
              <strong>کیف پول · بازار · معاملات</strong>
            </div>
            <span className="story-check">
              <Check size={18} />
            </span>
          </div>
          <div className="story-chart" aria-hidden="true">
            <svg viewBox="0 0 480 140" fill="none">
              <defs>
                <linearGradient id="story-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#6ce6bc" stopOpacity=".3" />
                  <stop offset="1" stopColor="#6ce6bc" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 120L25 115L40 122L65 100L85 108L110 85L135 95L150 82L175 89L195 60L225 75L250 43L280 55L300 30L325 40L345 26L370 33L400 15L430 23L455 5L480 12V140H0Z"
                fill="url(#story-fill)"
              />
              <path
                d="M0 120L25 115L40 122L65 100L85 108L110 85L135 95L150 82L175 89L195 60L225 75L250 43L280 55L300 30L325 40L345 26L370 33L400 15L430 23L455 5L480 12"
                stroke="#82ebc8"
                strokeWidth="2.5"
              />
            </svg>
          </div>
          <div className="story-feature-row">
            <span>
              <Check size={15} />
              طراحی برای دسکتاپ
            </span>
            <span>
              <Check size={15} />
              حساب مشترک با تلگرام
            </span>
          </div>
        </div>
        <div className="story-footer">
          <span className="brand-mark">
            <ChartNoAxesCombined size={18} />
          </span>
          <span>ساخته‌شده برای تجربه‌ای دقیق‌تر</span>
        </div>
      </aside>
    </div>
  );
}
