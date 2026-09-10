'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { showOpsToast } from '@/modules/ops/actions';
import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { classifyStudentError } from '@/modules/school-students/lib/classify-student-error';
import { useImportStudentsMutation } from '@/modules/student-import';
import type { ParsedStudentCsv } from '@/modules/student-import';

import type { ClassStudentImportState } from '@/modules/classes/types/hooks.types';

const EMPTY_PARSED: ParsedStudentCsv = { rows: [], errors: [] };

// Spec §1 "Import students" wiring, on the SHARED preview→commit engine the
// Students page uses — the class is fixed to the one being viewed, so there is
// no class selector to get wrong. Every count in a toast comes from the server
// result, never from rows.length, and the class reads are invalidated so the
// roster and the cards refresh.
export function useClassStudentImport(
  classDocumentId: string,
  onDone: () => void,
): ClassStudentImportState {
  const t = useTranslations('Classes.detail.import');
  const queryClient = useQueryClient();
  const [parsed, setParsedState] = useState<ParsedStudentCsv>(EMPTY_PARSED);
  const [csv, setCsvState] = useState('');
  const importStudents = useImportStudentsMutation();

  const setParsed = (next: ParsedStudentCsv, text: string) => {
    setParsedState(next);
    setCsvState(text);
  };

  const canSubmit = parsed.rows.length > 0 && !importStudents.isPending;

  const submit = async () => {
    if (!canSubmit) return;
    let result;
    try {
      result = await importStudents.mutateAsync({ csv, classDocumentId });
    } catch (error) {
      showOpsToast({ tone: 'error', message: t(`${classifyStudentError(error)}Toast`) });
      return;
    }
    if (result.kind === 'rejected') {
      showOpsToast({ tone: 'error', message: t('rejectedToast', { count: result.rejected }) });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
    if (result.created === 0) {
      showOpsToast({ tone: 'warn', message: t('alreadyImportedToast') });
    } else if (result.skipped > 0) {
      showOpsToast({
        tone: 'ok',
        message: t('successSkippedToast', { created: result.created, skipped: result.skipped }),
      });
    } else {
      showOpsToast({ tone: 'ok', message: t('successToast', { count: result.created }) });
    }
    onDone();
  };

  return { parsed, setParsed, canSubmit, pending: importStudents.isPending, submit };
}
