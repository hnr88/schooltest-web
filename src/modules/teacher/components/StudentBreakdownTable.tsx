'use client';

import { useTranslations } from 'next-intl';
import { useId } from 'react';

import { PhaseChip } from '@/modules/teacher/components/v2/PhaseChip';
import { STUDENT_I18N_NAMESPACE } from '@/modules/teacher/constants/student-detail.constants';
import { BAND_LABEL_KEY, GATE_LABEL_KEY, VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import { BREAKDOWN_VOCAB_LABEL_KEY } from '@/modules/teacher/constants/student-report.constants';
import { drillDownLabelKey } from '@/modules/teacher/lib/student-drill-down-view';
import type { StudentDrillDownViewModel } from '@/modules/teacher/lib/student-drill-down-view';
import type { AcaraPhaseKey } from '@/modules/teacher/types/teacher-kit.types';
import { cn } from '@/lib/utils';

/**
 * The server band → the chip's phase key, for the pill's traffic-light colours
 * ONLY — the label is the band's own (`BAND_LABEL_KEY`), and no score is ever
 * thresholded here (Spec 02 §3c).
 */
const BAND_PHASE: Readonly<Record<'secure' | 'developing' | 'emerging' | 'not_yet', AcaraPhaseKey>> = {
  secure: 'consolidating',
  developing: 'developing',
  emerging: 'emerging',
  not_yet: 'beginning',
};

// "Reading subskill breakdown" (Spec 02 §3c, `02 Student report.html:287–350`):
// the nine display rows in canonical order. Rows 1–8 carry the server band as a
// bordered traffic-light pill (Academic vocabulary's own 4-way band, with its
// provisional-cut caveat); row 9, Critical reading, is the ONLY exit-gate pill.
// A null band or gate prints the kit dash.
function StudentBreakdownTable({
  view,
  className,
}: {
  view: StudentDrillDownViewModel;
  className?: string;
}) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);
  const tKit = useTranslations('TeacherPortal.kit');
  // Row labels are FULL catalog keys (`Teach.diagnostic.areas.R1`,
  // `Report.attributes.Vocab_A2`, …) — the shipped naming, resolved at the root.
  const tLabel = useTranslations();
  const headingId = useId();

  return (
    <section
      data-slot="student-breakdown"
      aria-labelledby={headingId}
      className={cn('flex flex-col overflow-hidden rounded-[16px] border border-[#E6EBF3] bg-white shadow-[0_1px_3px_rgba(14,35,80,0.05)]', className)}
    >
      <h2 id={headingId} className="border-b border-[#E6EBF3] bg-[#F5F8FD] px-5 py-4 text-[16px] font-semibold text-navy-900">
        {t('breakdown.title')}
      </h2>
      <div className="flex gap-4 px-5 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-[0.05em] text-[#9CA3AF] uppercase">
        <span className="min-w-0 flex-1">{t('breakdown.columnSubskill')}</span>
        <span className="min-w-0 flex-1">{t('breakdown.columnPhase')}</span>
      </div>
      <ol className="px-2 pb-2">
        {view.breakdown.map((row) => (
          <li
            key={row.attribute}
            data-slot="student-breakdown-row"
            data-skill={row.attribute}
            className="mt-0.5 flex items-center gap-4 rounded-[10px] px-3 py-2.5 hover:bg-[#F7F9FD]"
          >
            <span className="min-w-0 flex-1 text-[13.5px] font-medium text-navy-900">
              {tLabel(BREAKDOWN_VOCAB_LABEL_KEY[row.attribute] ?? drillDownLabelKey(row.attribute))}
              {row.kind === 'band' && row.provisionalCut && row.band !== null ? (
                <span className="mt-0.5 block text-[11px] font-normal text-[#6B7280]">
                  {t('breakdown.provisionalNote')}
                </span>
              ) : null}
            </span>
            <span className="flex min-w-0 flex-1" data-slot="student-breakdown-phase">
              {row.kind === 'gate' ? (
                row.passed === null ? (
                  tKit('noValue')
                ) : (
                  <PhaseChip
                    variant="pill"
                    phase={null}
                    tone={row.passed ? 'success' : 'warning'}
                    label={tVm(GATE_LABEL_KEY[row.passed ? 'passed' : 'notYet'])}
                  />
                )
              ) : row.band === null ? (
                tKit('noValue')
              ) : (
                <PhaseChip
                  variant="pill"
                  phase={BAND_PHASE[row.band]}
                  label={tVm(BAND_LABEL_KEY[row.band])}
                />
              )}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export { StudentBreakdownTable };
