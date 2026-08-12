'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { START_TEST_SESSION_DEFAULTS } from '@/modules/teacher/constants/test-session-setup.constants';
import {
  deriveSetupStatus,
  toClassOptions,
  toTestOptions,
} from '@/modules/teacher/lib/session-setup';
import { useCreateTestSessionMutation } from '@/modules/teacher/queries/use-create-test-session.mutation';
import { useTeacherDashboardQuery } from '@/modules/teacher/queries/use-teacher-dashboard.query';
import { useTeacherTestsQuery } from '@/modules/teacher/queries/use-teacher-tests.query';
import { startTestSessionFormSchema } from '@/modules/teacher/schemas/session-setup.schema';
import type { StartTestSessionFormValues } from '@/modules/teacher/types/session-setup.types';

/**
 * The "Start a test session" panel's whole brain (.qa/DESIGN.md §Test sessions,
 * view 1). Both pickers are fed by live reads of the two contract entries that
 * own the data — the teacher's own classes (C-TD-1 `GET /api/teacher/dashboard`,
 * scoped to `class.teacher = caller` server-side) and the selectable A/B pair
 * (C-TD-2 `GET /api/teacher/tests`) — and the submit posts C-TS-1.
 *
 * Scope note (task 034 vs 035): the minted code is deliberately NOT rendered
 * here. This slice owns the setup form, and its button had to do something
 * real rather than sit inert, so it performs the contract's create and
 * confirms it; the large code panel with Copy / Go live is task 035, which
 * re-reads the same mutation result.
 */
export function useStartTestSessionForm() {
  const t = useTranslations('Teacher.testSessions.setup');
  const dashboard = useTeacherDashboardQuery();
  const tests = useTeacherTestsQuery();
  const create = useCreateTestSessionMutation();

  const form = useForm<StartTestSessionFormValues>({
    resolver: zodResolver(startTestSessionFormSchema),
    defaultValues: START_TEST_SESSION_DEFAULTS,
  });

  const onSubmit = form.handleSubmit((values) => {
    create.mutate(values, {
      onSuccess: (session) => toast.success(t('generated', { className: session.class.name })),
      onError: () => toast.error(t('generateError')),
    });
  });

  const classOptions = toClassOptions(dashboard.data?.classes ?? []);
  const testOptions = toTestOptions(tests.data?.tests ?? []);

  return {
    form,
    onSubmit,
    classOptions,
    testOptions,
    status: deriveSetupStatus({
      isLoading: dashboard.isLoading || tests.isLoading,
      isError: dashboard.isError || tests.isError,
      isSuccess: dashboard.isSuccess && tests.isSuccess,
      classCount: classOptions.length,
      testCount: testOptions.length,
    }),
    isGenerating: create.isPending,
    retry: () => {
      void dashboard.refetch();
      void tests.refetch();
    },
  };
}
