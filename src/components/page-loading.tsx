export function PageLoading() {
  return (
    <section
      role="status"
      aria-label="در حال دریافت صفحه"
      aria-busy="true"
      className="space-y-6 py-2"
    >
      <span className="sr-only">در حال دریافت صفحه…</span>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        <div className="space-y-3">
          <div className="h-7 w-40 rounded-lg bg-slate-200" />
          <div className="h-4 w-64 max-w-full rounded bg-slate-100" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 rounded-xl border border-slate-100 bg-white p-5">
              <div className="h-3 w-20 rounded bg-slate-100" />
              <div className="mt-5 h-6 w-28 rounded bg-slate-200" />
            </div>
          ))}
        </div>
        <div className="space-y-5 rounded-xl border border-slate-100 bg-white p-5">
          <div className="mb-7 h-5 w-32 rounded bg-slate-200" />
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="flex gap-6 border-b border-slate-50 pb-4">
              <div className="h-4 w-1/3 rounded bg-slate-100" />
              <div className="h-4 w-1/4 rounded bg-slate-100" />
              <div className="ms-auto h-4 w-16 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
