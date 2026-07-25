'use client';

import { UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { FormProvider } from 'react-hook-form';

import type { AuthUser } from '@/modules/auth';
import { Button } from '@/modules/design-system';
import { ProfileAddressFields } from '@/modules/onboarding/components/ProfileAddressFields';
import { ProfileEmergencyFields } from '@/modules/onboarding/components/ProfileEmergencyFields';
import { ProfileIdentityFields } from '@/modules/onboarding/components/ProfileIdentityFields';
import { useParentProfileForm } from '@/modules/onboarding/hooks/use-parent-profile-form';
import { useUpdateMeMutation } from '@/modules/onboarding/queries/use-update-me.mutation';
import type { ParentProfileValues } from '@/modules/onboarding/types/parent-profile.types';

const PROFILE_FIELDS = new Set<string>([
  'first_name',
  'last_name',
  'relationship_to_student',
  'occupation',
  'phone',
  'secondary_phone',
  'preferred_contact_method',
  'address_line',
  'city',
  'state_region',
  'postal_code',
  'country_of_residence',
  'emergency_contact_name',
  'emergency_contact_phone',
  'emergency_contact_relationship',
]);

interface OnboardingProfileFormProps {
  user: AuthUser | null;
  onSaved: () => void;
  onSkip: () => void;
  isSkipPending: boolean;
}

// Step 2 of the onboarding wizard: the parent-profile form (C-PAR-UPDATE-ME).
// Saving advances to the finish step; the 400 field list from the server is
// mapped back onto the matching inputs.
export function OnboardingProfileForm({
  user,
  onSaved,
  onSkip,
  isSkipPending,
}: OnboardingProfileFormProps) {
  const t = useTranslations('Onboarding');
  const form = useParentProfileForm(user);

  const updateMe = useUpdateMeMutation({
    onInvalidFields: (fields) => {
      for (const field of fields) {
        if (PROFILE_FIELDS.has(field)) {
          form.setError(field as keyof ParentProfileValues, {
            message: t('profileServerInvalid'),
          });
        }
      }
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    updateMe.mutate(values, { onSuccess: onSaved });
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-primary">
          <UserRound className="size-6" />
        </div>
        <h2 className="text-auth-title font-bold text-foreground">{t('stepProfileTitle')}</h2>
        <p className="max-w-xs text-body-md text-body">{t('stepProfileBody')}</p>
      </div>
      <FormProvider {...form}>
        <form
          onSubmit={handleSubmit}
          noValidate
          className="flex flex-col gap-5.5 text-left"
        >
          <ProfileIdentityFields />
          <ProfileAddressFields />
          <ProfileEmergencyFields />
          <div className="flex w-full flex-col gap-3">
            <Button
              type="submit"
              size="xl"
              className="w-full"
              loading={updateMe.isPending}
              disabled={isSkipPending}
            >
              {t('saveProfile')}
            </Button>
            <Button
              variant="ghost"
              size="default"
              className="w-full"
              onClick={onSkip}
              loading={isSkipPending}
              disabled={updateMe.isPending || isSkipPending}
            >
              {t('skip')}
            </Button>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
