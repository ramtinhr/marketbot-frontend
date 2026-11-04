'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowUpRight, Check, ChevronLeft, LoaderCircle, SearchX, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { errorText } from '@/lib/api';
import { assetName, number } from '@/lib/format';
export function AssetIcon({ asset, small = false }: { asset: string; small?: boolean }) {
  return (
    <span
      className={`asset-icon asset-${asset.toLowerCase()} ${small ? 'small' : ''}`}
      aria-hidden="true"
    >
      {({ BTC: '₿', ETH: 'Ξ', USDT: '₮', IRT: 'ت', TON: '◈' } as Record<string, string>)[asset] ??
        asset.charAt(0)}
    </span>
  );
}
export function AssetLabel({ asset }: { asset: string }) {
  return (
    <div className="asset-label">
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
    <span className="money">
      <bdi>{number(value, decimals)}</bdi>
      {unit && <small>{unit}</small>}
    </span>
  );
}
export function Change({ value }: { value: number }) {
  return (
    <span className={`change ${value < 0 ? 'negative' : 'positive'}`} dir="ltr">
      <ArrowUpRight size={13} style={{ transform: value < 0 ? 'rotate(90deg)' : undefined }} />
      {number(Math.abs(value), 2)}%
    </span>
  );
}
export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>;
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
    <div className="panel-title">
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
    <Link className="text-link" href={href}>
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
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
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
      <div className="state-block" role="status">
        <LoaderCircle className="spin" size={25} />
        <span>در حال دریافت اطلاعات…</span>
      </div>
    );
  if (error)
    return (
      <div className="state-block error-state" role="alert">
        <p>{errorText(error)}</p>
        <div>
          <button className="button secondary" onClick={retry}>
            تلاش دوباره
          </button>
          <Link className="text-link" href="/login">
            ورود به حساب
          </Link>
        </div>
      </div>
    );
  if (empty)
    return (
      <div className="state-block">
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
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay" />
        <Dialog.Content className="modal-content" dir="rtl">
          <div className="modal-header">
            <div>
              <Dialog.Title>{title}</Dialog.Title>
              <Dialog.Description>{description}</Dialog.Description>
            </div>
            <Dialog.Close className="icon-button" aria-label="بستن">
              <X size={20} />
            </Dialog.Close>
          </div>
          {children}
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
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function StatusBadge({ children, good = false }: { children: ReactNode; good?: boolean }) {
  return (
    <span className={`status-badge ${good ? 'good' : ''}`}>
      {good && <Check size={12} />} {children}
    </span>
  );
}
