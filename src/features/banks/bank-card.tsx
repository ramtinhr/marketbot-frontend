import type { CSSProperties } from 'react';
import { Landmark, Trash2 } from 'lucide-react';
import { bankFromIban, formatIban } from '@/lib/bank-brands';
import type { BankAccount } from '@/lib/types';
import styles from './bank-card.module.css';

export function BankCard({ account, onRemove }: { account: BankAccount; onRemove: () => void }) {
  const bank = bankFromIban(account.iban);
  const style = {
    '--bank-base': bank.base,
    '--bank-tone': bank.tone,
    '--bank-accent': bank.accent,
  } as CSSProperties;

  return (
    <article className={styles.card} style={style} aria-label={`${bank.name}، ${account.label}`}>
      <div className={styles.pattern} aria-hidden="true" />
      <div className={styles.top}>
        <span className={styles.logo}>
          {bank.logo ? (
            <img src={bank.logo} alt="" width={36} height={36} />
          ) : (
            <Landmark size={36} />
          )}
        </span>
        <div className={styles.heading}>
          <strong>{bank.name}</strong>
          <span>{account.label}</span>
        </div>
        <button
          type="button"
          className={styles.remove}
          aria-label={`حذف ${account.label}`}
          onClick={onRemove}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <div className={styles.number}>
        <span>شمارهٔ شبا</span>
        <bdi dir="ltr">{formatIban(account.iban)}</bdi>
      </div>
      <div className={styles.bottom}>
        <span>{account.holder_name}</span>
        <span className={styles.mark} aria-hidden="true">
          IR / IBAN
        </span>
      </div>
    </article>
  );
}
