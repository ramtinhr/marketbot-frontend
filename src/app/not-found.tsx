import Link from 'next/link';
export default function NotFound() {
  return (
    <main
      data-ui="not-found"
      className="[min-height:90vh] flex flex-col items-center justify-center [gap:18px] [&_>_span]:[font-size:80px] [&_>_span]:[font-weight:800] [&_>_span]:[color:#c2dfd5] [&_p]:[color:#99a6b4]"
    >
      <span>۴۰۴</span>
      <h1>این صفحه پیدا نشد</h1>
      <p>آدرس را بررسی کنید یا به نمای کلی برگردید.</p>
      <Link
        href="/"
        data-ui="button primary"
        className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
      >
        بازگشت به نمای کلی
      </Link>
    </main>
  );
}
