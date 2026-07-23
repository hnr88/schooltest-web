import type { NavItem } from '@/modules/shell/types/shell.types';

// A role-scoped item stays hidden until the identity is known: showing it while
// `role` is still loading would flash a link the account may not be able to open.
export function filterNavByRole(
  items: readonly NavItem[],
  roleType: string | null,
): readonly NavItem[] {
  return items.filter(
    (item) => !item.roles || (roleType !== null && item.roles.includes(roleType)),
  );
}
