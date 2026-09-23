'use client';

import { useTranslations } from 'next-intl';

import { ToneChip } from '@/modules/teacher/components/v2/ToneChip';
import {
  STUDENT_GATE_CHIP_TONE,
  STUDENT_I18N_NAMESPACE,
  STUDENT_LADDER_BANDS,
  STUDENT_TAG_CHIP_TONE,
} from '@/modules/teacher/constants/student-detail.constants';
import { VIEW_MODEL_I18N_NAMESPACE } from '@/modules/teacher/constants/v2-i18n.constants';
import { useStudentText } from '@/modules/teacher/hooks/useStudentText';
import { subskillDeltaText } from '@/modules/teacher/lib/student-detail-text';
import type { StudentSubskillCardProps } from '@/modules/teacher/types/student-drill-down.types';

// One reading subskill (`Teacher Portal v2.dc.html:443–461`): its ACARA phase (the
// server band) and four-step phase ladder, the server's movement, the exit gate on
// Critical reading and the blurb. No score or percentage. Nothing here thresholds.
function StudentSubskillCard({ card }: StudentSubskillCardProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tVm = useTranslations(VIEW_MODEL_I18N_NAMESPACE);
  const tKit = useTranslations('TeacherPortal.kit');
  const { text } = useStudentText();
  const delta = subskillDeltaText(card.delta);
  const band = card.band;
  const isGate = card.skill === 'Critical';
  const step = band === null ? 0 : STUDENT_LADDER_BANDS.indexOf(band.band) + 1;
  const label = tVm(card.labelKey);

  return (
    <article
      data-slot="student-subskill"
      data-skill={card.skill}
      data-assessed={card.score !== null}
      className="flex w-full flex-col rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[18px] py-4"
    >
      <div className="flex items-center justify-between gap-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <h3 className="text-[14.5px] font-semibold text-navy-900">{label}</h3>
          {card.tag === null ? null : (
            <ToneChip tone={STUDENT_TAG_CHIP_TONE[card.tag.kind]} size="xs" className="text-[10px]">
              {tVm(card.tag.labelKey)}
            </ToneChip>
          )}
        </div>
        {isGate && card.gate !== null ? null : (
          <span data-slot="student-subskill-phase" className="text-[14.5px] font-semibold" style={{ color: card.barTone.fg }}>
            {band === null ? tKit('noValue') : tVm(band.labelKey)}
          </span>
        )}
      </div>
      {isGate ? null : (
        <div className="mt-[11px] flex items-center gap-[9px]">
          <div
            data-slot="student-subskill-ladder"
            data-step={step}
            role="img"
            aria-label={band === null ? `${label}: ${tKit('noValue')}` : t('subskills.ladderLabel', { skill: label, phase: tVm(band.labelKey), step })}
            className="grid flex-1 grid-cols-4 gap-1"
          >
            {STUDENT_LADDER_BANDS.map((rung, index) => (
              <span
                key={rung}
                aria-hidden="true"
                data-reached={index < step}
                className="h-2 rounded-full"
                style={{ backgroundColor: index < step ? card.barTone.fg : card.barTone.bg }}
              />
            ))}
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
      )}
      {card.gate === null ? null : (
        <div className="mt-2.5 flex flex-wrap items-center gap-2">
          <ToneChip tone={STUDENT_GATE_CHIP_TONE[card.gate.passed ? 'passed' : 'notYet']} size="sm" className="text-[11px]">
            {tVm(card.gate.labelKey)}
          </ToneChip>
        </div>
      )}
      <p className="mt-[11px] text-[12px] leading-[1.5] text-[#6B7280]">{tVm(card.blurbKey)}</p>
    </article>
  );
}

export { StudentSubskillCard };
