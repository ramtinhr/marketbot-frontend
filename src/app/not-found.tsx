import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="not-found">
      <span>۴۰۴</span>
      <h1>این صفحه پیدا نشد</h1>
      <p>آدرس را بررسی کنید یا به نمای کلی برگردید.</p>
      <Link href="/" className="button primary">
        بازگشت به نمای کلی
      </Link>
    </main>
  );
}
