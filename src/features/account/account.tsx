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
      <div className="account-grid">
        <Panel>
          <PanelTitle title="اطلاعات حساب" subtitle="اطلاعات ثبت‌شدهٔ شما در مارکت‌بات" />
          <div className="account-profile">
            <span className="avatar large">{user?.first_name?.charAt(0) ?? 'م'}</span>
            <div>
              <h2>
                {[user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'کاربر مارکت‌بات'}
              </h2>
              <span>حساب شخصی</span>
            </div>
            <StatusBadge good>فعال</StatusBadge>
          </div>
          <dl className="account-details">
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
          <div className="security-row">
            <span className="metric-icon teal">
              <ShieldCheck size={22} />
            </span>
            <div>
              <strong>ورود پیامکی</strong>
              <p>ورود به حساب با کد یک‌بارمصرف موبایل.</p>
            </div>
            <StatusBadge good>فعال</StatusBadge>
          </div>
          <div className="security-row">
            <span className="metric-icon blue">
              <LockKeyhole size={21} />
            </span>
            <div>
              <strong>تأیید برداشت</strong>
              <p>هر درخواست برداشت به یک کد تازه نیاز دارد.</p>
            </div>
            <StatusBadge good>فعال</StatusBadge>
          </div>
          <div className="security-explainer">
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
