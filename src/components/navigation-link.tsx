'use client';

import Link, { useLinkStatus } from 'next/link';
import { LoaderCircle } from 'lucide-react';
import type { ComponentProps } from 'react';

function NavigationFeedback() {
  const { pending } = useLinkStatus();
  return (
    <>
      <span
        className="ms-auto inline-flex h-4 w-4 shrink-0 items-center justify-center"
        role={pending ? 'status' : undefined}
      >
        {pending && (
          <>
            <LoaderCircle
              size={16}
              aria-hidden="true"
              className="text-[var(--accent)] motion-safe:animate-spin"
            />
            <span className="sr-only">در حال دریافت صفحه…</span>
          </>
        )}
      </span>
      {pending && (
        <span
          aria-hidden="true"
          className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-1 bg-[var(--accent)] motion-safe:animate-pulse"
        />
      )}
    </>
  );
}

export function NavigationLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <NavigationFeedback />
    </Link>
  );
}
