'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';

import type { DirectoryRowAction } from '@/modules/directory';
import { showOpsToast } from '@/modules/ops/actions';
import { classifyStudentError } from '@/modules/school-students/lib/classify-student-error';
import { useArchiveStudentMutation } from '@/modules/school-students/queries/use-archive-student.mutation';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

export function studentDisplayName(student: SchoolStudent): string {
  return `${student.given_name ?? ''} ${student.family_name ?? ''}`.trim();
}

/** What a row's actions close over — the screen owns the dialogs. */
export interface StudentRowActionHandlers {
  onEdit: (student: SchoolStudent) => void;
  onArchive: (student: SchoolStudent) => void;
}

// Task 31 — the roster's row actions as the directory kit's declared list
// (D-20: the `write` flag is declared, never inferred from the label). Both
// actions keep their old semantics: Edit opens the screen-level edit dialog
// (dialog-opening writes are `write: true` — the ops MOVE_CLASS convention),
// Archive first opens the C-CHD-04 confirm and only the confirm fires the
// mutation. Archived students keep offering Edit and no Archive, exactly as
// the old menu did.
export function studentRowActions(
  student: SchoolStudent,
  labels: { edit: string; archive: string },
  handlers: StudentRowActionHandlers,
): readonly DirectoryRowAction<SchoolStudent>[] {
  const actions: DirectoryRowAction<SchoolStudent>[] = [
    {
      label: labels.edit,
      write: true,
      onSelect: () => handlers.onEdit(student),
    },
  ];
  if (student.status === 'active') {
    actions.push({
      label: labels.archive,
      write: true,
      destructive: true,
      onSelect: () => handlers.onArchive(student),
    });
  }
  return actions;
}

/**
 * Archive wiring for the roster table (C-CHD-04): ONE confirm dialog at the
 * screen level instead of one per row — the kit renders the row menu, and a
 * menu action can only name a target, not own a dialog. Confirm state,
 * mutation and toasts live here so the components stay under the line cap.
 */
export function useStudentArchive() {
  const t = useTranslations('SchoolStudents.archiveDialog');
  const [target, setTarget] = useState<SchoolStudent | null>(null);
  const archive = useArchiveStudentMutation();

  const confirmArchive = async () => {
    if (target === null) return;
    try {
      await archive.mutateAsync(target.documentId);
      showOpsToast({
        tone: 'ok',
        message: t('successToast', { name: studentDisplayName(target) }),
      });
      setTarget(null);
    } catch (error) {
      // Archive can only 403 on role/school scope — the seat gate lives on
      // create — so the contract codes collapse to the generic failure here.
      const kind = classifyStudentError(error);
      showOpsToast({
        tone: 'error',
        message: t(kind === 'forbidden' ? 'forbiddenToast' : 'genericToast'),
      });
    }
  };

  return {
    archiveTarget: target,
    requestArchive: setTarget,
    closeArchive: () => setTarget(null),
    confirmArchive,
    archivePending: archive.isPending,
  };
}
