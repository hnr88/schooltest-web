'use client';

import { isAxiosError } from 'axios';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';

import { useUpdateClassMutation } from '@/modules/classes/mutations/use-update-class.mutation';
import type { SchoolClass } from '@/modules/classes/types/classes.types';
import type { SchoolChild } from '@/modules/school-children';

import type { StrapiErrorEnvelope } from '@/modules/classes/types/hooks.types';

function sameMembers(first: string[], second: string[]): boolean {
  return first.length === second.length && first.every((entry) => second.includes(entry));
}

// Working copy of one class's teacher/student membership for the detail
// screen (task 31, C-CLS-03). Null state means "no local edits", so the
// pickers mirror the server until the first change. `members` is the class's
// full roster (any status): archived members stay in the replacement list
// even though the student picker only offers active children, so a save
// never silently unlinks them.
export function useClassAssignment(schoolClass: SchoolClass, members: SchoolChild[]) {
  const t = useTranslations('Classes.detail');
  const update = useUpdateClassMutation();
  const [teacherIds, setTeacherIds] = useState<string[] | null>(null);
  const [studentIds, setStudentIds] = useState<string[] | null>(null);

  const serverTeacherIds = schoolClass.teachers.map((teacher) => teacher.documentId);
  const serverStudentIds = members.map((member) => member.documentId);
  const teacherValue = teacherIds ?? serverTeacherIds;
  const studentValue = studentIds ?? serverStudentIds;
  const dirty =
    !sameMembers(teacherValue, serverTeacherIds) || !sameMembers(studentValue, serverStudentIds);

  const save = async () => {
    try {
      await update.mutateAsync({
        documentId: schoolClass.documentId,
        name: schoolClass.name,
        year_band: schoolClass.year_band === '10_12' ? '10_12' : '7_9',
        teacher_documentIds: teacherValue,
        student_documentIds: studentValue,
      });
      setTeacherIds(null);
      setStudentIds(null);
      toast.success(t('savedToast', { name: schoolClass.name }));
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 403) {
        // C-CLS-03 tenancy failures carry the server reason (e.g. a member
        // outside the school); surface it verbatim when present.
        const envelope = error.response.data as StrapiErrorEnvelope | undefined;
        toast.error(envelope?.error?.message ?? t('forbiddenToast'));
        return;
      }
      toast.error(t('errorToast'));
    }
  };

  return {
    teacherValue,
    studentValue,
    setTeachers: (next: string[]) => setTeacherIds(next),
    setStudents: (next: string[]) => setStudentIds(next),
    dirty,
    saving: update.isPending,
    save,
  };
}
