'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { cn } from '@/lib/utils';
import { StudentProgressChart } from '@/modules/teacher/components/StudentProgressChart';
import { PhaseChip } from '@/modules/teacher/components/v2/PhaseChip';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import { useStudentText } from '@/modules/teacher/hooks/useStudentText';
import { progressTiles } from '@/modules/teacher/lib/student-detail-text';
import { acaraPhaseKey } from '@/modules/teacher/lib/teacher-kit';
import type { StudentProgressPanelProps } from '@/modules/teacher/types/student-drill-down.types';

// "Reading progress over time" (`Teacher Portal v2.dc.html:394–436`): the ACARA phase
// chip, the per-sitting chart and the 2×2 grid of baseline, latest, growth and sittings.
// A tile without a value prints the kit dash, never a number.
function StudentProgressPanel({ view }: StudentProgressPanelProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);
  const tKit = useTranslations('TeacherPortal.kit');
  const { text } = useStudentText();
  const headingId = useId();
  const phase = view.phase === null ? null : acaraPhaseKey(view.phase.phase);

  return (
    <section
      data-slot="student-progress"
      aria-labelledby={headingId}
      className="rounded-[12px] border border-[#ECEEF2] bg-[#FAFBFC] px-[22px] py-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id={headingId} className="text-[15px] font-semibold text-navy-900">
            {t('progressTitle')}
          </h2>
          <p className="mt-[3px] text-[12.5px] text-[#6B7280]">{t('progressDescription')}</p>
        </div>
        {view.phase === null || phase === null ? null : (
          <PhaseChip
            phase={phase}
            size="lg"
            label={t('phaseChip', { phase: tVm(view.phase.subLabelKey) })}
            className="flex-none"
          />
        )}
      </div>
      <div className="mt-[14px] flex flex-wrap items-center gap-6">
        <div className="max-w-[520px] min-w-[min(280px,100%)] flex-[1_1_380px]">
          <StudentProgressChart chart={view.chart} />
        </div>
        <dl
          data-slot="student-progress-tiles"
          className="grid min-w-[min(190px,100%)] flex-[1_1_200px] grid-cols-2 gap-px overflow-hidden rounded-[10px] border border-[#ECEEF2] bg-[#ECEEF2]"
        >
          {progressTiles(view).map((tile) => (
            <div key={tile.id} data-tile={tile.id} className="bg-white px-3.5 py-3">
              <dt className="text-[10.5px] font-semibold tracking-[0.05em] text-[#9CA3AF] uppercase">
                {text(tile.label)}
              </dt>
              <dd
                className={cn('mt-[5px] text-[15px] font-semibold tabular-nums', tile.fg === null && 'text-navy-900')}
                style={tile.fg === null ? undefined : { color: tile.fg }}
              >
                {tile.value === null ? tKit('noValue') : text(tile.value)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

export { StudentProgressPanel };
