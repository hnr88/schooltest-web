'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { EMPTY_PARSED_CSV } from '@/modules/school-students/constants/hooks.constants';
import { useImportStudentsMutation } from '@/modules/school-students/queries/use-import-students.mutation';
import type { StudentImportState } from '@/modules/school-students/types/hooks.types';
import type { ParsedStudentCsv } from '@/modules/student-import';

// Spec §4 import wiring: the parsed CSV and the target class the shared fields
// report up, plus the batch write. Every count in a toast comes from the batch
// result, so a partial import says exactly how many rows landed.
export function useStudentImport(onDone: () => void): StudentImportState {
  const t = useTranslations('SchoolStudents.import');
  const [parsed, setParsed] = useState<ParsedStudentCsv>(EMPTY_PARSED_CSV);
  const [classId, setClassId] = useState('');
  const importStudents = useImportStudentsMutation();

  const canSubmit = classId !== '' && parsed.rows.length > 0 && !importStudents.isPending;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    const result = await importStudents
      .mutateAsync({ rows: parsed.rows, classDocumentId: classId })
      .catch(() => ({ created: 0, total: parsed.rows.length, failure: null }));
    if (result.created === 0) {
      toast.error(t(`${result.failure ?? 'generic'}Toast`));
      return;
    }
    if (result.created < result.total) {
      toast.warning(t('partialToast', { created: result.created, total: result.total }));
    } else {
      toast.success(t('successToast', { count: result.created }));
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
