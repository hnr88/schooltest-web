import type { UserRoleLabelKey } from '@/modules/shell/types/shell.types';

// The users-permissions role slugs the API's own bootstrap mints
// (schooltest-api/src/bootstrap/roles.ts). The rail's user card used to print the
// literal "Parent account" for every account, which is wrong the moment a teacher
// signs in (.qa/DESIGN.md "Sidebar": the footer carries the role word). An
// unrecognised or still-loading role resolves to null and the card prints no role
// line at all — never a guess.
const ROLE_LABEL_KEYS: Record<string, UserRoleLabelKey> = {
  parent: 'parent',
  teacher: 'teacher',
  admin: 'admin',
  student: 'student',
};

export function getUserRoleLabelKey(roleType: string | null | undefined): UserRoleLabelKey | null {
  if (!roleType) return null;
  return ROLE_LABEL_KEYS[roleType] ?? null;
}
