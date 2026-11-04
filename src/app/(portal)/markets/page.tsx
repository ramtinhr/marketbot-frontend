import { Suspense } from 'react';
import { Markets } from '@/features/markets/markets';
export const metadata = { title: 'بازارها' };
export default function Page() {
  return (
    <Suspense>
      <Markets />
    </Suspense>
  );
}
