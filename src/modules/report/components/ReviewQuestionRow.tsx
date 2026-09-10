'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { StatusPill } from '@/modules/design-system';
import { ReviewAssistBlock } from '@/modules/report/components/ReviewAssistBlock';
import { secsOf } from '@/modules/report/lib/review-display';

import type { ReviewItem } from '@/modules/teacher/schemas/teacher-review.schema';

// scoring/11 — ONE question row of the review drawer (Teacher Portal v2
// `rvItems`): what was given, what was correct, how long it took, its area and
// its flag. The assist block only appears on an extended response.

function ReviewQuestionRow({
  item,
  markSlot,
}: {
  item: ReviewItem;
  /** Task 12's accept/override/decline controls, rendered under the assist. */
  markSlot?: ReactNode;
}) {
  const t = useTranslations('Report.review');
  const secs = secsOf(item.latency_ms);
  const given =
    typeof item.given === 'string' && item.given.length > 0
      ? item.given
      : JSON.stringify(item.given ?? null);

  return (
    <li
      data-slot="review-question-row"
      data-sequence={item.sequence_index}
      // Three states, not two: an unmarked row is neither correct nor wrong,
      // and a spec asserting on this attribute must be able to tell them apart.
      data-correct={item.is_correct === null ? 'unmarked' : String(item.is_correct)}
      className="flex flex-col gap-2 border-b border-divider py-4 last:border-b-0"
    >
      <div className="flex items-start justify-between gap-4">
        <p className="min-w-0 text-body-md text-foreground">{item.prompt ?? item.item_code}</p>
        {/* `area` arrives as a SERVED label; the browser never re-derives it
            from the stored attribute snapshot. */}
        {item.area ? <StatusPill tone="neutral">{item.area}</StatusPill> : null}
      </div>

      <dl className="flex flex-wrap items-center gap-x-6 gap-y-1 text-caption text-body">
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">{t('columnGiven')}</dt>
          <dd className="font-medium text-foreground">{given}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">{t('columnCorrect')}</dt>
          <dd className="font-medium text-foreground">
            {item.correct_key === null ? t('unmarked') : item.correct_key.type}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-muted-foreground">{t('columnSecs')}</dt>
          <dd className="font-medium text-foreground">{secs ?? '—'}</dd>
        </div>
        {item.flags?.timeout ? <StatusPill tone="warning">{t('columnFlag')}</StatusPill> : null}
      </dl>

      {item.response_kind === 'text' ? <ReviewAssistBlock item={item} /> : null}
      {markSlot ?? null}
    </li>
  );
}

export { ReviewQuestionRow };
