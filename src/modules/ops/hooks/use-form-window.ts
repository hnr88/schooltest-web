'use client';

import { useAuthStore } from '@/modules/auth';
import { useFormLockQuery } from '@/modules/ops/queries/use-form-lock.query';
import { useFormWindowQuery } from '@/modules/ops/queries/use-form-window.query';
import { useFormsQuery } from '@/modules/ops/queries/use-forms.query';

// Data wiring for OpsFormWindow (C-WIN-01/02, task 68): the school's current
// window (form-window core find), the form picker source (forms core find) and
// the locked badge (session core find - the same submitted/ended rule the
// task-61 service enforces).
export function useFormWindowData(schoolDocumentId: string) {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const enabled = hydrated && Boolean(token);

  const formsQuery = useFormsQuery(enabled);
  const windowQuery = useFormWindowQuery(schoolDocumentId, enabled);
  const currentWindow = windowQuery.data ?? null;
  const lockQuery = useFormLockQuery(currentWindow?.form?.documentId ?? null, enabled);

  return {
    forms: formsQuery.data ?? [],
    currentWindow,
    locked: lockQuery.data === true,
    isPending: formsQuery.isPending || windowQuery.isPending,
    isError: formsQuery.isError || windowQuery.isError,
    retry: () => {
      void formsQuery.refetch();
      void windowQuery.refetch();
    },
    retrying: formsQuery.isFetching || windowQuery.isFetching,
  };
}
