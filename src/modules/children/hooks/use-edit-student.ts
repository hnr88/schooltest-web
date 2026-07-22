'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

import { useRouter } from '@/i18n/navigation';
import { toAbsoluteMediaUrl, useWizardMediaStore } from '@/modules/student-wizard';
import type { StudentWizardOutput, StudentWizardValues } from '@/modules/student-wizard';
import { detailToInitialValues } from '@/modules/children/lib/detail-to-initial-values';
import { useStudentDetailQuery } from '@/modules/children/queries/use-student-detail.query';
import { useUpdateStudentMutation } from '@/modules/children/queries/use-update-student.mutation';

// C-UI-MYCHILDREN edit flow: fetch the parent detail read, seed the wizard media
// previews (the store is reset by the wizard on mount — this parent effect runs
// after that and wins), map to RHF initial values, and PUT on submit
// (C-STUDENT-UPDATE) → toast → back to the list (the mutation invalidates the
// list). Submit errors bubble to the wizard's classify alert.
export function useEditStudent(documentId: string) {
  const t = useTranslations('Children');
  const router = useRouter();
  const { data, error, isFetching, isLoading, isError, refetch } =
    useStudentDetailQuery(documentId);
  const update = useUpdateStudentMutation();
  const setMedia = useWizardMediaStore((state) => state.setMedia);

  useEffect(() => {
    if (!data) {
      return;
    }
    if (data.photo) {
      setMedia('photo', {
        id: data.photo.id,
        url: toAbsoluteMediaUrl(data.photo.url),
        mime: data.photo.mime ?? 'image/*',
        name: data.photo.name ?? '',
      });
    }
    if (data.voice_intro) {
      setMedia('voice_intro', {
        id: data.voice_intro.id,
        url: toAbsoluteMediaUrl(data.voice_intro.url),
        mime: data.voice_intro.mime ?? 'audio/*',
        name: data.voice_intro.name ?? '',
      });
    }
  }, [data, setMedia]);

  const initialValues: Partial<StudentWizardValues> | undefined = useMemo(
    () => (data ? detailToInitialValues(data) : undefined),
    [data],
  );

  const handleSubmit = useCallback(
    async (values: StudentWizardOutput) => {
      await update.mutateAsync({ documentId, values });
      toast.success(t('updatedToast'));
      router.push('/dashboard/children');
    },
    [documentId, router, t, update],
  );

  return { initialValues, error, isFetching, isLoading, isError, refetch, handleSubmit };
}
