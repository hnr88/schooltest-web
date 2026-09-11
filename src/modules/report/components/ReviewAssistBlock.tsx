'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';
import {
  REVIEW_CHIP,
  REVIEW_EYEBROW,
  REVIEW_TONE_CHIP,
} from '@/modules/report/constants/components.constants';
import {
  answerOf,
  durationOf,
  isDeclined,
  markState,
  rubricCriteria,
  suggestedMark,
  wordCount,
} from '@/modules/report/lib/review-display';
import type { ReviewCriterion } from '@/modules/report/types/review.types';
import type { ReviewItem } from '@/modules/teacher/schemas/teacher-review.schema';

// scoring/11 — the Extended response card (Teacher Portal v2 S31 `rv.ext`):
// the prompt, what they wrote, the marking assist's rubric rows with the
// EVIDENCE QUOTE and reason the worker produced, the decline box or note, and
// the action row the drawer passes in. Every value is served — an absent
// assist renders as no rubric and no suggestion, never a fabricated one.

function CriterionRow({ criterion }: { criterion: ReviewCriterion }) {
  const t = useTranslations('TeacherPortal.review');
  return (
    <li className="rounded-lg border border-[#ECEEF2] px-[15px] py-[13px]">
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="min-w-[180px] flex-1 text-[13.5px] font-semibold">{criterion.name}</span>
        <span className={cn(REVIEW_CHIP, REVIEW_TONE_CHIP[criterion.tone])}>
          {criterion.max === null
            ? criterion.level
            : t('levelOf', { level: criterion.level, max: criterion.max })}
        </span>
      </div>
      {criterion.reason ? (
        <p className="mt-[7px] text-[13px] leading-normal text-[#4B5563]">{criterion.reason}</p>
      ) : null}
      {criterion.evidence ? (
        <blockquote
          data-slot="review-evidence"
          className="mt-[7px] border-l-2 border-[#E4E9F2] pl-[11px] text-[13px] leading-normal text-[#6B7280]"
        >
          {t('evidenceQuote', { text: criterion.evidence })}
        </blockquote>
      ) : null}
    </li>
  );
}

function ReviewAssistBlock({ item, controls }: { item: ReviewItem; controls: ReactNode }) {
  const t = useTranslations('TeacherPortal.review');
  const rubric = item.rubric_score;
  const declined = rubric !== null && isDeclined(rubric);
  const state = markState(item);
  const suggested = suggestedMark(item);
  const max = item.mark_max ?? null;
  const answer = answerOf(item.given);
  const text = answer.kind === 'text' ? answer.text : null;
  const criteria = rubricCriteria(item);
  const note = rubric !== null && !declined ? (rubric.decline_reason ?? null) : null;
  const duration = item.latency_ms === null ? null : durationOf(item.latency_ms);
  const words = text === null ? null : t('words', { count: wordCount(text) });
  const time =
    duration === null
      ? null
      : duration.minutes > 0
        ? t('minSec', duration)
        : t('sec', { seconds: duration.seconds });
  const writing = words === null ? t('notReached') : time === null ? words : t('writtenIn', { words, duration: time });
  const mark = item.teacher_mark ?? 0;
  const stateLabel = {
    awaiting: () => t('stateAwaiting'),
    judgement: () => t('stateJudgement'),
    accepted: () => t('stateAccepted', { value: mark, max: max ?? mark }),
    marked: () => t('stateMarked', { value: mark, max: max ?? mark }),
  }[state]();
  const footer = declined
    ? t('footerNoSuggestion')
    : suggested !== null && max !== null
      ? t('footerSuggestion', { suggested, max })
      : null;
  const unmarked = state === 'awaiting' || state === 'judgement';

  return (
    <section
      data-slot="review-assist"
      data-declined={String(declined)}
      data-state={state}
      className="rounded-[11px] border border-[#ECEEF2] bg-white px-[22px] py-5"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <h3 className="text-[13.5px] font-bold">{t('extendedTitle')}</h3>
        <span className={cn(REVIEW_CHIP, 'border border-[#ECEEF2] bg-[#F5F6F8] text-[#0E2350]')}>
          {t('markingAssist')}
        </span>
        <span
          data-slot="review-mark-state"
          className={cn(REVIEW_CHIP, 'ml-auto', REVIEW_TONE_CHIP[unmarked ? 'pending' : 'full'])}
        >
          {stateLabel}
        </span>
      </div>
      <p className="mt-3 text-sm leading-[1.55] text-pretty">{item.prompt ?? item.item_code}</p>
      <div className="mt-3 rounded-lg border border-[#ECEEF2] bg-[#FAFBFC] px-4 py-3.5">
        <p className={REVIEW_EYEBROW}>{t('theyWrote')}</p>
        <p
          data-slot="review-answer"
          className={cn('mt-[7px] text-sm leading-[1.6] whitespace-pre-wrap', text === null && 'text-[#9CA3AF] italic')}
        >
          {text ?? t('blankText')}
        </p>
        <p data-slot="review-word-count" className="mt-2 text-xs text-[#9CA3AF]">
          {writing}
        </p>
      </div>
      {rubric !== null && declined ? (
        <div data-slot="review-decline" className="mt-3 rounded-lg border border-[#F3D9A4] bg-[#FDF8EC] px-4 py-3.5">
          <p className="text-[13.5px] font-bold text-[#7A4E07]">
            {rubric.decline_kind === 'language' ? t('declineLanguageTitle') : t('declineBlankTitle')}
          </p>
          <p data-slot="review-decline-reason" className="mt-1 max-w-[70ch] text-[13px] leading-[1.55] text-[#5C4A2A]">
            {rubric.decline_reason}
          </p>
        </div>
      ) : null}
      {criteria.length > 0 ? (
        <>
          <p className={cn(REVIEW_EYEBROW, 'mt-4')}>{t('againstRubric')}</p>
          <ul data-slot="review-criteria" className="mt-2.5 flex flex-col gap-2.5">
            {criteria.map((criterion) => (
              <CriterionRow key={criterion.name} criterion={criterion} />
            ))}
          </ul>
        </>
      ) : null}
      {controls}
      {note ? (
        <p data-slot="review-note" className="mt-3.5 max-w-[70ch] border-l-2 border-[#D8DFEA] py-0.5 pl-3 text-[13px] leading-[1.55] text-[#4B5563]">
          {note}
        </p>
      ) : null}
      {footer ? (
        <p data-slot="review-assist-footer" className="mt-3 max-w-[70ch] text-xs leading-normal text-[#9CA3AF]">
          {footer}
        </p>
      ) : null}
    </section>
  );
}

export { ReviewAssistBlock };
