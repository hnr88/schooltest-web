'use client';

import { useTranslations } from 'next-intl';

import { isDeclined } from '@/modules/report/lib/review-display';

import type { ReviewItem } from '@/modules/teacher/schemas/teacher-review.schema';

// scoring/11 — the Extended-response marking-assist block (Teacher Portal v2
// `rvExtended`). It renders the rubric criteria, the EVIDENCE QUOTE and the
// reason sentence the C-10 worker has produced since it shipped and that
// nothing in the product has ever displayed.
//
// READ-ONLY. Accept / override / decline and the per-item note are task 12.

function ReviewAssistBlock({ item }: { item: ReviewItem }) {
  const t = useTranslations('Report.review');
  const rubric = item.rubric_score;

  // No assist body at all — the row is waiting for a human, and saying so is
  // the point. A fabricated suggestion here would be the worst defect this
  // surface could ship, so the absent case gets its own explicit arm.
  if (rubric === null) {
    return (
      <p data-slot="review-awaiting-mark" className="text-body-md font-medium text-warning">
        {t('awaitingMark')}
      </p>
    );
  }

  const declined = isDeclined(rubric);
  const dimensions = rubric.dimensions ?? null;

  return (
    <div data-slot="review-assist" data-declined={String(declined)} className="flex flex-col gap-3">
      {declined ? (
        <p data-slot="review-needs-judgement" className="text-body-md font-medium text-warning">
          {t('needsJudgement')}
        </p>
      ) : null}

      {/* Bands are absent on a decline and are NEVER zero-filled, so an absent
          set renders as no criteria rather than as a row of zeroes. */}
      {dimensions === null ? null : (
        <dl data-slot="review-criteria" className="flex flex-col gap-2">
          {Object.entries(dimensions).map(([name, band]) => (
            <div key={name} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-caption text-body">{name}</dt>
                <dd className="text-caption font-semibold text-foreground">{band}</dd>
              </div>
              {rubric.rationale?.[name] ? (
                <p className="text-meta text-muted-foreground">{rubric.rationale[name]}</p>
              ) : null}
              {/* The EXACT student text the model read — never a paraphrase. */}
              {rubric.evidence?.[name] ? (
                <blockquote
                  data-slot="review-evidence"
                  className="border-l-2 border-divider pl-3 text-caption text-body"
                >
                  {rubric.evidence[name]}
                </blockquote>
              ) : null}
            </div>
          ))}
        </dl>
      )}

      {/* The model's own sentence, shipped verbatim as a stored string (D-33) —
          never an i18n key, so a moderator reads what the model actually
          wrote rather than a translated approximation of it. */}
      {rubric.decline_reason ? (
        <p data-slot="review-decline-reason" className="text-caption text-body">
          {rubric.decline_reason}
        </p>
      ) : null}

      <p data-slot="review-assist-footer" className="text-meta text-muted-foreground">
        {declined ? t('noSuggestion') : t('suggestionInvariant')}
      </p>
    </div>
  );
}

export { ReviewAssistBlock };
