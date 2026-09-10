'use client';

import { CircleAlert } from 'lucide-react';

import type { AuthFieldErrorProps } from '@/modules/auth/types/components.types';

const ERROR_CLASS =
  'inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#B91C1C] animate-in fade-in slide-in-from-top-1 duration-150 motion-reduce:animate-none';

export function AuthFieldError({ id, message }: AuthFieldErrorProps) {
  return (
    <p id={id} className={ERROR_CLASS}>
      <CircleAlert aria-hidden="true" strokeWidth={2.2} className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}
