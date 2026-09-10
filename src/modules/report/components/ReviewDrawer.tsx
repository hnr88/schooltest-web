'use client';

import { useTranslations } from 'next-intl';

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { PanelHeaderRow, ScoreText, SkeletonCard, StatusPill } from '@/modules/design-system';
import { QueryErrorFallback } from '@/modules/query-errors';
import { ReviewQuestionRow } from '@/modules/report/components/ReviewQuestionRow';
import { correctCount } from '@/modules/report/lib/review-display';
import { useResultReviewQuery } from '@/modules/report/queries/use-result-review.query';

// scoring/11 — the READ-ONLY review drawer (C-REV-1; Teacher Portal v2 T-12).
//
// It WRAPS the read-only sheet primitive rather than editing it, and every cell
// is a design-system consume — no primitive is written here.
//
// WHY THIS IS NOT ON THE DIRECTORY KIT, deliberately. The question rows are a
// FIXED-LENGTH READ-ONLY list: no search, no filter, no sort, no pager, no
// selection, no row menu, no bulk actions. The shared layer rules that adopting
// the kit for this shape is wrong, so the rows are a plain map(). The reuse
// rule is honoured where it applies — the cells are all shared units.
//
// THE WRITE HALF IS NOT HERE: accept / override / decline and the per-item note
// are task 12. Nothing here mutates, which is what lets the footer promise it.

function ReviewDrawer({
  resultId,
  open,
  onOpenChange,
}: {
  resultId: string;
  open: boolean;
  onOpenChange: (next: boolean) => void;
}) {
  const t = useTranslations('Report.review');
  // A closed drawer must not fetch — the open flag drives the query.
  const query = useResultReviewQuery(resultId, open);
  const review = query.data;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        data-surface="result-review"
        // The width must carry the SAME variant chain as the primitive's own
        // `data-[side=right]:sm:max-w-sm` — a bare `sm:max-w-xl` has lower
        // specificity, loses silently, and the drawer renders at 384px with
        // its strip and band digits clipped off the sheet's edges.
        className="flex w-full flex-col gap-6 overflow-y-auto data-[side=right]:sm:max-w-xl"
      >
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('scoreStripEyebrow')}</SheetDescription>
        </SheetHeader>

        {query.isPending ? <SkeletonCard rows={6} /> : null}

        {query.isError ? (
          <QueryErrorFallback
            error={query.error}
            onRetry={() => void query.refetch()}
            isRetrying={query.isFetching}
            // The REQUIRED terminal affordance, for the arms that cannot be
            // retried (gone / restricted). A drawer's terminal action is to
            // close it — there is nowhere else for the teacher to go.
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

        {review ? (
          <>
            {/* THE STRIP. The band is SERVED; nothing is re-thresholded. The
                figure is a COUNT of the server's own `is_correct` judgements,
                shown as a count rather than a percentage — this contract has no
                score field and inventing one client-side would be exactly the
                judgement the design assigns to the server. */}
            <div data-slot="review-strip" className="flex items-center gap-3">
              <ScoreText
                value={null}
                display={`${correctCount(review.items)}/${review.item_count}`}
              />
              {review.cefr_band ? <StatusPill tone="info">{review.cefr_band}</StatusPill> : null}
              <StatusPill tone="neutral">{review.release_state}</StatusPill>
            </div>

            <section className="flex flex-col gap-1">
              <PanelHeaderRow title={t('questionsHeading')} />
              {review.items.length === 0 ? (
                <div data-slot="review-empty" className="py-6">
                  <p className="text-body-md font-medium text-foreground">{t('emptyTitle')}</p>
                  <p className="text-caption text-body">{t('emptyDescription')}</p>
                </div>
              ) : (
                <ol data-slot="review-questions" className="flex flex-col">
                  {review.items.map((item) => (
                    <ReviewQuestionRow
                      key={`${item.sequence_index}-${item.item_code}`}
                      item={item}
                    />
                  ))}
                </ol>
              )}
            </section>
          </>
        ) : null}

        <SheetFooter>
          <p className="text-meta text-muted-foreground">{t('suggestionInvariant')}</p>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export { ReviewDrawer };
