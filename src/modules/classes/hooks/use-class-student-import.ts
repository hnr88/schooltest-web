'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { useImportStudentsMutation } from '@/modules/school-students';
import type { ParsedStudentCsv } from '@/modules/student-import';

import type { ClassStudentImportState } from '@/modules/classes/types/hooks.types';

const EMPTY_PARSED: ParsedStudentCsv = { rows: [], errors: [] };

// Spec §1 "Import students" wiring, on top of the SHARED C-CHD-02 batch write
// the Students page already uses. The class is fixed to the one being viewed —
// there is no class selector to get wrong. Every count in a toast comes from the
// batch result, so a partial import says exactly how many rows landed, and the
// class detail read is invalidated so the roster and the cards refresh.
export function useClassStudentImport(
  classDocumentId: string,
  onDone: () => void,
): ClassStudentImportState {
  const t = useTranslations('Classes.detail.import');
  const queryClient = useQueryClient();
  const [parsed, setParsed] = useState<ParsedStudentCsv>(EMPTY_PARSED);
  const importStudents = useImportStudentsMutation();

  const canSubmit = parsed.rows.length > 0 && !importStudents.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    const result = await importStudents
      .mutateAsync({ rows: parsed.rows, classDocumentId })
      .catch(() => ({ created: 0, total: parsed.rows.length, failure: null }));
    if (result.created === 0) {
      toast.error(t(`${result.failure ?? 'generic'}Toast`));
      return;
    }
    await queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
    if (result.created < result.total) {
      toast.warning(t('partialToast', { created: result.created, total: result.total }));
    } else {
      toast.success(t('successToast', { count: result.created }));
    }
    onDone();
  };

  return { parsed, setParsed, canSubmit, pending: importStudents.isPending, submit };
}
