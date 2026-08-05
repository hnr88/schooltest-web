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

// Spec section 5 "School details card": school, location, admin email and the
// two lifecycle chips. Every value comes from C-SCH-01 / the signed-in user —
// anything the record leaves null renders the spec's "Not set".
export function AccountDetailsCard({ school, adminEmail }: AccountDetailsCardProps) {
  const t = useTranslations('SchoolAdmin');
  const location = formatSchoolLocation(school);

  return (
    <DataPanel data-slot="account-details-card" className="flex flex-col gap-4 p-6">
      <PanelHeaderRow as="h2" title={t('account.detailsTitle')} />
      <KeyValueList>
        <KeyValueRow label={t('account.schoolLabel')}>{school.name}</KeyValueRow>
        <KeyValueRow label={t('account.locationLabel')}>
          {location === '' ? t('account.notSet') : location}
        </KeyValueRow>
        <KeyValueRow label={t('account.adminLabel')}>
          {adminEmail ?? t('account.notSet')}
        </KeyValueRow>
        <KeyValueRow label={t('account.statusLabel')}>
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
