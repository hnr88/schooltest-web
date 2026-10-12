'use client';

import { classifyConsentError } from '@/modules/privacy-consent/lib/classify-consent-error';
import { buildConsentRows } from '@/modules/privacy-consent/lib/consent-rows';
import { useConsentConfigQuery } from '@/modules/privacy-consent/queries/use-consent-config.query';
import { useStudentConsentsQuery } from '@/modules/privacy-consent/queries/use-student-consents.query';
import type { PrivacyConsentPanelModel } from '@/modules/privacy-consent/types/hooks.types';

// One place that decides what the panel is allowed to show. It stays hidden while
// the config loads, when the config cannot be read, and while records are disabled:
// with the switch OFF the portal must look exactly as it did before this panel.
export function usePrivacyConsentPanel(studentDocumentId: string): PrivacyConsentPanelModel {
  const configQuery = useConsentConfigQuery();
  const config = configQuery.data;
  const enabled = config?.consent_records_enabled === true;
  const consentsQuery = useStudentConsentsQuery(studentDocumentId, enabled);
  const records = consentsQuery.data;

  if (config === undefined || !enabled) {
    return { status: 'hidden' };
  }
  if (consentsQuery.isError) {
    const kind = classifyConsentError(consentsQuery.error);
    return kind === 'disabled'
      ? { status: 'hidden' }
      : {
          status: 'error',
          kind: kind === 'notFound' ? 'notFound' : 'generic',
          config,
          retry: () => void consentsQuery.refetch(),
          retrying: consentsQuery.isFetching,
        };
  }
  if (records === undefined) {
    return { status: 'loading', config };
  }
  return { status: 'ready', config, rows: buildConsentRows(config, records) };
}
