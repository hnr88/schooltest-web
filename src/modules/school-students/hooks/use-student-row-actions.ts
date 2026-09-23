'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';

import type { DirectoryRowAction } from '@/modules/directory';
import { showOpsToast } from '@/modules/ops/actions';
import { classifyStudentError } from '@/modules/school-students/lib/classify-student-error';
import { useArchiveStudentMutation } from '@/modules/school-students/queries/use-archive-student.mutation';
import { useUnarchiveStudentMutation } from '@/modules/school-students/queries/use-unarchive-student.mutation';
import type { SchoolStudent } from '@/modules/school-students/types/school-students.types';

export function studentDisplayName(student: SchoolStudent): string {
  return `${student.given_name ?? ''} ${student.family_name ?? ''}`.trim();
}

/** What a row's actions close over — the screen owns the dialogs. */
export interface StudentRowActionHandlers {
  onEdit: (student: SchoolStudent) => void;
  onArchive: (student: SchoolStudent) => void;
  onUnarchive: (student: SchoolStudent) => void;
}

// Task 31 — the roster's row actions as the directory kit's declared list
// (D-20: the `write` flag is declared, never inferred from the label). Both
// actions keep their old semantics: Edit opens the screen-level edit dialog
// (dialog-opening writes are `write: true` — the ops MOVE_CLASS convention),
// Archive first opens the C-CHD-04 confirm and only the confirm fires the
// mutation. D10: an ARCHIVED row keeps Edit and gains Unarchive — the same
// confirm-then-mutate pattern, restoring the seat-occupying status — and
// still offers no Archive, exactly as the old menu did.
export function studentRowActions(
  student: SchoolStudent,
  labels: { edit: string; archive: string; unarchive: string },
  handlers: StudentRowActionHandlers,
): readonly DirectoryRowAction<SchoolStudent>[] {
  const actions: DirectoryRowAction<SchoolStudent>[] = [
    {
      label: labels.edit,
      write: true,
      onSelect: () => handlers.onEdit(student),
    },
  ];
  if (student.student_status === 'active') {
    actions.push({
      label: labels.archive,
      write: true,
      destructive: true,
      onSelect: () => handlers.onArchive(student),
    });
  }
  if (student.student_status === 'archived') {
    // Restoring is the opposite of the destructive act, so it is not
    // flagged destructive — the confirm still gates the write.
    actions.push({
      label: labels.unarchive,
      write: true,
      onSelect: () => handlers.onUnarchive(student),
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
  // The confirm disables on `isPending`, which re-renders a tick after
  // mutate(): a double-click's second press reaches this handler first, so
  // the guard is a ref, set synchronously. It stays set after a success (a
  // late press on the closing dialog sends nothing) and clears on a failure
  // (the press may be retried) or when a new confirm opens.
  const pressed = useRef(false);

  const requestArchive = (student: SchoolStudent | null) => {
    pressed.current = false;
    setTarget(student);
  };

  const confirmArchive = async () => {
    if (target === null || pressed.current) return;
    pressed.current = true;
    try {
      await archive.mutateAsync(target.documentId);
      showOpsToast({
        tone: 'ok',
        message: t('successToast', { name: studentDisplayName(target) }),
      });
      setTarget(null);
    } catch (error) {
      pressed.current = false;
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
    requestArchive,
    closeArchive: () => setTarget(null),
    confirmArchive,
    archivePending: archive.isPending,
  };
}

/**
 * D10 — Unarchive wiring for the roster table: the same screen-level confirm
 * pattern as `useStudentArchive` (the kit renders the row menu, so a menu
 * action only names a target), with the C-CHD-04b endpoint behind it. Success
 * invalidates the roster + entitlement queries inside the mutation, so the
 * row flips back to active and the seat math re-counts without a reload.
 */
export function useStudentUnarchive() {
  const t = useTranslations('SchoolStudents.unarchiveDialog');
  const [target, setTarget] = useState<SchoolStudent | null>(null);
  const unarchive = useUnarchiveStudentMutation();
  // Same double-press guard as useStudentArchive.
  const pressed = useRef(false);

  const requestUnarchive = (student: SchoolStudent | null) => {
    pressed.current = false;
    setTarget(student);
  };

  const confirmUnarchive = async () => {
    if (target === null || pressed.current) return;
    pressed.current = true;
    try {
      await unarchive.mutateAsync(target.documentId);
      showOpsToast({
        tone: 'ok',
        message: t('successToast', { name: studentDisplayName(target) }),
      });
      setTarget(null);
    } catch (error) {
      pressed.current = false;
      // Unarchive can only 403 on role/school scope, mirroring archive — the
      // contract codes collapse to the generic failure here.
      const kind = classifyStudentError(error);
      showOpsToast({
        tone: 'error',
        message: t(kind === 'forbidden' ? 'forbiddenToast' : 'genericToast'),
      });
    }
  };

  return {
    unarchiveTarget: target,
    requestUnarchive,
    closeUnarchive: () => setTarget(null),
    confirmUnarchive,
    unarchivePending: unarchive.isPending,
  };
}
