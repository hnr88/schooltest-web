import type { ClassStudentOption } from '@/modules/classes/types/classes.types';
import type { ClassMemberOption } from '@/modules/classes/types/components.types';
import type { SchoolTeacher } from '@/modules/teachers';

export function teacherOption(teacher: SchoolTeacher): ClassMemberOption {
  const name = `${teacher.first_name ?? ''} ${teacher.last_name ?? ''}`.trim();
  return { value: teacher.documentId, label: name || teacher.email };
}

export function studentOption(student: ClassStudentOption): ClassMemberOption {
  return {
    value: student.documentId,
    label: `${student.given_name} ${student.family_name}`.trim(),
    hint: student.class?.name,
  };
}
