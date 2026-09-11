'use client';

import { Dialog } from '@base-ui/react/dialog';
import { useTranslations } from 'next-intl';

import { Sheet } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { SkeletonCard } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { ReviewAssistBlock } from '@/modules/report/components/ReviewAssistBlock';
import { ReviewCommentCard, ReviewDrawerFooter, ReviewDrawerHeader } from '@/modules/report/components/ReviewDrawerParts';
import { useReviewMarking } from '@/modules/report/components/ReviewDrawerWriteHalf';
import { ReviewMarkScale } from '@/modules/report/components/ReviewMarkScale';
import { ReviewQuestionRow } from '@/modules/report/components/ReviewQuestionRow';
import { REVIEW_EYEBROW } from '@/modules/report/constants/components.constants';
import { isExtended, reviewTally } from '@/modules/report/lib/review-display';
import { useResultReviewQuery } from '@/modules/report/queries/use-result-review.query';
import type { ReviewDrawerProps } from '@/modules/report/types/review.types';

// The "Review submission" drawer (Teacher Portal v2 S31): the Sheet primitive's
// Base UI dialog with the design's navy scrim and 720px panel (the vendored
// sheet is not edited). A closed drawer does not fetch. The question rows are a
// fixed-length list, so a plain map() rather than the directory kit.

function ReviewDrawer({ resultDocumentId, open, onOpenChange, ...context }: ReviewDrawerProps) {
  const t = useTranslations('TeacherPortal.review');
  const query = useResultReviewQuery(resultDocumentId, open);
  const review = query.data ?? null;
  const marking = useReviewMarking(resultDocumentId, review, context, () => onOpenChange(false));
  const items = review?.items ?? [];
  const extended = items.filter((item) => isExtended(item));
  const questions = items.filter((item) => !isExtended(item));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-[rgba(14,35,80,0.42)] transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0" />
        <Dialog.Popup
          data-surface="result-review"
          className="fixed inset-y-0 right-0 z-50 flex h-full w-[720px] max-w-full flex-col overflow-y-auto bg-[#FAFBFC] text-[#0E2350] shadow-[-24px_0_56px_rgba(0,0,0,0.2)] outline-none transition-transform duration-300 ease-out-expo data-ending-style:translate-x-full data-starting-style:translate-x-full motion-reduce:transition-none"
        >
          <ReviewDrawerHeader
            context={context}
            tally={review === null ? null : reviewTally(items)}
            noteCount={marking.noteCount}
          />
          <div className="flex flex-1 flex-col gap-3.5 px-[30px] py-[22px]">
            {query.isPending ? <SkeletonCard rows={6} /> : null}
            {query.isError ? (
              <QueryErrorFallback
                error={query.error}
                onRetry={() => void query.refetch()}
                isRetrying={query.isFetching}
                action={
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="text-body-md font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {t('close')}
                  </button>
                }
              />
            ) : null}
            {review === null ? null : (
              <>
                <ReviewCommentCard value={marking.comment} disabled={marking.isPending} onChange={marking.setComment} />
                {extended.map((item) => (
                  <ReviewAssistBlock
                    key={item.response_document_id}
                    item={item}
                    controls={
                      <ReviewMarkScale item={item} disabled={marking.isPending} onChoose={marking.choose} onReset={marking.reset} />
                    }
                  />
                ))}
                {items.length === 0 ? (
                  <div data-slot="review-empty" className="py-6">
                    <p className="text-sm font-semibold">{t('emptyTitle')}</p>
                    <p className="text-[13px] text-[#6B7280]">{t('emptyDescription')}</p>
                  </div>
                ) : null}
                {questions.length === 0 ? null : (
                  <>
                    <p className={cn(REVIEW_EYEBROW, 'mt-1 tracking-[0.07em]')}>{t('questionsEyebrow')}</p>
                    <ol data-slot="review-questions" className="flex flex-col gap-3.5">
                      {questions.map((item, index) => (
                        <ReviewQuestionRow
                          key={`${item.sequence_index}-${item.item_code}`}
                          item={item}
                          n={index + 1}
                          note={marking.noteFor(item)}
                          disabled={marking.isPending}
                          onNote={(note) => marking.setNote(item, note)}
                        />
                      ))}
                    </ol>
                  </>
                )}
              </>
            )}
          </div>
          <ReviewDrawerFooter
            noteCount={marking.noteCount}
            pending={marking.isPending}
            failed={marking.isError}
            canSave={review !== null}
            onSave={marking.save}
            onClose={() => onOpenChange(false)}
          />
          {marking.confirmDialog}
        </Dialog.Popup>
      </Dialog.Portal>
    </Sheet>
  );
}

export { ReviewDrawer };
