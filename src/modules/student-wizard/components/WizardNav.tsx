'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/modules/design-system';
import type { WizardMode } from '@/modules/student-wizard/types/student-wizard.types';

interface WizardNavProps {
  isFirstStep: boolean;
  isLastStep: boolean;
  mode: WizardMode;
  pending: boolean;
  onBack: () => void;
  onContinue: () => void;
}

// Back (ghost) / Continue (primary). Step 5 button = "Create student"
// (edit mode: "Save changes"). Hover/active transitions come from the DS Button.
export function WizardNav({
  isFirstStep,
  isLastStep,
  mode,
  pending,
  onBack,
  onContinue,
}: WizardNavProps) {
  const t = useTranslations('StudentWizard');
  const finalLabel = mode === 'edit' ? t('saveChanges') : t('createStudent');

  return (
    <div className="mt-6 flex items-center justify-between gap-3">
      <Button type="button" variant="ghost" onClick={onBack} disabled={isFirstStep}>
        {t('back')}
      </Button>
      <Button type="button" onClick={onContinue} loading={pending && isLastStep}>
        {isLastStep ? finalLabel : t('continue')}
      </Button>
    </div>
  );
}
