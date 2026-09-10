import { ROLE_DESTINATIONS } from '@/modules/dashboard/constants/components.constants';

// After accept the new staff member lands signed in on their own dashboard
// (spec §15), on the SAME role root every other sign-in is redirected to —
// ONE mapping (ROLE_DESTINATIONS), not a second copy that drifts when a
// persona's home moves: the teacher landing became /dashboard/results when
// teacher/10 retired the teach-home cluster, and this file still routed
// teachers to the deleted /dashboard/teach (a live 404 on accept). Any role
// without a row falls back to /dashboard, whose role gate routes from there.
export function dashboardHrefForRole(role: string): string {
  return ROLE_DESTINATIONS[role] ?? '/dashboard';
}
