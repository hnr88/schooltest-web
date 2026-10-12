'use client';

import { useTranslations } from 'next-intl';
import { Controller, useFormContext, useFormState } from 'react-hook-form';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/modules/design-system';
import { WIZARD_CONSENT_ROWS } from '@/modules/student-wizard/constants/student-wizard.constants';
import { useWizardPrivacyOptions } from '@/modules/student-wizard/hooks/use-student-wizard';
import type { StudentWizardValues } from '@/modules/student-wizard/types/student-wizard.types';

// W4-19 (D5 S1, G-27): the two SEPARATE consent boxes above the review summary.
// Both start unticked. The statement wording is whatever `GET /api/consents/config`
// serves (English, API-owned); only the headings and labels are catalogue keys.
// Shown only when consent records are enabled and the wizard is creating a
// student, so with every switch off (or a failed config request) it renders
// nothing. Declining AI is explicit and never blocks enrolment.
export function WizardConsentBlock() {
  const t = useTranslations('StudentWizard.consent');
  const { control } = useFormContext<StudentWizardValues>();
  const { errors } = useFormState({ control });
  const { config, options, isCreate } = useWizardPrivacyOptions();

  if (!config || !isCreate || !options.recordsEnabled) return null;

  return (
    <section
      data-slot="wizard-consent"
      aria-labelledby="wizard-consent-title"
      className="flex flex-col gap-4 rounded-card border border-border p-4"
    >
      <div className="flex flex-col gap-1">
        <h3 id="wizard-consent-title" className="text-[15px] font-semibold text-foreground">
          {t('title')}
        </h3>
        <p className="text-body-sm text-body">{t('intro')}</p>
      </div>
      {WIZARD_CONSENT_ROWS.map(({ type, field }) => {
        const statement = config.statements.find((entry) => entry.type === type);
        const required = type === 'data_collection' && options.guardianConsentRequired;
        const id = `wizard-consent-${type}`;
        const error = errors[field]?.message;
        return (
          <Controller
            key={type}
            control={control}
            name={field}
            render={({ field: box }) => (
              <div data-consent-type={type} className="flex flex-col gap-2">
                <p className="text-meta font-semibold text-foreground">
                  {t(`${type}.title`)}{' '}
                  <span className="font-normal text-muted-foreground">
                    {required ? t('required') : t('optional')}
                  </span>
                </p>
                {statement ? (
                  <p id={`${id}-statement`} className="text-body-sm break-words text-body">
                    {statement.text}
                  </p>
                ) : null}
                <div className="flex items-start gap-2">
                  <Checkbox
                    id={id}
                    ref={box.ref}
                    checked={box.value === true}
                    required={required}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={statement ? `${id}-statement` : undefined}
                    onCheckedChange={(checked) => box.onChange(checked === true)}
                    onBlur={box.onBlur}
                  />
                  <Label htmlFor={id} className="min-w-0 text-sm font-normal">
                    {t(`${type}.label`)}
                  </Label>
                </div>
                {type === 'ai_processing' ? (
                  <p className="text-xs text-muted-foreground">
                    {t(config.ai_consent_required ? 'aiDeclineMarking' : 'aiDeclineNote')}
                  </p>
                ) : null}
                {error ? (
                  <p role="alert" className="text-xs font-medium text-destructive">
                    {error}
                  </p>
                ) : null}
              </div>
            )}
          />
        );
      })}
      <p className="text-xs text-muted-foreground">
        {t('policyVersion', { version: config.policy.version })} {t('changeLater')}
      </p>
    </section>
  );
}
