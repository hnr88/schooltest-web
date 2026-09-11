'use client';

import { useTranslations } from 'next-intl';

import { ACARA_PHASE_PILL_TONES } from '@/modules/school-students/constants/components.constants';
import { toAcaraPhase } from '@/modules/school-students/lib/student-level';

import type { StudentLevelBadgeProps } from '@/modules/school-students/types/components.types';

// School Admin Portal design phase pill (:1176, :1179): 12/600 on the phase's
// soft tint pair, rounded-full. The row list draws it at 5px 12px, the
// drill-down header at 6px 13px — `compact` picks the row sizing.
export function StudentLevelBadge({ phase, compact }: StudentLevelBadgeProps) {
  const t = useTranslations('SchoolStudents');
  const level = toAcaraPhase(phase);

  if (!level) {
    return <span className="text-muted-foreground">{t('table.notSet')}</span>;
  }

  const tone = ACARA_PHASE_PILL_TONES[level];

  return (
    <span
      data-slot="student-level-badge"
      className={
        compact
          ? 'inline-block rounded-full px-3 py-[5px] text-xs font-semibold'
          : 'inline-block rounded-full px-[13px] py-1.5 text-xs font-semibold'
      }
      style={{ color: tone.fg, backgroundColor: tone.bg }}
    >
      {t(`form.acaraPhaseOption.${level}`)}
    </span>
  );
}
