'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { PHASE_TONE } from '@/modules/teacher/constants/teacher-kit.constants';
import type { PhaseChipProps } from '@/modules/teacher/types/teacher-kit.types';

/**
 * Teacher Portal v2 — the ACARA phase chip (phaseChip, design l.1981):
 * Consolidating green · Developing blue · Emerging amber · Beginning red; a
 * student with no measured phase reads "Not sat" in the Beginning pair. The
 * phase is the server's (normalise it with `acaraPhaseKey`) — nothing here
 * thresholds a score.
 */
function PhaseChip({ phase, label, size = 'md', className }: PhaseChipProps) {
  const t = useTranslations('TeacherPortal.kit.phase');

  return (
    <ToneChip
      tone={phase === null ? 'danger' : PHASE_TONE[phase]}
      size="lg"
      className={cn(size === 'lg' && 'px-[13px] py-1.5', className)}
    >
      {label ?? t(phase ?? 'notSat')}
    </ToneChip>
  );
}

export { PhaseChip };
