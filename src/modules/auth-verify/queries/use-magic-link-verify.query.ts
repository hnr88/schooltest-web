import { useQuery } from '@tanstack/react-query';

import { publicAuthApi } from '@/lib/axios/public-auth';
import {
  studentMagicLinkVerifyResponseSchema,
  teacherMagicLinkVerifyResponseSchema,
} from '@/modules/auth-verify/schemas/magic-link-verify.schema';
import type {
  MagicLinkSuccessView,
  MagicLinkVariant,
} from '@/modules/auth-verify/types/auth-verify.types';

/**
 * C-ML-VERIFY (student) — GET /api/auth/student/magic-link/verify?token=…
 * The token rides the query exactly as the desktop app sends it; the response's
 * `jwt` is parsed, mapped to the display slice and then dropped — the web
 * fallback never persists a session (the app is the session's consumer).
 */
async function claimStudentMagicLink(token: string): Promise<MagicLinkSuccessView> {
  const res = await publicAuthApi.get('/api/auth/student/magic-link/verify', {
    params: { token },
  });
  const { student } = studentMagicLinkVerifyResponseSchema.parse(res.data);
  const detail = [student.classLabel, student.schoolName].filter(Boolean).join(' · ');
  return { name: student.firstName, detail: detail === '' ? null : detail };
}

/**
 * C-TT-VERIFY (teacher) — POST /api/auth/teacher/magic-link/verify { token }.
 * The teacher twin verifies through a POST body (the contract's strictObject
 * 64-hex token), and its response carries no class/school — only the account
 * ref, so the username stands in for the first name.
 */
async function claimTeacherMagicLink(token: string): Promise<MagicLinkSuccessView> {
  const res = await publicAuthApi.post('/api/auth/teacher/magic-link/verify', { token });
  const { teacher } = teacherMagicLinkVerifyResponseSchema.parse(res.data);
  return { name: teacher.username, detail: null };
}

/**
 * Fires the variant's claim on mount and maps every outcome onto the screen's
 * three states: pending (no data yet), success (parsed view) and error — a
 * 400/401/network failure all land in the ONE designed error state, because a
 * single-use token that lost the race is terminal and never worth retrying.
 */
export function useMagicLinkVerify(variant: MagicLinkVariant, token: string) {
  // useQuery (not useEffect) per the data-fetching rule; the invitation module
  // is the precedent for a one-shot public claim on mount.
  return useQuery({
    queryKey: ['magic-link-verify', variant, token],
    queryFn: () =>
      variant === 'student' ? claimStudentMagicLink(token) : claimTeacherMagicLink(token),
    enabled: token !== '',
    retry: false,
    staleTime: Infinity,
  });
}
