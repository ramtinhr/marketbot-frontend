'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  ArrowUpLeft,
  Search,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChartNoAxesCombined,
  Handshake,
} from 'lucide-react';
import s from '@/app/landing.module.css';
const login = 'https://portal.parscryptoexchange.com/login';
const assets = [
  {
    symbol: 'BTC',
    name: 'بیت‌کوین',
    mark: '₿',
    color: '#f59b25',
    path: 'M0 36L12 28L23 31L35 17L47 24L59 19L70 26L83 12L96 18L110 5',
  },
  {
    symbol: 'ETH',
    name: 'اتریوم',
    mark: 'Ξ',
    color: '#7d88c7',
    path: 'M0 12L12 19L23 11L35 25L47 18L59 32L70 23L83 29L96 19L110 25',
  },
  {
    symbol: 'USDT',
    name: 'تتر',
    mark: '₮',
    color: '#269c7c',
    path: 'M0 22L12 21L23 24L35 20L47 22L59 19L70 22L83 20L96 23L110 21',
  },
  {
    symbol: 'TON',
    name: 'تون‌کوین',
    mark: '◇',
    color: '#279ed1',
    path: 'M0 32L12 35L23 26L35 30L47 18L59 22L70 13L83 19L96 9L110 14',
  },
];
export function LandingMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    )
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries)
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-revealed', 'true');
            observer.unobserve(entry.target);
          }
      },
      { threshold: 0.12 },
    );
    root.current?.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={root} className={s.motionRoot}>
      {children}
    </div>
  );
}
export function MarketDiscovery() {
  const [query, setQuery] = useState('');
  const filtered = assets.filter((asset) =>
    `${asset.name} ${asset.symbol}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <section id="discover" className={`${s.section} ${s.container}`} data-reveal>
      <div className={s.sectionHeading}>
        <div>
          <span className={s.kicker}>از شناخت بازار شروع کنید</span>
          <h2>نگاهی به دنیای رمزارزها</h2>
        </div>
        <a href={login + '?next=%2Fmarkets'} className={s.textLink}>
          مشاهده بازارها در پنل <ArrowUpLeft size={18} />
        </a>
      </div>
      <div className={s.marketPanel}>
        <div className={s.marketToolbar}>
          <div>
            <strong>دیده‌بان بازار</strong>
            <span className={s.sampleBadge}>پیش‌نمایش آموزشی</span>
          </div>
          <label className={s.marketSearch}>
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جست‌وجوی نام یا نماد"
              aria-label="جست‌وجوی رمزارز در پیش‌نمایش"
            />
          </label>
        </div>
        <div className={s.marketRows} aria-live="polite">
          {filtered.map((asset) => (
            <a
              href={login + '?next=' + encodeURIComponent('/trade/' + asset.symbol + '_IRT')}
              key={asset.symbol}
              className={s.marketRow}
            >
              <span className={s.assetIdentity}>
                <span className={s.assetCoin} style={{ background: asset.color }}>
                  {asset.mark}
                </span>
                <span>
                  <strong>{asset.name}</strong>
                  <small>{asset.symbol}</small>
                </span>
              </span>
              <span className={s.marketPair} dir="ltr">
                {asset.symbol} / IRT
              </span>
              <svg className={s.sparkline} viewBox="0 0 110 44" aria-hidden="true">
                <path
                  d={asset.path}
                  fill="none"
                  stroke={asset.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className={s.marketAction}>
                بررسی بازار <ArrowUpLeft size={16} />
              </span>
            </a>
          ))}
          {filtered.length === 0 && (
            <p className={s.emptyMarket}>رمزارزی با این نام در پیش‌نمایش پیدا نشد.</p>
          )}
        </div>
        <p className={s.marketDisclaimer}>
          نمودارها صرفاً نمایشی‌اند و قیمت یا روند واقعی بازار را نشان نمی‌دهند. فهرست بازارهای فعال
          و قیمت‌ها را در پنل ببینید.
        </p>
      </div>
    </section>
  );
}
const products = [
  {
    id: 'trade',
    label: 'معامله',
    icon: ChartNoAxesCombined,
    title: 'جزئیات بیشتر. تصمیم دقیق‌تر.',
    text: 'نمودار، دفتر سفارش و معاملات اخیر را کنار هم ببینید. سفارش خود را ثبت کنید و وضعیت اجرا را دنبال کنید.',
    href: '/trade/USDT_IRT',
    points: ['نمودار و اطلاعات بازار', 'ثبت و مدیریت سفارش', 'تاریخچه معاملات'],
  },
  {
    id: 'wallet',
    label: 'کیف پول',
    icon: Wallet,
    title: 'یک نمای روشن از دارایی شما.',
    text: 'موجودی در دسترس و مبالغ درگیر سفارش‌ها را ببینید. برای واریز و برداشت اقدام کنید و سوابق هر عملیات را بررسی کنید.',
    href: '/wallet',
    points: ['تفکیک موجودی دارایی‌ها', 'واریز و برداشت ریالی و رمزارزی', 'تاریخچه قابل پیگیری'],
  },
  {
    id: 'p2p',
    label: 'همتا به همتا',
    icon: Handshake,
    title: 'هر تبادل، یک مسیر مشخص.',
    text: 'پیشنهادهای تبادل را بررسی کنید. از رزرو سفارش تا ارسال رسید و تأیید پرداخت، مراحل را در همان پنل دنبال کنید.',
    href: '/p2p',
    points: ['بررسی پیشنهادها', 'ثبت رسید پرداخت', 'پیگیری و ثبت اختلاف'],
  },
];
export function ProductExplorer() {
  const [active, setActive] = useState(0);
  const product = products[active];
  return (
    <section id="workspace" className={`${s.workspace} ${s.container}`} data-reveal>
      <div className={s.workspaceIntro}>
        <span className={s.kicker}>فضای کار شما</span>
        <h2>
          ابزار مناسب،
          <br />
          برای قدم بعدی.
        </h2>
        <p>با بخش‌های پنل آشنا شوید و مسیر مورد نیازتان را انتخاب کنید.</p>
        <div className={s.productPicker} role="group" aria-label="انتخاب پیش‌نمایش محصول">
          {products.map((item, index) => (
            <button
              key={item.id}
              aria-pressed={index === active}
              aria-controls="product-preview"
              onClick={() => setActive(index)}
            >
              <item.icon size={19} />
              {item.label}
              <ArrowUpLeft size={16} />
            </button>
          ))}
        </div>
      </div>
      <div className={s.productStage} id="product-preview" aria-live="polite">
        <div key={product.id} className={s.productContent}>
          <div className={s.productMock} aria-label="نمای مفهومی محصول">
            <div className={s.mockHeading}>
              <span>
                <product.icon size={18} />
                {product.label}
              </span>
              <span>پیش‌نمایش</span>
            </div>
            {active === 0 ? (
              <>
                <div className={s.candles} aria-hidden="true">
                  {[30, 48, 36, 65, 46, 78, 58, 88, 68, 93, 74, 102, 84, 120, 100, 133].map(
                    (height, i) => (
                      <i
                        key={i}
                        style={{
                          height: height + 'px',
                          background: i % 3 === 0 ? '#db797c' : '#71d0ad',
                        }}
                      />
                    ),
                  )}
                </div>
                <div className={s.mockChips}>
                  <span>نمودار بازار</span>
                  <span>دفتر سفارش</span>
                  <span>سفارش‌های من</span>
                </div>
              </>
            ) : active === 1 ? (
              <div className={s.walletMock}>
                <span>دارایی‌های شما</span>
                {assets.slice(0, 3).map((asset) => (
                  <div key={asset.symbol}>
                    <span style={{ color: asset.color }}>{asset.mark}</span>
                    <strong>{asset.name}</strong>
                    <span dir="ltr">{asset.symbol}</span>
                  </div>
                ))}
                <div className={s.walletActions}>
                  <span>
                    <ArrowDownLeft size={16} /> واریز
                  </span>
                  <span>
                    <ArrowUpRight size={16} /> برداشت
                  </span>
                </div>
              </div>
            ) : (
              <div className={s.p2pMock}>
                {['بررسی و رزرو سفارش', 'پرداخت و ثبت رسید', 'تأیید و پیگیری'].map((text, i) => (
                  <div key={text}>
                    <span>{i === 0 ? <Check size={15} /> : i + 1}</span>
                    <strong>{text}</strong>
                    <small>{i === 0 ? 'قدم اول' : 'مرحله بعد'}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
          <h3>{product.title}</h3>
          <p>{product.text}</p>
          <ul>
            {product.points.map((point) => (
              <li key={point}>
                <Check size={15} />
                {point}
              </li>
            ))}
          </ul>
          <a className={s.textLink} href={login + '?next=' + encodeURIComponent(product.href)}>
            ورود به بخش {product.label}
            <ArrowUpLeft size={18} />
          </a>
        </div>
      </div>
    </section>
  );
}
