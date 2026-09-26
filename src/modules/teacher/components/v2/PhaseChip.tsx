'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import { PHASE_TONE } from '@/modules/teacher/constants/teacher-kit.constants';
import type { PhaseChipProps } from '@/modules/teacher/types/teacher-kit.types';

/** The bordered traffic-light pill (Spec 02 §3c, `02 Student report.html:297`):
 * the design's exact fg/bg/border triples, ONE map for every breakdown row —
 * Beginning red · Emerging amber · Developing blue · Consolidating green.
 */
type PillTone = 'success' | 'info' | 'warning' | 'danger';

const PILL_TONE_CLASSES: Readonly<Record<PillTone, string>> = {
  danger: 'border-[#F6CFC9] bg-[#FDEEEC] text-[#B42318]',
  warning: 'border-[#F0DCA8] bg-[#FDF4E3] text-[#92610B]',
  info: 'border-[#CFDBF2] bg-[#EAF0FB] text-[#1A3B8B]',
  success: 'border-[#A9DCC0] bg-[#E9F6EF] text-[#1F7A4D]',
};

/**
 * Teacher Portal v2 — the ACARA phase chip (phaseChip, design l.1981):
 * Consolidating green · Developing blue · Emerging amber · Beginning red; a
 * student with no measured phase reads "Not sat" in the Beginning pair. The
 * phase is the server's (normalise it with `acaraPhaseKey`) — nothing here
 * thresholds a score. `variant="pill"` draws the bordered breakdown-table pill
 * instead of the soft tint chip.
 */
function PhaseChip({ phase, label, size = 'md', variant = 'tint', tone, className }: PhaseChipProps) {
  const t = useTranslations('TeacherPortal.kit.phase');

  if (variant === 'pill') {
    // PHASE_TONE's phase values are exactly the four pill tones.
    const pillTone: PillTone =
      tone ?? (phase === null ? 'danger' : (PHASE_TONE[phase] as PillTone));
    return (
      <span
        data-tone={pillTone}
        className={cn(
          'inline-flex items-center rounded-full border px-[11px] py-[3px] text-[12.5px] font-semibold whitespace-nowrap',
          PILL_TONE_CLASSES[pillTone],
          className,
        )}
      >
        {label ?? t(phase ?? 'notSat')}
      </span>
    );
  }

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
