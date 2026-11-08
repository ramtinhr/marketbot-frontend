'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, ShieldCheck } from 'lucide-react';
import { useBanks } from '@/lib/use-data';
import { api, errorText } from '@/lib/api';
import { normalizeIban, validIban } from '@/lib/validation';
import { digits } from '@/lib/format';
import { useApp } from '@/providers/app-provider';
import { Field, Modal, PageHeading, State } from '@/components/ui';
import type { BankAccount } from '@/lib/types';
import { BankCard } from './bank-card';
export function Banks() {
  const banks = useBanks();
  const client = useQueryClient();
  const { demo, notify } = useApp();
  const [add, setAdd] = useState(false);
  const [remove, setRemove] = useState<BankAccount | null>(null);
  const [label, setLabel] = useState('');
  const [holder, setHolder] = useState('');
  const [iban, setIban] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validIban(iban)) {
      setError('شمارهٔ شبا معتبر نیست. ۲۴ رقم بعد از IR را بررسی کنید.');
      return;
    }
    if (!holder.trim() || holder.trim().length > 120 || !label.trim() || label.trim().length > 80) {
      setError(
        'نام صاحب حساب الزامی و حداکثر ۱۲۰ نویسه است؛ عنوان حساب الزامی و حداکثر ۸۰ نویسه است.',
      );
      return;
    }
    setBusy(true);
    setError('');
    try {
      const body = { label: label.trim(), holder_name: holder.trim(), iban: normalizeIban(iban) };
      if (demo) {
        client.setQueryData<{ accounts: BankAccount[] }>(['banks'], (old) => ({
          accounts: [...(old?.accounts ?? []), { ...body, id: `demo-${Date.now()}` }],
        }));
      } else {
        await api('/bank-accounts', { method: 'POST', body });
        await banks.refetch();
      }
      notify(demo ? 'حساب نمونه اضافه شد.' : 'حساب بانکی ذخیره شد.');
      setAdd(false);
      setLabel('');
      setHolder('');
      setIban('');
    } catch (e) {
      setError(errorText(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeading
        title="حساب‌های بانکی"
        description="حساب‌های مقصد برداشت را یک‌جا نگه دارید و مدیریت کنید."
        actions={
          <button
            data-ui="button primary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={() => setAdd(true)}
          >
            <Plus size={17} />
            افزودن حساب بانکی
          </button>
        }
      />
      <div
        data-ui="info-banner"
        className="flex items-start [gap:13px] [padding-top:19px] [padding-right:23px] [padding-bottom:19px] [padding-left:23px] [background:#edf7f2] [border-top-width:1px] [border-top-style:solid] [border-top-color:#e1efe7] [border-right-width:1px] [border-right-style:solid] [border-right-color:#e1efe7] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:#e1efe7] [border-left-width:1px] [border-left-style:solid] [border-left-color:#e1efe7] [border-radius:12px] [margin-bottom:25px] [color:#3d987c] [@media(width<=640px)]:[gap:11px] [@media(width<=640px)]:[padding-top:18px] [@media(width<=640px)]:[padding-right:18px] [@media(width<=640px)]:[padding-bottom:18px] [@media(width<=640px)]:[padding-left:18px] [&_strong]:[font-size:var(--text-sm)] [&_strong]:font-semibold [&_p]:[font-size:var(--text-sm)] [&_p]:[color:#83a295] [&_p]:[margin-top:5px]"
      >
        <ShieldCheck size={20} />
        <div>
          <strong>اطلاعات بانکی شما، در اختیار شما</strong>
          <p>حساب‌های ذخیره‌شده مقصد برداشت هستند. ثبت حساب به معنی تأیید مالکیت بانکی آن نیست.</p>
        </div>
      </div>
      <State
        loading={banks.isPending}
        error={banks.error}
        retry={() => banks.refetch()}
        empty={!banks.data?.accounts.length}
      >
        <div
          data-ui="bank-grid"
          className="grid [grid-template-columns:repeat(3,_minmax(0,_1fr))] [gap:20px] [@media(width<=640px)]:[grid-template-columns:1fr] [@media(width>640px)]:[@media(width<=1250px)]:[grid-template-columns:1fr_1fr] [@media(width<=800px)]:[gap:16px]"
        >
          {banks.data?.accounts.map((b) => (
            <BankCard key={b.id} account={b} onRemove={() => setRemove(b)} />
          ))}
          <button
            data-ui="add-bank-card"
            className="[border-top-width:1px] [border-top-style:dashed] [border-top-color:#dce5eb] [border-right-width:1px] [border-right-style:dashed] [border-right-color:#dce5eb] [border-bottom-width:1px] [border-bottom-style:dashed] [border-bottom-color:#dce5eb] [border-left-width:1px] [border-left-style:dashed] [border-left-color:#dce5eb] [border-radius:15px] [min-height:270px] flex flex-col items-center justify-center [gap:10px] [color:#8c9eac] [background:#f9fbfc] [@media(width<=640px)]:[min-height:170px] [&_>_span]:[width:43px] [&_>_span]:[height:43px] [&_>_span]:[border-radius:50%] [&_>_span]:[border-top-width:1px] [&_>_span]:[border-top-style:solid] [&_>_span]:[border-top-color:#e1e9ee] [&_>_span]:[border-right-width:1px] [&_>_span]:[border-right-style:solid] [&_>_span]:[border-right-color:#e1e9ee] [&_>_span]:[border-bottom-width:1px] [&_>_span]:[border-bottom-style:solid] [&_>_span]:[border-bottom-color:#e1e9ee] [&_>_span]:[border-left-width:1px] [&_>_span]:[border-left-style:solid] [&_>_span]:[border-left-color:#e1e9ee] [&_>_span]:grid [&_>_span]:place-items-center [&_>_span]:[color:#92b2a6] [&_>_span]:[margin-bottom:5px] [&_strong]:[font-size:var(--text-base)] [&_strong]:font-medium [&_small]:[font-size:var(--text-sm)] [&_small]:[color:#acb6c0] [&:hover]:[background:#f1f8f5] [&:hover]:[border-top-color:#a6cebd] [&:hover]:[border-right-color:#a6cebd] [&:hover]:[border-bottom-color:#a6cebd] [&:hover]:[border-left-color:#a6cebd]"
            onClick={() => setAdd(true)}
          >
            <span>
              <Plus size={24} />
            </span>
            <strong>افزودن حساب جدید</strong>
            <small>شمارهٔ شبا و نام صاحب حساب</small>
          </button>
        </div>
      </State>
      <Modal
        open={add}
        onOpenChange={setAdd}
        title="افزودن حساب بانکی"
        description="برای ذخیرهٔ مقصد برداشت، اطلاعات حساب را وارد کنید."
      >
        <form noValidate data-ui="form-stack" className="flex flex-col [gap:19px]" onSubmit={save}>
          <Field label="عنوان حساب">
            <input
              required
              maxLength={80}
              placeholder="مثلاً حساب شخصی"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
          <Field label="نام و نام خانوادگی صاحب حساب">
            <input
              required
              maxLength={120}
              value={holder}
              onChange={(e) => setHolder(e.target.value)}
            />
          </Field>
          <Field label="شمارهٔ شبا" hint="IR و ۲۴ رقم؛ از روی اطلاعات بانک وارد کنید.">
            <input
              dir="ltr"
              required
              maxLength={34}
              placeholder="IR …"
              value={iban}
              onChange={(e) => setIban(digits(e.target.value))}
            />
          </Field>
          {error && (
            <p
              data-ui="inline-error"
              className="[font-size:var(--text-xs)] [color:var(--error-text)] [background:#fff1f3] [padding-top:10px] [padding-right:12px] [padding-bottom:10px] [padding-left:12px] [border-radius:7px] [line-height:1.9] [&_[data-ui~='text-link']]:[color:var(--error-text)]"
              role="alert"
            >
              {error}
            </p>
          )}
          <div
            data-ui="dialog-actions"
            className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
          >
            <button
              type="button"
              data-ui="button secondary"
              className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
              onClick={() => setAdd(false)}
            >
              انصراف
            </button>
            <button
              type="submit"
              data-ui="button primary"
              className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
              disabled={busy}
            >
              {busy ? 'در حال ذخیره…' : 'ذخیرهٔ حساب'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={!!remove}
        size="compact"
        onOpenChange={(open) => !open && setRemove(null)}
        title="حذف حساب بانکی"
        description="حساب از مقصدهای ذخیره‌شده حذف می‌شود؛ سوابق برداشت حفظ می‌شوند."
      >
        <div
          data-ui="dialog-actions"
          className="flex justify-end [gap:9px] [padding-top:22px] [margin-top:3px] [border-top-width:1px] [border-top-style:solid] [border-top-color:var(--line)] [@media(width<=640px)]:flex-wrap [&_[data-ui~='button']]:[min-width:96px]"
        >
          <button
            data-ui="button secondary"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            onClick={() => setRemove(null)}
          >
            انصراف
          </button>
          <button
            data-ui="button danger"
            className="inline-flex items-center justify-center [gap:8px] [border-radius:8px] [padding-top:10px] [padding-right:16px] [padding-bottom:10px] [padding-left:16px] [border-top-width:1px] [border-top-style:solid] [border-top-color:transparent] [border-right-width:1px] [border-right-style:solid] [border-right-color:transparent] [border-bottom-width:1px] [border-bottom-style:solid] [border-bottom-color:transparent] [border-left-width:1px] [border-left-style:solid] [border-left-color:transparent] [font-size:var(--text-sm)] font-semibold [min-height:44px] whitespace-nowrap [transition:background_0.15s,_box-shadow_0.15s] [&[data-ui~='primary']]:[background:var(--accent)] [&[data-ui~='primary']]:[color:#fff] [&[data-ui~='primary']]:[box-shadow:0_3px_5px_#079a7c08] [&[data-ui~='primary']:hover]:[background:var(--accent-dark)] [&[data-ui~='secondary']]:[background:#fff] [&[data-ui~='secondary']]:[border-top-color:#e4e9ef] [&[data-ui~='secondary']]:[border-right-color:#e4e9ef] [&[data-ui~='secondary']]:[border-bottom-color:#e4e9ef] [&[data-ui~='secondary']]:[border-left-color:#e4e9ef] [&[data-ui~='secondary']]:[color:#657183] [&[data-ui~='secondary']:hover]:[background:#f6f8fa] [&[data-ui~='danger']]:[background:var(--red)] [&[data-ui~='danger']]:[color:#fff] [&[data-ui~='full']]:[width:100%]"
            disabled={busy}
            onClick={async () => {
              if (!remove) return;
              setBusy(true);
              try {
                if (demo)
                  client.setQueryData<{ accounts: BankAccount[] }>(['banks'], (old) => ({
                    accounts: old?.accounts.filter((b) => b.id !== remove.id) ?? [],
                  }));
                else {
                  await api(`/bank-accounts/${remove.id}`, { method: 'DELETE' });
                  await banks.refetch();
                }
                notify('حساب از فهرست حذف شد.');
                setRemove(null);
              } catch (e) {
                notify(errorText(e), true);
              } finally {
                setBusy(false);
              }
            }}
          >
            حذف حساب
          </button>
        </div>
      </Modal>
    </>
  );
}
