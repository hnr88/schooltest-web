'use client';

import { useTranslations } from 'next-intl';

import {
  Badge,
  DataPanel,
  KeyValueList,
  KeyValueRow,
  PanelHeaderRow,
} from '@/modules/design-system';
import {
  ACCOUNT_STATUS_VARIANTS,
  ONBOARDING_STATUS_VARIANTS,
} from '@/modules/school-admin/constants/lib.constants';
import { formatSchoolLocation } from '@/modules/school-admin/lib/account-view';
import type { AccountDetailsCardProps } from '@/modules/school-admin/types/account.types';

// VIEW 6 "Details" tab (School Admin Portal.dc.html:835-843): ONE white
// 24-radius card (26px 30px) holding the "School details" title and the
// field list — 14px row rhythm over hairlines, key in muted ink, value 600
// right-aligned. Every value comes from C-SCH-01 / the signed-in user —
// anything the record leaves null renders the design's "Not set".
export function AccountDetailsCard({ school, adminEmail }: AccountDetailsCardProps) {
  const t = useTranslations('SchoolAdmin');
  const location = formatSchoolLocation(school);

  return (
    <DataPanel
      data-slot="account-details-card"
      className="flex flex-col rounded-card border-0 px-7.5 py-6.5 shadow-sm"
    >
      <PanelHeaderRow as="h2" title={t('account.detailsTitle')} className="pb-4" />
      <KeyValueList className="gap-0">
        <KeyValueRow label={t('account.schoolLabel')} className="py-3.5">
          {school.name}
        </KeyValueRow>
        <KeyValueRow label={t('account.locationLabel')} className="py-3.5">
          {location === '' ? t('account.notSet') : location}
        </KeyValueRow>
        <KeyValueRow label={t('account.adminLabel')} className="py-3.5">
          {adminEmail ?? t('account.notSet')}
        </KeyValueRow>
        <KeyValueRow label={t('account.statusLabel')} className="py-3.5">
          <span className="inline-flex flex-wrap items-center justify-end gap-2">
            <Badge variant={ACCOUNT_STATUS_VARIANTS[school.account_status]}>
              {t(`accountStatus.${school.account_status}`)}
            </Badge>
            <Badge variant={ONBOARDING_STATUS_VARIANTS[school.onboarding_status]}>
              {t(`onboardingStatus.${school.onboarding_status}`)}
            </Badge>
          </span>
        </KeyValueRow>
      </KeyValueList>
    </DataPanel>
  );
}
