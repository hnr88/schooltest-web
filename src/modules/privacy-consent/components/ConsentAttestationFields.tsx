'use client';

import { useTranslations } from 'next-intl';

import { Label } from '@/components/ui/label';
import { Checkbox } from '@/modules/design-system';
import { ATTESTABLE_CONSENT_TYPES } from '@/modules/privacy-consent/constants/components.constants';

import type { ConsentAttestationFieldsProps } from '@/modules/privacy-consent/types/components.types';

// W4-21 (D5 S1): "this school holds guardian consent", as two SEPARATE boxes that
// both start unticked. The wording of each statement is whatever the API serves
// (English, API-owned); only headings and labels are catalogue keys. It renders
// nothing while consent records are off, so the host form or dialog is unchanged.
// Declining AI marking never blocks adding or importing students.
export function ConsentAttestationFields({
  options,
  value,
  onChange,
  showRequiredError = false,
  refusal = null,
  disabled = false,
  idPrefix = 'consent-attestation',
}: ConsentAttestationFieldsProps) {
  const t = useTranslations('PrivacyConsent');

  if (!options.visible) {
    return null;
  }
  const missing = options.required && !value.data_collection;

  return (
    <section
      data-slot="consent-attestation"
      aria-labelledby={`${idPrefix}-title`}
      className="flex flex-col gap-4 rounded-card border border-border p-4"
    >
      <div className="flex flex-col gap-1">
        <h3 id={`${idPrefix}-title`} className="text-[15px] font-semibold text-foreground">
          {t('attestation.title')}
        </h3>
        <p className="text-body-sm text-body">{t('attestation.intro')}</p>
      </div>
      {ATTESTABLE_CONSENT_TYPES.map((type) => {
        const statement = options.statements[type];
        const required = type === 'data_collection' && options.required;
        const id = `${idPrefix}-${type}`;
        const invalid = type === 'data_collection' && showRequiredError && missing;
        return (
          <div key={type} data-consent-type={type} className="flex flex-col gap-2">
            <p className="text-meta font-semibold text-foreground">
              {t(`type.${type}.title`)}{' '}
              <span className="font-normal text-muted-foreground">
                {required ? t('attestation.required') : t('attestation.optional')}
              </span>
            </p>
            {statement === undefined ? null : (
              <p id={`${id}-statement`} className="text-body-sm break-words text-body">
                {statement.text}
              </p>
            )}
            <div className="flex items-start gap-2">
              <Checkbox
                id={id}
                checked={value[type]}
                required={required}
                disabled={disabled}
                aria-invalid={invalid ? true : undefined}
                aria-describedby={statement === undefined ? undefined : `${id}-statement`}
                onCheckedChange={(checked) => onChange({ ...value, [type]: checked === true })}
              />
              <Label htmlFor={id} className="min-w-0 text-sm font-normal">
                {t(`attestation.${type}.label`)}
              </Label>
            </div>
            {type === 'ai_processing' ? (
              <p className="text-xs text-muted-foreground">
                {t(options.aiConsentRequired ? 'attestation.aiDeclineMarking' : 'attestation.aiDeclineNote')}
              </p>
            ) : null}
            {invalid ? (
              <p role="alert" className="text-xs font-medium text-destructive">
                {t('attestation.requiredError')}
              </p>
            ) : null}
          </div>
        );
      })}
      {refusal === null ? null : (
        <p role="alert" className="text-xs font-medium text-destructive">
          {t(`attestation.refusal.${refusal}`)}
        </p>
      )}
      {options.policyVersion === null ? null : (
        <p className="text-xs text-muted-foreground">
          {t('attestation.policyVersion', { version: options.policyVersion })} {t('attestation.changeLater')}
        </p>
      )}
    </section>
  );
}
