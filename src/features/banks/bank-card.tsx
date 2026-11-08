import type { CSSProperties } from 'react';
import { Landmark, Trash2 } from 'lucide-react';
import { bankFromIban, formatIban } from '@/lib/bank-brands';
import type { BankAccount } from '@/lib/types';

export function BankCard({ account, onRemove }: { account: BankAccount; onRemove: () => void }) {
  const bank = bankFromIban(account.iban);
  const style = {
    '--bank-base': bank.base,
    '--bank-tone': bank.tone,
    '--bank-accent': bank.accent,
  } as CSSProperties;

  return (
    <article
      data-ui="bank-design-card"
      className="relative [isolation:isolate] flex flex-col justify-between [gap:22px] min-w-0 [min-height:230px] overflow-hidden [padding-top:24px] [padding-right:24px] [padding-bottom:24px] [padding-left:24px] [border-top-width:1px] [border-top-style:solid] [border-top-color:rgb(255_255_255_/_0.17)] [border-right-width:1px] [border-right-style:solid] [border-right-color:rgb(255_255_255_/_0.17)] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:rgb(255_255_255_/_0.17)] [border-left-width:1px] [border-left-style:solid] [border-left-color:rgb(255_255_255_/_0.17)] [border-radius:24px] [background:radial-gradient(_ellipse_at_0%_0%,_color-mix(in_srgb,_var(--bank-tone)_85%,_white)_0%,_transparent_64%_),_linear-gradient(125deg,_var(--bank-tone),_var(--bank-base)_75%)] [box-shadow:0_12px_28px_color-mix(in_srgb,_var(--bank-base)_20%,_transparent),_inset_0_1px_0_rgb(255_255_255_/_0.12)] [color:#fff] text-right font-normal [height:100%] [container-type:inline-size] [@media(width<=380px)]:[padding-top:20px] [@media(width<=380px)]:[padding-right:20px] [@media(width<=380px)]:[padding-bottom:20px] [@media(width<=380px)]:[padding-left:20px]"
      style={style}
      aria-label={`${bank.name}، ${account.label}`}
    >
      <div
        data-ui="bank-design-pattern"
        className="absolute [z-index:-1] [inset:0] overflow-hidden pointer-events-none [background:repeating-linear-gradient(_125deg,_transparent_0_16px,_rgb(255_255_255_/_0.025)_16px_17px_)] [&::before]:[content:''] [&::before]:absolute [&::before]:[width:320px] [&::before]:[height:320px] [&::before]:[border-radius:50%] [&::before]:[border-top-width:1px] [&::before]:[border-top-style:solid] [&::before]:[border-top-color:rgb(255_255_255_/_0.13)] [&::before]:[border-right-width:1px] [&::before]:[border-right-style:solid] [&::before]:[border-right-color:rgb(255_255_255_/_0.13)] [&::before]:[border-bottom-width:1px] [&::before]:[border-bottom-style:solid] [&::before]:[border-bottom-color:rgb(255_255_255_/_0.13)] [&::before]:[border-left-width:1px] [&::before]:[border-left-style:solid] [&::before]:[border-left-color:rgb(255_255_255_/_0.13)] [&::before]:[inset-inline-start:-155px] [&::before]:[top:-160px] [&::before]:[box-shadow:0_0_0_22px_rgb(255_255_255_/_0.035),_0_0_0_45px_rgb(255_255_255_/_0.035),_0_0_0_68px_rgb(255_255_255_/_0.025)] [&::after]:[content:''] [&::after]:absolute [&::after]:[width:180px] [&::after]:[height:180px] [&::after]:[border-radius:50%] [&::after]:[border-top-width:1px] [&::after]:[border-top-style:solid] [&::after]:[border-top-color:rgb(255_255_255_/_0.13)] [&::after]:[border-right-width:1px] [&::after]:[border-right-style:solid] [&::after]:[border-right-color:rgb(255_255_255_/_0.13)] [&::after]:[border-bottom-width:1px] [&::after]:[border-bottom-style:solid] [&::after]:[border-bottom-color:rgb(255_255_255_/_0.13)] [&::after]:[border-left-width:1px] [&::after]:[border-left-style:solid] [&::after]:[border-left-color:rgb(255_255_255_/_0.13)] [&::after]:[inset-inline-start:auto] [&::after]:[top:auto] [&::after]:[box-shadow:0_0_0_22px_rgb(255_255_255_/_0.035),_0_0_0_45px_rgb(255_255_255_/_0.035),_0_0_0_68px_rgb(255_255_255_/_0.025)] [&::after]:[bottom:-150px] [&::after]:[inset-inline-end:-40px]"
        aria-hidden="true"
      />
      <div data-ui="bank-design-top" className="flex items-center [gap:12px]">
        <span
          data-ui="bank-design-logo"
          className="grid place-items-center [flex:0_0_52px] [width:52px] [height:52px] [padding-top:8px] [padding-right:8px] [padding-bottom:8px] [padding-left:8px] [background:#fff] [border-radius:16px] [box-shadow:0_3px_12px_rgb(0_0_0_/_0.1)] [@media(width<=380px)]:[width:44px] [@media(width<=380px)]:[height:44px] [@media(width<=380px)]:[flex-basis:44px] [&_img]:[width:100%] [&_img]:[height:100%] [&_img]:[object-fit:contain] [&_svg]:[width:100%] [&_svg]:[height:100%] [&_svg]:[object-fit:contain] [&_svg]:[color:var(--bank-base)]"
        >
          {bank.logo ? (
            <img src={bank.logo} alt="" width={36} height={36} />
          ) : (
            <Landmark size={36} />
          )}
        </span>
        <div
          data-ui="bank-design-heading"
          className="flex flex-col [gap:3px] min-w-0 [flex:1] [&_strong]:[font-size:var(--text-base)] [&_strong]:font-bold [&_strong]:[line-height:1.45] [&_>_span]:[color:rgb(255_255_255_/_0.72)] [&_>_span]:[font-size:var(--text-xs)] [&_>_span]:[overflow-wrap:anywhere]"
        >
          <strong>{bank.name}</strong>
          <span>{account.label}</span>
        </div>
        <button
          type="button"
          data-ui="bank-design-remove"
          className="grid place-items-center [flex:0_0_36px] [width:36px] [height:36px] [margin-inline-start:auto] [border-top-width:1px] [border-top-style:solid] [border-top-color:rgb(255_255_255_/_0.22)] [border-right-width:1px] [border-right-style:solid] [border-right-color:rgb(255_255_255_/_0.22)] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:rgb(255_255_255_/_0.22)] [border-left-width:1px] [border-left-style:solid] [border-left-color:rgb(255_255_255_/_0.22)] [border-radius:50%] [background:rgb(0_0_0_/_0.1)] [color:#fff] [cursor:pointer] [&:hover]:[background:rgb(255_255_255_/_0.2)] [&:focus-visible]:[outline:2px_solid_#fff] [&:focus-visible]:[outline-offset:3px]"
          aria-label={`حذف ${account.label}`}
          onClick={onRemove}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div
        data-ui="bank-design-number"
        className="flex flex-col [gap:5px] [&_>_span]:[color:var(--bank-accent)] [&_>_span]:[font-size:var(--text-xs)] [&_>_span]:font-semibold [&_bdi]:block [&_bdi]:text-left [&_bdi]:whitespace-nowrap [&_bdi]:[font-family:ui-monospace,_SFMono-Regular,_Consolas,_monospace] [&_bdi]:[font-size:clamp(11px,_4.3cqi,_17px)] [&_bdi]:[letter-spacing:0.025em] [&_bdi]:font-medium [&_bdi]:[line-height:1.6] [&_bdi]:[user-select:all]"
      >
        <span>شمارهٔ شبا</span>
        <bdi dir="ltr">{formatIban(account.iban)}</bdi>
      </div>
      <div
        data-ui="bank-design-bottom"
        className="flex items-center justify-between [gap:12px] [font-size:var(--text-sm)] [&_>_span:first-child]:[overflow-wrap:anywhere]"
      >
        <span>{account.holder_name}</span>
        <span
          data-ui="bank-design-mark"
          className="shrink-0 [color:var(--bank-accent)] [font:600_0.75rem/1_ui-monospace,_monospace] [letter-spacing:0.12em] [direction:ltr]"
          aria-hidden="true"
        >
          IR / IBAN
        </span>
      </div>
    </article>
  );
}
