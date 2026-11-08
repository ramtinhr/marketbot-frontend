import { Suspense } from 'react';
import { PageLoading } from '@/components/page-loading';
import { Markets } from '@/features/markets/markets';
export const metadata = { title: 'بازارها' };
export default function Page() {
  return (
    <Suspense fallback={<PageLoading />}>
      <Markets />
    </Suspense>
  );
}
