'use client';

import { useMemo } from 'react';

import { getCountryOptions, NationalityCombobox, type CountryCode } from '@/modules/student-wizard';

import type { CountryComboboxProps } from '@/modules/onboarding/types/components.types';

// ISO-code-valued country picker: the NationalityCombobox stores the localized
// display NAME, but C-PAR-UPDATE-ME wants the 2-letter code, so this adapter
// maps code ↔ name over the shared getCountryOptions list.
export function CountryCombobox({
  id,
  label,
  value,
  locale,
  placeholder,
  emptyLabel,
  error,
  required,
  onValueChange,
  onBlur,
}: CountryComboboxProps) {
  const options = useMemo(() => getCountryOptions(locale), [locale]);
  const nameByCode = useMemo(
    () => new Map(options.map((option) => [option.code, option.name])),
    [options],
  );
  const codeByName = useMemo(
    () => new Map(options.map((option) => [option.name, option.code])),
    [options],
  );

  return (
    <NationalityCombobox
      id={id}
      label={label}
      value={nameByCode.get(value as CountryCode) ?? ''}
      locale={locale}
      placeholder={placeholder}
      emptyLabel={emptyLabel}
      error={error}
      required={required}
      onValueChange={(name) => onValueChange(codeByName.get(name) ?? '')}
      onBlur={onBlur}
    />
  );
}
