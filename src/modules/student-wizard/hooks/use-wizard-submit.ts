'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { WIZARD_SUCCESS_DWELL_MS } from '@/modules/student-wizard/constants/student-wizard.constants';
import { classifyWizardError } from '@/modules/student-wizard/lib/classify-wizard-error';
import { useCreateStudentFullMutation } from '@/modules/student-wizard/queries/use-create-student-full.mutation';
import type { StudentWizardOutput } from '@/modules/student-wizard/schemas/student-wizard.schema';
import type { WizardSubmitError } from '@/modules/student-wizard/types/student-wizard.types';

interface UseWizardSubmitParams {
  onSubmit?: (values: StudentWizardOutput) => Promise<void>;
}

// Step 5 submit flow (C-UI-STUDENT-WIZARD): the caller passes the zod-parsed
// output (RHF handleSubmit = the full-schema parse). Create path → POST mutation
// → sonner "Student created" toast → invalidate (in the mutation) → the success
// panel holds for one beat so the confirmation is seen, then
// router.push('/dashboard/children'). Edit mode (054) supplies `onSubmit` to run
// the PUT path instead (it navigates itself). Failures are classified into the §5
// error alert and leave the form exactly where it was.
export function useWizardSubmit({ onSubmit }: UseWizardSubmitParams) {
  const t = useTranslations('StudentWizard');
  const router = useRouter();
  const createStudent = useCreateStudentFullMutation();
  const [error, setError] = useState<WizardSubmitError | null>(null);
  const [isSucceeded, setIsSucceeded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const submit = useCallback(
    async (values: StudentWizardOutput) => {
      setError(null);
      try {
        if (onSubmit) {
          await onSubmit(values);
          setIsSucceeded(true);
          return;
        }
        await createStudent.mutateAsync(values);
        toast.success(t('toastCreated'));
        setIsSucceeded(true);
        timer.current = setTimeout(
          () => router.push('/dashboard/children'),
          WIZARD_SUCCESS_DWELL_MS,
        );
      } catch (caught) {
        setError(classifyWizardError(caught));
      }
    },
    [createStudent, onSubmit, router, t],
  );

  const dismissError = useCallback(() => setError(null), []);

  return { submit, error, dismissError, isSucceeded };
}
