'use client';

import { ArrowLeftRight, Blocks, BookOpen, Download, Type, type LucideIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

import {
  BAND_BORDER,
  PHASE_BORDER,
  TEACHING_AVATAR_LIMIT,
  TEACHING_AVATARS,
} from '@/modules/teacher/constants/teaching.constants';
import { PHASE_LABEL_KEY } from '@/modules/teacher/constants/v2-i18n.constants';
import { useTeachingInsights } from '@/modules/teacher/hooks/useTeachingInsights';
import { saveTextFile } from '@/modules/teacher/lib/teacher-export-download';
import { allStudentsPrompt, strandPrompt, studentPrompt } from '@/modules/teacher/lib/v2/teaching/prompts';
import type { TeachingInsightsPanelProps } from '@/modules/teacher/types/class-analytics.types';
import type {
  NextPhase,
  TeachingNextStep,
  TeachingStrand,
  TeachingStrandGroup,
} from '@/modules/teacher/types/teaching-plan.types';

const MARKDOWN = 'text/markdown;charset=utf-8';

const STRAND_ICONS: Readonly<Record<TeachingStrand, LucideIcon>> = {
  vocabulary: Type,
  comprehension: BookOpen,
  foundations: Blocks,
};

const STRANDS: readonly TeachingStrand[] = ['vocabulary', 'comprehension', 'foundations'];

/** The pill text's next phase: the ACARA ladder's own labels, or the mock's "Extend" past Consolidating. */
function useNextPhaseLabel() {
  const t = useTranslations('TeacherPortal.insights');
  const tv = useTranslations('TeacherPortal.viewModel');
  return (nextPhase: NextPhase) =>
    nextPhase === 'Extend' ? t('teaching.nextSteps.extend') : tv(PHASE_LABEL_KEY[nextPhase]);
}

// Spec 04 (`live_feedback_2/spec-teacher-portal-04-teaching.md`, mock `04 Teaching.html`):
// the Teaching tab rebuilt as a week-by-week action page over the ONE roster read.
// "Whole class" is THREE differentiation cards (Vocabulary / Comprehension / Foundations),
// each grouping students by the subskill where they sit furthest below the class mean;
// Critical reading is never a group — it is the exit-gate chip on the Comprehension card
// (§0.1). "Individual" is Reading pairs (on the class's largest-gap skill) and Next steps
// (one vocabulary + one comprehension pill per student, coloured by their CURRENT band,
// naming the NEXT phase). Every button downloads a name-free Markdown prompt the teacher
// pastes into their own AI assistant. The root carries `leading-[normal]` like every
// other teacher tab panel (P1 round 2 · N13).
function TeachingInsightsPanel({ rows }: TeachingInsightsPanelProps) {
  const t = useTranslations('TeacherPortal.insights');
  const tv = useTranslations('TeacherPortal.viewModel');
  const nextPhaseLabel = useNextPhaseLabel();
  const { view, hasResults } = useTeachingInsights(rows);

  const downloadStrand = (strand: TeachingStrand) =>
    saveTextFile(strandPrompt(strand, view.strands[strand]), `teaching-prompt-${strand}.md`, MARKDOWN);
  const downloadAll = () =>
    saveTextFile(allStudentsPrompt(view.nextSteps), 'teaching-prompt-all.md', MARKDOWN);
  const downloadStudent = (student: TeachingNextStep, index: number) =>
    saveTextFile(
      studentPrompt(student),
      `teaching-prompt-student-${index + 1}-${student.initials.toLowerCase()}.md`,
      MARKDOWN,
    );

  const promptButton = (
    <button
      type="button"
      data-slot="teaching-prompt"
      data-scope="all"
      title={t('teaching.prompt.title')}
      onClick={downloadAll}
      className="inline-flex h-[34px] flex-none items-center gap-[7px] rounded-lg bg-navy-900 px-[13px] text-[12.5px] font-semibold text-white hover:bg-[#16326B]"
    >
      <Download size={14} strokeWidth={2} aria-hidden />
      {t('teaching.prompt.all')}
    </button>
  );

  const strandCard = (strand: TeachingStrand) => {
    const Icon = STRAND_ICONS[strand];
    const groups = view.strands[strand];
    return (
      <div
        key={strand}
        data-slot="teaching-strand-card"
        data-strand={strand}
        className="flex flex-col overflow-hidden rounded-2xl border border-[#E6EBF3] bg-white shadow-[0_1px_3px_rgba(14,35,80,0.05)]"
      >
        <div className="flex items-center gap-3 border-b border-[#E6EBF3] bg-[#F5F8FD] px-[18px] py-4">
          <span className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-white text-[#1A3B8B] shadow-[0_1px_2px_rgba(14,35,80,0.08)]">
            <Icon size={18} strokeWidth={2} aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-navy-900">{t(`teaching.strands.${strand}`)}</div>
            <div className="mt-px text-xs text-[#6B7280]">{t(`teaching.strands.${strand}Sub`)}</div>
          </div>
          <button
            type="button"
            data-slot="teaching-prompt"
            data-scope={`strand:${strand}`}
            title={t('teaching.prompt.title')}
            aria-label={t('teaching.prompt.strandFor', { strand: t(`teaching.strands.${strand}`) })}
            disabled={groups.length === 0}
            onClick={() => downloadStrand(strand)}
            className="inline-flex h-[34px] flex-none items-center gap-[7px] rounded-lg bg-navy-900 px-[13px] text-[12.5px] font-semibold text-white hover:bg-[#16326B] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={14} strokeWidth={2} aria-hidden />
            {t('teaching.prompt.strand')}
          </button>
        </div>
        <div className="flex flex-col gap-2 px-4 pb-4 pt-3.5">
          {groups.length === 0 ? (
            <p className="text-[12.5px] text-[#6B7280]">{t('teaching.strands.empty')}</p>
          ) : (
            groups.map((group, index) => <GroupRow key={group.skill} group={group} letter={String.fromCharCode(65 + index)} />)
          )}
          {strand === 'comprehension' ? <GateChip /> : null}
        </div>
      </div>
    );
  };

  function GroupRow({ group, letter }: { group: TeachingStrandGroup; letter: string }) {
    const badge =
      group.phase === null
        ? { fg: '#5B6472', bg: '#F1F3F6', border: '#E5E7EB' }
        : { fg: group.phase.tone.fg, bg: group.phase.tone.bg, border: PHASE_BORDER[group.phase.phase] };
    return (
      <div
        data-slot="teaching-group"
        data-skill={group.skill}
        data-count={group.count}
        data-phase={group.phase?.phase}
        title={group.members.join(', ')}
        className="relative flex items-center gap-3 rounded-xl border border-[#EDF0F5] bg-white py-3 pl-3 pr-3.5 hover:border-[#CFDBF2] hover:shadow-[0_2px_8px_rgba(14,35,80,0.07)]"
      >
        <span
          style={{ color: badge.fg, backgroundColor: badge.bg, borderColor: badge.border }}
          className="grid h-[30px] w-[30px] flex-none place-items-center rounded-[9px] border text-[13px] font-bold"
        >
          {letter}
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-navy-900">{t(`teaching.skills.${group.skill}`)}</span>
          <span className="sr-only">{group.members.join(', ')}</span>
          {group.phase === null ? null : (
            <span className="text-[11.5px] font-medium text-[#6B7280]">
              {tv(group.phase.labelKey)}
              {group.provisionalCut ? ` · ${t('teaching.provisional')}` : ''}
            </span>
          )}
        </div>
        <div className="flex flex-none items-center pl-2">
          {group.students.slice(0, TEACHING_AVATAR_LIMIT).map((student, index) => {
            const [bg, fg] = TEACHING_AVATARS[index % TEACHING_AVATARS.length];
            return (
              <span
                key={student.studentDocumentId}
                title={student.name}
                style={{ backgroundColor: bg, color: fg, marginLeft: index === 0 ? undefined : '-8px' }}
                className="grid h-[30px] w-[30px] place-items-center rounded-full border-2 border-white text-[10.5px] font-bold"
              >
                {student.initials}
              </span>
            );
          })}
          {group.students.length > TEACHING_AVATAR_LIMIT ? (
            <span
              data-slot="teaching-group-more"
              className="-ml-2 grid h-[30px] min-w-[30px] place-items-center rounded-full border-2 border-white bg-[#F1F3F6] px-1.5 text-[10.5px] font-bold text-[#5B6472]"
            >
              {t('teaching.moreMembers', { count: group.students.length - TEACHING_AVATAR_LIMIT })}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  function GateChip() {
    return (
      <div data-slot="teaching-gate" data-passed={view.gate.passed} data-not-yet={view.gate.notYet} className="mt-1 flex">
        <span className="inline-flex flex-wrap items-center gap-x-1.5 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 text-xs font-medium text-[#4B5563]">
          <span className="font-semibold text-navy-900">{t('teaching.gate.label')}</span>
          <span>
            {t('teaching.gate.passed', { count: view.gate.passed })} · {t('teaching.gate.notYet', { count: view.gate.notYet })}
          </span>
          {view.gate.provisionalCut ? <span className="text-[#92610B]">({t('teaching.provisional')})</span> : null}
        </span>
      </div>
    );
  }

  function Pill({ strand, student }: { strand: 'vocabulary' | 'comprehension'; student: TeachingNextStep }) {
    const target = student[strand];
    if (target === null) return null;
    const phase = nextPhaseLabel(target.nextPhase);
    const skill = t(`teaching.skills.${target.skill}`);
    return (
      <span
        data-slot="teaching-pill"
        data-strand={strand}
        data-skill={target.skill}
        data-phase={target.phase}
        title={target.provisionalCut ? t('teaching.provisional') : undefined}
        style={{ color: target.tone.fg, backgroundColor: target.tone.bg, borderColor: BAND_BORDER[target.band] }}
        className="rounded-full border px-[9px] py-[3px] text-[11.5px] font-semibold sm:whitespace-nowrap"
      >
        <span className="sr-only">{t(`teaching.nextSteps.${strand}Pill`, { skill, phase })}</span>
        <span aria-hidden="true">
        {t(strand === 'vocabulary' ? 'teaching.nextSteps.vocabularyTarget' : 'teaching.nextSteps.target', { skill, phase })}
        {target.provisionalCut ? ` · ${t('teaching.provisional')}` : null}
        </span>
      </span>
    );
  }

  return (
    <div
      data-slot="teaching-insights"
      data-status={hasResults ? 'ready' : 'empty'}
      className="flex flex-col gap-[18px] leading-[normal]"
    >
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-[#E1E9F7] bg-[linear-gradient(135deg,#EEF3FC_0%,#F7F9FD_100%)] px-6 py-[22px]">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] text-navy-900">{t('title')}</h2>
          <p data-slot="teaching-summary" className="mt-1.5 text-[13.5px] text-[#4B5563]">
            {hasResults
              ? t('teaching.summary', {
                  v: view.counts.vocabularyGroups,
                  c: view.counts.comprehensionGroups,
                  f: view.counts.foundationsGroups,
                  p: view.counts.pairs,
                  n: view.counts.students,
                })
              : t('teaching.empty')}
          </p>
        </div>
      </div>
      {hasResults ? (
        <>
          <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
            <span className="grid h-6 w-6 flex-none place-items-center self-center rounded-full bg-navy-900 text-xs font-bold text-white">1</span>
            <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-navy-900">{t('teaching.section.wholeClass')}</h3>
            <span className="text-[13px] text-[#6B7280]">{t('teaching.section.wholeClassSub')}</span>
          </div>
          <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] items-start gap-4">
            {STRANDS.map(strandCard)}
          </div>
          <div className="mt-2 flex flex-wrap items-baseline gap-2.5">
            <span className="grid h-6 w-6 flex-none place-items-center self-center rounded-full bg-navy-900 text-xs font-bold text-white">2</span>
            <h3 className="text-[17px] font-semibold tracking-[-0.01em] text-navy-900">{t('teaching.section.individual')}</h3>
            <span className="text-[13px] text-[#6B7280]">{t('teaching.section.individualSub')}</span>
          </div>
          <div className="flex flex-wrap items-start gap-4">
            <div
              data-slot="teaching-pairs"
              data-skill={view.pairings.skill?.skill}
              className="flex min-w-[280px] flex-[1_1_300px] flex-col gap-2.5 rounded-2xl border border-[#E6EBF3] bg-white p-[18px] pb-4 shadow-[0_1px_3px_rgba(14,35,80,0.05)]"
            >
              <div className="min-w-0">
                <div className="text-[15px] font-semibold text-navy-900">{t('teaching.pairs.title')}</div>
                <div className="mt-px text-xs text-[#6B7280]">
                  {view.pairings.skill === null
                    ? null
                    : t('teaching.pairs.intro', { skill: tv(view.pairings.skill.labelKey) })}
                </div>
              </div>
              {view.pairings.pairs.length === 0 ? (
                <p data-slot="teaching-pairs-empty" className="text-[12.5px] text-[#6B7280]">{t('teaching.pairs.empty')}</p>
              ) : (
                view.pairings.pairs.map((pair) => (
                  <div
                    key={pair.strong.studentDocumentId}
                    data-slot="teaching-pair"
                    data-lead={pair.strong.firstName}
                    data-learner={pair.support.firstName}
                    className="flex items-center gap-2.5 rounded-xl bg-[#F7F9FD] px-3 py-[11px]"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[#16295A] text-[10.5px] font-bold text-white">
                        {pair.strong.initials}
                      </span>
                      <span className="truncate text-[13.5px] font-semibold text-navy-900">{pair.strong.firstName}</span>
                    </div>
                    <ArrowLeftRight size={18} strokeWidth={2} aria-hidden className="flex-none text-[#9CA3AF]" />
                    <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
                      <span className="truncate text-[13.5px] font-semibold text-navy-900">{pair.support.firstName}</span>
                      <span className="grid h-7 w-7 flex-none place-items-center rounded-full bg-[#DCE6F6] text-[10.5px] font-bold text-navy-900">
                        {pair.support.initials}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex min-w-[300px] flex-[2_1_440px] flex-col gap-2.5 rounded-2xl border border-[#E6EBF3] bg-white px-5 py-[18px] shadow-[0_1px_3px_rgba(14,35,80,0.05)]">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-semibold text-navy-900">{t('teaching.nextSteps.title')}</div>
                  <div className="mt-px text-xs text-[#6B7280]">{t('teaching.nextSteps.sub')}</div>
                </div>
                {promptButton}
              </div>
              <div data-slot="teaching-next-steps" className="flex flex-col">
                {view.nextSteps.map((student, index) => (
                  <div
                    key={student.studentDocumentId}
                    data-slot="teaching-next-step"
                    data-student={student.studentDocumentId}
                    className="flex flex-wrap items-center gap-3 rounded-[10px] px-2 py-[9px] hover:bg-[#F7F9FD] sm:flex-nowrap"
                  >
                    <div className="flex min-w-0 flex-none basis-[120px] items-center gap-[9px]">
                      <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-[#DCE6F6] text-[10.5px] font-bold text-navy-900">
                        {student.initials}
                      </span>
                      <span className="truncate text-[13.5px] font-semibold text-navy-900">{student.firstName}</span>
                    </div>
                    <div className="order-last flex min-w-0 basis-full flex-wrap gap-1.5 sm:order-none sm:flex-1 sm:basis-auto">
                      <Pill strand="vocabulary" student={student} />
                      <Pill strand="comprehension" student={student} />
                    </div>
                    <button
                      type="button"
                      data-slot="teaching-prompt"
                      data-scope={`student:${student.studentDocumentId}`}
                      title={t('teaching.prompt.student', { name: student.firstName })}
                      onClick={() => downloadStudent(student, index)}
                      className="ml-auto grid h-8 w-8 flex-none place-items-center rounded-lg border border-[#E5E7EB] bg-white text-navy-900 hover:border-navy-900"
                    >
                      <Download size={14} strokeWidth={2} aria-hidden />
                      <span className="sr-only">{t('teaching.prompt.student', { name: student.firstName })}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export { TeachingInsightsPanel };
