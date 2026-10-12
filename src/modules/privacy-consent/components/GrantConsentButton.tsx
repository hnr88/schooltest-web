'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { classifyConsentError } from '@/modules/privacy-consent/lib/classify-consent-error';
import { useGrantConsentMutation } from '@/modules/privacy-consent/queries/use-grant-consent.mutation';

import type { GrantConsentButtonProps } from '@/modules/privacy-consent/types/components.types';

// Parent: "Give consent". School: "Record school attestation". The grant carries the
// statement key of the wording the row displays, so the person agrees to exactly the
// text on screen. The API fixes role and source from the signed-in caller.
export function GrantConsentButton({ row, studentDocumentId, audience }: GrantConsentButtonProps) {
  const t = useTranslations('PrivacyConsent');
  const grant = useGrantConsentMutation();
  const statement = row.statement;
  if (statement === null) {
    return null;
  }

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        loading={grant.isPending}
        onClick={() =>
          grant.mutate({
            student_document_id: studentDocumentId,
            consent_type: row.type,
            statement_key: statement.key,
          })
        }
      >
        {t(audience === 'parent' ? 'grant.parent' : 'grant.school_admin')}
      </Button>
      {grant.isError ? (
        <p role="alert" className="text-xs font-semibold text-destructive">
          {t(`error.${classifyConsentError(grant.error)}`)}
        </p>
      ) : null}
    </div>
  );
}
