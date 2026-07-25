'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import {
  CONTACT_METHOD_VALUES,
  RELATIONSHIP_VALUES,
} from '@/modules/onboarding/constants/parent-profile.constants';
import type { ParentProfileValues } from '@/modules/onboarding/types/parent-profile.types';
import { WizardChoiceField, WizardTextField } from '@/modules/student-wizard';

// Identity + contact field groups of the parent-profile step (spec: the 10
// completion-rule fields marked required). Chip groups for the two enums, the
// same control the student wizard uses for small in-form enums.
export function ProfileIdentityFields() {
  const t = useTranslations('Onboarding.profile');
  const { register, control } = useFormContext<ParentProfileValues>();
  const { errors } = useFormState({ control });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardTextField
          id="onboarding-first-name"
          label={t('firstName')}
          required
          autoComplete="given-name"
          error={errors.first_name?.message}
          registration={register('first_name')}
        />
        <WizardTextField
          id="onboarding-last-name"
          label={t('lastName')}
          required
          autoComplete="family-name"
          error={errors.last_name?.message}
          registration={register('last_name')}
        />
      </div>
      <Controller
        control={control}
        name="relationship_to_student"
        render={({ field, fieldState }) => (
          <WizardChoiceField
            id="onboarding-relationship"
            label={t('relationship')}
            required
            options={RELATIONSHIP_VALUES.map((value) => ({
              value,
              label: t(`relationshipOptions.${value}`),
            }))}
            value={field.value ?? ''}
            error={fieldState.error?.message}
            onValueChange={field.onChange}
          />
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardTextField
          id="onboarding-phone"
          type="tel"
          inputMode="tel"
          label={t('phone')}
          required
          autoComplete="tel"
          placeholder={t('phonePlaceholder')}
          error={errors.phone?.message}
          registration={register('phone')}
        />
        <WizardTextField
          id="onboarding-secondary-phone"
          type="tel"
          inputMode="tel"
          label={t('secondaryPhone')}
          autoComplete="tel-national"
          error={errors.secondary_phone?.message}
          registration={register('secondary_phone')}
        />
      </div>
      <Controller
        control={control}
        name="preferred_contact_method"
        render={({ field, fieldState }) => (
          <WizardChoiceField
            id="onboarding-contact-method"
            label={t('preferredContact')}
            required
            options={CONTACT_METHOD_VALUES.map((value) => ({
              value,
              label: t(`contactOptions.${value}`),
            }))}
            value={field.value ?? ''}
            error={fieldState.error?.message}
            onValueChange={field.onChange}
          />
        )}
      />
      <WizardTextField
        id="onboarding-occupation"
        label={t('occupation')}
        error={errors.occupation?.message}
        registration={register('occupation')}
      />
    </>
  );
}
