'use client';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { describedBy, FieldShell } from '@/modules/design-system/components/field-shell';

import type { SelectRowProps } from '@/modules/design-system/types/choice.types';

// Canonical SelectRow — the FAUX select the app screens actually draw (DS §06):
//   border 1px #CBD5E1, radius 10px, padding 11px 14px, 14.5px #0E2350,
//   space-between, 14px chevron #94A3B8.
// It is a button, not a listbox: use it when the choice opens a sheet, dialog or
// map picker rather than a popup list (country picker, "Assign to classes"). When
// the choice really is a short popup list, use `SelectField` instead.
// 11px padding + a 14.5px line box + 2 borders = 45px, so the drawn row already
// clears the 44px pointer target; min-h-11 pins it if the label ever shortens.
function SelectRow({
  id,
  label,
  placeholder,
  value,
  onClick,
  helperText,
  errorText,
  required,
  disabled,
  className,
}: SelectRowProps) {
  return (
    <FieldShell
      id={id}
      label={label}
      helperText={helperText}
      errorText={errorText}
      required={required}
      disabled={disabled}
      className={className}
    >
      <button
        id={id}
        type="button"
        onClick={onClick}
        disabled={disabled}
        data-invalid={errorText ? '' : undefined}
        aria-describedby={describedBy(id, helperText, errorText)}
        data-slot="select-row"
        className={cn(
          'flex min-h-11 w-full items-center justify-between gap-3 rounded-lg border bg-card px-3.5 py-2.75 text-left text-lede transition-colors duration-200 ease-out-expo focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none motion-reduce:transition-none',
          errorText ? 'border-destructive' : 'border-input hover:border-primary/40',
          disabled && 'cursor-not-allowed border-border bg-muted',
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            value ? 'font-medium text-foreground' : 'text-muted-foreground',
            disabled && 'text-body',
          )}
        >
          {value ?? placeholder}
        </span>
        <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
      </button>
    </FieldShell>
  );
}

export { SelectRow };
