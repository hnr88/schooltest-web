'use client';

import { useTranslations } from 'next-intl';

import { BandChip } from '@/modules/teacher/components/v2/BandChip';
import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import {
  STUDENT_BAND_CHIP,
  STUDENT_GATE_CHIP_TONE,
  STUDENT_I18N_NAMESPACE,
  STUDENT_TAG_CHIP_TONE,
} from '@/modules/teacher/constants/student-detail.constants';
import { VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import { useStudentText } from '@/modules/teacher/hooks/useStudentText';
import { strandsText, subskillDeltaText } from '@/modules/teacher/lib/student-detail-text';
import type { StudentSubskillCardProps } from '@/modules/teacher/types/student-drill-down.types';

// One reading subskill (`Teacher Portal v2.dc.html:443–461`): score, band bar, the
// server's movement, the band chip (the exit gate on Critical reading), the vocabulary
// strands and the blurb. Tones are the view model's; nothing here thresholds a score.
function StudentSubskillCard({ card }: StudentSubskillCardProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);
  const tKit = useTranslations('TeacherPortal.kit');
  const { text } = useStudentText();
  const delta = subskillDeltaText(card.delta);
  const strands = strandsText(card.strands);

  return (
    <article
      data-slot="student-subskill"
      data-skill={card.skill}
      data-assessed={card.score !== null}
      className="flex w-full flex-col rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[18px] py-4"
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="text-[14.5px] font-semibold text-navy-900">{tVm(card.labelKey)}</h3>
          {card.tag === null ? null : (
            <ToneChip tone={STUDENT_TAG_CHIP_TONE[card.tag.kind]} size="xs" className="text-[10px]">
              {tVm(card.tag.labelKey)}
            </ToneChip>
          )}
        </div>
        <span data-slot="student-subskill-score" className="text-[16px] font-semibold tabular-nums" style={{ color: card.barTone.fg }}>
          {card.score === null ? tKit('noValue') : t('percent', { value: card.score })}
        </span>
      </div>
      <div className="mt-[11px] flex items-center gap-[9px]">
        <div aria-hidden="true" className="h-2 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: card.barTone.bg }}>
          <div className="h-full rounded-full" style={{ width: `${card.score ?? 0}%`, backgroundColor: card.barTone.fg }} />
        </div>
        {delta === null || card.delta.kind === 'none' ? null : (
          <span
            data-slot="student-subskill-delta"
            className="text-[12px] font-semibold whitespace-nowrap tabular-nums"
            style={{ color: card.delta.fg }}
          >
            {text(delta)}
          </span>
        )}
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-2">
        {card.band === null ? null : <BandChip band={STUDENT_BAND_CHIP[card.band.band]} label={tVm(card.band.labelKey)} />}
        {card.gate === null ? null : (
          <ToneChip tone={STUDENT_GATE_CHIP_TONE[card.gate.passed ? 'passed' : 'notYet']} size="sm" className="text-[11px]">
            {tVm(card.gate.labelKey)}
          </ToneChip>
        )}
        {strands === null ? null : (
          <span data-slot="student-subskill-strands" className="text-[11.5px] text-[#6B7280] tabular-nums">
            {text(strands)}
          </span>
        )}
      </div>
      <p className="mt-[11px] text-[12px] leading-[1.5] text-[#6B7280]">{tVm(card.blurbKey)}</p>
    </article>
  );
}

export { StudentSubskillCard };
