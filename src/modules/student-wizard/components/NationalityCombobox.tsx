'use client';

import { useMemo } from 'react';

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/modules/design-system';
import { getCountryNames } from '@/modules/student-wizard/constants/countries.constants';

interface NationalityComboboxProps {
  id?: string;
  value: string;
  locale: string;
  placeholder: string;
  emptyLabel: string;
  ariaLabel: string;
  ariaDescribedBy?: string;
  invalid?: boolean;
  onValueChange: (value: string) => void;
  onBlur?: () => void;
}

// C-UI-STUDENT-WIZARD — searchable country combobox over the shared ISO source.
// Stores the localized display-name string (schema `string().min(1).max(100)`);
// base-ui filters the list internally, empty state shows `emptyLabel`.
export function NationalityCombobox({
  id,
  value,
  locale,
  placeholder,
  emptyLabel,
  ariaLabel,
  ariaDescribedBy,
  invalid,
  onValueChange,
  onBlur,
}: NationalityComboboxProps) {
  const countries = useMemo(() => getCountryNames(locale), [locale]);

  return (
    <Combobox
      items={countries}
      value={value === '' ? null : value}
      onValueChange={(next) => onValueChange(next ?? '')}
    >
      <ComboboxInput
        id={id}
        showClear
        className="h-11"
        placeholder={placeholder}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        aria-invalid={invalid ? true : undefined}
        onBlur={onBlur}
      />
      <ComboboxContent>
        <ComboboxEmpty>{emptyLabel}</ComboboxEmpty>
        <ComboboxList>
          {(country: string) => (
            <ComboboxItem key={country} value={country}>
              {country}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
