'use client';

import type { FormShellProps } from '@/modules/forms/types/forms.types';

// U-18 — the `<form>` and its root-error paragraph, nothing else. Fields stay
// hand-written per surface on `FieldShell`; every string is a prop (R-15), and
// it takes a handler, never a schema, so it cannot grow into a renderer (R-18).
export function FormShell({
  id,
  onSubmit,
  rootError,
  submitting,
  className,
  children,
}: FormShellProps) {
  return (
    <form noValidate className={className} onSubmit={onSubmit} aria-busy={submitting || undefined}>
      {rootError ? (
        <p role="alert" className="text-sm text-destructive" data-testid={`${id}-root-error`}>
          {rootError}
        </p>
      ) : null}
      {children}
    </form>
  );
}
