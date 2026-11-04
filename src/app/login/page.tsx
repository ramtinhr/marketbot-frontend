import { Suspense } from 'react';
import { Login } from '@/features/auth/login';
export const metadata = { title: 'ورود به حساب' };
export default function Page() {
  return (
    <Suspense>
      <Login />
    </Suspense>
  );
}
