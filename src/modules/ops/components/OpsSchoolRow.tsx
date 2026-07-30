'use client';

import { useTranslations } from 'next-intl';

import { Link } from '@/i18n/navigation';
import { Badge, TableCell, TableRow } from '@/modules/design-system';
import type { OpsSchool } from '@/modules/ops/types/ops.types';
import { ACCOUNT_STATUS_VARIANTS, ONBOARDING_STATUS_VARIANTS } from '@/modules/school-admin';

interface OpsSchoolRowProps {
  school: OpsSchool;
}

// One C-OPS-01 row: the school name (linking to the detail page), the two
// lifecycle chips and the live teacher/class/student/result counts.
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
        <Badge variant={ACCOUNT_STATUS_VARIANTS[school.account_status]}>
          {t(`accountStatus.${school.account_status}`)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={ONBOARDING_STATUS_VARIANTS[school.onboarding_status]}>
          {t(`onboardingStatus.${school.onboarding_status}`)}
        </Badge>
      </TableCell>
      <TableCell>{school.teacher_count}</TableCell>
      <TableCell>{school.class_count}</TableCell>
      <TableCell>{school.student_count}</TableCell>
      <TableCell>{school.results_count}</TableCell>
    </TableRow>
  );
}
