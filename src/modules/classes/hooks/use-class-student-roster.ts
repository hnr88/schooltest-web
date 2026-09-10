'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { CLASSES_QUERY_KEY } from '@/modules/classes/constants/queries.constants';
import { studentDisplayName } from '@/modules/classes/lib/class-detail.helpers';
import { showOpsToast } from '@/modules/ops/actions';
import { useUpdateStudentMutation } from '@/modules/school-students';

import type { ClassDetailStudent } from '@/modules/classes/types/class-detail.types';
import type { SchoolStudent } from '@/modules/school-students';

interface UseClassStudentRosterResult {
  assign: (students: readonly SchoolStudent[]) => Promise<boolean>;
  remove: (student: ClassDetailStudent) => Promise<boolean>;
  assigning: boolean;
  removingDocumentIds: ReadonlySet<string>;
  error: boolean;
  clearError: () => void;
}

export function useClassStudentRoster(classDocumentId: string): UseClassStudentRosterResult {
  const t = useTranslations('Classes.detail');
  const queryClient = useQueryClient();
  const updateStudent = useUpdateStudentMutation();
  const [assigning, setAssigning] = useState(false);
  const [removingDocumentIds, setRemovingDocumentIds] = useState<ReadonlySet<string>>(new Set());
  const [error, setError] = useState(false);

  async function assign(students: readonly SchoolStudent[]): Promise<boolean> {
    if (students.length === 0 || assigning) return false;
    setAssigning(true);
    setError(false);
    try {
      await Promise.all(
        students.map((student) =>
          updateStudent.mutateAsync({
            documentId: student.documentId,
            body: { class_documentId: classDocumentId },
          }),
        ),
      );
      void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      showOpsToast({ tone: 'ok', message: t('studentsAddedToast', { count: students.length }) });
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setAssigning(false);
    }
  }

  async function remove(student: ClassDetailStudent): Promise<boolean> {
    if (removingDocumentIds.has(student.documentId)) return false;
    setRemovingDocumentIds(new Set([...removingDocumentIds, student.documentId]));
    setError(false);
    try {
      await updateStudent.mutateAsync({
        documentId: student.documentId,
        body: { class_documentId: null },
      });
      void queryClient.invalidateQueries({ queryKey: CLASSES_QUERY_KEY });
      showOpsToast({
        tone: 'ok',
        message: t('studentRemovedToast', { name: studentDisplayName(student) }),
      });
      return true;
    } catch {
      setError(true);
      return false;
    } finally {
      setRemovingDocumentIds((current) => {
        const next = new Set(current);
        next.delete(student.documentId);
        return next;
      });
    }
  }

  return { assign, remove, assigning, removingDocumentIds, error, clearError: () => setError(false) };
}
