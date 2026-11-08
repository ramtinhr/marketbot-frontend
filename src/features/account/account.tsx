'use client';
import { useSession } from '@/lib/use-data';
import { ShieldCheck, Smartphone, CalendarDays, UserRound, LockKeyhole, Globe } from 'lucide-react';
import { PageHeading, Panel, PanelTitle, StatusBadge } from '@/components/ui';
import { date } from '@/lib/format';
export function Account() {
  const { data } = useSession();
  const user = data?.user;
  return (
    <>
      <PageHeading title="حساب و امنیت" description="اطلاعات حساب و روش‌های تأیید امنیتی شما." />
      <div
        data-ui="account-grid"
        className="grid [grid-template-columns:1fr_1fr] [gap:24px] [@media(width<=1000px)]:[grid-template-columns:1fr]"
      >
        <Panel>
          <PanelTitle title="اطلاعات حساب" subtitle="اطلاعات ثبت‌شدهٔ شما در مارکت‌بات" />
          <div
            data-ui="account-profile"
            className="flex items-center [gap:15px] [padding-top:12px] [padding-right:24px] [padding-bottom:26px] [padding-left:24px] [@media(width<=640px)]:[gap:12px] [@media(width<=640px)]:[padding-right:20px] [@media(width<=640px)]:[padding-left:20px] [&_>_div]:[flex:1] [&_h2]:[font-size:var(--text-base)] [&_>_div_>_span]:[font-size:var(--text-xs)] [&_>_div_>_span]:[color:#66758a] [@media(width<=640px)]:[&_h2]:[font-size:var(--text-sm)]"
          >
            <span
              data-ui="avatar large"
              className="inline-grid place-items-center shrink-0 [width:35px] [height:35px] [border-radius:50%] [font-size:var(--text-base)] font-semibold [color:#437169] [background:#e6efec] [border-top-width:3px] [border-top-style:solid] [border-top-color:white] [border-right-width:3px] [border-right-style:solid] [border-right-color:white] [border-bottom-width:3px] [border-bottom-style:solid] [border-bottom-color:white] [border-left-width:3px] [border-left-style:solid] [border-left-color:white] [box-shadow:0_0_0_1px_#e7eeeb] [&[data-ui~='small']]:[width:31px] [&[data-ui~='small']]:[height:31px] [&[data-ui~='small']]:[font-size:var(--text-sm)] [&[data-ui~='large']]:[width:56px] [&[data-ui~='large']]:[height:56px] [&[data-ui~='large']]:[font-size:25px]"
            >
              {user?.first_name?.charAt(0) ?? 'م'}
            </span>
            <div>
              <h2>
                {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'کاربر مارکت‌بات'}
              </h2>
              <span>حساب شخصی</span>
            </div>
            <StatusBadge good>فعال</StatusBadge>
          </div>
          <dl
            data-ui="account-details"
            className="[margin-top:0] [margin-right:0] [margin-bottom:0] [margin-left:0] [padding-top:0] [padding-right:24px] [padding-bottom:18px] [padding-left:24px] [@media(width<=640px)]:[padding-right:20px] [@media(width<=640px)]:[padding-left:20px] [&_>_div]:flex [&_>_div]:justify-between [&_>_div]:[gap:16px] [&_>_div]:[border-top-width:1px] [&_>_div]:[border-top-style:solid] [&_>_div]:[border-top-color:var(--line)] [&_>_div]:[padding-top:17px] [&_>_div]:[padding-right:0] [&_>_div]:[padding-bottom:17px] [&_>_div]:[padding-left:0] [&_>_div]:[font-size:var(--text-xs)] [&_dt]:flex [&_dt]:items-center [&_dt]:[gap:9px] [&_dt]:[color:#66758a] [&_dd]:[margin-top:0] [&_dd]:[margin-right:0] [&_dd]:[margin-bottom:0] [&_dd]:[margin-left:0] [&_dd]:[color:#6b7a8c] [@media(width<=640px)]:[&_>_div]:flex-wrap [@media(width<=640px)]:[&_dd]:[overflow-wrap:anywhere]"
          >
            <div>
              <dt>
                <Smartphone size={17} />
                شمارهٔ موبایل
              </dt>
              <dd>
                <bdi>{user?.phone}</bdi>
              </dd>
            </div>
            <div>
              <dt>
                <UserRound size={17} />
                نام کاربری
              </dt>
              <dd>{user?.username ?? 'ثبت نشده'}</dd>
            </div>
            <div>
              <dt>
                <CalendarDays size={17} />
                عضویت از
              </dt>
              <dd>{user?.created_at ? date(user.created_at) : '—'}</dd>
            </div>
            <div>
              <dt>
                <Globe size={17} />
                حساب تلگرام
              </dt>
              <dd>{user?.telegram_id ? 'متصل' : 'متصل نشده'}</dd>
            </div>
          </dl>
        </Panel>
        <Panel>
          <PanelTitle title="امنیت و دسترسی" subtitle="تأییدهای لازم برای دسترسی به دارایی‌ها" />
          <div
            data-ui="security-row"
            className="flex items-center [gap:12px] [padding-top:20px] [padding-right:24px] [padding-bottom:20px] [padding-left:24px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:[gap:10px] [@media(width<=640px)]:[padding-right:20px] [@media(width<=640px)]:[padding-left:20px] [@media(width<=640px)]:flex-wrap [&_>_div]:[flex:1] [&_strong]:[font-size:var(--text-xs)] [&_strong]:font-semibold [&_p]:[font-size:var(--text-xs)] [&_p]:[color:#66758a] [&_p]:[margin-top:4px]"
          >
            <span
              data-ui="metric-icon teal"
              className="inline-flex items-center justify-center [width:41px] [height:41px] [border-radius:12px] shrink-0 [color:#19a488] [background:#effaf5] [@media(width<=640px)]:[width:31px] [@media(width<=640px)]:[height:31px] [@media(width>640px)]:[@media(width<=1000px)]:[width:30px] [@media(width>640px)]:[@media(width<=1000px)]:[height:30px] [@media(width>1000px)]:[@media(width<=1250px)]:[width:35px] [@media(width>1000px)]:[@media(width<=1250px)]:[height:35px] [@media(width<=1250px)]:[border-radius:10px]"
            >
              <ShieldCheck size={22} />
            </span>
            <div>
              <strong>ورود پیامکی</strong>
              <p>ورود به حساب با کد یک‌بارمصرف موبایل.</p>
            </div>
            <StatusBadge good>فعال</StatusBadge>
          </div>
          <div
            data-ui="security-row"
            className="flex items-center [gap:12px] [padding-top:20px] [padding-right:24px] [padding-bottom:20px] [padding-left:24px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:[gap:10px] [@media(width<=640px)]:[padding-right:20px] [@media(width<=640px)]:[padding-left:20px] [@media(width<=640px)]:flex-wrap [&_>_div]:[flex:1] [&_strong]:[font-size:var(--text-xs)] [&_strong]:font-semibold [&_p]:[font-size:var(--text-xs)] [&_p]:[color:#66758a] [&_p]:[margin-top:4px]"
          >
            <span
              data-ui="metric-icon blue"
              className="inline-flex items-center justify-center [width:41px] [height:41px] [border-radius:12px] shrink-0 [color:#5e83d5] [background:#f0f4fe] [@media(width<=640px)]:[width:31px] [@media(width<=640px)]:[height:31px] [@media(width>640px)]:[@media(width<=1000px)]:[width:30px] [@media(width>640px)]:[@media(width<=1000px)]:[height:30px] [@media(width>1000px)]:[@media(width<=1250px)]:[width:35px] [@media(width>1000px)]:[@media(width<=1250px)]:[height:35px] [@media(width<=1250px)]:[border-radius:10px]"
            >
              <LockKeyhole size={21} />
            </span>
            <div>
              <strong>تأیید برداشت</strong>
              <p>هر درخواست برداشت به یک کد تازه نیاز دارد.</p>
            </div>
            <StatusBadge good>فعال</StatusBadge>
          </div>
          <div
            data-ui="security-explainer"
            className="flex items-start [gap:10px] [background:#f6f9f8] [color:#8da49a] [margin-top:10px] [margin-right:24px] [margin-bottom:24px] [margin-left:24px] [padding-top:15px] [padding-right:15px] [padding-bottom:15px] [padding-left:15px] [border-radius:9px] [font-size:var(--text-xs)] [line-height:2] [@media(width<=640px)]:[margin-right:20px] [@media(width<=640px)]:[margin-left:20px]"
          >
            <ShieldCheck size={20} />
            <p>
              کدهای تأیید خود را در اختیار دیگران نگذارید. پیش از تأیید سفارش یا برداشت، جزئیات و
              مقصد را بررسی کنید.
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
