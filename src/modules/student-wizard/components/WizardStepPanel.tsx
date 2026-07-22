'use client';

import { useTranslations } from 'next-intl';

import {
  WIZARD_STEP_COUNT,
  WIZARD_STEP_KEYS,
} from '@/modules/student-wizard/constants/student-wizard.constants';
import { StepEducation } from '@/modules/student-wizard/components/StepEducation';
import { StepGuardian } from '@/modules/student-wizard/components/StepGuardian';
import { StepMedia } from '@/modules/student-wizard/components/StepMedia';
import { StepPersonal } from '@/modules/student-wizard/components/StepPersonal';
import { StepReview } from '@/modules/student-wizard/components/StepReview';
import type { WizardSubmitError } from '@/modules/student-wizard/types/student-wizard.types';

interface WizardStepPanelProps {
  step: number;
  error: WizardSubmitError | null;
  onDismissError: () => void;
}

// The card's body (spec 03 §2.3): every step opens with the same heading block —
// a 20/600 h2 over the 13.5px "Step n of 5 · <what this step is for>" line — and
// stacks its fields under it at a 22px rhythm.
export function WizardStepPanel({ step, error, onDismissError }: WizardStepPanelProps) {
  const t = useTranslations('StudentWizard');
  const stepKey = WIZARD_STEP_KEYS[step];

  return (
    <div className="flex flex-col gap-5.5">
      <header className="flex flex-col gap-1.5">
        <h2 className="text-xl font-semibold text-foreground">{t(`steps.${stepKey}.title`)}</h2>
        <p className="text-body-sm text-body">
          {t('stepCaption', {
            current: step + 1,
            total: WIZARD_STEP_COUNT,
            title: t(`steps.${stepKey}.description`),
          })}
        </p>
      </header>
      {step === 0 ? (
        <StepPersonal />
      ) : step === 1 ? (
        <StepEducation />
      ) : step === 2 ? (
        <StepGuardian />
      ) : step === 3 ? (
        <StepMedia />
      ) : (
        <StepReview error={error} onDismissError={onDismissError} />
      )}
    </div>
  );
}
