'use client';

import type { Ref } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/modules/design-system';
import { WizardField } from '@/modules/student-wizard/components/WizardField';

type WizardSelectValue = string | number;

interface WizardSelectOption {
  value: WizardSelectValue;
  label: string;
}

interface WizardSelectFieldProps {
  id: string;
  label: string;
  placeholder: string;
  options: readonly WizardSelectOption[];
  value: WizardSelectValue | null;
  helper?: string;
  error?: string;
  triggerRef?: Ref<HTMLButtonElement>;
  onValueChange: (value: WizardSelectValue) => void;
  onBlur?: () => void;
}

// Label + §5.5 Select + helper/error, wired to a RHF Controller field. `items`
// feeds base-ui the localized option label so the trigger shows the translated
// text (not the raw enum value) in every locale; `triggerRef` receives the RHF
// field ref so Continue's shouldFocus lands on this control when it is invalid.
export function WizardSelectField({
  id,
  label,
  placeholder,
  options,
  value,
  helper,
  error,
  triggerRef,
  onValueChange,
  onBlur,
}: WizardSelectFieldProps) {
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;

  return (
    <WizardField htmlFor={id} label={label} helper={helper} error={error}>
      <Select<WizardSelectValue, false>
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
          className="min-h-11 w-full"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onBlur={onBlur}
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem
              key={String(option.value)}
              value={option.value}
              className="focus:bg-muted focus:text-foreground data-highlighted:bg-muted data-highlighted:text-foreground data-selected:bg-muted data-selected:text-foreground"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </WizardField>
  );
}
