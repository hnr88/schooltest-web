'use client';

import { XIcon } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useId } from 'react';

import { SheetClose, SheetDescription, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { REVIEW_FOCUS, REVIEW_PHASES } from '@/modules/report/constants/components.constants';
import { reviewInitials, submittedAgo } from '@/modules/report/lib/review-display';
import type {
  ReviewHeaderContext,
  ReviewPhase,
  ReviewTally,
} from '@/modules/report/types/review.types';

// The review drawer's fixed parts (Teacher Portal v2 S31): the sticky header
// (who, what, when, the served tally), the overall comment card, and the
// sticky footer. Every header value is one the caller holds from a live row or
// the review served; an unknown one is left out, never filled in.

const HEADER_CHIP = 'rounded-full px-[13px] py-1.5 text-[12.5px] font-semibold';

const isPhase = (value: string): value is ReviewPhase =>
  (REVIEW_PHASES as readonly string[]).includes(value);

function ReviewDrawerHeader({
  context,
  tally,
  noteCount,
}: {
  context: ReviewHeaderContext;
  tally: ReviewTally | null;
  noteCount: number;
}) {
  const t = useTranslations('TeacherPortal.review');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const name = context.studentName?.trim() ? context.studentName.trim() : null;
  const ago = context.submittedAt ? submittedAgo(context.submittedAt, now) : null;
  const submitted =
    ago === null
      ? null
      : ago.unit === 'now'
        ? t('submittedJustNow')
        : ago.unit === 'minutes'
          ? t('submittedMinutes', { count: ago.count })
          : ago.unit === 'hours'
            ? t('submittedHours', { count: ago.count })
            : t('submittedDays', { count: ago.count });
  const meta = [context.testLabel, context.className, submitted]
    .filter((part): part is string => Boolean(part))
    .join(' · ');
  const phase =
    context.phase === undefined
      ? null
      : context.phase === null
        ? t('phaseNotSet')
        : isPhase(context.phase)
          ? t(`phase.${context.phase}`)
          : context.phase;
  const scored = tally !== null && tally.total > 0 ? tally : null;

  return (
    <header data-slot="review-header" className="sticky top-0 z-[3] border-b border-[#ECEEF2] bg-white px-[30px] py-6">
      <div className="flex items-center gap-3.5">
        {name ? (
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-[#F5F6F8] text-sm font-semibold">
            {reviewInitials(name)}
          </span>
        ) : null}
        <div className="min-w-0 flex-1">
          <SheetTitle className="text-[19px] leading-tight font-semibold tracking-[-0.01em] text-[#0E2350]">
            {name ?? t('title')}
          </SheetTitle>
          {meta ? (
            <SheetDescription className="mt-[3px] text-[13px] text-[#6B7280]">{meta}</SheetDescription>
          ) : null}
        </div>
        <SheetClose
          aria-label={t('close')}
          className={cn(
            'grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg border border-[#ECEEF2] bg-white text-[#6B7280] transition-colors hover:border-[#0E2350]',
            REVIEW_FOCUS,
          )}
        >
          <XIcon className="size-4" aria-hidden="true" />
        </SheetClose>
      </div>
      <div data-slot="review-strip" className="mt-4 flex flex-wrap gap-2.5">
        {scored === null ? null : (
          <>
            <span className={cn(HEADER_CHIP, 'bg-[#F5F6F8]')}>
              {t('scoreChip', { correct: scored.correct, total: scored.total })}
            </span>
            <span className={cn(HEADER_CHIP, 'bg-[#F5F6F8]')}>
              {format.number(scored.correct / scored.total, { style: 'percent' })}
            </span>
          </>
        )}
        {phase === null ? null : <span className={cn(HEADER_CHIP, 'bg-[#F5F6F8]')}>{phase}</span>}
        <span data-slot="review-note-summary" className={cn(HEADER_CHIP, 'border border-[#ECEEF2] bg-white text-[#6B7280]')}>
          {t('noteSummary', { count: noteCount })}
        </span>
      </div>
    </header>
  );
}

function ReviewCommentCard({
  value,
  disabled,
  onChange,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const t = useTranslations('TeacherPortal.review');
  const id = useId();
  return (
    <section data-slot="review-comment-card" className="rounded-[11px] border border-[#ECEEF2] bg-[#FAFBFC] px-[22px] py-5">
      <label htmlFor={`${id}-comment`} className="block text-[14.5px] font-semibold">
        {t('commentTitle')}
      </label>
      <p id={`${id}-help`} className="mt-1 text-[13px] leading-[1.55] text-[#6B7280]">
        {t('commentHelp')}
      </p>
      <Textarea
        id={`${id}-comment`}
        data-slot="review-comment"
        aria-describedby={`${id}-help`}
        value={value}
        placeholder={t('commentPlaceholder')}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className="mt-3 min-h-[88px] resize-y rounded-lg border-[#ECEEF2] bg-white px-3.5 py-3 text-[13.5px] leading-[1.55] md:text-[13.5px]"
      />
    </section>
  );
}

function ReviewDrawerFooter({
  noteCount,
  pending,
  failed,
  canSave,
  onSave,
  onClose,
}: {
  noteCount: number;
  pending: boolean;
  failed: boolean;
  canSave: boolean;
  onSave: () => void;
  onClose: () => void;
}) {
  const t = useTranslations('TeacherPortal.review');
  const status = pending ? t('saving') : failed ? t('saveFailed') : t('noteSummary', { count: noteCount });
  return (
    <footer data-slot="review-footer" className="sticky bottom-0 z-[3] flex items-center gap-3 border-t border-[#ECEEF2] bg-white px-[30px] py-[18px]">
      <button
        type="button"
        data-slot="review-save"
        disabled={!canSave || pending}
        onClick={onSave}
        className={cn(
          'inline-flex h-[46px] cursor-pointer items-center rounded-lg bg-[#0E2350] px-[22px] text-sm font-semibold text-white transition-colors hover:bg-[#16326E] disabled:cursor-not-allowed disabled:opacity-60',
          REVIEW_FOCUS,
        )}
      >
        {t('saveComments')}
      </button>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          'inline-flex h-[46px] cursor-pointer items-center rounded-lg border border-[#E5E7EB] bg-white px-5 text-sm font-semibold text-[#0E2350] transition-colors hover:bg-[#F5F6F8]',
          REVIEW_FOCUS,
        )}
      >
        {t('close')}
      </button>
      <p
        role="status"
        data-slot="review-status"
        className={cn('ml-auto text-[12.5px]', failed && !pending ? 'font-semibold text-[#B42318]' : 'text-[#9CA3AF]')}
      >
        {status}
      </p>
    </footer>
  );
}

export { ReviewCommentCard, ReviewDrawerFooter, ReviewDrawerHeader };
