'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import { WIZARD_STEP_COUNT } from '@/modules/student-wizard/constants/student-wizard.constants';
import type { WizardMode } from '@/modules/student-wizard/types/student-wizard.types';

interface WizardNavProps {
  step: number;
  isLastStep: boolean;
  mode: WizardMode;
  pending: boolean;
  onBack: () => void;
  onContinue: () => void;
}

// Wizard footer (spec 03 §2.9): pinned to the bottom of the card with
// `margin-top:auto`, a borderless "← Back" on the left and the step counter beside
// the navy pill on the right. Back is NEVER disabled — at step 1 it leaves the
// wizard for the roster, which is what the design's `stepNext/stepBack` pair does.
// The pill's label is "Continue" on steps 1–4 and the confirm label on step 5.
export function WizardNav({ step, isLastStep, mode, pending, onBack, onContinue }: WizardNavProps) {
  const t = useTranslations('StudentWizard');
  const finalLabel = mode === 'edit' ? t('saveChanges') : t('createStudent');

  return (
    <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-7.5">
      <Button
        type="button"
        variant="ghost"
        onClick={onBack}
        className="group h-11 gap-2 rounded-full px-2.5 text-body-md font-semibold text-body hover:bg-surface-hover hover:text-foreground"
      >
        <ArrowLeft
          aria-hidden="true"
          className="size-4 transition-transform duration-200 ease-out-expo group-hover:-translate-x-0.5 motion-reduce:transition-none"
        />
        {t('back')}
      </Button>
      <div className="flex items-center gap-4">
        <span className="text-meta text-muted-foreground">
          {t('stepCounter', { current: step + 1, total: WIZARD_STEP_COUNT })}
        </span>
        <Button
          type="button"
          onClick={onContinue}
          loading={pending && isLastStep}
          className="h-11 rounded-full bg-foreground px-6.5 text-body-md font-semibold text-card shadow-none transition duration-200 ease-out-expo hover:-translate-y-px hover:bg-navy-800 active:translate-y-0 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
        >
          {isLastStep ? finalLabel : t('continue')}
        </Button>
      </div>
    </div>
  );
}
