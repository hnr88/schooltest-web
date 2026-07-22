'use client';

import { useTranslations } from 'next-intl';

import { Alert } from '@/modules/design-system';
import { ReviewSummaryTable } from '@/modules/student-wizard/components/ReviewSummaryTable';
import { useReviewModel } from '@/modules/student-wizard/hooks/use-review-model';
import type { WizardSubmitError } from '@/modules/student-wizard/types/student-wizard.types';

interface StepReviewProps {
  error: WizardSubmitError | null;
  onDismissError: () => void;
}

// Step 5 — Review & confirm (spec 03 §2.8): the four-row summary table, composed
// from what the parent typed. The design's cost notice under it is B-7 (no plan,
// subscription or invoice content-type exists anywhere in the API), so it is not
// drawn — an invented price is worse than a missing panel.
// The submit itself is fired by the footer's confirm button (full-schema parse →
// mutation); its failure lands in the alert above the table.
export function StepReview({ error, onDismissError }: StepReviewProps) {
  const t = useTranslations('StudentWizard.review');
  const { rows } = useReviewModel();

  return (
    <div className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      {error ? (
        <Alert
          variant={error.kind === 'validation' ? 'warning' : 'error'}
          title={t(`error.${error.kind}Title`)}
          onDismiss={onDismissError}
          dismissLabel={t('error.dismiss')}
        >
          {error.kind === 'validation' && error.message
            ? error.message
            : t(`error.${error.kind}Body`)}
        </Alert>
      ) : null}
      <ReviewSummaryTable rows={rows} emptyLabel={t('empty')} />
    </div>
  );
}
