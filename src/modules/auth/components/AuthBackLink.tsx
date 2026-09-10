'use client';

import { ArrowLeft } from 'lucide-react';

import { Link } from '@/i18n/navigation';

import type { AuthBackLinkProps } from '@/modules/auth/types/components.types';

export function AuthBackLink({ label }: AuthBackLinkProps) {
  return (
    <Link
      href="/sign-in"
      className="group inline-flex min-h-11 items-center justify-center gap-2 self-center rounded-sm px-1 text-[14.5px] font-semibold text-[#1D4ED8] no-underline hover:text-[#0E2350] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-4 transition-transform duration-150 ease-out-expo group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      />
      {label}
    </Link>
  );
}
