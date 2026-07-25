'use client';

import { useTranslations } from 'next-intl';
import { useFormContext, useFormState } from 'react-hook-form';

import type { ParentProfileValues } from '@/modules/onboarding/types/parent-profile.types';
import { WizardTextField } from '@/modules/student-wizard';

// Emergency-contact group of the parent-profile step. Name + phone count toward
// the server's completion rule; the relationship line is optional.
export function ProfileEmergencyFields() {
  const t = useTranslations('Onboarding.profile');
  const { register, control } = useFormContext<ParentProfileValues>();
  const { errors } = useFormState({ control });

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardTextField
          id="onboarding-emergency-name"
          label={t('emergencyName')}
          required
          error={errors.emergency_contact_name?.message}
          registration={register('emergency_contact_name')}
        />
        <WizardTextField
          id="onboarding-emergency-phone"
          type="tel"
          inputMode="tel"
          label={t('emergencyPhone')}
          required
          placeholder={t('phonePlaceholder')}
          error={errors.emergency_contact_phone?.message}
          registration={register('emergency_contact_phone')}
        />
      </div>
      <WizardTextField
        id="onboarding-emergency-relationship"
        label={t('emergencyRelationship')}
        error={errors.emergency_contact_relationship?.message}
        registration={register('emergency_contact_relationship')}
      />
    </>
  );
}
