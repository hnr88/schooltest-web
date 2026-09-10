import type { SchoolClass } from '@/modules/classes';

export function classAssignOptions(
  classes: readonly SchoolClass[],
  currentDocumentId: string | null,
): SchoolClass[] {
  return classes
    .filter((klass) => klass.documentId !== currentDocumentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}
