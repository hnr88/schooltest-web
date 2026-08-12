import type { FormEventHandler } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { z } from 'zod';

import type { ChoiceOption } from '@/modules/design-system';
import type { startTestSessionFormSchema } from '@/modules/teacher/schemas/session-setup.schema';

export type StartTestSessionFormValues = z.infer<typeof startTestSessionFormSchema>;

/**
 * What the panel can honestly render. `no-classes` / `no-tests` are reachable
 * ONLY after both reads succeeded — an emptiness claim is never made on a
 * pending or failed query, and neither picker ever falls back to a canned list.
 */
export type TestSessionSetupStatus = 'loading' | 'error' | 'no-classes' | 'no-tests' | 'ready';

export interface TestSessionSetupCounts {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  classCount: number;
  testCount: number;
}

export interface TestSessionSelectProps {
  id: string;
  label: string;
  options: readonly ChoiceOption[];
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  errorText?: string;
}

export interface StartTestSessionFormProps {
  form: UseFormReturn<StartTestSessionFormValues>;
  onSubmit: FormEventHandler<HTMLFormElement>;
  classOptions: readonly ChoiceOption[];
  testOptions: readonly ChoiceOption[];
  isGenerating: boolean;
}
