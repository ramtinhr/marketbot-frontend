'use client';
import { ui } from '@/lib/ui-styles';

import Link from 'next/link';
import { NavigationLink } from './navigation-link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useRef, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowUpLeft,
  ArrowLeftRight,
  Handshake,
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
const overviewLink = { href: '/', label: 'نمای کلی', icon: LayoutDashboard };
const navigationGroups = [
  {
    id: 'trading',
    label: 'بازار و معاملات',
    links: [
      { href: '/markets', label: 'بازارها', icon: ChartNoAxesCombined },
      { href: '/trade/USDT_IRT', label: 'معامله', icon: ArrowLeftRight },
      { href: '/orders', label: 'سفارش‌ها', icon: ClipboardList },
    ],
  },
  {
    id: 'assets',
    label: 'دارایی و پرداخت',
    links: [
      { href: '/wallet', label: 'کیف پول', icon: Wallet },
      { href: '/p2p', label: 'همتا به همتا', icon: Handshake },
      { href: '/bank-accounts', label: 'حساب‌های بانکی', icon: Landmark },
    ],
  },
  {
    id: 'account',
    label: 'مدیریت حساب',
    links: [{ href: '/settings', label: 'حساب و امنیت', icon: Settings2 }],
  },
];
const links = [overviewLink, ...navigationGroups.flatMap((group) => group.links)];
function isCurrentPage(pathname: string, href: string) {
  const route = href === '/trade/USDT_IRT' ? '/trade' : href;
  return pathname === route || (route !== '/' && pathname.startsWith(`${route}/`));
}
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
      <main data-ui="session-loading" className="[height:100vh] grid place-items-center">
        <State loading={session.isPending} error={session.error} retry={() => session.refetch()}>
          <span />
        </State>
      </main>
    );
  if (!session.data.verified) return null;
  const user = session.data.user;
  const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || 'کاربر مارکت‌بات';
  const title = links.find((link) => isCurrentPage(pathname, link.href))?.label ?? 'پنل کاربری';
  return (
    <div data-ui="portal" className="[min-height:100vh] [overflow-x:clip]">
      <a
        data-ui="skip-link"
        className="fixed [top:-50px] [right:20px] [background:var(--accent)] [color:#fff] [padding-top:10px] [padding-right:10px] [padding-bottom:10px] [padding-left:10px] [z-index:100] [&:focus]:[top:10px]"
        href="#main-content"
      >
        رفتن به محتوای اصلی
      </a>
      {mobile && (
        <button
          data-ui="sidebar-scrim"
          className="hidden [@media(width<=800px)]:block [@media(width<=800px)]:fixed [@media(width<=800px)]:[inset:0] [@media(width<=800px)]:[background:#152b414d] [@media(width<=800px)]:[backdrop-filter:blur(2px)] [@media(width<=800px)]:[z-index:29]"
          aria-label="بستن فهرست"
          onClick={() => setMobile(false)}
        />
      )}
      <aside
        ref={sidebar}
        role={mobile ? 'dialog' : undefined}
        aria-modal={mobile || undefined}
        {...ui(`sidebar ${mobile ? 'is-open' : ''}`)}
        style={{ overflowY: 'auto', overscrollBehavior: 'contain' }}
        aria-label="فهرست اصلی"
      >
        <Link
          href="/"
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
        <button
          data-ui="icon-button mobile-close"
          className="hidden items-center justify-center [width:30px] [height:30px] [border-radius:7px] [color:#8d99a7] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [@media(width<=800px)]:flex [@media(width<=800px)]:absolute [@media(width<=800px)]:[top:30px] [@media(width<=800px)]:[left:10px] [@media(width<=640px)]:[min-width:44px] [@media(width<=640px)]:[min-height:44px] [@media(width>640px)]:[@media(width<=800px)]:[min-width:34px] [@media(width>640px)]:[@media(width<=800px)]:[min-height:34px] [&:hover]:[background:#f3f6f7] [&:hover]:[color:var(--text)]"
          aria-label="بستن فهرست"
          onClick={() => setMobile(false)}
        >
          <X size={20} />
        </button>
        <nav aria-label="صفحه‌های پنل" className="mt-6">
          <NavigationLink
            href={overviewLink.href}
            {...ui(`nav-link ${isCurrentPage(pathname, overviewLink.href) ? 'active' : ''}`)}
            aria-current={isCurrentPage(pathname, overviewLink.href) ? 'page' : undefined}
          >
            <LayoutDashboard size={19} aria-hidden="true" className="shrink-0" />
            <span>{overviewLink.label}</span>
          </NavigationLink>
          {navigationGroups.map((group) => (
            <div key={group.id} role="group" aria-labelledby={`nav-${group.id}`} className="mt-4">
              <p
                id={`nav-${group.id}`}
                data-ui="nav-caption"
                className="mb-2 px-3 text-[length:var(--text-xs)] font-semibold text-[#66758a]"
              >
                {group.label}
              </p>
              <ul className="m-0 list-none border-s border-[#e9edf2] ps-1">
                {group.links.map(({ href, label, icon: Icon }) => {
                  const active = isCurrentPage(pathname, href);
                  return (
                    <li key={href}>
                      <NavigationLink
                        href={href}
                        {...ui(`nav-link ${active ? 'active' : ''}`)}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon size={19} aria-hidden="true" className="shrink-0" />
                        <span>{label}</span>
                        {href === '/orders' && count > 0 && (
                          <span
                            data-ui="nav-count"
                            aria-label={`${count} سفارش فعال`}
                            className="ms-auto min-w-5 rounded-md bg-[#f0f3f7] px-1 text-center text-[length:var(--text-xs)] text-[#66758a]"
                          >
                            {count.toLocaleString('fa-IR')}
                          </span>
                        )}
                      </NavigationLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div data-ui="sidebar-bottom" className="mt-auto [padding-top:34px]">
          <div
            data-ui="help-card"
            className="[border-top-width:1px] [border-top-style:solid] [border-top-color:#edf1f3] [border-right-width:1px] [border-right-style:solid] [border-right-color:#edf1f3] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#edf1f3] [border-left-width:1px] [border-left-style:solid] [border-left-color:#edf1f3] [border-radius:11px] [background:linear-gradient(135deg,_#fbfdfc,_#f7faf9)] [padding-top:16px] [padding-right:14px] [padding-bottom:16px] [padding-left:14px] [margin-bottom:24px] [@media(width<=1250px)]:[padding-top:13px] [@media(width<=1250px)]:[padding-right:11px] [@media(width<=1250px)]:[padding-bottom:13px] [@media(width<=1250px)]:[padding-left:11px] [&_strong]:[font-size:var(--text-sm)] [&_p]:[font-size:var(--text-xs)] [&_p]:[color:#66758a] [&_p]:[margin-top:7px] [&_p]:[margin-right:0] [&_p]:[margin-bottom:12px] [&_p]:[margin-left:0] [&_p]:[line-height:1.9] [&_a]:flex [&_a]:items-center [&_a]:justify-between [&_a]:[font-size:var(--text-xs)] [&_a]:[color:#66758a] [&_a]:font-semibold"
          >
            <span data-ui="help-icon" className="block [color:var(--accent)] [margin-bottom:9px]">
              <ShieldCheck size={21} />
            </span>
            <strong>کنترل دارایی، در دست شما</strong>
            <p>وضعیت حساب و تأییدهای امنیتی خود را بررسی کنید.</p>
            <Link href="/settings">
              امنیت حساب <ArrowUpLeft size={15} />
            </Link>
          </div>
          <button
            data-ui="sidebar-profile"
            className="[width:calc(100%_+_36px)] [margin-right:-18px] [margin-left:-18px] flex items-center [gap:9px] [padding-top:17px] [padding-right:23px] [padding-bottom:17px] [padding-left:23px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] text-right [@media(width<=1250px)]:[width:calc(100%_+_26px)] [@media(width<=1250px)]:[margin-right:-13px] [@media(width<=1250px)]:[margin-left:-13px] [@media(width<=1250px)]:[padding-right:17px] [@media(width<=1250px)]:[padding-left:17px] [&_>_span:nth-child(2)]:flex [&_>_span:nth-child(2)]:flex-col [&_>_span:nth-child(2)]:[flex:1] [&_strong]:[font-size:var(--text-sm)] [&_small]:[font-size:var(--text-xs)] [&_small]:[color:#66758a] [&_small]:[margin-top:2px] [&_>_svg]:[color:#9aa5b2]"
            onClick={() => setLogout(true)}
          >
            <span
              data-ui="avatar"
              className="inline-grid place-items-center shrink-0 [width:35px] [height:35px] [border-radius:50%] [font-size:var(--text-base)] font-semibold [color:#437169] [background:#e6efec] [border-top-width:3px] [border-top-style:solid] [border-top-color:white] [border-right-width:3px] [border-right-style:solid] [border-right-color:white] [border-bottom-width:3px] [border-bottom-style:solid] [border-bottom-color:white] [border-left-width:3px] [border-left-style:solid] [border-left-color:white] [box-shadow:0_0_0_1px_#e7eeeb] [&[data-ui~='small']]:[width:31px] [&[data-ui~='small']]:[height:31px] [&[data-ui~='small']]:[font-size:var(--text-sm)] [&[data-ui~='large']]:[width:56px] [&[data-ui~='large']]:[height:56px] [&[data-ui~='large']]:[font-size:25px]"
            >
              {name.charAt(0)}
            </span>
            <span>
              <strong>{name}</strong>
              <small>حساب شخصی</small>
            </span>
            <LogOut size={17} />
          </button>
        </div>
      </aside>
      <div
        data-ui="workspace"
        className="[margin-right:var(--sidebar)] [@media(width<=800px)]:[margin-right:0]"
      >
        <header
          data-ui="topbar"
          className="[height:78px] [background:#fff] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#edf0f3] flex items-center justify-between [padding-top:0] [padding-right:34px] [padding-bottom:0] [padding-left:34px] [gap:24px] [@media(width<=800px)]:[height:67px] [@media(width<=640px)]:[padding-right:16px] [@media(width<=640px)]:[padding-left:16px] [@media(width>640px)]:[@media(width<=1000px)]:[padding-right:20px] [@media(width>640px)]:[@media(width<=1000px)]:[padding-left:20px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-right:24px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-left:24px] [@media(width>1650px)]:[padding-right:44px] [@media(width>1650px)]:[padding-left:44px]"
        >
          <div
            data-ui="breadcrumb"
            className="flex items-center [gap:14px] [font-size:var(--text-sm)] [color:#66758a] [@media(width<=800px)]:[gap:11px] [&_strong]:font-medium [&_strong]:[color:#566273]"
          >
            <button
              data-ui="icon-button mobile-menu"
              className="hidden items-center justify-center [width:30px] [height:30px] [border-radius:7px] [color:#8d99a7] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [@media(width<=800px)]:flex [@media(width<=640px)]:[min-width:44px] [@media(width<=640px)]:[min-height:44px] [@media(width>640px)]:[@media(width<=800px)]:[min-width:34px] [@media(width>640px)]:[@media(width<=800px)]:[min-height:34px] [&:hover]:[background:#f3f6f7] [&:hover]:[color:var(--text)]"
              aria-label="باز کردن فهرست"
              onClick={() => setMobile(true)}
            >
              <Menu size={22} />
            </button>
            <span>پنل کاربری</span>
            <span data-ui="breadcrumb-divider" className="[font-size:17px] [color:#d5dbe3]">
              /
            </span>
            <strong>{title}</strong>
          </div>
          <div
            data-ui="topbar-actions"
            className="flex items-center [gap:17px] [@media(width<=640px)]:[gap:10px] [@media(width>640px)]:[@media(width<=1000px)]:[gap:11px] [@media(width<=640px)]:[&_>_[data-ui~='icon-button']]:hidden"
          >
            <form
              data-ui="global-search"
              className="flex items-center [gap:9px] [color:#a2acb8] [@media(width<=640px)]:hidden [&_input]:[width:180px] [&_input]:[border-top-width:0] [&_input]:[border-top-style:none] [&_input]:[border-top-color:currentColor] [&_input]:[border-right-width:0] [&_input]:[border-right-style:none] [&_input]:[border-right-color:currentColor] [&_input]:[border-bottom-width:0] [&_input]:[border-bottom-style:none] [&_input]:[border-bottom-color:currentColor] [&_input]:[border-left-width:0] [&_input]:[border-left-style:none] [&_input]:[border-left-color:currentColor] [&_input]:[background:none] [&_input]:[font-size:var(--text-sm)] [&_input]:[padding-top:8px] [&_input]:[padding-right:0] [&_input]:[padding-bottom:8px] [&_input]:[padding-left:0] [&_input::placeholder]:[color:#66758a] [&_kbd]:[background:#f7f8fa] [&_kbd]:[border-top-width:1px] [&_kbd]:[border-top-style:solid] [&_kbd]:[border-top-color:#edf0f3] [&_kbd]:[border-right-width:1px] [&_kbd]:[border-right-style:solid] [&_kbd]:[border-right-color:#edf0f3] [&_kbd]:[border-bottom-width:1px] [&_kbd]:[border-bottom-style:solid] [&_kbd]:[border-bottom-color:#edf0f3] [&_kbd]:[border-left-width:1px] [&_kbd]:[border-left-style:solid] [&_kbd]:[border-left-color:#edf0f3] [&_kbd]:[padding-top:1px] [&_kbd]:[padding-right:5px] [&_kbd]:[padding-bottom:1px] [&_kbd]:[padding-left:5px] [&_kbd]:[border-radius:4px] [&_kbd]:[font-size:var(--text-xs)] [@media(width<=1000px)]:[&_input]:[width:135px] [@media(width<=640px)]:[&_input]:[font-size:var(--text-base)]"
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
            <span
              data-ui="topbar-divider"
              className="[height:20px] [border-left-width:1px] [border-left-style:solid] [border-left-color:#e9edf2] [@media(width<=640px)]:hidden"
            />
            <Link
              href="/settings"
              data-ui="icon-button"
              className="inline-flex items-center justify-center [width:30px] [height:30px] [border-radius:7px] [color:#8d99a7] [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [@media(width<=640px)]:[min-width:44px] [@media(width<=640px)]:[min-height:44px] [@media(width>640px)]:[@media(width<=800px)]:[min-width:34px] [@media(width>640px)]:[@media(width<=800px)]:[min-height:34px] [&:hover]:[background:#f3f6f7] [&:hover]:[color:var(--text)]"
              aria-label="راهنمای حساب"
            >
              <CircleHelp size={19} />
            </Link>
            <span
              data-ui="avatar small"
              className="inline-grid place-items-center shrink-0 [width:35px] [height:35px] [border-radius:50%] [font-size:var(--text-base)] font-semibold [color:#437169] [background:#e6efec] [border-top-width:3px] [border-top-style:solid] [border-top-color:white] [border-right-width:3px] [border-right-style:solid] [border-right-color:white] [border-bottom-width:3px] [border-bottom-style:solid] [border-bottom-color:white] [border-left-width:3px] [border-left-style:solid] [border-left-color:white] [box-shadow:0_0_0_1px_#e7eeeb] [&[data-ui~='small']]:[width:31px] [&[data-ui~='small']]:[height:31px] [&[data-ui~='small']]:[font-size:var(--text-sm)] [&[data-ui~='large']]:[width:56px] [&[data-ui~='large']]:[height:56px] [&[data-ui~='large']]:[font-size:25px]"
              title={name}
            >
              {name.charAt(0)}
            </span>
          </div>
        </header>
        {demo && (
          <div
            data-ui="demo-banner"
            className="[min-height:37px] flex items-center justify-between [gap:12px] [padding-top:6px] [padding-right:34px] [padding-bottom:6px] [padding-left:34px] [background:#edf6f2] [color:#536f63] [font-size:var(--text-xs)] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#e1eee7] [@media(width<=800px)]:[padding-top:7px] [@media(width<=800px)]:[padding-bottom:7px] [@media(width<=640px)]:[padding-right:16px] [@media(width<=640px)]:[padding-left:16px] [@media(width>640px)]:[@media(width<=800px)]:[padding-right:20px] [@media(width>640px)]:[@media(width<=800px)]:[padding-left:20px] [@media(width>800px)]:[@media(width<=1250px)]:[padding-right:24px] [@media(width>800px)]:[@media(width<=1250px)]:[padding-left:24px] [&_>_span]:flex [&_>_span]:items-center [&_>_span]:[gap:6px] [&_a]:flex [&_a]:items-center [&_a]:[gap:6px] [@media(width<=800px)]:[&_>_a]:hidden"
          >
            <span>
              <span
                data-ui="demo-dot"
                className="inline-block [width:5px] [height:5px] [background:#81ae98] [border-radius:50%]"
              />
              محیط نمایشی · اعداد و حساب‌ها نمونه هستند و تراکنش واقعی انجام نمی‌شود.
            </span>
            <Link href="/login">
              مشاهدهٔ صفحهٔ ورود <ArrowUpLeft size={13} />
            </Link>
          </div>
        )}
        <main
          data-ui="main-content"
          className="[max-width:1620px] mt-auto mr-auto [margin-bottom:auto] ml-auto [padding-top:32px] [padding-right:34px] [padding-bottom:0] [padding-left:34px] [@media(width<=640px)]:[padding-top:23px] [@media(width<=640px)]:[padding-right:16px] [@media(width<=640px)]:[padding-left:16px] [@media(width>640px)]:[@media(width<=800px)]:[padding-top:24px] [@media(width>800px)]:[@media(width<=1000px)]:[padding-top:25px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-top:27px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-right:24px] [@media(width>1000px)]:[@media(width<=1250px)]:[padding-left:24px] [@media(width>1650px)]:[padding-top:38px] [@media(width>1650px)]:[padding-right:44px] [@media(width>1650px)]:[padding-left:44px] [@media(width>640px)]:[@media(width<=1000px)]:[padding-right:20px] [@media(width>640px)]:[@media(width<=1000px)]:[padding-left:20px] [@media(width<=640px)]:[&_[data-ui~='data-table']_th]:[padding-right:13px] [@media(width<=640px)]:[&_[data-ui~='data-table']_th]:[padding-left:13px] [@media(width>640px)]:[@media(width<=800px)]:[&_[data-ui~='data-table']_th]:[padding-right:15px] [@media(width>640px)]:[@media(width<=800px)]:[&_[data-ui~='data-table']_th]:[padding-left:15px] [@media(width<=640px)]:[&_[data-ui~='data-table']_td]:[padding-right:13px] [@media(width<=640px)]:[&_[data-ui~='data-table']_td]:[padding-left:13px] [@media(width>640px)]:[@media(width<=800px)]:[&_[data-ui~='data-table']_td]:[padding-right:15px] [@media(width>640px)]:[@media(width<=800px)]:[&_[data-ui~='data-table']_td]:[padding-left:15px] [@media(width<=800px)]:[&_[data-ui~='market-table']_td:first-child]:[padding-right:16px]"
          id="main-content"
        >
          {children}
          <footer
            data-ui="footer"
            className="flex items-center justify-between [padding-top:26px] [padding-right:2px] [padding-bottom:26px] [padding-left:2px] [font-size:var(--text-xs)] [color:#66758a] [gap:15px] [@media(width<=640px)]:[padding-top:23px] [@media(width<=640px)]:[padding-bottom:23px] [@media(width<=640px)]:[gap:9px] [@media(width<=640px)]:flex-wrap [&_>_span:last-child]:flex [&_>_span:last-child]:items-center [&_>_span:last-child]:[gap:5px] [@media(width<=640px)]:[&_svg]:[width:11px] [@media(width<=640px)]:[&_svg]:[height:11px]"
          >
            <span>مارکت‌بات · فضای معاملات شما</span>
            <span>
              <ShieldCheck size={13} /> تأیید پیامکی برای عملیات مالی
            </span>
          </footer>
        </main>
      </div>
      <Modal
        open={logout}
        size="compact"
        onOpenChange={setLogout}
        title="خروج از حساب"
        description="برای دسترسی دوباره به حساب، کد ورود پیامکی لازم است."
      >
        <div
          data-ui="dialog-actions"
          className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
        >
          <button
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={() => setLogout(false)}
          >
            انصراف
          </button>
          <button
            data-ui="button danger"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
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
