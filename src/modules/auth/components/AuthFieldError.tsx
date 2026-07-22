'use client';

import { CircleAlert } from 'lucide-react';

import { AUTH_ERROR_CLASS } from '@/modules/auth/constants/auth-field.constants';

interface AuthFieldErrorProps {
  id: string;
  message: string;
}

export function AuthFieldError({ id, message }: AuthFieldErrorProps) {
  return (
    <p id={id} className={AUTH_ERROR_CLASS}>
      <CircleAlert aria-hidden="true" strokeWidth={2.2} className="size-3.5 shrink-0" />
      {message}
    </p>
  );
}
