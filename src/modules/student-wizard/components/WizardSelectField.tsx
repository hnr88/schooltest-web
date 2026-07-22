'use client';

import { cn } from '@/lib/utils';
import {
  describedBy,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import { WizardField } from '@/modules/student-wizard/components/WizardField';
import { WIZARD_TRIGGER } from '@/modules/student-wizard/constants/wizard-control.constants';
import type { WizardSelectFieldProps } from '@/modules/student-wizard/types/student-wizard.types';

// `PortalSelect` (spec 03 §1.4) — the same 48px box as the input at 12px inline
// padding. Composed from the vendored base-ui Select rather than the design
// system's own `SelectField`, because that component's API exposes neither
// `items` — without which base-ui's `Select.Value` prints the RAW value, i.e. "7"
// instead of "Year 7" and an English "Year 1" in zh/ko/ms/vi/th — nor a trigger
// ref, which RHF's `trigger(..., { shouldFocus })` needs to land on this field
// when it is the first invalid one.
// The RHF field's `onBlur` is deliberately NOT wired to the trigger. Base-ui moves
// focus into the popup when it opens, so the trigger blurs the instant the user
// starts answering — under `mode: 'onBlur'` that painted "Target entry year is
// required" underneath a field the user was in the middle of filling. A select
// cannot hold a malformed value, so "nothing chosen" is a Continue-time check
// (`form.trigger(STEP_FIELDS[step])`), which is where it was already enforced.
export function WizardSelectField({
  id,
  label,
  placeholder,
  options,
  value,
  helper,
  error,
  required,
  triggerRef,
  onValueChange,
}: WizardSelectFieldProps) {
  return (
    <WizardField id={id} label={label} helper={helper} error={error} required={required}>
      <Select<string | number, false>
        items={options}
        value={value}
        onValueChange={(next) => {
          if (next !== null) {
            onValueChange(next);
          }
        }}
      >
        <SelectTrigger
          id={id}
          ref={triggerRef}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, helper, error)}
          className={cn(WIZARD_TRIGGER, error && 'border-destructive')}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={option.value}
              // 46px, not 44: a pointer walk out of the row centre resolves 43.5 on a
              // drawn 44 because device-pixel rounding eats the boundary half-pixel —
              // the same 2px-over-minimum idiom IconButton documents.
              className="min-h-11.5 px-2.5 text-body-md focus:bg-muted focus:text-foreground data-highlighted:bg-muted data-highlighted:text-foreground data-selected:bg-muted data-selected:text-foreground"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </WizardField>
  );
}
