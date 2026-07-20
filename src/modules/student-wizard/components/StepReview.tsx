'use client';

import { useTranslations } from 'next-intl';

import { Alert } from '@/modules/design-system';
import {
  ReviewMediaRow,
  ReviewRow,
  ReviewSection,
} from '@/modules/student-wizard/components/ReviewSection';
import { useReviewModel } from '@/modules/student-wizard/hooks/use-review-model';
import { useWizardMediaStore } from '@/modules/student-wizard/stores/use-wizard-media-store';
import type { WizardSubmitError } from '@/modules/student-wizard/types/student-wizard.types';

interface StepReviewProps {
  goToStep: (step: number) => void;
  error: WizardSubmitError | null;
  onDismissError: () => void;
}

// C-UI-STUDENT-WIZARD Step 5 — read-only per-section review with Edit jumps,
// media previews, and the submit-error alert (400 → generic validation copy,
// 403/other → server, offline). The submit itself is fired by the Nav's
// "Create student" button (WizardScreen full-schema parse → mutation).
export function StepReview({ goToStep, error, onDismissError }: StepReviewProps) {
  const t = useTranslations('StudentWizard.review');
  const sections = useReviewModel();
  const photo = useWizardMediaStore((state) => state.media.photo);
  const voiceIntro = useWizardMediaStore((state) => state.media.voice_intro);
  const emptyLabel = t('empty');

  return (
    <div className="flex flex-col gap-4 duration-300 ease-out animate-in fade-in slide-in-from-bottom-1 motion-reduce:animate-none">
      <p className="text-sm text-muted-foreground">{t('intro')}</p>

      {error ? (
        <Alert
          variant={error.kind === 'validation' ? 'warning' : 'error'}
          title={t(`error.${error.kind}Title`)}
          onDismiss={onDismissError}
          dismissLabel={t('error.dismiss')}
        >
          {error.kind === 'validation' && error.message ? error.message : t(`error.${error.kind}Body`)}
        </Alert>
      ) : null}

      {sections.map((section) => (
        <ReviewSection
          key={section.id}
          title={section.title}
          editLabel={t('edit')}
          onEdit={() => goToStep(section.step)}
        >
          {section.rows.map((row) => (
            <ReviewRow key={row.label} label={row.label} value={row.value} emptyLabel={emptyLabel} />
          ))}
        </ReviewSection>
      ))}

      <ReviewSection title={t('section.media')} editLabel={t('edit')} onEdit={() => goToStep(3)}>
        <ReviewMediaRow
          label={t('photo')}
          media={photo}
          isImage
          emptyLabel={emptyLabel}
          previewAlt={t('photoAlt')}
        />
        <ReviewMediaRow
          label={t('voice')}
          media={voiceIntro}
          isImage={false}
          emptyLabel={emptyLabel}
          previewAlt={t('voiceAlt')}
        />
      </ReviewSection>
    </div>
  );
}
