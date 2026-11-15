'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowUpLeft, Clock3, LoaderCircle, Search, X } from 'lucide-react';
import { useSymbols } from '@/lib/use-data';
import { assetName } from '@/lib/format';
import { CoinLogo } from './coin-logo';
import s from './header-search.module.css';

const pages = [
  {
    label: 'کیف پول',
    detail: 'موجودی، واریز و برداشت',
    href: '/wallet',
    keywords: 'wallet deposit withdrawal',
  },
  { label: 'سفارش‌ها', detail: 'پیگیری معاملات شما', href: '/orders', keywords: 'orders trade' },
  {
    label: 'حساب‌های بانکی',
    detail: 'مدیریت کارت و حساب بانکی',
    href: '/bank-accounts',
    keywords: 'bank card',
  },
  {
    label: 'حساب و امنیت',
    detail: 'تنظیمات حساب کاربری',
    href: '/settings',
    keywords: 'settings security',
  },
  { label: 'همتا به همتا', detail: 'خرید و فروش مستقیم', href: '/p2p', keywords: 'p2p' },
];
const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/[\s_\-/\u200c]+/g, '');
const historyKey = 'pce-search-history';
const aliases: Record<string, string> = {
  BTC: 'bitcoin بیت کوین',
  ETH: 'ethereum اتر',
  USDT: 'tether تتر',
  SOL: 'solana سولانا',
  TON: 'toncoin تون',
  DOGE: 'dogecoin دوج کوین',
  XRP: 'ripple ریپل',
  ADA: 'cardano کاردانو',
  TRX: 'tron ترون',
  BNB: 'binance بایننس',
  SHIB: 'shiba شیبا',
  USDC: 'usd coin یو اس دی کوین',
};

