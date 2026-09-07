'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Badge, TableCell, TableRow } from '@/modules/design-system';
import { ACCOUNT_STATUS_VARIANTS, ONBOARDING_STATUS_VARIANTS } from '@/modules/school-admin';

import type { OpsSchoolRowProps } from '@/modules/ops/types/components.types';

// One C-OPS-PORTAL-001 row: the school name (linking to the detail page), the
// two lifecycle chips and the live counts. The Teachers column shows the
// teacher-only count (portal_teacher_count); the legacy staff count stays on
// the row payload untouched, and Admins is split out beside it. A null legacy
// status renders as an unset cell rather than a labelled chip.
export function OpsSchoolRow({ school }: OpsSchoolRowProps) {
  const t = useTranslations('Ops.schools');

  return (
    <TableRow>
      <TableCell>
        <Link
          href={`/dashboard/ops/schools/${school.documentId}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {school.name}
        </Link>
      </TableCell>
      <TableCell>
        {school.account_status ? (
          <Badge variant={ACCOUNT_STATUS_VARIANTS[school.account_status]}>
            {t(`accountStatus.${school.account_status}`)}
          </Badge>
        ) : null}
      </TableCell>
      <TableCell>
        {school.onboarding_status ? (
          <Badge variant={ONBOARDING_STATUS_VARIANTS[school.onboarding_status]}>
            {t(`onboardingStatus.${school.onboarding_status}`)}
          </Badge>
        ) : null}
      </TableCell>
      <TableCell>{school.portal_teacher_count}</TableCell>
      <TableCell>{school.admin_count}</TableCell>
      <TableCell>{school.class_count}</TableCell>
      <TableCell>{school.student_count}</TableCell>
      <TableCell>{school.results_count}</TableCell>
    </TableRow>
  );
}
