'use client';

import { useTranslations } from 'next-intl';

import { StepEducation } from '@/modules/student-wizard/components/StepEducation';
import { StepGuardian } from '@/modules/student-wizard/components/StepGuardian';
import { StepMedia } from '@/modules/student-wizard/components/StepMedia';
import { StepPersonal } from '@/modules/student-wizard/components/StepPersonal';
import { StepReview } from '@/modules/student-wizard/components/StepReview';
import type {
  WizardStepKey,
  WizardSubmitError,
} from '@/modules/student-wizard/types/student-wizard.types';

interface WizardStepPanelProps {
  step: number;
  stepKey: WizardStepKey;
  stepCount: number;
  error: WizardSubmitError | null;
  onDismissError: () => void;
}

// The card's body (spec 03 §2.3): every step opens with the same heading block —
// a 20/600 h2 over the 13.5px "Step n of N · <what this step is for>" line — and
// stacks its fields under it at a 22px rhythm. Steps are rendered by KEY from
// the active step list (task 47), so a masked guardian/media step is never
// mounted; all five components stay in the repo for the flag-on flow.
export function WizardStepPanel({ step, stepKey, stepCount, error, onDismissError }: WizardStepPanelProps) {
  const t = useTranslations('StudentWizard');

  return (
    <div className="flex flex-col gap-5.5">
      <header className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold text-foreground">{t(`steps.${stepKey}.title`)}</h2>
        <p className="text-body-sm text-body">
          {t('stepCaption', {
            current: step + 1,
            total: stepCount,
            title: t(`steps.${stepKey}.description`),
          })}
        </p>
      </header>
      {stepKey === 'personal' ? (
        <StepPersonal />
      ) : stepKey === 'education' ? (
        <StepEducation />
      ) : stepKey === 'guardian' ? (
        <StepGuardian />
      ) : stepKey === 'media' ? (
        <StepMedia />
      ) : (
        <StepReview error={error} onDismissError={onDismissError} />
      )}
    </div>
  );
}
