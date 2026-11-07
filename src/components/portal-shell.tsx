'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpLeft,
  ArrowLeftRight,
  CircleHelp,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Settings2,
  ShieldCheck,
  Wallet,
  X,
  Landmark,
  ChartNoAxesCombined,
  ClipboardList,
} from 'lucide-react';
import { api, ApiError, errorText } from '@/lib/api';
import { useApp } from '@/providers/app-provider';
import { useOrders, useSession } from '@/lib/use-data';
import { Modal, State } from './ui';
const links = [
  { href: '/', label: 'نمای کلی', icon: LayoutDashboard },
  { href: '/markets', label: 'بازارها', icon: ChartNoAxesCombined },
  { href: '/trade/USDT_IRT', label: 'معامله', icon: ArrowLeftRight },
  { href: '/wallet', label: 'کیف پول', icon: Wallet },
  { href: '/p2p', label: 'همتا به همتا', icon: ArrowLeftRight },
  { href: '/orders', label: 'سفارش‌ها', icon: ClipboardList },
];
const accountLinks = [
  { href: '/bank-accounts', label: 'حساب‌های بانکی', icon: Landmark },
  { href: '/settings', label: 'حساب و امنیت', icon: Settings2 },
];
export function PortalShell({ children }: { children: ReactNode }) {
  const { demo, notify } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const client = useQueryClient();
  const [mobile, setMobile] = useState(false);
  const [logout, setLogout] = useState(false);
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const sidebar = useRef<HTMLElement>(null);
  const session = useSession();
  const orders = useOrders();
  const count =
    orders.data?.orders.filter((o) => ['open', 'partial'].includes(o.status)).length ?? 0;
  useEffect(() => {
    if (session.error instanceof ApiError && session.error.status === 401)
      router.replace(`/login?next=${encodeURIComponent(pathname + window.location.search)}`);
    else if (session.data && !session.data.verified) router.replace('/login?verify=1');
  }, [session.error, session.data, router, pathname]);
  useEffect(() => setMobile(false), [pathname]);
  useEffect(() => {
    if (!mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusable = () =>
      Array.from(sidebar.current?.querySelectorAll<HTMLElement>('a,button') ?? []).filter(
        (element) => element.getClientRects().length > 0,
      );
    focusable()[0]?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobile(false);
      if (event.key !== 'Tab') return;
      const elements = focusable();
      if (event.shiftKey && document.activeElement === elements[0]) {
        event.preventDefault();
        elements.at(-1)?.focus();
      } else if (!event.shiftKey && document.activeElement === elements.at(-1)) {
        event.preventDefault();
        elements[0]?.focus();
      }
    };
    document.addEventListener('keydown', keydown);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener('keydown', keydown);
      previous?.focus();
    };
  }, [mobile]);
  if (session.isPending || !session.data)
    return (
      <main className="session-loading">
        <State loading={session.isPending} error={session.error} retry={() => session.refetch()}>
          <span />
        </State>
      </main>
    );
  if (!session.data.verified) return null;
  const user = session.data.user;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'کاربر مارکت‌بات';
  const title =
    [...links, ...accountLinks].find((l) =>
      l.href === '/' ? pathname === '/' : pathname.startsWith(l.href.split('/USDT')[0]),
    )?.label ?? 'پنل کاربری';
  return (
    <div className="portal">
      <a className="skip-link" href="#main-content">
        رفتن به محتوای اصلی
      </a>
      {mobile && (
        <button
          className="sidebar-scrim"
          aria-label="بستن فهرست"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        ref={sidebar}
        role={mobile ? 'dialog' : undefined}
        aria-modal={mobile || undefined}
        className={`sidebar ${mobile ? 'is-open' : ''}`}
        aria-label="فهرست اصلی"
      >
        <Link href="/" className="brand">
          <span className="brand-mark">
            <ChartNoAxesCombined size={23} />
          </span>
          <span>
            مارکت‌بات<small>MARKETBOT</small>
          </span>
        </Link>
        <button
          className="icon-button mobile-close"
          aria-label="بستن فهرست"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <p className="nav-caption">فضای کار شما</p>
        <nav>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={
                (href === '/' ? pathname === '/' : pathname.startsWith(href.split('/USDT')[0]))
                  ? 'nav-link active'
                  : 'nav-link'
              }
              aria-current={
                (href === '/' ? pathname === '/' : pathname.startsWith(href.split('/USDT')[0]))
                  ? 'page'
                  : undefined
              }
            >
              <Icon size={19} />
              <span>{label}</span>
              {href === '/orders' && count > 0 && <span className="nav-count">{count}</span>}
            </Link>
          ))}
        </nav>
        <p className="nav-caption account-caption">مدیریت حساب</p>
        <nav>
          {accountLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`nav-link ${pathname.startsWith(href) ? 'active' : ''}`}
              aria-current={pathname.startsWith(href) ? 'page' : undefined}
            >
              <Icon size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">
              <ShieldCheck size={21} />
            </span>
            <strong>کنترل دارایی، در دست شما</strong>
            <p>وضعیت حساب و تأییدهای امنیتی خود را بررسی کنید.</p>
            <Link href="/settings">
              امنیت حساب <ArrowUpLeft size={15} />
            </Link>
          </div>
          <button className="sidebar-profile" onClick={() => setLogout(true)}>
            <span className="avatar">{name.charAt(0)}</span>
            <span>
              <strong>{name}</strong>
              <small>حساب شخصی</small>
            </span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              aria-label="باز کردن فهرست"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>پنل کاربری</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <form
              className="global-search"
              role="search"
              onSubmit={(e) => {
                e.preventDefault();
                router.push(`/markets?q=${encodeURIComponent(search)}`);
              }}
            >
              <Search size={17} />
              <input
                aria-label="جست‌وجوی بازار"
                placeholder="جست‌وجوی ارز یا بازار…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>↵</kbd>
            </form>
            <span className="topbar-divider" />
            <Link href="/settings" className="icon-button" aria-label="راهنمای حساب">
              <CircleHelp size={19} />
            </Link>
            <span className="avatar small" title={name}>
              {name.charAt(0)}
            </span>
          </div>
        </header>
        {demo && (
          <div className="demo-banner">
            <span>
              <span className="demo-dot" />
              محیط نمایشی · اعداد و حساب‌ها نمونه هستند و تراکنش واقعی انجام نمی‌شود.
            </span>
            <Link href="/login">
              مشاهدهٔ صفحهٔ ورود <ArrowUpLeft size={13} />
            </Link>
          </div>
        )}
        <main className="main-content" id="main-content">
          {children}
          <footer className="footer">
            <span>مارکت‌بات · فضای معاملات شما</span>
            <span>
              <ShieldCheck size={13} /> تأیید پیامکی برای عملیات مالی
            </span>
          </footer>
        </main>
      </div>
      <Modal
        open={logout}
        onOpenChange={setLogout}
        title="خروج از حساب"
        description="برای دسترسی دوباره به حساب، کد ورود پیامکی لازم است."
      >
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setLogout(false)}>
            انصراف
          </button>
          <button
            className="button danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try {
                if (!demo) await api('/auth/logout', { method: 'POST' });
                client.clear();
                router.push('/login');
              } catch (e) {
                notify(errorText(e), true);
              } finally {
                setBusy(false);
              }
            }}
          >
            خروج از حساب
          </button>
        </div>
      </Modal>
    </div>
  );
}
