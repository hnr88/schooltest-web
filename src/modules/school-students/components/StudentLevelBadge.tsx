'use client';

import { useTranslations } from 'next-intl';

import { Badge } from '@/modules/design-system';
import { ACARA_PHASE_BADGE_VARIANTS } from '@/modules/school-students/constants/components.constants';
import { toAcaraPhase } from '@/modules/school-students/lib/student-level';

import type { StudentLevelBadgeProps } from '@/modules/school-students/types/components.types';

// Spec §4 Level cell. The phase drives one of the Badge tones the design system
// already ships (beginning danger, emerging warning, developing accent,
// consolidating success); a student with no phase on file reads as not set.
export function StudentLevelBadge({ phase }: StudentLevelBadgeProps) {
  const t = useTranslations('SchoolStudents');
  const level = toAcaraPhase(phase);

  if (!level) {
    return <span className="text-muted-foreground">{t('table.notSet')}</span>;
  }

  return (
    <Badge variant={ACARA_PHASE_BADGE_VARIANTS[level]}>
      {t(`form.acaraPhaseOption.${level}`)}
    </Badge>
  );
}
