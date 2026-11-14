'use client';
import { CoinLogo } from './coin-logo';
import { ui } from '@/lib/ui-styles';
import styles from './modal.module.css';

import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Check, ChevronLeft, LoaderCircle, SearchX, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { errorText } from '@/lib/api';
import { assetName, number } from '@/lib/format';
export function AssetIcon({ asset, small = false }: { asset: string; small?: boolean }) {
  return (
    <span
      {...ui(`asset-icon asset-${asset.toLowerCase()} ${small ? 'small' : ''}`)}
      aria-hidden="true"
    >
      <CoinLogo asset={asset} />
    </span>
  );
}
export function AssetLabel({ asset }: { asset: string }) {
  return (
    <div
      data-ui="asset-label"
      className="flex items-center [gap:10px] [min-width:110px] [&_>_div]:flex [&_>_div]:flex-col [&_>_div]:[gap:2px] [&_strong]:[font-size:var(--text-sm)] [&_strong]:font-semibold [&_>_div_>_span]:[font-size:var(--text-xs)] [&_>_div_>_span]:[color:#66758a] [&_>_div_>_span]:[letter-spacing:0.3px]"
    >
      <AssetIcon asset={asset} />
      <div>
        <strong>{assetName(asset)}</strong>
        <span>{asset === 'IRT' ? 'تومان ایران' : asset}</span>
      </div>
    </div>
  );
}
export function Money({
  value,
  unit = 'تومان',
  decimals = 0,
}: {
  value: number | string;
  unit?: string;
  decimals?: number;
}) {
  return (
    <span
      data-ui="money"
      className="inline-flex items-baseline [gap:5px] tabular-nums whitespace-nowrap [&_small]:[font-size:var(--text-xs)] [&_small]:font-normal [&_small]:[color:#66758a]"
    >
      <bdi>{number(value, decimals)}</bdi>
      {unit && <small>{unit}</small>}
    </span>
  );
}
export function Change({ value }: { value: number }) {
  return (
    <span {...ui(`change ${value < 0 ? 'negative' : 'positive'}`)} dir="ltr">
      <ArrowUpRight size={13} style={{ transform: value < 0 ? 'rotate(90deg)' : undefined }} />
      {number(Math.abs(value), 2)}%
    </span>
  );
}
export function Panel({ children, appearance = '' }: { children: ReactNode; appearance?: string }) {
  return <section {...ui(`panel ${appearance}`)}>{children}</section>;
}
export function PanelTitle({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div
      data-ui="panel-title"
      className="flex-wrap flex items-center justify-between [gap:12px] [padding-top:var(--space-5)] [padding-right:var(--space-5)] [padding-bottom:var(--space-5)] [padding-left:var(--space-5)] [@media(width<=640px)]:[padding-top:var(--space-4)] [@media(width<=640px)]:[padding-right:var(--space-4)] [@media(width<=640px)]:[padding-bottom:var(--space-4)] [@media(width<=640px)]:[padding-left:var(--space-4)] [&_>_div]:min-w-0 [&_h2]:[font-size:var(--text-base)] [&_h2]:font-bold [&_p]:[font-size:var(--text-xs)] [&_p]:[color:#66758a] [&_p]:[margin-top:4px]"
    >
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
export function MoreLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      data-ui="text-link"
      className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
      href={href}
    >
      {children}
      <ChevronLeft size={15} />
    </Link>
  );
}
export function PageHeading({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div
      data-ui="page-heading"
      className="flex-wrap flex items-center justify-between [margin-bottom:var(--space-5)] [gap:var(--space-4)] [@media(width<=640px)]:items-start [@media(width<=640px)]:[margin-bottom:22px] [@media(width<=640px)]:[gap:17px] [@media(width<=640px)]:flex-col [&_>_div:first-child]:min-w-0 [&_p]:[font-size:var(--text-sm)] [&_p]:[color:#66758a] [&_p]:[margin-top:6px] [&_h1]:[font-size:27px] [&_[data-ui~='button']]:[font-size:var(--text-sm)] [&_[data-ui~='button']]:[min-height:44px] [@media(width<=640px)]:[&_h1]:[font-size:1.5rem] [@media(width<=1000px)]:[&_[data-ui~='button']]:[padding-top:9px] [@media(width<=1000px)]:[&_[data-ui~='button']]:[padding-right:12px] [@media(width<=1000px)]:[&_[data-ui~='button']]:[padding-bottom:9px] [@media(width<=1000px)]:[&_[data-ui~='button']]:[padding-left:12px]"
    >
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && (
        <div
          data-ui="heading-actions"
          className="flex-wrap [max-width:100%] flex [gap:var(--space-2)] shrink-0 [@media(width<=640px)]:[width:100%] [@media(width<=640px)]:[&_[data-ui~='button']]:[flex:1_1_140px] [@media(width<=640px)]:[&_[data-ui~='button']]:[font-size:var(--text-sm)]"
        >
          {actions}
        </div>
      )}
    </div>
  );
}
export function State({
  loading,
  error,
  retry,
  empty,
  children,
}: {
  loading?: boolean;
  error?: unknown;
  retry?: () => void;
  empty?: boolean;
  children: ReactNode;
}) {
  if (loading)
    return (
      <div
        data-ui="state-block"
        className="flex flex-col items-center justify-center [gap:12px] [color:#a3adb9] [min-height:180px] [padding-top:30px] [padding-right:30px] [padding-bottom:30px] [padding-left:30px] text-center [font-size:var(--text-xs)] [&_strong]:[font-size:var(--text-sm)] [&_strong]:[color:#91a0ad] [&_>_span]:[font-size:var(--text-xs)] [&_>_div]:flex [&_>_div]:items-center [&_>_div]:[gap:16px]"
        role="status"
      >
        <LoaderCircle data-ui="spin" className="[animation:spin_1s_linear_infinite]" size={25} />
        <span>در حال دریافت اطلاعات…</span>
      </div>
    );
  if (error)
    return (
      <div
        data-ui="state-block error-state"
        className="flex flex-col items-center justify-center [gap:12px] [color:#a3adb9] [min-height:180px] [padding-top:30px] [padding-right:30px] [padding-bottom:30px] [padding-left:30px] text-center [font-size:var(--text-xs)] [&_strong]:[font-size:var(--text-sm)] [&_strong]:[color:#91a0ad] [&_>_span]:[font-size:var(--text-xs)] [&_>_div]:flex [&_>_div]:items-center [&_>_div]:[gap:16px] [&_p]:[color:var(--error-text)]"
        role="alert"
      >
        <p>{errorText(error)}</p>
        <div>
          <button
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={retry}
          >
            تلاش دوباره
          </button>
          <Link
            data-ui="text-link"
            className="[font-size:var(--text-xs)] [color:var(--accent)] inline-flex items-center [gap:5px] font-semibold [padding-top:0] [padding-right:0] [padding-bottom:0] [padding-left:0] [&:hover]:[color:var(--accent-dark)]"
            href="/login"
          >
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  if (empty)
    return (
      <div
        data-ui="state-block"
        className="flex flex-col items-center justify-center [gap:12px] [color:#a3adb9] [min-height:180px] [padding-top:30px] [padding-right:30px] [padding-bottom:30px] [padding-left:30px] text-center [font-size:var(--text-xs)] [&_strong]:[font-size:var(--text-sm)] [&_strong]:[color:#91a0ad] [&_>_span]:[font-size:var(--text-xs)] [&_>_div]:flex [&_>_div]:items-center [&_>_div]:[gap:16px]"
      >
        <SearchX size={28} />
        <strong>هنوز موردی وجود ندارد</strong>
        <span>با شروع فعالیت، اطلاعات شما اینجا نمایش داده می‌شود.</span>
      </div>
    );
  return children;
}
export function Modal({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'default',
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
  size?: 'compact' | 'default' | 'wide';
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay data-ui="modal-overlay" className={styles.overlay} />
        <Dialog.Content
          data-ui="modal-content"
          data-size={size}
          className={styles.content}
          dir="rtl"
        >
          <div data-ui="modal-header" className={styles.header}>
            <div className={styles.heading}>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className={styles.close} aria-label="بستن" type="button">
              <X size={20} />
            </Dialog.Close>
          </div>
          <div className={styles.body}>{children}</div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label
      data-ui="field"
      className="flex flex-col [gap:7px] [font-size:var(--text-sm)] [color:#6b788b] [&_>_span]:font-medium [&_>_small]:[font-size:var(--text-xs)] [&_>_small]:font-normal [&_>_small]:[color:#66758a] [&_>_input]:[width:100%] [&_>_input]:[background:#fff] [&_>_input]:[border-top-width:1px] [&_>_input]:[border-top-style:solid] [&_>_input]:[border-top-color:#e3e9ef] [&_>_input]:[border-right-width:1px] [&_>_input]:[border-right-style:solid] [&_>_input]:[border-right-color:#e3e9ef] [&_>_input]:[border-bottom-width:1px] [&_>_input]:[border-bottom-style:solid] [&_>_input]:[border-bottom-color:#e3e9ef] [&_>_input]:[border-left-width:1px] [&_>_input]:[border-left-style:solid] [&_>_input]:[border-left-color:#e3e9ef] [&_>_input]:[border-radius:8px] [&_>_input]:[padding-top:11px] [&_>_input]:[padding-right:12px] [&_>_input]:[padding-bottom:11px] [&_>_input]:[padding-left:12px] [&_>_input]:[font-size:var(--text-sm)] [&_>_select]:[width:100%] [&_>_select]:[background:#fff] [&_>_select]:[border-top-width:1px] [&_>_select]:[border-top-style:solid] [&_>_select]:[border-top-color:#e3e9ef] [&_>_select]:[border-right-width:1px] [&_>_select]:[border-right-style:solid] [&_>_select]:[border-right-color:#e3e9ef] [&_>_select]:[border-bottom-width:1px] [&_>_select]:[border-bottom-style:solid] [&_>_select]:[border-bottom-color:#e3e9ef] [&_>_select]:[border-left-width:1px] [&_>_select]:[border-left-style:solid] [&_>_select]:[border-left-color:#e3e9ef] [&_>_select]:[border-radius:8px] [&_>_select]:[padding-top:11px] [&_>_select]:[padding-right:12px] [&_>_select]:[padding-bottom:11px] [&_>_select]:[padding-left:12px] [&_>_select]:[font-size:var(--text-sm)] [&_>_textarea]:[width:100%] [&_>_textarea]:[background:#fff] [&_>_textarea]:[border-top-width:1px] [&_>_textarea]:[border-top-style:solid] [&_>_textarea]:[border-top-color:#e3e9ef] [&_>_textarea]:[border-right-width:1px] [&_>_textarea]:[border-right-style:solid] [&_>_textarea]:[border-right-color:#e3e9ef] [&_>_textarea]:[border-bottom-width:1px] [&_>_textarea]:[border-bottom-style:solid] [&_>_textarea]:[border-bottom-color:#e3e9ef] [&_>_textarea]:[border-left-width:1px] [&_>_textarea]:[border-left-style:solid] [&_>_textarea]:[border-left-color:#e3e9ef] [&_>_textarea]:[border-radius:8px] [&_>_textarea]:[padding-top:11px] [&_>_textarea]:[padding-right:12px] [&_>_textarea]:[padding-bottom:11px] [&_>_textarea]:[padding-left:12px] [&_>_textarea]:[font-size:var(--text-sm)] [@media(width<=800px)]:[&_>_input]:[font-size:var(--text-base)] [@media(width<=800px)]:[&_>_select]:[font-size:var(--text-base)] [@media(width<=640px)]:[&_>_textarea]:[font-size:var(--text-base)]"
    >
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function StatusBadge({ children, good = false }: { children: ReactNode; good?: boolean }) {
  return (
    <span {...ui(`status-badge ${good ? 'good' : ''}`)}>
      {good && <Check size={12} />} {children}
    </span>
  );
}