export function HeaderSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const symbols = useSymbols();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [settled, setSettled] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [recent, setRecent] = useState<string[]>([]);
  const [composing, setComposing] = useState(false);
  const waiting = query !== settled || composing;

  useEffect(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(historyKey) ?? '[]');
      if (Array.isArray(saved))
        setRecent(saved.filter((v): v is string => typeof v === 'string').slice(0, 4));
    } catch {
      /* Search remains available when storage is blocked. */
    }
  }, []);
  useEffect(() => {
    if (composing) return;
    const timer = setTimeout(() => {
      setSettled(query);
      setActive(-1);
    }, 700);
    return () => clearTimeout(timer);
  }, [query, composing]);
  useEffect(() => {
    setOpen(false);
    setActive(-1);
  }, [pathname]);
  useEffect(() => {
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const shortcut = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', shortcut);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', shortcut);
    };
  }, []);

  useEffect(() => {
    if (open && active >= 0)
      document.getElementById(`${id}-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [active, open, id]);

  const term = normalize(settled);
  const markets = (symbols.data?.symbols ?? [])
    .map((symbol) => {
      const [base, quote] = symbol.split('_');
      return {
        label: assetName(base),
        detail: `${base} / ${quote}`,
        href: `/trade/${encodeURIComponent(symbol)}`,
        asset: base,
        keywords: `${symbol} ${assetName(base)} ${assetName(quote)} ${aliases[base] ?? ''}`,
      };
    })
    .filter((item) => !term || normalize(item.keywords).includes(term))
    .sort((a, b) => Number(normalize(b.asset) === term) - Number(normalize(a.asset) === term))
    .slice(0, 5);
  const destinations = pages
    .filter(
      (page) => !term || normalize(`${page.label} ${page.detail} ${page.keywords}`).includes(term),
    )
    .slice(0, term ? 3 : 2);
  const results = [...markets, ...destinations];
  function visit(href: string) {
    const value = query.trim();
    if (value) {
      const next = [value, ...recent.filter((item) => item !== value)].slice(0, 4);
      setRecent(next);
      try {
        localStorage.setItem(historyKey, JSON.stringify(next));
      } catch {
        /* Optional history. */
      }
    }
    setOpen(false);
    input.current?.blur();
    router.push(href);
  }

  return (
    <div
      className={s.root}
      ref={root}
      data-ui="global-search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form
        className={s.field}
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          if (composing) return;
          if (open && !waiting && active >= 0 && results[active]) visit(results[active].href);
          else visit(`/markets?q=${encodeURIComponent(query.trim())}`);
        }}
      >
        <Search size={19} aria-hidden="true" />
        <input
          ref={input}
          role="combobox"
          aria-label="جست‌وجوی ارز، بازار یا بخش‌های پنل"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && !waiting && active >= 0 ? `${id}-${active}` : undefined}
          placeholder="جست‌وجوی ارز، بازار یا بخش‌های پنل…"
          value={query}
          autoComplete="off"
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(event) => {
            if (event.nativeEvent.isComposing) return;
            if (event.key === 'Escape') {
              event.preventDefault();
              setOpen(false);
            }
            if (
              (event.key === 'ArrowDown' || event.key === 'ArrowUp') &&
              !waiting &&
              results.length
            ) {
              event.preventDefault();
              setOpen(true);
              setActive(
                (value) =>
                  (value + (event.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length,
              );
            }
          }}
        />
        {query ? (
          <button
            type="button"
            className={s.clear}
            aria-label="پاک کردن جست‌وجو"
            onClick={() => {
              setQuery('');
              setSettled('');
              setActive(-1);
              input.current?.focus();
            }}
          >
            <X size={16} />
          </button>
        ) : (
          <kbd dir="ltr">Ctrl K</kbd>
        )}
      </form>
      {open && (
        <div className={s.dropdown}>
          <div className={s.heading}>
            <span>{term ? 'نتایج جست‌وجو' : 'بازارها و دسترسی سریع'}</span>
            <span>نام فارسی یا نماد ارز</span>
          </div>
          {!query && recent.length > 0 && (
            <div className={s.recent}>
              <Clock3 size={14} />
              <span>اخیر</span>
              {recent.map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setQuery(value);
                    setActive(-1);
                    input.current?.focus();
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          )}
          <div
            id={`${id}-list`}
            role="listbox"
            aria-label="پیشنهادهای جست‌وجو"
            aria-busy={waiting || symbols.isPending}
          >
            {waiting ? (
              <div className={s.status} role="status">
                <LoaderCircle size={18} className={s.spinner} />
                در حال جست‌وجو…
              </div>
            ) : (
              <>
                {symbols.isPending && (
                  <div className={s.status} role="status">
                    در حال دریافت بازارها…
                  </div>
                )}
                {symbols.isError && (
                  <div className={s.status}>
                    دریافت بازارها ناموفق بود.
                    <button type="button" onClick={() => void symbols.refetch()}>
                      تلاش دوباره
                    </button>
                  </div>
                )}
                {results.map((item, index) => (
                  <div
                    key={item.href}
                    id={`${id}-${index}`}
                    role="option"
                    aria-selected={active === index}
                    className={`${s.result} ${active === index ? s.selected : ''}`}
                    onPointerMove={() => setActive(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => visit(item.href)}
                  >
                    <span className={s.icon}>
                      {'asset' in item ? (
                        <CoinLogo asset={String(item.asset)} />
                      ) : (
                        <ArrowUpLeft size={19} />
                      )}
                    </span>
                    <span className={s.label}>
                      <strong>{item.label}</strong>
                      <small dir={'asset' in item ? 'ltr' : 'rtl'}>{item.detail}</small>
                    </span>
                    <span className={s.type}>{'asset' in item ? 'بازار' : 'صفحه'}</span>
                    <ArrowUpLeft size={16} />
                  </div>
                ))}
                {!results.length && !symbols.isPending && (
                  <div className={s.empty}>
                    <Search size={24} />
                    <strong>نتیجه‌ای پیدا نشد</strong>
                    <span>نام دیگری یا نماد ارز مثل BTC را امتحان کنید.</span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className={s.footer}>
            <span>↑ ↓ انتخاب · Enter ورود · Esc بستن</span>
            <button
              type="button"
              onClick={() => visit(`/markets?q=${encodeURIComponent(query.trim())}`)}
            >
              همه بازارها <ArrowUpLeft size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
