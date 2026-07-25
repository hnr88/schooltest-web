'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import { CountryCombobox } from '@/modules/onboarding/components/CountryCombobox';
import type { ParentProfileValues } from '@/modules/onboarding/types/parent-profile.types';
import { WizardTextField } from '@/modules/student-wizard';

// Address group of the parent-profile step. Country is the ISO-code combobox
// (C-PAR-UPDATE-ME stores the 2-letter code, uppercased server-side).
export function ProfileAddressFields() {
  const t = useTranslations('Onboarding.profile');
  const locale = useLocale();
  const { register, control } = useFormContext<ParentProfileValues>();
  const { errors } = useFormState({ control });

  return (
    <>
      <WizardTextField
        id="onboarding-address-line"
        label={t('addressLine')}
        required
        autoComplete="street-address"
        error={errors.address_line?.message}
        registration={register('address_line')}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardTextField
          id="onboarding-city"
          label={t('city')}
          required
          autoComplete="address-level2"
          error={errors.city?.message}
          registration={register('city')}
        />
        <WizardTextField
          id="onboarding-state-region"
          label={t('stateRegion')}
          autoComplete="address-level1"
          error={errors.state_region?.message}
          registration={register('state_region')}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardTextField
          id="onboarding-postal-code"
          label={t('postalCode')}
          autoComplete="postal-code"
          error={errors.postal_code?.message}
          registration={register('postal_code')}
        />
        <Controller
          control={control}
          name="country_of_residence"
          render={({ field, fieldState }) => (
            <CountryCombobox
              id="onboarding-country"
              label={t('country')}
              required
              value={field.value ?? ''}
              locale={locale}
              placeholder={t('countryPlaceholder')}
              emptyLabel={t('countryEmpty')}
              error={fieldState.error?.message}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
            />
          )}
        />
      </div>
    </>
  );
}
