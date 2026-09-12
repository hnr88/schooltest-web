'use client';

import { useTranslations } from 'next-intl';

import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  REVIEW_ANSWER_BOX,
  REVIEW_CHIP,
  REVIEW_EYEBROW,
  REVIEW_TONE_CHIP,
} from '@/modules/report/constants/components.constants';
import { answerOf, hasText, isUnreached, keyAnswerOf, secsOf } from '@/modules/report/lib/review-display';
import type { ReviewAnswer } from '@/modules/report/types/review.types';
import type { ReviewItem } from '@/modules/teacher/schemas/teacher-review.schema';

// scoring/11 — ONE question row of the review drawer (Teacher Portal v2 S31
// `rv.items`): the served area, the served correct/incorrect judgement, the
// time on the item, what they answered and — only when wrong — the key, then
// the teacher's note on it. `n` is the row's place in the list.

function ReviewQuestionRow({
  item,
  n,
  note,
  disabled,
  onNote,
}: {
  item: ReviewItem;
  n: number;
  note: string;
  disabled: boolean;
  onNote: (note: string) => void;
}) {
  const t = useTranslations('TeacherPortal.review');
  const secs = secsOf(item.latency_ms);
  const key = keyAnswerOf(item.correct_key);
  const unreached = isUnreached(item);
  const print = (answer: ReviewAnswer): string =>
    answer.kind === 'options'
      ? answer.ids.map((id) => t('option', { id: id.toUpperCase() })).join(', ')
      : answer.kind === 'text'
        ? answer.text
        : t('noAnswer');

  return (
    <li
      data-slot="review-question-row"
      data-sequence={item.sequence_index}
      // Three states, not two: an unmarked row is neither correct nor wrong.
      data-correct={item.is_correct === null ? 'unmarked' : String(item.is_correct)}
      data-unreached={String(unreached)}
      className="rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[22px] py-[18px]"
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[13.5px] font-bold">{t('questionNumber', { n })}</span>
        {item.area ? (
          <span className="rounded-full border border-[#ECEEF2] bg-[#F5F6F8] px-[11px] py-1 text-[12.5px] font-medium text-[#4B5563]">
            {item.area}
          </span>
        ) : null}
        {unreached ? (
          <span data-slot="review-question-mark" className={cn(REVIEW_CHIP, 'bg-[#F5F6F8] text-[#6B7280]')}>
            {t('unreached')}
          </span>
        ) : item.is_correct === null ? null : (
          <span
            data-slot="review-question-mark"
            className={cn(REVIEW_CHIP, REVIEW_TONE_CHIP[item.is_correct ? 'full' : 'zero'])}
          >
            {item.is_correct ? t('correct') : t('incorrect')}
          </span>
        )}
        {secs === null ? null : (
          <span className="ml-auto text-xs text-[#9CA3AF]">{t('timeOnQuestion', { secs })}</span>
        )}
      </div>
      <p className="mt-3 text-sm leading-[1.55] text-pretty">{item.prompt ?? item.item_code}</p>
      <div className="mt-3 flex flex-wrap gap-2.5">
        <div className={REVIEW_ANSWER_BOX}>
          <p className={REVIEW_EYEBROW}>{t('theyAnswered')}</p>
          <p
            data-slot="review-given"
            className={cn('mt-[5px] text-sm leading-[normal] font-semibold', unreached && 'font-normal text-[#9CA3AF] italic')}
          >
            {unreached ? t('unreached') : print(answerOf(item.given))}
          </p>
        </div>
        {(item.is_correct === false || unreached) && key.kind !== 'none' ? (
          <div className={REVIEW_ANSWER_BOX}>
            <p className={REVIEW_EYEBROW}>{t('correctAnswer')}</p>
            <p data-slot="review-key" className="mt-[5px] text-sm leading-[normal] font-semibold text-[#1F7A4D]">
              {print(key)}
            </p>
          </div>
        ) : null}
      </div>
      <Textarea
        aria-label={t('questionNoteLabel', { n })}
        placeholder={t('questionNotePlaceholder')}
        value={note}
        disabled={disabled}
        onChange={(event) => onNote(event.target.value)}
        className={cn(
          'mt-3 min-h-16 resize-y rounded-[8px] bg-white px-[13px] py-2.5 text-[13.5px] leading-[1.55] md:text-[13.5px]',
          hasText(note) ? 'border-[#0E2350]' : 'border-[#E4E9F2]',
        )}
      />
    </li>
  );
}

export { ReviewQuestionRow };
