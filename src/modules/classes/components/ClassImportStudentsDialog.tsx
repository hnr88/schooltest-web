'use client';

import { StudentImportDialogBase } from '@/modules/student-import/components/StudentImportDialogBase';
import { useClassStudentImport } from '@/modules/classes/hooks/use-class-student-import';

import type { ClassImportStudentsDialogProps } from '@/modules/classes/types/components.types';

// Spec §1 "Import students": the SAME shared import dialog the Students page
// renders, with the destination class fixed to the one being viewed — so no
// class selector renders and the description names the class. Parsing,
// preview→commit, refusal rows and messages all live in the shared
// student-import module.
export function ClassImportStudentsDialog({
  classDocumentId,
  className,
  onClose,
}: ClassImportStudentsDialogProps) {
  const importState = useClassStudentImport(classDocumentId, onClose);

  return (
    <StudentImportDialogBase
      messageNamespace="Classes.detail.import"
      state={importState}
      onClose={onClose}
      fixedClassName={className}
    />
  );
}
