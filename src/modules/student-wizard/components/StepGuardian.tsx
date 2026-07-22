'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import { WizardChoiceField } from '@/modules/student-wizard/components/WizardChoiceField';
import { WizardTextField } from '@/modules/student-wizard/components/WizardTextField';
import { CONTACT_CHANNELS } from '@/modules/student-wizard/constants/student-wizard.constants';
import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

// Step 3 — Guardian (spec 03 §2.6): [name | phone], [email | WeChat ID],
// [preferred contact channel, full width]. The channel row is the portal chip
// group — four one-word labels, no icons, exactly as drawn. Wire values stay the
// raw `whatsapp|wechat|email|sms` enum.
export function StepGuardian() {
  const t = useTranslations('StudentWizard.guardian');
  const { register, control } = useFormContext<StudentWizardValues>();
  const { errors } = useFormState({ control });

  const channelOptions = CONTACT_CHANNELS.map(({ value }) => ({
    value,
    label: t(`channel.${value}`),
  }));

  return (
    <div className="flex flex-col gap-5.5 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <div className="grid gap-4 sm:grid-cols-2">
        <WizardTextField
          id="wizard-guardian-name"
          label={t('name')}
          required
          autoComplete="name"
          placeholder={t('namePlaceholder')}
          error={errors.parent_guardian_name?.message}
          registration={register('parent_guardian_name')}
        />
        <WizardTextField
          id="wizard-guardian-phone"
          type="tel"
          inputMode="tel"
          label={t('phone')}
          required
          autoComplete="tel"
          placeholder={t('phonePlaceholder')}
          error={errors.parent_guardian_phone?.message}
          registration={register('parent_guardian_phone')}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
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
        <WizardTextField
          id="wizard-guardian-wechat"
          label={t('wechat')}
          placeholder={t('wechatPlaceholder')}
          error={errors.parent_guardian_wechat?.message}
          registration={register('parent_guardian_wechat')}
        />
      </div>
      <Controller
        control={control}
        name="preferred_contact_channel"
        render={({ field, fieldState }) => (
          <WizardChoiceField
            id="wizard-contact-channel"
            label={t('preferredContact')}
            options={channelOptions}
            value={field.value ?? 'whatsapp'}
            error={fieldState.error?.message}
            onValueChange={field.onChange}
          />
        )}
      />
    </div>
  );
}
