import type { Metadata } from 'next';
import {
  ArrowUpLeft,
  ArrowLeftRight,
  ChartNoAxesCombined,
  Wallet,
  ShieldCheck,
  Handshake,
  Landmark,
  ChevronDown,
  Check,
  Activity,
  BookOpen,
  ArrowLeft,
  Smartphone,
  MousePointer2,
} from 'lucide-react';
import s from './landing.module.css';
import {
  LandingMotion,
  MarketDiscovery,
  ProductExplorer,
} from '@/features/landing/landing-experience';

const portal = 'https://portal.parscryptoexchange.com';
const login = `${portal}/login`;
export const metadata: Metadata = {
  title: { absolute: 'پارس کریپتو | معامله و مدیریت دارایی دیجیتال' },
  description:
    'بازارها، معاملات، کیف پول و تبادل همتا به همتا؛ دارایی دیجیتال خود را در پارس کریپتو مدیریت کنید.',
  alternates: { canonical: 'https://parscryptoexchange.com' },
  openGraph: {
    title: 'پارس کریپتو | یک فضای روشن برای دارایی دیجیتال',
    description: 'از اولین واریز تا معامله؛ بازار، کیف پول و سفارش‌ها در یک پنل.',
    url: 'https://parscryptoexchange.com',
    locale: 'fa_IR',
    type: 'website',
  },
};
const features = [
  {
    icon: ChartNoAxesCombined,
    title: 'بازار را واضح‌تر ببینید',
    text: 'نمودار قیمت، سفارش‌های بازار و سابقه معاملات را کنار هم بررسی کنید و با دید بازتری سفارش بگذارید.',
    tag: 'بازار و معامله',
    className: s.wide,
  },
  {
    icon: Wallet,
    title: 'دارایی‌ها، یک‌جا',
    text: 'موجودی، واریز و برداشت ریالی و رمزارزی را از کیف پول خود مدیریت و پیگیری کنید.',
    tag: 'کیف پول',
  },
  {
    icon: Handshake,
    title: 'تبادل همتا به همتا',
    text: 'پیشنهادها را بررسی کنید و مراحل پرداخت، تأیید و پیگیری سفارش را در یک مسیر مشخص انجام دهید.',
    tag: 'P2P',
  },
  {
    icon: Landmark,
    title: 'از حساب بانکی تا بازار',
    text: 'حساب‌های بانکی خود را ثبت کنید و به تاریخچه پرداخت‌ها و وضعیت درخواست‌ها دسترسی داشته باشید.',
    tag: 'پرداخت و پیگیری',
    className: s.wide,
  },
];
const faqs = [
  [
    'چطور شروع کنم؟',
    'وارد پنل شوید، شماره موبایل خود را ثبت کنید و با کد تأیید ادامه دهید. پس از تکمیل اطلاعات و مراحل تأیید حساب، می‌توانید از امکانات در دسترس استفاده کنید.',
  ],
  [
    'چه امکاناتی در پنل وجود دارد؟',
    'مشاهده بازار و نمودارها، ثبت و پیگیری سفارش، مدیریت کیف پول، واریز و برداشت، ثبت حساب بانکی و معاملات همتا به همتا در پنل قرار دارند. دسترسی به هر امکان به وضعیت حساب و بازار بستگی دارد.',
  ],
  [
    'کارمزد و شرایط معامله را کجا ببینم؟',
    'پیش از تأیید هر عملیات، اطلاعات و شرایط نمایش‌داده‌شده در پنل را بررسی کنید. مبالغ، محدودیت‌ها و شرایط ممکن است برای هر بازار یا روش پرداخت متفاوت باشند.',
  ],
  [
    'آیا معامله رمزارز ریسک دارد؟',
    'بله. قیمت رمزارزها نوسان دارد و ممکن است بخشی یا تمام سرمایه خود را از دست بدهید. تصمیم خود را با بررسی شرایط بازار و میزان ریسک‌پذیری‌تان بگیرید.',
  ],
];
export default function LandingPage() {
  return (
    <LandingMotion>
      <div className={s.page}>
        <a className={s.skip} href="#main">
          رفتن به محتوای اصلی
        </a>
        <header className={s.header}>
          <div className={s.container + ' ' + s.nav}>
            <a href="/" className={s.brand} aria-label="پارس کریپتو، صفحه اصلی">
              <span className={s.mark}>
                <ArrowLeftRight size={23} />
              </span>
              <span>
                پارس کریپتو<small>PARS CRYPTO EXCHANGE</small>
              </span>
            </a>
            <nav aria-label="راهبری اصلی">
              <a href="#discover">بازارها</a>
              <a href="#features">امکانات</a>
              <a href="#start">مسیر شروع</a>
              <a href="#questions">پرسش‌های متداول</a>
            </nav>
            <a href={login} className={s.navCta}>
              ورود به پنل <ArrowUpLeft size={17} />
            </a>
          </div>
        </header>
        <div className={s.announcement}>
          <span className={s.announcementTag}>کشف امکانات</span>
          <span>بازار، کیف پول و تبادل؛ همه در یک پنل</span>
          <a href="#workspace">
            بیشتر ببینید <ArrowLeft size={14} />
          </a>
        </div>
        <main id="main">
          <section className={s.hero + ' ' + s.container}>
            <div className={s.heroCopy} data-reveal>
              <span className={s.eyebrow}>
                <span /> بازار روشن‌تر. تصمیم آگاهانه‌تر.
              </span>
              <h1>
                دنیای دارایی دیجیتال،
                <br />
                <em>کمی ساده‌تر.</em>
              </h1>
              <p>
                از دنبال‌کردن بازار تا مدیریت دارایی؛ معامله، کیف پول و پرداخت‌های شما در یک فضای
                یکپارچه و روشن.
              </p>
              <div className={s.actions}>
                <a className={s.primary} href={login}>
                  شروع با پارس کریپتو <ArrowUpLeft size={20} />
                </a>
                <a className={s.secondary} href="#features">
                  آشنایی با امکانات <span>↓</span>
                </a>
              </div>
              <div className={s.heroNotes}>
                <span>
                  <Check size={16} /> ورود با شماره موبایل
                </span>
                <span>
                  <Check size={16} /> پیگیری وضعیت سفارش‌ها
                </span>
              </div>
            </div>
            <div className={s.preview} aria-label="نمای مفهومی امکانات پنل، بدون قیمت زنده">
              <div className={s.previewTop}>
                <span className={s.previewLogo}>
                  <Activity size={17} /> نمای بازار
                </span>
                <span className={s.demo}>نمای مفهومی</span>
              </div>
              <div className={s.pair}>
                <span className={s.coin}>₮</span>
                <div>
                  <strong>تتر / تومان</strong>
                  <small dir="ltr">USDT / IRT</small>
                </div>
                <span className={s.marketLabel}>بازار رمزارز</span>
              </div>
              <div className={s.chart} aria-hidden="true">
                <div className={s.chartGrid} />
                <svg viewBox="0 0 500 180" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                      <stop stopColor="#079a7c" stopOpacity=".17" />
                      <stop offset="1" stopColor="#079a7c" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path
                    d="M0 150L25 138L48 145L75 112L100 123L130 91L151 103L180 80L202 96L229 65L253 76L282 44L305 67L332 53L359 64L389 34L414 46L447 18L470 28L500 8V180H0Z"
                    fill="url(#fill)"
                  />
                  <path
                    d="M0 150L25 138L48 145L75 112L100 123L130 91L151 103L180 80L202 96L229 65L253 76L282 44L305 67L332 53L359 64L389 34L414 46L447 18L470 28L500 8"
                    fill="none"
                    stroke="#079a7c"
                    strokeWidth="3"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <div className={s.previewTabs}>
                <span>نمودار بازار</span>
                <span>دفتر سفارش</span>
                <span>معاملات اخیر</span>
              </div>
              <div className={s.previewBottom}>
                <div>
                  <Wallet size={19} />
                  <span>
                    کیف پول و دارایی‌ها<small>واریز، برداشت و تاریخچه</small>
                  </span>
                </div>
                <ArrowUpLeft size={19} />
              </div>
              <div className={s.floating}>
                <span>
                  <ShieldCheck size={21} />
                </span>
                <div>
                  هر مرحله، قابل پیگیری<small>از ثبت سفارش تا وضعیت پرداخت</small>
                </div>
              </div>
            </div>
          </section>
          <div className={`${s.container} ${s.quickLinks}`} data-reveal>
            {[
              {
                icon: ArrowLeftRight,
                title: 'معامله در بازار',
                text: 'نمودار، سفارش و تاریخچه',
                path: '/markets',
              },
              {
                icon: Wallet,
                title: 'مدیریت کیف پول',
                text: 'دارایی، واریز و برداشت',
                path: '/wallet',
              },
              {
                icon: Handshake,
                title: 'تبادل همتا به همتا',
                text: 'پیشنهاد، پرداخت و پیگیری',
                path: '/p2p',
              },
            ].map(({ icon: Icon, title, text, path }) => (
              <a key={path} href={login + '?next=' + encodeURIComponent(path)}>
                <span className={s.quickIcon}>
                  <Icon size={23} />
                </span>
                <span>
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
                <ArrowUpLeft size={19} />
              </a>
            ))}
          </div>
          <MarketDiscovery />
          <div className={s.strip}>
            <div className={s.container}>
              <span>یک پنل، مسیرهای متصل</span>
              <span>
                <ChartNoAxesCombined /> بازار و معاملات
              </span>
              <span>
                <Wallet /> مدیریت دارایی
              </span>
              <span>
                <Handshake /> تبادل همتا به همتا
              </span>
            </div>
          </div>
          <section id="features" className={s.section + ' ' + s.container} data-reveal>
            <div className={s.sectionHeading}>
              <div>
                <span className={s.kicker}>برای تمام مسیر شما</span>
                <h2>
                  از بازار تا کیف پول.
                  <br />
                  همه‌چیز در کنار هم.
                </h2>
              </div>
              <p>
                ابزارهایی که برای بررسی، معامله و مدیریت دارایی نیاز دارید؛ با دسترسی مستقیم و
                جزئیات قابل پیگیری.
              </p>
            </div>
            <div className={s.features}>
              {features.map(({ icon: Icon, title, text, tag, className }) => (
                <article className={`${s.feature} ${className || ''}`} key={title}>
                  <div className={s.featureTop}>
                    <Icon size={25} />
                    <span>{tag}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
          <ProductExplorer />
          <section id="start" data-reveal className={s.stepsSection}>
            <div className={s.container}>
              <span className={s.kicker}>شروعی بدون پیچیدگی</span>
              <h2>سه قدم تا فضای معاملاتی شما</h2>
              <div className={s.steps}>
                {[
                  [
                    '۰۱',
                    'حساب خود را بسازید',
                    'با شماره موبایل و کد تأیید وارد شوید و اطلاعات حساب خود را تکمیل کنید.',
                  ],
                  [
                    '۰۲',
                    'کیف پول را آماده کنید',
                    'حساب بانکی خود را ثبت کنید و روش واریز متناسب با دارایی‌تان را انتخاب کنید.',
                  ],
                  [
                    '۰۳',
                    'بازار را بررسی کنید',
                    'جزئیات بازار را ببینید، سفارش ثبت کنید و وضعیت آن را از پنل دنبال کنید.',
                  ],
                ].map(([n, title, text]) => (
                  <article key={n}>
                    <span className={s.stepNumber}>{n}</span>
                    <h3>{title}</h3>
                    <p>{text}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
          <section className={`${s.section} ${s.container}`} data-reveal>
            <div className={s.sectionHeading}>
              <div>
                <span className={s.kicker}>با آگاهی جلو بروید</span>
                <h2>قبل از اولین معامله</h2>
              </div>
              <span className={s.learningLabel}>
                <BookOpen size={17} /> راهنمای کوتاه شروع
              </span>
            </div>
            <div className={s.learnGrid}>
              {[
                [
                  '۰۱',
                  'سفارش با معامله چه تفاوتی دارد؟',
                  'ثبت سفارش لزوماً به معنی انجام معامله نیست. سفارش ممکن است باز بماند یا تنها بخشی از آن اجرا شود. وضعیت نهایی را در بخش سفارش‌ها بررسی کنید.',
                  'وضعیت سفارش خود را از کجا ببینم؟',
                  'در بخش سفارش‌ها می‌توانید وضعیت اجرا و سفارش‌های باز را پیگیری کنید.',
                ],
                [
                  '۰۲',
                  'پیش از واریز رمزارز چه چیزهایی را بررسی کنم؟',
                  'دارایی، شبکه و آدرس مقصد باید با اطلاعات نمایش‌داده‌شده در پنل مطابقت داشته باشند. انتقال روی شبکه اشتباه ممکن است قابل بازگشت نباشد.',
                  'چرا انتخاب شبکه مهم است؟',
                  'یک رمزارز ممکن است روی چند شبکه وجود داشته باشد. شبکه مبدأ و مقصد باید یکسان و در پنل پشتیبانی‌شده باشند.',
                ],
                [
                  '۰۳',
                  'در معامله همتا به همتا به چه توجه کنم؟',
                  'مشخصات سفارش و مهلت پرداخت را بخوانید. رسید را در مسیر تعیین‌شده ثبت کنید و وضعیت تأیید را از همان سفارش دنبال کنید.',
                  'اگر پرداخت نیاز به پیگیری داشت چه کنم؟',
                  'جزئیات سفارش را بررسی کنید و از مسیر پیگیری یا ثبت اختلاف همان سفارش اقدام کنید.',
                ],
              ].map(([n, title, text, question, answer]) => (
                <article key={n}>
                  <span className={s.learnNumber}>{n} / راهنما</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <details>
                    <summary>
                      {question}
                      <ChevronDown size={16} />
                    </summary>
                    <p>{answer}</p>
                  </details>
                </article>
              ))}
            </div>
          </section>
          <section className={`${s.container} ${s.deviceSection}`} data-reveal>
            <div className={s.deviceIllustration} aria-hidden="true">
              <div className={s.desktopMock}>
                <div>
                  <span />
                  <span />
                  <span />
                </div>
                <span className={s.deviceBar} />
                <div className={s.deviceChart}>
                  <ChartNoAxesCombined size={95} strokeWidth={1} />
                </div>
                <span className={s.deviceBar} />
              </div>
              <div className={s.phoneMock}>
                <span />
                <Wallet size={28} />
                <i />
                <i />
                <i />
              </div>
            </div>
            <div>
              <span className={s.kicker}>همراه مسیر شما</span>
              <h2>
                روی هر صفحه،
                <br />
                یک تجربه آشنا.
              </h2>
              <p>
                بازار را در مرورگر ببینید و از موبایل یا دسکتاپ، دارایی و سفارش‌هایتان را دنبال
                کنید.
              </p>
              <div className={s.deviceTags}>
                <span>
                  <Smartphone size={16} /> موبایل
                </span>
                <span>
                  <MousePointer2 size={16} /> دسکتاپ
                </span>
                <span>بدون نیاز به نصب</span>
              </div>
              <a className={s.textLink} href={login}>
                باز کردن پنل کاربری <ArrowUpLeft size={18} />
              </a>
            </div>
          </section>
          <section id="questions" className={s.section + ' ' + s.container + ' ' + s.faq}>
            <div>
              <span className={s.kicker}>پیش از شروع</span>
              <h2>
                پرسش‌های شما،
                <br />
                پاسخ‌های روشن.
              </h2>
              <p>چند نکته برای آشنایی با مسیر پیش رو.</p>
            </div>
            <div>
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary>
                    {question}
                    <ChevronDown size={18} />
                  </summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
          <section className={s.container}>
            <div className={s.finalCta}>
              <div>
                <span>قدم بعدی با شماست</span>
                <h2>بازار را ببینید. مسیر خود را بسازید.</h2>
                <p>پنل شما برای مدیریت دارایی و دنبال‌کردن معاملات.</p>
              </div>
              <a className={s.primary} href={login}>
                ورود و شروع <ArrowUpLeft size={20} />
              </a>
            </div>
          </section>
        </main>
        <footer className={s.container + ' ' + s.footer}>
          <div>
            <a href="/" className={s.footerBrand}>
              پارس کریپتو
            </a>
            <p>فضایی یکپارچه برای دارایی دیجیتال.</p>
          </div>
          <div className={s.footerLinks}>
            <a href="#features">امکانات</a>
            <a href="#questions">پرسش‌ها</a>
            <a href={login}>
              پنل کاربری <ArrowUpLeft size={14} />
            </a>
          </div>
          <p className={s.risk}>
            معامله رمزارز با ریسک نوسان قیمت همراه است. پیش از هر تصمیم، شرایط و میزان ریسک‌پذیری
            خود را بررسی کنید.
          </p>
          <div className={s.footerBottom}>
            <span>پارس کریپتو اکسچنج</span>
            <span dir="ltr">parscryptoexchange.com</span>
          </div>
        </footer>
      </div>
    </LandingMotion>
  );
}
