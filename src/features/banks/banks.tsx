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
          <button className="button primary" onClick={() => setAdd(true)}>
            <Plus size={17} />
            افزودن حساب بانکی
          </button>
        }
      />
      <div className="info-banner">
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
        <div className="bank-grid">
          {banks.data?.accounts.map((b) => (
            <BankCard key={b.id} account={b} onRemove={() => setRemove(b)} />
          ))}
          <button className="add-bank-card" onClick={() => setAdd(true)}>
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
        <form noValidate className="form-stack" onSubmit={save}>
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
            <p className="inline-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="button secondary" onClick={() => setAdd(false)}>
              انصراف
            </button>
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? 'در حال ذخیره…' : 'ذخیرهٔ حساب'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        open={!!remove}
        onOpenChange={(open) => !open && setRemove(null)}
        title="حذف حساب بانکی"
        description="حساب از مقصدهای ذخیره‌شده حذف می‌شود؛ سوابق برداشت حفظ می‌شوند."
      >
        <div className="dialog-actions">
          <button className="button secondary" onClick={() => setRemove(null)}>
            انصراف
          </button>
          <button
            className="button danger"
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
