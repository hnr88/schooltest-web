'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { REVIEW_FOCUS } from '@/modules/report/constants/components.constants';
import { isDeclined, suggestedMark } from '@/modules/report/lib/review-display';
import type { MarkedItem } from '@/modules/report/types/review.types';

// scoring/12 — the extended response's action row (Teacher Portal v2 S31
// `rv.ext`): accept the served suggestion, set the mark on the rubric's own
// 0–max scale, or clear it. Nothing here writes: every press goes through the
// drawer's guarded `choose`. No served ceiling means no scale at all.

function ReviewMarkScale({
  item,
  disabled,
  onChoose,
  onReset,
}: {
  item: MarkedItem;
  disabled: boolean;
  onChoose: (item: MarkedItem, value: number) => void;
  onReset: (item: MarkedItem) => void;
}) {
  const t = useTranslations('TeacherPortal.review');
  const max = item.mark_max ?? null;
  if (max === null || item.rubric_score === null) return null;
  const declined = isDeclined(item.rubric_score);
  const suggested = suggestedMark(item);
  const mine = item.teacher_mark ?? null;
  const touched = mine !== null || (item.teacher_mark_source ?? null) !== null;
  const scaleLabel = declined ? t('scaleLabelDeclined') : t('scaleLabel');

  return (
    <div
      data-slot="review-mark"
      data-marked={String(mine !== null)}
      className="mt-4 flex flex-wrap items-center gap-2.5"
    >
      {!touched && !declined && suggested !== null ? (
        <button
          type="button"
          data-slot="review-accept"
          disabled={disabled}
          onClick={() => onChoose(item, suggested)}
          className={cn(
            'inline-flex h-[42px] cursor-pointer items-center rounded-lg bg-[#0E2350] px-[18px] text-[13.5px] font-semibold text-white transition-colors hover:bg-[#16326E] disabled:cursor-not-allowed disabled:opacity-60',
            REVIEW_FOCUS,
          )}
        >
          {t('accept', { suggested, max })}
        </button>
      ) : null}
      <span className="text-[12.5px] text-[#6B7280]">{scaleLabel}</span>
      <div role="group" aria-label={scaleLabel} data-slot="review-mark-scale" className="flex gap-1.5">
        {Array.from({ length: max + 1 }, (_, value) => (
          <button
            key={value}
            type="button"
            aria-pressed={mine === value}
            aria-label={t('scaleValue', { value, max })}
            disabled={disabled}
            onClick={() => onChoose(item, value)}
            className={cn(
              'grid size-[38px] cursor-pointer place-items-center rounded-lg border text-[13.5px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60',
              mine === value
                ? 'border-[#0E2350] bg-[#0E2350] text-white'
                : 'border-[#D8DFEA] bg-white text-[#0E2350] hover:border-[#0E2350]',
              REVIEW_FOCUS,
            )}
          >
            {value}
          </button>
        ))}
      </div>
      {touched ? (
        <button
          type="button"
          data-slot="review-reset"
          disabled={disabled}
          onClick={() => onReset(item)}
          className={cn(
            'inline-flex h-[38px] cursor-pointer items-center rounded-lg px-3.5 text-[13px] font-semibold text-[#6B7280] transition-colors hover:text-[#B42318] disabled:cursor-not-allowed disabled:opacity-60',
            REVIEW_FOCUS,
          )}
        >
          {t('clearMark')}
        </button>
      ) : null}
    </div>
  );
}

export { ReviewMarkScale };
