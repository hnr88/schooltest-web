import type { ClassMemberOption } from '@/modules/classes/types/components.types';
import type { SchoolTeacher } from '@/modules/teachers';

/** A staff member's display name, falling back to their email (C-TCH-01 rows). */
export function teacherLabel(teacher: SchoolTeacher): string {
  const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
  return name || teacher.email;
}

export function teacherOption(teacher: SchoolTeacher): ClassMemberOption {
  return { value: teacher.documentId, label: teacherLabel(teacher) };
}
