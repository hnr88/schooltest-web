import { TEACHER_ROLE_TYPE } from '@/modules/auth/constants/role.constants';
import { TEACHER_FRAME_PATHS } from '@/modules/shell/constants/nav.constants';

// Does this render get the Teacher Portal v2 frame (Teacher Portal v2.dc.html:23–56:
// the bordered rail skin and NO topbar)? A resolved role decides on its own, so
// every other role keeps its frame exactly as before. While GET /api/users/me is
// still in flight the role is null; then the pathname decides, and only on routes
// no other role can open, so a hard load of /dashboard/results never flashes the
// old topbar and navy slab before the role lands. Shared or unknown routes keep
// today's frame until the role resolves.
export function isTeacherFrame(roleType: string | null, pathname: string): boolean {
  if (roleType !== null) return roleType === TEACHER_ROLE_TYPE;
  return TEACHER_FRAME_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
