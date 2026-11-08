'use client';
import { VerificationCodeInput } from '@/components/verification-code-input';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
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
  const verifying = useRef(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(0);
  useEffect(() => {
    if (!resendAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAt]);
  const wait = Math.max(0, Math.ceil((resendAt - now) / 1000));
  const send = async () => {
    if (!/^09\d{9}$/.test(digits(phone))) {
      setError('شمارهٔ موبایل باید ۱۱ رقم و با ۰۹ شروع شود.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const result = await api<{ challenge_id: string; resend_in: number }>('/auth/web/send', {
        method: 'POST',
        body: { phone },
      });
      setChallenge(result.challenge_id);
      setCode('');
      setNow(Date.now());
      setResendAt(Date.now() + result.resend_in * 1000);
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  const verify = async (value: string) => {
    const completedCode = digits(value);
    if (!challenge || busy || verifying.current) return;
    if (!/^[0-9]{6}$/.test(completedCode)) {
      setError('کد تأیید باید ۶ رقم باشد.');
      return;
    }
    verifying.current = true;
    setBusy(true);
    setError('');
    try {
      await api('/auth/web/verify', {
        method: 'POST',
        body: { challenge_id: challenge, code: completedCode },
      });
      await client.invalidateQueries({ queryKey: ['session'] });
      router.replace(safeNext(params.get('next')));
    } catch (e) {
      setError(errorText(e));
    } finally {
      verifying.current = false;
      setBusy(false);
    }
  };
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (challenge) await verify(code);
    else if (!busy) await send();
  };
  return (
    <div
      data-ui="login-layout"
      className="[min-height:100vh] grid [grid-template-columns:1fr_1fr] [background:white] [@media(width<=800px)]:[grid-template-columns:1fr]"
    >
      <div
        data-ui="login-form-side"
        className="flex flex-col [padding-top:46px] [padding-right:60px] [padding-bottom:22px] [padding-left:60px] [min-height:100vh] [@media(width<=640px)]:[padding-top:30px] [@media(width<=640px)]:[padding-right:24px] [@media(width<=640px)]:[padding-bottom:20px] [@media(width<=640px)]:[padding-left:24px] [@media(width>640px)]:[@media(width<=1000px)]:[padding-top:32px] [@media(width>640px)]:[@media(width<=1000px)]:[padding-right:32px] [@media(width>640px)]:[@media(width<=1000px)]:[padding-bottom:32px] [@media(width>640px)]:[@media(width<=1000px)]:[padding-left:32px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-top:40px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-right:40px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-bottom:40px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-left:40px] [@media(width<=800px)]:[min-height:100dvh] [&_>_[data-ui~='brand']]:[padding-top:0] [&_>_[data-ui~='brand']]:[padding-right:0] [&_>_[data-ui~='brand']]:[padding-bottom:0] [&_>_[data-ui~='brand']]:[padding-left:0] [@media(width<=800px)]:[&_>_[data-ui~='brand']]:[align-self:center]"
      >
        <Link
          href="/login"
          data-ui="brand"
          className="flex items-center [gap:11px] [padding-top:0] [padding-right:14px] [padding-bottom:0] [padding-left:14px] [font-size:22px] [font-weight:850] [letter-spacing:-0.5px] [color:#1c3431] [line-height:1.5] [@media(width<=1250px)]:[padding-right:10px] [@media(width<=1250px)]:[padding-left:10px] [@media(width<=1250px)]:[font-size:20px] [&_small]:block [&_small]:[letter-spacing:2.7px] [&_small]:[font-size:var(--text-xs)] [&_small]:font-semibold [&_small]:[color:#9aa3af] [&_small]:[margin-top:2px]"
        >
          <span
            data-ui="brand-mark"
            className="[width:37px] [height:37px] [border-radius:11px] [background:var(--accent)] [color:white] grid place-items-center [box-shadow:0_5px_12px_#079a7c15] [@media(width<=1000px)]:[width:32px] [@media(width<=1000px)]:[height:32px]"
          >
            <ChartNoAxesCombined size={23} />
          </span>
          <span>
            مارکت‌بات<small>MARKETBOT</small>
          </span>
        </Link>
        <div
          data-ui="login-form-wrap"
          className="[max-width:350px] [width:100%] mt-auto mr-auto [margin-bottom:auto] ml-auto [padding-top:70px] [padding-right:0] [padding-bottom:70px] [padding-left:0] [@media(width<=800px)]:[max-width:360px] [@media(width<=640px)]:[padding-top:60px] [@media(width<=640px)]:[padding-bottom:60px] [&_h1]:[font-size:25px] [&_h1]:[letter-spacing:-0.7px] [&_>_p]:[font-size:var(--text-sm)] [&_>_p]:[color:#66758a] [&_>_p]:[margin-top:10px] [&_>_p]:[margin-right:0] [&_>_p]:[margin-bottom:31px] [&_>_p]:[margin-left:0] [&_>_p]:[line-height:2] [&_[data-ui~='field']_>_input]:[font-size:var(--text-base)] [&_[data-ui~='field']_>_input]:[padding-top:13px] [&_[data-ui~='field']_>_input]:[padding-right:15px] [&_[data-ui~='field']_>_input]:[padding-bottom:13px] [&_[data-ui~='field']_>_input]:[padding-left:15px] [&_[data-ui~='button']]:[min-height:45px] [&_[data-ui~='button']_svg]:mr-auto"
        >
          <span
            data-ui="login-symbol"
            className="[width:49px] [height:49px] grid place-items-center [background:#ecf8f2] [border-top-width:1px] [border-top-style:solid] [border-top-color:#dcefe4] [border-right-width:1px] [border-right-style:solid] [border-right-color:#dcefe4] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#dcefe4] [border-left-width:1px] [border-left-style:solid] [border-left-color:#dcefe4] [color:var(--accent)] [border-radius:13px] [margin-bottom:22px]"
          >
            <Smartphone size={25} />
          </span>
          <h1>{challenge ? 'تأیید شمارهٔ موبایل' : 'به مارکت‌بات خوش آمدید'}</h1>
          <p>
            {challenge
              ? `کد ۶ رقمی ارسال‌شده به ${phone} را وارد کنید.`
              : 'با شمارهٔ موبایل خود وارد فضای معاملات شوید.'}
          </p>
          <form
            noValidate
            data-ui="form-stack"
            className="flex flex-col [gap:19px]"
            onSubmit={submit}
          >
            {challenge ? (
              <>
                <Field label="کد تأیید">
                  <VerificationCodeInput
                    key={challenge}
                    value={code}
                    disabled={busy}
                    invalid={Boolean(error)}
                    describedBy={error ? 'login-error' : undefined}
                    onChange={(normalized) => {
                      setCode(normalized);
                      setError('');
                      if (normalized.length === 6) void verify(normalized);
                    }}
                  />
                </Field>
                <div data-ui="otp-links" className="flex items-center justify-between">
                  <button
                    type="button"
                    data-ui="text-link"
                    className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
                    disabled={busy}
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
                    data-ui="text-link"
                    className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
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
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="09121234567"
                  required
                  minLength={11}
                  maxLength={11}
                  pattern="09[0-9]{9}"
                  value={phone}
                  onChange={(e) =>
                    setPhone(
                      digits(e.target.value)
                        .replace(/[^0-9]/g, '')
                        .slice(0, 11),
                    )
                  }
                />
              </Field>
            )}
            {error && (
              <p
                id="login-error"
                data-ui="inline-error"
                className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
                role="alert"
              >
                {error}
              </p>
            )}
            <button
              data-ui="button primary full"
              className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
              disabled={busy || (Boolean(challenge) && code.length !== 6)}
              type="submit"
            >
              {busy ? 'در حال پردازش…' : challenge ? 'تأیید و ورود' : 'دریافت کد ورود'}
              <ArrowLeft size={17} />
            </button>
          </form>
          <div
            data-ui="login-security"
            className="flex items-center justify-center [gap:7px] [color:#66758a] [font-size:var(--text-xs)] [margin-top:23px]"
          >
            <ShieldCheck size={17} />
            <span>ورود با کد یک‌بارمصرف، بدون نیاز به رمز عبور</span>
          </div>
          {demo && (
            <div
              data-ui="login-demo"
              className="[margin-top:25px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [padding-top:20px] [&_p]:[font-size:var(--text-xs)] [&_p]:[color:#97a3ae] [&_p]:[margin-bottom:10px]"
            >
              <p>محیط نمایشی فعال است. برای دیدن طراحی بدون ورود:</p>
              <Link
                data-ui="button secondary full"
                className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
                href="/"
              >
                مشاهدهٔ پنل نمونه
              </Link>
            </div>
          )}
        </div>
        <footer
          data-ui="login-footer"
          className="text-center [color:#66758a] [font-size:var(--text-xs)]"
        >
          مارکت‌بات · کیف پول و بازار معاملات
        </footer>
      </div>
      <aside
        data-ui="login-story"
        className="relative overflow-hidden [background:#12382f] [color:#e5f4ec] flex flex-col justify-center [padding-top:65px] [padding-right:70px] [padding-bottom:65px] [padding-left:70px] [@media(width<=800px)]:hidden [@media(width<=1000px)]:[padding-top:40px] [@media(width<=1000px)]:[padding-right:30px] [@media(width<=1000px)]:[padding-bottom:40px] [@media(width<=1000px)]:[padding-left:30px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-top:50px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-right:40px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-bottom:50px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-left:40px] [&:before]:[content:''] [&:before]:absolute [&:before]:[width:750px] [&:before]:[height:750px] [&:before]:[top:-460px] [&:before]:[left:-250px] [&:before]:[background:radial-gradient(circle,_#3a98745e,_transparent_65%)] [&:before]:pointer-events-none"
      >
        <div
          data-ui="story-grid"
          className="absolute [inset:0] [background-image:linear-gradient(#ffffff03_1px,_transparent_1px),_linear-gradient(90deg,_#ffffff03_1px,_transparent_1px)] [background-size:60px_60px] [mask-image:linear-gradient(transparent,_black,_transparent)]"
        />
        <div
          data-ui="story-content"
          className="relative [max-width:440px] mt-auto mr-auto [margin-bottom:auto] ml-auto [&_h2]:[font-size:42px] [&_h2]:[line-height:1.8] [&_h2]:font-bold [&_h2]:[letter-spacing:-1px] [&_h2]:[margin-top:19px] [&_h2]:[margin-right:0] [&_h2]:[margin-bottom:14px] [&_h2]:[margin-left:0] [&_>_p]:[font-size:var(--text-sm)] [&_>_p]:[line-height:2.4] [&_>_p]:[color:#81a998] [@media(width<=1000px)]:[&_h2]:[font-size:29px] [@media(width>1000px)]:[@media(width<=1250px)]:[&_h2]:[font-size:35px] [@media(width<=1000px)]:[&_>_p]:[font-size:var(--text-xs)]"
        >
          <span
            data-ui="story-eyebrow"
            className="[font-size:var(--text-xs)] [color:#9ec9b5] [letter-spacing:0.2px]"
          >
            یک فضای روشن برای تصمیم‌های بهتر
          </span>
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
          <div
            data-ui="story-portfolio"
            className="flex items-center [gap:13px] [padding-top:21px] [padding-right:18px] [padding-bottom:21px] [padding-left:18px] [background:#ffffff08] [border-top-width:1px] [border-top-style:solid] [border-top-color:#ffffff10] [border-right-width:1px] [border-right-style:solid] [border-right-color:#ffffff10] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#ffffff10] [border-left-width:1px] [border-left-style:solid] [border-left-color:#ffffff10] [border-radius:13px] [margin-top:45px] [@media(width<=1000px)]:[padding-top:18px] [@media(width<=1000px)]:[padding-right:13px] [@media(width<=1000px)]:[padding-bottom:18px] [@media(width<=1000px)]:[padding-left:13px] [&_>_div]:flex [&_>_div]:flex-col [&_>_div]:[gap:6px] [&_>_div_>_span]:[font-size:var(--text-xs)] [&_>_div_>_span]:[color:#89b09d] [&_strong]:[font-size:var(--text-xs)] [&_strong]:font-medium [&_strong]:[letter-spacing:0.2px]"
          >
            <span
              data-ui="story-wallet-icon"
              className="[width:40px] [height:40px] [background:#ffffff0b] [border-radius:10px] grid place-items-center [color:#9fd7bb]"
            >
              <Wallet size={21} />
            </span>
            <div>
              <span>تمام دارایی‌ها، یک تصویر روشن</span>
              <strong>کیف پول · بازار · معاملات</strong>
            </div>
            <span
              data-ui="story-check"
              className="mr-auto [width:26px] [height:26px] [border-radius:50%] [background:#a4d8bf1c] grid place-items-center [color:#91d5b4]"
            >
              <Check size={18} />
            </span>
          </div>
          <div
            data-ui="story-chart"
            className="[margin-top:18px] [opacity:0.6] [&_svg]:block [&_svg]:[width:100%] [&_svg]:[height:auto]"
            aria-hidden="true"
          >
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
          <div
            data-ui="story-feature-row"
            className="flex [gap:25px] [font-size:var(--text-xs)] [color:#90b4a1] [margin-top:30px] [@media(width<=1000px)]:[gap:15px] [&_>_span]:flex [&_>_span]:items-center [&_>_span]:[gap:6px]"
          >
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
        <div
          data-ui="story-footer"
          className="relative flex items-center justify-center [gap:10px] [font-size:var(--text-xs)] [color:#719e88] [margin-top:50px] [&_[data-ui~='brand-mark']]:[width:25px] [&_[data-ui~='brand-mark']]:[height:25px] [&_[data-ui~='brand-mark']]:[font-size:var(--text-xs)] [&_[data-ui~='brand-mark']]:[background:#356d55]"
        >
          <span
            data-ui="brand-mark"
            className="[width:37px] [height:37px] [border-radius:11px] [background:var(--accent)] [color:white] grid place-items-center [box-shadow:0_5px_12px_#079a7c15] [@media(width<=1000px)]:[width:32px] [@media(width<=1000px)]:[height:32px]"
          >
            <ChartNoAxesCombined size={18} />
          </span>
          <span>ساخته‌شده برای تجربه‌ای دقیق‌تر</span>
        </div>
      </aside>
    </div>
  );
}
