'use client';

import { AlertCircle } from 'lucide-react';

import { cn } from '@/lib/utils';
import type { WizardFieldProps } from '@/modules/student-wizard/types/student-wizard.types';

// Portal field stack (spec 03 §1.4): `PortalLabel` 12.5/600 #0E2350 with the
// #2563EB required marker welded to it, the control, then `PortalHelpText` 12px.
// Two label modes because the two control shapes need different wiring: a single
// focusable control takes <label for>, a chip radiogroup takes aria-labelledby (a
// <label> pointing at a group is not a real label and axe rejects it).
// The design ships NO error state anywhere (§1.4) — the 12px destructive line is
// authored here, since the schema this form is bound to does reject input.
// Canonical help ink #9AA6B8 is 2.6:1, a straight AA failure, so help and error
// text take --muted-foreground / --destructive.
export function WizardField({
  id,
  label,
  labelId,
  required,
  helper,
  error,
  className,
  children,
}: WizardFieldProps) {
  const labelClass = 'text-meta font-semibold text-foreground';
  const marker = required ? <span className="text-primary">*</span> : null;

  return (
    <div
      data-slot="wizard-field"
      data-invalid={error ? '' : undefined}
      className={cn('flex min-w-0 flex-col gap-1.75', className)}
    >
      {labelId ? (
        <span id={labelId} className={labelClass}>
          {label}
          {marker}
        </span>
      ) : (
        <label htmlFor={id} className={labelClass}>
          {label}
          {marker}
        </label>
      )}
      {children}
      {helper && !error ? (
        <p id={`${id}-helper`} className="text-xs text-muted-foreground">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          className="flex items-center gap-1.5 text-xs font-medium text-destructive duration-200 ease-out animate-in fade-in slide-in-from-top-0.5 motion-reduce:animate-none"
        >
          <AlertCircle aria-hidden="true" className="size-3.5 shrink-0" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
