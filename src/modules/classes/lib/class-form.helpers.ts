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

/**
 * Eligibility for taking a class (the C-CLS-02 teacher): an active staff row
 * that is NOT the school administrator. Suspended rows never count, and the
 * admin's own row in the staff list is not a class teacher — so a school
 * whose only member is the admin has NO eligible teachers, and class
 * creation is refused up front ("no eligible teachers") instead of offered
 * as a form. `role` may be absent on rows created outside the invitation
 * flow; absent means unknown, and only an EXPLICIT admin is excluded.
 */
export function isEligibleClassTeacher(
  teacher: Pick<SchoolTeacher, 'blocked'> & { role?: 'teacher' | 'school_admin' | null },
): boolean {
  return !teacher.blocked && teacher.role !== 'school_admin';
}
