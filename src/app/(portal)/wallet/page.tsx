import { Suspense } from 'react';
import { WalletPage } from '@/features/wallet/wallet';
export const metadata = { title: 'کیف پول' };
export default function Page() {
  return (
    <Suspense>
      <WalletPage />
    </Suspense>
  );
}
