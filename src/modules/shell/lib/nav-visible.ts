import type { NavItem } from '@/modules/shell/types/shell.types';

// A role-scoped item stays hidden until the identity is known: showing it while
// `role` is still loading would flash a link the account may not be able to open.
// The `hiddenForRoles` subtraction is the mirror image and is deliberately NOT
// applied while the role is unknown — the parent rail is what an unresolved
// identity has always rendered, so nothing disappears mid-hydration.
export function filterNavByRole(
  items: readonly NavItem[],
  roleType: string | null,
): readonly NavItem[] {
  return items.filter((item) => {
    if (item.roles && (roleType === null || !item.roles.includes(roleType))) return false;
    if (item.hiddenForRoles && roleType !== null && item.hiddenForRoles.includes(roleType)) {
      return false;
    }
    return true;
  });
}
