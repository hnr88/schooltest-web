'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { showOpsToast } from '@/modules/ops/actions';
import { EMPTY_PARSED_CSV } from '@/modules/school-students/constants/hooks.constants';
import {
  ENTITLEMENT_QUERY_KEY,
  SCHOOL_CHILDREN_QUERY_KEY,
} from '@/modules/school-students/constants/queries.constants';
import { classifyStudentError } from '@/modules/school-students/lib/classify-student-error';
import { useImportStudentsMutation } from '@/modules/student-import';
import type { ParsedStudentCsv } from '@/modules/student-import';

import type { StudentImportState } from '@/modules/school-students/types/hooks.types';

// Spec §4 import wiring: the parsed CSV, the raw csv text and the target class
// the shared fields report up, then ONE preview→commit run against
// /api/schools/me/import-students/* — the same engine the ops portal uses.
// Every count in a toast comes from the server result, never from a guess
// about what the file contained.
export function useStudentImport(onDone: () => void): StudentImportState {
  const t = useTranslations('SchoolStudents.import');
  const queryClient = useQueryClient();
  const [parsed, setParsedState] = useState<ParsedStudentCsv>(EMPTY_PARSED_CSV);
  const [csv, setCsvState] = useState('');
  const [classId, setClassId] = useState('');
  const importStudents = useImportStudentsMutation();

  const setParsed = (next: ParsedStudentCsv, text: string) => {
    setParsedState(next);
    setCsvState(text);
  };

  const canSubmit = classId !== '' && parsed.rows.length > 0 && !importStudents.isPending;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    let result;
    try {
      result = await importStudents.mutateAsync({ csv, classDocumentId: classId });
    } catch (error) {
      showOpsToast({ tone: 'error', message: t(`${classifyStudentError(error)}Toast`) });
      return;
    }
    if (result.kind === 'rejected') {
      showOpsToast({ tone: 'error', message: t('rejectedToast', { count: result.rejected }) });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: SCHOOL_CHILDREN_QUERY_KEY });
    void queryClient.invalidateQueries({ queryKey: ENTITLEMENT_QUERY_KEY });
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

  return {
    parsed,
    setParsed,
    classId,
    setClassId,
    canSubmit,
    pending: importStudents.isPending,
    submit,
  };
}
