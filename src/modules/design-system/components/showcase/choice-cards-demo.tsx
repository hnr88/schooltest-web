'use client';

import { useState } from 'react';

import { FieldShell } from '@/modules/design-system/components/field-shell';
import { SelectField } from '@/modules/design-system/components/select-field';
import { SelectionCardGroup } from '@/modules/design-system/components/selection-card';
import { SelectRow } from '@/modules/design-system/components/select-row';
import type { ChoiceOption } from '@/modules/design-system/types/choice.types';

interface ChoiceCardsDemoProps {
  packLabel: string;
  packOptions: readonly ChoiceOption[];
  selectLabel: string;
  selectPlaceholder: string;
  selectOptions: readonly ChoiceOption[];
  selectHelper: string;
  errorText: string;
  countryLabel: string;
  countryPlaceholder: string;
  countryValue: string;
  disabledLabel: string;
}

function ChoiceCardsDemo({
  packLabel,
  packOptions,
  selectLabel,
  selectPlaceholder,
  selectOptions,
  selectHelper,
  errorText,
  countryLabel,
  countryPlaceholder,
  countryValue,
  disabledLabel,
}: ChoiceCardsDemoProps) {
  const [pack, setPack] = useState(packOptions[0]?.value ?? '');
  const [country, setCountry] = useState<string | undefined>(undefined);

  return (
    <div className="flex flex-col gap-7">
      <FieldShell
        id="ds-pack"
        labelId="ds-pack-label"
        label={packLabel}
        required
        className="max-w-2xl"
      >
        <SelectionCardGroup
          options={packOptions}
          value={pack}
          onValueChange={setPack}
          ariaLabelledBy="ds-pack-label"
        />
      </FieldShell>
      <div className="grid gap-6 sm:grid-cols-2">
        <SelectField
          id="ds-choice-select"
          label={selectLabel}
          placeholder={selectPlaceholder}
          options={selectOptions}
          helperText={selectHelper}
        />
        <SelectField
          id="ds-choice-select-error"
          label={selectLabel}
          placeholder={selectPlaceholder}
          options={selectOptions}
          errorText={errorText}
          required
        />
        <SelectRow
          id="ds-country"
          label={countryLabel}
          placeholder={countryPlaceholder}
          value={country}
          onClick={() => setCountry((previous) => (previous ? undefined : countryValue))}
        />
        <SelectRow
          id="ds-country-disabled"
          label={disabledLabel}
          placeholder={countryPlaceholder}
          disabled
        />
      </div>
    </div>
  );
}

export { ChoiceCardsDemo, type ChoiceCardsDemoProps };
