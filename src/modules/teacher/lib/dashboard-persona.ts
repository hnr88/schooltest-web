import { TEACHER_ROLE_TYPE } from '@/modules/auth';
import type {
  DashboardPersona,
  DashboardPersonaInput,
} from '@/modules/teacher/types/teacher-dashboard.types';

/**
 * Which persona `/dashboard` is allowed to mount (A4, .qa/DECISIONS.md).
 *
 * The branch keys on the ROLE being KNOWN, never merely on the identity read
 * having stopped being pending. `useLoginMutation` seeds `['auth','me']` with
 * the `POST /api/auth/local` user, and that payload carries NO `role` field —
 * only the populated `GET /api/users/me` does. So on the sign-in path there is
 * a window where the user is authenticated and the role is still unknown. Read
 * "not a teacher" there and the parent Overview mounts for a teacher, firing
 * its parent-only students query at a 403 — the exact defect this gate exists
 * to remove. An authenticated identity with no role is therefore STILL
 * RESOLVING, not "some other persona".
 *
 * A missing role only ever means "not loaded yet": a signed-out or errored read
 * leaves no user at all, which is `other` so the incumbent screen and the
 * layout's own guard keep handling it exactly as before.
 */
export function derivePersona({
  isLoading,
  isAuthenticated,
  roleType,
}: DashboardPersonaInput): DashboardPersona {
  if (isLoading) return 'pending';
  if (isAuthenticated && roleType === null) return 'pending';
  return roleType === TEACHER_ROLE_TYPE ? 'teacher' : 'other';
}
