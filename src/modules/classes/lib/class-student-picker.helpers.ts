import { studentDisplayName } from '@/modules/school-students';
import type { ClassMemberOption } from '@/modules/classes/types/components.types';
import type { SchoolStudent } from '@/modules/school-students';

export function toOption(student: SchoolStudent): ClassMemberOption {
  return {
    value: student.documentId,
    label: studentDisplayName(student),
    // The student's current class, so a move in from another class is visible.
    hint: student.class?.name ?? undefined,
  };
}
