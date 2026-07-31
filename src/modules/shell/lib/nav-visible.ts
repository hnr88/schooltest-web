import { parentViewsEnabled } from '@/modules/flags';
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

// Task 46 (st-mvp-pivot): parent-portal destinations are masked, not deleted,
// while the flag is off — the items vanish from the rail for every role and
// return unchanged when the flag flips on.
export function filterNavByParentViews(items: readonly NavItem[]): readonly NavItem[] {
  if (parentViewsEnabled()) return items;
  return items.filter((item) => !item.parentViews);
}
