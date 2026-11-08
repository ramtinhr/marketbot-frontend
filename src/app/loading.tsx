export default function Loading() {
  return (
    <div
      data-ui="page-skeleton"
      className="grid [gap:20px] [padding-top:40px] [padding-right:40px] [padding-bottom:40px] [padding-left:40px] [&_div]:[height:90px] [&_div]:[border-radius:15px] [&_div]:[background:linear-gradient(90deg,_#e9eef2,_#f2f5f7,_#e9eef2)] [&_div]:[animation:pulse_1.5s_infinite]"
      role="status"
      aria-label="در حال دریافت صفحه"
    >
      <div />
      <div />
      <div />
    </div>
  );
}
