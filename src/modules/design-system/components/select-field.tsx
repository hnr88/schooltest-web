'use client';

import { Select, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { describedBy, FieldShell } from '@/modules/design-system/components/field-shell';
import { SelectContent, SelectItem } from '@/modules/design-system/components/select-wrappers';

import type { SelectFieldProps } from '@/modules/design-system/types/choice.types';

// Canonical app-screen select (DS §06 "Select"): 1px #CBD5E1, radius 10px, padding
// 11px 14px, 14.5px #0E2350 on #FFFFFF, chevron right, focus 3px primary ring,
// error 1px #DC2626 + 3px danger ring, disabled #F1F5F9 / #94A3B8.
// The vendored trigger ships a 32px `data-[size=default]:h-8` and a transparent
// fill; both are corrected HERE, from the wrapper, never in components/ui. The
// height override has to repeat the `data-[size=default]` variant or it loses on
// specificity to the primitive's own rule — a plain `h-11` silently does nothing.
const TRIGGER =
  'min-h-11 w-full justify-between rounded-lg border-input bg-card px-3.5 text-lede font-medium text-foreground data-[size=default]:h-11 disabled:bg-muted disabled:text-muted-foreground disabled:opacity-100';

function SelectField({
  id,
  label,
  options,
  placeholder,
  value,
  defaultValue,
  onValueChange,
  helperText,
  errorText,
  required,
  disabled,
  className,
}: SelectFieldProps) {
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
      <Select
        value={value}
        defaultValue={defaultValue}
        onValueChange={(next) => onValueChange?.(next ?? '')}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger
          id={id}
          aria-invalid={errorText ? true : undefined}
          aria-describedby={describedBy(id, helperText, errorText)}
          className={cn(TRIGGER, errorText && 'border-destructive')}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
}

export { SelectField };
