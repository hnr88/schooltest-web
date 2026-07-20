'use client';

import { CircleAlert } from 'lucide-react';
import type { ReactNode } from 'react';

import { Label } from '@/modules/design-system';
import { cn } from '@/lib/utils';

interface WizardFieldProps {
  label: string;
  htmlFor?: string;
  helper?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}

// Label + control + optional helper + §5.2 field error (circle-alert, destructive
// tint). Shared shell for the wizard steps (049–052); the control owns its own
// `aria-invalid`/`aria-describedby` wiring.
export function WizardField({ label, htmlFor, helper, error, className, children }: WizardFieldProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {helper && !error ? (
        <p id={htmlFor ? `${htmlFor}-helper` : undefined} className="text-xs text-muted-foreground">
          {helper}
        </p>
      ) : null}
      {error ? (
        <p
          id={htmlFor ? `${htmlFor}-error` : undefined}
          className="flex items-center gap-1.5 text-xs text-destructive"
        >
          <CircleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
