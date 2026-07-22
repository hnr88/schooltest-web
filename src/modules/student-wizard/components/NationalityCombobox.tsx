'use client';

import { useMemo } from 'react';

import { ChevronDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  describedBy,
  InputGroupAddon,
} from '@/modules/design-system';
import { WizardField } from '@/modules/student-wizard/components/WizardField';
import { getCountryNames } from '@/modules/student-wizard/constants/countries.constants';
import { WIZARD_CONTROL } from '@/modules/student-wizard/constants/wizard-control.constants';

interface NationalityComboboxProps {
  id: string;
  label: string;
  value: string;
  locale: string;
  placeholder: string;
  emptyLabel: string;
  helper?: string;
  error?: string;
  required?: boolean;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
}

// Canonical §1.5: the app screens ship no combobox, and the note is explicit — if
// one is needed (nationality), build it as the §1.4 trigger box plus the dropdown
// panel with a search field inset at the top. That is exactly the base-ui combobox,
// so the work here is putting it in the canonical field stack and correcting the
// vendored input's 32px transparent box to the 44px screen-dialect one.
export function NationalityCombobox({
  id,
  label,
  value,
  locale,
  placeholder,
  emptyLabel,
  helper,
  error,
  required,
  onValueChange,
  onBlur,
}: NationalityComboboxProps) {
  const countries = useMemo(() => getCountryNames(locale), [locale]);

  return (
    <WizardField id={id} label={label} helper={helper} error={error} required={required}>
      <Combobox
        items={countries}
        value={value === '' ? null : value}
        onValueChange={(next) => onValueChange(next ?? '')}
      >
        {/* The vendored ComboboxInput's built-in chevron and clear controls are
            icon-only <button>s with no accessible name — axe `button-name`, a
            critical WCAG 4.1.2 failure. They are switched off and replaced with the
            canonical decorative chevron (§1.4: a 14px #94A3B8 svg with
            pointer-events:none, not a control), which is also one fewer tab stop. */}
        <ComboboxInput
          id={id}
          showTrigger={false}
          className={cn(WIZARD_CONTROL, error && 'border-destructive')}
          placeholder={placeholder}
          aria-label={label}
          aria-describedby={describedBy(id, helper, error)}
          aria-invalid={error ? true : undefined}
          onBlur={onBlur}
        >
          <InputGroupAddon align="inline-end">
            <ChevronDown aria-hidden="true" className="size-3.5 text-muted-foreground" />
          </InputGroupAddon>
        </ComboboxInput>
        <ComboboxContent>
          <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
          <ComboboxList>
            {(country: string) => (
              <ComboboxItem
                key={country}
                value={country}
                className="min-h-11.5 text-body-md data-highlighted:bg-muted data-highlighted:text-foreground data-selected:bg-muted data-selected:text-foreground"
              >
                {country}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </WizardField>
  );
}
