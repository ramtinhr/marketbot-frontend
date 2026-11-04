'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="not-found">
      <h1>دریافت صفحه انجام نشد</h1>
      <p>لطفاً دوباره تلاش کنید.</p>
      <button className="button primary" onClick={reset}>
        تلاش دوباره
      </button>
    </main>
  );
}
