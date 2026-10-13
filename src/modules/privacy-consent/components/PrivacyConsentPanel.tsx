'use client';

import { useTranslations } from 'next-intl';

import { Alert, Button, PanelHeaderRow, Skeleton } from '@/modules/design-system';
import { ConsentRow } from '@/modules/privacy-consent/components/ConsentRow';
import { EraseStudentSection } from '@/modules/privacy-consent/components/EraseStudentSection';
import { usePrivacyConsentPanel } from '@/modules/privacy-consent/hooks/use-privacy-consent-panel';
import { resolveEraseEntry } from '@/modules/privacy-consent/lib/erase-request';
import { useConsentConfigQuery } from '@/modules/privacy-consent/queries/use-consent-config.query';

import type { PrivacyConsentPanelProps } from '@/modules/privacy-consent/types/components.types';

// The "Privacy and consent" panel, and the only preference centre the product has
// (D5: there are no cookies to govern). Everything shown comes from the live API;
// while `consent_records_enabled` is OFF it renders nothing at all.
//
// W4-21: on the school administrator's page of an ARCHIVED student the panel also
// carries "Erase this student's personal data", only while `student_erasure_enabled`
// is ON. When consent records are OFF but erasure is ON, the panel is otherwise
// hidden, so the erase entry stands alone in its own section: erasure must stay
// reachable by a school, not only by a curl command. With every switch OFF nothing
// changes and this renders nothing.
export function PrivacyConsentPanel({
  studentDocumentId,
  audience,
  studentStatus,
  studentGivenName,
  studentFamilyName,
}: PrivacyConsentPanelProps) {
  const t = useTranslations('PrivacyConsent');
  const model = usePrivacyConsentPanel(studentDocumentId);
  const config = useConsentConfigQuery().data;
  const eraseEntry = resolveEraseEntry({
    audience,
    config,
    studentStatus,
    givenName: studentGivenName,
    familyName: studentFamilyName,
  });

  if (model.status === 'hidden') {
    if (eraseEntry === 'none') {
      return null;
    }
    return (
      <section
        data-slot="privacy-erase-panel"
        data-audience={audience}
        aria-labelledby="privacy-erase-title"
        className="w-full rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
      >
        <PanelHeaderRow as="h2" titleId="privacy-erase-title" title={t('erase.sectionTitle')} />
        <div className="mt-3">
          <EraseStudentSection
            studentDocumentId={studentDocumentId}
            givenName={studentGivenName}
            state={eraseEntry}
          />
        </div>
      </section>
    );
  }

  return (
    <section
      data-slot="privacy-consent-panel"
      data-audience={audience}
      aria-labelledby="privacy-consent-title"
      className="w-full rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <PanelHeaderRow
        as="h2"
        titleId="privacy-consent-title"
        title={t('title')}
        description={t(audience === 'parent' ? 'descriptionParent' : 'descriptionSchool')}
      />
      {model.status === 'loading' ? <Skeleton className="mt-3 h-24 w-full" /> : null}
      {model.status === 'error' ? (
        <Alert
          variant="error"
          title={t(model.kind === 'notFound' ? 'notFoundTitle' : 'errorTitle')}
          action={
            model.kind === 'notFound' ? undefined : (
              <Button type="button" variant="outline" size="sm" loading={model.retrying} onClick={model.retry}>
                {t('retry')}
              </Button>
            )
          }
        >
          {t(model.kind === 'notFound' ? 'notFoundDescription' : 'errorDescription')}
        </Alert>
      ) : null}
      {model.status === 'ready' ? (
        <>
          {model.config.ai_consent_required ? (
            <p className="mt-1 text-xs text-muted-foreground">{t('aiRequiredNote')}</p>
          ) : null}
          <ul className="mt-2 flex flex-col">
            {model.rows.map((row) => (
              <ConsentRow
                key={row.type}
                row={row}
                config={model.config}
                studentDocumentId={studentDocumentId}
                audience={audience}
              />
            ))}
          </ul>
          {eraseEntry === 'none' ? null : (
            <div className="mt-2 border-t border-border pt-4">
              <EraseStudentSection
                studentDocumentId={studentDocumentId}
                givenName={studentGivenName}
                state={eraseEntry}
              />
            </div>
          )}
        </>
      ) : null}
    </section>
  );
}
