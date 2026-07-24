'use client';

import { ArrowLeft } from 'lucide-react';

import { Link } from '@/i18n/navigation';

interface AuthBackLinkProps {
  label: string;
}

// "← Back to sign in" (design spec 06 §1.3:12) — centred, 14/600, primary ink.
export function AuthBackLink({ label }: AuthBackLinkProps) {
  return (
    <Link
      href="/sign-in"
      className="group inline-flex min-h-11 items-center justify-center gap-1.5 self-center rounded-sm px-1 text-body-md font-semibold text-primary transition-colors duration-150 hover:text-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <ArrowLeft
        aria-hidden="true"
        className="size-4 transition-transform duration-150 ease-out-expo group-hover:-translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
      />
      {label}
    </Link>
  );
}
