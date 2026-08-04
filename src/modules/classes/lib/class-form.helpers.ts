import type { ClassChildOption } from '@/modules/classes/types/classes.types';
import type { ClassMemberOption } from '@/modules/classes/types/components.types';
import type { SchoolTeacher } from '@/modules/teachers';

export function teacherOption(teacher: SchoolTeacher): ClassMemberOption {
  const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
  return { value: teacher.documentId, label: name || teacher.email };
}

export function childOption(child: ClassChildOption): ClassMemberOption {
  return {
    value: child.documentId,
    label: `${child.given_name} ${child.family_name}`.trim(),
    hint: child.class?.name,
  };
}
