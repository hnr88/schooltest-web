import type { NavItem } from '@/modules/shell/types/shell.types';

// WHILE THE ROLE IS UNKNOWN THE RAIL SHOWS NO ROLE-SCOPED ITEM AT ALL (task 062).
// `roleType` is null in two real windows: a hard load before GET /api/users/me
// answers, and the moment after sign-in when ['auth','me'] holds the
// /api/auth/local user, which carries no `role`. An earlier version applied
// `roles` immediately but deferred `hiddenForRoles` until the role resolved, so an
// unresolved identity rendered the PARENT rail — a teacher signing in flashed
// "Overview · My children · Search · Settings" for a frame, which brief flow 1
// forbids outright. Defaulting to one specific role's nav when no role is known is
// the defect; an empty rail that fills in is the honest answer. Both gates are
// therefore withheld together: an item that names EITHER is role-scoped, and a
// role-scoped item needs a resolved role before it can be shown or hidden.
export function filterNavByRole(
  items: readonly NavItem[],
  roleType: string | null,
): readonly NavItem[] {
  return items.filter((item) => {
    const isRoleScoped = Boolean(item.roles ?? item.hiddenForRoles);
    if (roleType === null) return !isRoleScoped;
    if (item.roles && !item.roles.includes(roleType)) return false;
    if (item.hiddenForRoles?.includes(roleType)) return false;
    return true;
  });
}
