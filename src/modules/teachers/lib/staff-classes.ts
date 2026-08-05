import type { SchoolClass } from '@/modules/classes';
import type { SchoolTeacherClass } from '@/modules/teachers/types/teachers.types';

// `api::class.class` carries BOTH `teacher` (manyToOne) and `teachers`
// (manyToMany), and C-TCH-01 groups a school's classes by the SINGULAR one
// (schooltest-api/src/api/school/lib/school-teacher.actions.ts:132-139), so a
// class taught by two people lists under the first alone. C-CLS-01 projects the
// full `teachers` m2m (schooltest-api/src/api/class/lib/class-action-helpers.ts:23),
// so the UNION of the two reads is the complete assignment set. Sorted by name,
// matching the order both endpoints already return.
export function mergeTeacherClasses(
  rosterClasses: SchoolTeacherClass[],
  schoolClasses: SchoolClass[] | undefined,
  teacherDocumentId: string,
): SchoolTeacherClass[] {
  const byDocumentId = new Map(rosterClasses.map((klass) => [klass.documentId, klass]));
  for (const klass of schoolClasses ?? []) {
    if (byDocumentId.has(klass.documentId)) continue;
    if (!klass.teachers.some((teacher) => teacher.documentId === teacherDocumentId)) continue;
    byDocumentId.set(klass.documentId, { documentId: klass.documentId, name: klass.name });
  }
  return [...byDocumentId.values()].sort((a, b) => a.name.localeCompare(b.name));
}
