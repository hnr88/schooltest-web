import { childDisplayName } from '@/modules/school-children';
import type { ClassMemberOption } from '@/modules/classes/types/components.types';
import type { SchoolChild } from '@/modules/school-children';

export function toOption(child: SchoolChild): ClassMemberOption {
  return {
    value: child.documentId,
    label: childDisplayName(child),
    // The child's current class, so a move in from another class is visible.
    hint: child.class?.name ?? undefined,
  };
}
