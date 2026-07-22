import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';

import type { FieldShellProps } from '@/modules/design-system/types/choice.types';

// Canonical field stack (DS §06): column, 6–7px gap, label 13.5/600 #16326E with a
// #DC2626 required marker, helper 12.5px, error 12.5/500 #DC2626 + 13px alert icon.
// Two label modes because the two control shapes need different wiring: a single
// focusable control takes <label for>, a radiogroup takes aria-labelledby (a <label>
// pointing at a group is not a real label and axe rejects it).
// Canonical helper ink is #94A3B8 — 2.56:1, a straight AA failure — so helper text
// takes --muted-foreground (#64748B, 4.76:1 on white) instead.

function helperId(id: string) {
  return `${id}-helper`;
}

function errorId(id: string) {
  return `${id}-error`;
}

function describedBy(id: string, helperText?: string, errorText?: string) {
  const ids = [helperText ? helperId(id) : null, errorText ? errorId(id) : null].filter(Boolean);
  return ids.length > 0 ? ids.join(' ') : undefined;
}

function FieldShell({
  id,
  label,
  children,
  helperText,
  errorText,
  required,
  disabled,
  labelId,
  className,
}: FieldShellProps) {
  const labelClass = cn(
    'text-body-sm font-semibold',
    disabled ? 'text-muted-foreground' : 'text-secondary-foreground',
  );
  return (
    <div
      data-slot="field-shell"
      data-invalid={errorText ? '' : undefined}
      className={cn('flex min-w-0 flex-col gap-1.5', className)}
    >
      {labelId ? (
        <span id={labelId} className={labelClass}>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </span>
      ) : (
        <label htmlFor={id} className={labelClass}>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </label>
      )}
      {children}
      {helperText && !errorText ? (
        <p id={helperId(id)} className="text-meta text-body">
          {helperText}
        </p>
      ) : null}
      {errorText ? (
        <p
          id={errorId(id)}
          className="flex items-center gap-1.5 text-meta font-medium text-destructive"
        >
          <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
          {errorText}
        </p>
      ) : null}
    </div>
  );
}

export { FieldShell, describedBy };
