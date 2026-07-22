'use client';

import { useTranslations } from 'next-intl';
import type { UseFormReturn } from 'react-hook-form';

import { describedBy, FieldShell, Input } from '@/modules/design-system';
import { SETTINGS_INPUT_CLASS } from '@/modules/settings/constants/settings.constants';
import { parseNullableNumber } from '@/modules/settings/lib/search-preferences';
import { SettingsPanel } from '@/modules/settings/components/SettingsPanel';
import type { SearchPreferenceFormValues } from '@/modules/settings/types/settings.types';

interface SearchPreferenceFeeFieldsProps {
  form: UseFormReturn<SearchPreferenceFormValues>;
}

// The canonical two-up numeric field pair (App Screens 3f L3409-3412 "Institution
// no. / Phone"): a 1fr 1fr grid at a 14px gutter inside its own panel.
// The range error is raised on `default_fee_min` by the schema refine, so it renders
// through that field's FieldShell — the canonical 12.5/500 #DC2626 line with the
// alert glyph — and is wired to the input with aria-describedby rather than being
// dropped in as a loose paragraph the control never references.
export function SearchPreferenceFeeFields({ form }: SearchPreferenceFeeFieldsProps) {
  const t = useTranslations('Settings');
  const { errors } = form.formState;
  const minError = errors.default_fee_min?.message;
  const maxError = errors.default_fee_max?.message;

  return (
    <SettingsPanel id="settings-search-fees" title={t('defaultFeeRange')}>
      <div className="grid gap-4 sm:grid-cols-2">
        <FieldShell
          id="search-preference-fee-min"
          label={t('defaultFeeMinimum')}
          errorText={minError ? t(minError) : undefined}
        >
          <Input
            id="search-preference-fee-min"
            type="number"
            min="0"
            max="1000000"
            inputMode="numeric"
            className={SETTINGS_INPUT_CLASS}
            aria-invalid={minError ? true : undefined}
            aria-describedby={describedBy('search-preference-fee-min', undefined, minError)}
            {...form.register('default_fee_min', { setValueAs: parseNullableNumber })}
          />
        </FieldShell>
        <FieldShell
          id="search-preference-fee-max"
          label={t('defaultFeeMaximum')}
          errorText={maxError ? t(maxError) : undefined}
        >
          <Input
            id="search-preference-fee-max"
            type="number"
            min="0"
            max="1000000"
            inputMode="numeric"
            className={SETTINGS_INPUT_CLASS}
            aria-invalid={maxError ? true : undefined}
            aria-describedby={describedBy('search-preference-fee-max', undefined, maxError)}
            {...form.register('default_fee_max', { setValueAs: parseNullableNumber })}
          />
        </FieldShell>
      </div>
    </SettingsPanel>
  );
}
