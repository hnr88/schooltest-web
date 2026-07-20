'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import { ContactChannelCards } from '@/modules/student-wizard/components/ContactChannelCards';
import { WizardField } from '@/modules/student-wizard/components/WizardField';
import { WizardTextField } from '@/modules/student-wizard/components/WizardTextField';
import { CONTACT_CHANNEL_VALUES } from '@/modules/student-wizard/constants/student-wizard.constants';
import type {
  ContactChannel,
  StudentWizardValues,
} from '@/modules/student-wizard/types/student-wizard.types';

// C-UI-STUDENT-WIZARD step 3 — 5 guardian fields on the shared RHF form (048).
// `preferred_contact_channel` renders the §5.12 ContactChannelCards; wire values
// stay the raw `whatsapp|wechat|email|sms` enum (never translated).
export function StepGuardian() {
  const t = useTranslations('StudentWizard.guardian');
  const { register, control } = useFormContext<StudentWizardValues>();
  const { errors } = useFormState({ control });

  const channelLabels = Object.fromEntries(
    CONTACT_CHANNEL_VALUES.map((value) => [value, t(`channel.${value}`)]),
  ) as Record<ContactChannel, string>;

  return (
    <div className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <WizardTextField
        id="wizard-guardian-name"
        label={t('name')}
        autoComplete="name"
        placeholder={t('namePlaceholder')}
        error={errors.parent_guardian_name?.message}
        registration={register('parent_guardian_name')}
      />
      <div className="grid grid-cols-2 gap-3.5">
        <WizardTextField
          id="wizard-guardian-phone"
          type="tel"
          inputMode="tel"
          label={t('phone')}
          autoComplete="tel"
          placeholder={t('phonePlaceholder')}
          error={errors.parent_guardian_phone?.message}
          registration={register('parent_guardian_phone')}
        />
        <WizardTextField
          id="wizard-guardian-email"
          type="email"
          inputMode="email"
          label={t('email')}
          autoComplete="email"
          placeholder={t('emailPlaceholder')}
          error={errors.parent_guardian_email?.message}
          registration={register('parent_guardian_email')}
        />
      </div>
      <WizardTextField
        id="wizard-guardian-wechat"
        label={t('wechat')}
        placeholder={t('wechatPlaceholder')}
        error={errors.parent_guardian_wechat?.message}
        registration={register('parent_guardian_wechat')}
      />
      <Controller
        control={control}
        name="preferred_contact_channel"
        render={({ field, fieldState }) => (
          <WizardField label={t('preferredContact')} error={fieldState.error?.message}>
            <ContactChannelCards
              ariaLabel={t('preferredContact')}
              value={field.value ?? 'whatsapp'}
              labels={channelLabels}
              onValueChange={field.onChange}
            />
          </WizardField>
        )}
      />
    </div>
  );
}
