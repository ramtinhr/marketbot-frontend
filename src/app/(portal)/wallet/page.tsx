import { Suspense } from 'react';
import { PageLoading } from '@/components/page-loading';
import { WalletPage } from '@/features/wallet/wallet';
export const metadata = { title: 'کیف پول' };
export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <WalletPage />
    </Suspense>
  );
}
