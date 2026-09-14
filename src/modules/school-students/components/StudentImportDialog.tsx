'use client';

import { StudentImportDialogBase } from '@/modules/student-import/components/StudentImportDialogBase';
import { useStudentImport } from '@/modules/school-students/hooks/use-student-import';

import type { StudentImportDialogProps } from '@/modules/school-students/types/components.types';

// Spec §4 "Import students": the ONE shared import dialog with the class
// selector shown, so the admin picks the class every parsed row is created
// into. Parsing, preview→commit, refusal rows and messages all live in the
// shared student-import module — this wrapper only passes the picker options
// and the empty-classes escape hatch (the guard's "Create a class" CTA).
export function StudentImportDialog({ classes, onClose }: StudentImportDialogProps) {
  const importState = useStudentImport(onClose);

  return (
    <StudentImportDialogBase
      messageNamespace="SchoolStudents.import"
      state={importState}
      onClose={onClose}
      classes={classes}
      createClassesHref="/dashboard/school/classes"
    />
  );
}
