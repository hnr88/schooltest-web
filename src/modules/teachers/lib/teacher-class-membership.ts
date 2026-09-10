import type { SchoolClass } from '@/modules/classes';

export interface ClassTeachersPatch {
  documentId: string;
  teacherDocumentIds: string[];
}

export function currentTeacherClassIds(
  classes: readonly SchoolClass[],
  teacherDocumentId: string,
): Set<string> {
  const ids = new Set<string>();
  for (const klass of classes) {
    if (klass.teachers.some((teacher) => teacher.documentId === teacherDocumentId)) {
      ids.add(klass.documentId);
    }
  }
  return ids;
}

export function withTeacher(
  teacherDocumentIds: readonly string[],
  teacherDocumentId: string,
): string[] {
  return teacherDocumentIds.includes(teacherDocumentId)
    ? [...teacherDocumentIds]
    : [...teacherDocumentIds, teacherDocumentId];
}

export function withoutTeacher(
  teacherDocumentIds: readonly string[],
  teacherDocumentId: string,
): string[] {
  return teacherDocumentIds.filter((entry) => entry !== teacherDocumentId);
}

export function classMembershipPatches(
  classes: readonly SchoolClass[],
  teacherDocumentId: string,
  selectedDocumentIds: ReadonlySet<string>,
): ClassTeachersPatch[] {
  return classes
    .filter(
      (klass) =>
        klass.teachers.some((teacher) => teacher.documentId === teacherDocumentId) !==
        selectedDocumentIds.has(klass.documentId),
    )
    .map((klass) => {
      const current = klass.teachers.map((teacher) => teacher.documentId);
      return {
        documentId: klass.documentId,
        teacherDocumentIds: selectedDocumentIds.has(klass.documentId)
          ? withTeacher(current, teacherDocumentId)
          : withoutTeacher(current, teacherDocumentId),
      };
    });
}

export function removeTeacherPatch(
  klass: SchoolClass | undefined,
  teacherDocumentId: string,
): ClassTeachersPatch | null {
  if (!klass || klass.teachers.length === 0) {
    return null;
  }
  const current = klass.teachers.map((teacher) => teacher.documentId);
  if (!current.includes(teacherDocumentId)) {
    return null;
  }
  return {
    documentId: klass.documentId,
    teacherDocumentIds: withoutTeacher(current, teacherDocumentId),
  };
}
