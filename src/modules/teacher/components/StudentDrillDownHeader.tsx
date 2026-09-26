'use client';

import { Download, Sparkle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { StudentSkillSelect } from '@/modules/teacher/components/StudentSkillSelect';
import { InitialsAvatar } from '@/modules/teacher/components/v2/InitialsAvatar';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import {
  OVERALL_DELTA_KEY,
  STUDENT_HEADER_BUTTON_CLASS,
  STUDENT_I18N_NAMESPACE,
} from '@/modules/teacher/constants/student-detail.constants';
import { acaraPhaseKey } from '@/modules/teacher/lib/teacher-kit';
import type {
  StudentDrillDownHeaderProps,
  StudentGrowthPillProps,
} from '@/modules/teacher/types/student-drill-down.types';

/** The growth pill's soft pair per direction (Spec 02 §3a, `02 Student report.html:188`). */
const GROWTH_PILL_CLASS = {
  up: 'bg-[#E9F6EF] text-[#1F7A4D]',
  down: 'bg-[#FDEEEC] text-[#B42318]',
  flat: 'bg-[#F1F3F6] text-[#5B6472]',
} as const;

const STAT_CARD_CLASS =
  'flex flex-col gap-[9px] rounded-[14px] border border-[#E1E9F7] bg-white px-[18px] py-[15px] shadow-[0_1px_2px_rgba(14,35,80,0.05)]';
const STAT_LABEL_CLASS = 'text-[11px] font-semibold tracking-[0.06em] text-[#6B7280] uppercase';

// The overall stat card's growth pill: the server history's own latest-minus-first
// delta, coloured by its direction. Under two scored sittings there is no delta,
// so there is no pill — never a number invented (Spec 02 §3a/§5).
function GrowthPill({ growth }: StudentGrowthPillProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  if (growth.direction === null) return null;
  return (
    <span
      data-slot="student-overall-delta"
      className={cn(
        'rounded-full px-[9px] py-[3px] text-[12.5px] font-semibold whitespace-nowrap tabular-nums',
        GROWTH_PILL_CLASS[growth.direction],
      )}
    >
      {growth.direction === 'flat'
        ? t(OVERALL_DELTA_KEY.flat)
        : t(OVERALL_DELTA_KEY[growth.direction], { points: Math.abs(growth.delta ?? 0) })}
    </span>
  );
}

// The student header (Spec 02 §3a, `02 Student report.html:102–206`): a soft blue
// banner holding the avatar, name and "{class} · Reading" subline, the skill
// select, the server's de-identified Markdown export (C-TR-7), Ask AI and — inside
// the banner — three white stat cards: overall % with the growth pill, the ACARA
// phase (the server's own string) and momentum (the 5/10 provisional cuts). A
// refused export is said in text, never swallowed.
function StudentDrillDownHeader({
  studentName,
  className,
  view,
  actions,
  skill,
  onValueChange,
}: StudentDrillDownHeaderProps) {
  const t = useTranslations(STUDENT_I18N_NAMESPACE);
  const tExport = useTranslations('Teacher.results.export');
  const tKit = useTranslations('TeacherPortal.kit');
  const phase = acaraPhaseKey(view.acaraPhase);

  return (
    <div
      data-slot="student-drill-down-header"
      className="flex flex-col gap-5 rounded-[18px] border border-[#E1E9F7] bg-gradient-to-br from-[#EEF3FC] to-[#F7F9FD] px-6 py-[22px]"
    >
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 items-center gap-4">
          <InitialsAvatar
            name={studentName}
            size="xl"
            tone="navy"
            className="flex-none shadow-[0_2px_8px_rgba(14,35,80,0.18)] ring-4 ring-white"
          />
          <div className="min-w-0">
            <h1 className="text-[26px] font-semibold tracking-[-0.02em] break-words text-navy-900">
              {studentName}
            </h1>
            <p data-slot="student-meta" className="mt-1 text-[13.5px] text-[#4B5563]">
              {t('subtitle', { class: className })}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StudentSkillSelect skill={skill} onValueChange={onValueChange} />
          {actions === null ? null : (
            <>
              <TeacherButton
                tone="outline"
                size="md"
                data-slot="student-export-button"
                title={t('exportTitle')}
                loading={actions.exportPending}
                onClick={actions.exportMarkdown}
                className={STUDENT_HEADER_BUTTON_CLASS}
              >
                <Download aria-hidden="true" className="size-[15px]" strokeWidth={2} />
                {t('export')}
              </TeacherButton>
              <TeacherButton
                tone="primary"
                size="md"
                data-slot="student-ask-ai-button"
                title={t('askAiTitle')}
                aria-expanded={actions.askAiOpen}
                onClick={actions.askAi}
                // The design draws THIS navy button with a 1px same-colour border
                // (`:119`) — the kit's `primary` tone keeps `border-0` (round 1 row 19).
                className={`${STUDENT_HEADER_BUTTON_CLASS} border border-navy-900`}
              >
                <Sparkle aria-hidden="true" className="size-[15px]" strokeWidth={2} />
                {actions.askAiOpen ? t('hideAi') : t('askAi')}
              </TeacherButton>
            </>
          )}
        </div>
      </div>
      {actions?.exportFailed ? (
        <p role="alert" data-slot="teacher-export-error" className="self-end text-[12.5px] text-[#B42318]">
          {tExport('failed')}
        </p>
      ) : null}
      <div data-slot="student-stat-cards" className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
        <div data-slot="student-stat-overall" className={STAT_CARD_CLASS}>
          <div className={STAT_LABEL_CLASS}>{t('statOverall')}</div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span
              data-slot="student-overall-score"
              className="text-[24px] leading-none font-semibold tracking-[-0.02em] text-navy-900 tabular-nums"
            >
              {view.overallPct === null ? tKit('noValue') : t('percent', { value: view.overallPct })}
            </span>
            <GrowthPill growth={view.growth} />
          </div>
        </div>
        <div data-slot="student-stat-phase" className={STAT_CARD_CLASS}>
          <div className={STAT_LABEL_CLASS}>{t('statAcaraPhase')}</div>
          <span
            data-slot="student-stat-phase-value"
            data-phase={phase ?? undefined}
            className="text-[24px] leading-none font-semibold tracking-[-0.02em] text-navy-900"
          >
            {phase === null ? tKit('noValue') : tKit(`phase.${phase}`)}
          </span>
        </div>
        <div data-slot="student-stat-momentum" className={STAT_CARD_CLASS}>
          <div className={STAT_LABEL_CLASS}>{t('statMomentum')}</div>
          <div className="flex flex-wrap items-baseline gap-2">
            {view.momentum.kind === null ? null : (
              <span
                data-slot="student-stat-momentum-value"
                data-momentum={view.momentum.kind}
                className="text-[24px] leading-none font-semibold tracking-[-0.02em] text-navy-900"
              >
                {t(`momentum.${view.momentum.kind}`)}
              </span>
            )}
            <span className="text-[12px] text-[#6B7280]">
              {t(view.momentum.kind === null ? 'momentumNote.none' : `momentumNote.${view.momentum.kind}`)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export { StudentDrillDownHeader };
