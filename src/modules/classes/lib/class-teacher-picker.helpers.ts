import type { ClassMemberOption } from '@/modules/classes/types/components.types';
import type { SchoolTeacher } from '@/modules/teachers';

export function toOption(teacher: SchoolTeacher): ClassMemberOption {
  const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
  return { value: teacher.documentId, label: name || teacher.email };
}
