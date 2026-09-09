'use client';

import { useTranslations } from 'next-intl';

import { KeyValueList, KeyValueRow } from '@/modules/design-system';
import { OpsSchoolActivity } from '@/modules/ops/components/OpsSchoolActivity';

import type { SchoolDetail } from '@schooltest/ops-contracts';

/**
 * ops/12 (D-29): the Overview tab body, lifted verbatim out of
 * OpsSchoolTables.tsx so tasks 15-18 and 25 own one tab file each. The null
 * copy stays `t('unknown')` (D-33) — unknown phone and last activity are NULL
 * and render as "unavailable", never a placeholder that reads like a value.
 */
export function OpsOverviewTab({ school }: { school: SchoolDetail }) {
  const t = useTranslations('Ops.schoolTables');

  return (
    <div className="flex flex-col gap-4">
      <KeyValueList>
        <KeyValueRow label={t('fieldSuburb')}>{school.suburb ?? t('unknown')}</KeyValueRow>
        <KeyValueRow label={t('fieldState')}>{school.state ?? t('unknown')}</KeyValueRow>
        <KeyValueRow label={t('fieldSector')}>{school.sector ?? t('unknown')}</KeyValueRow>
        <KeyValueRow label={t('fieldContact')}>{school.contact_name ?? t('unknown')}</KeyValueRow>
        <KeyValueRow label={t('fieldEmail')}>{school.contact_email ?? t('unknown')}</KeyValueRow>
        <KeyValueRow label={t('fieldPhone')}>{school.phone ?? t('unknown')}</KeyValueRow>
        <KeyValueRow label={t('fieldLastActivity')}>
          {school.last_active_at ?? t('unknown')}
        </KeyValueRow>
      </KeyValueList>
      <OpsSchoolActivity documentId={school.documentId} />
    </div>
  );
}
