import { z } from 'zod';

// Multi-tenant school switcher — the web mirror of the server contract in
// `schooltest-api/src/contracts/school-admin.ts` (C: memberships). One row per
// school the signed-in school_admin administers, plus the legacy school when
// it has no membership row yet; sorted is_primary desc then name asc. Strict
// on purpose: an unknown key is a contract defect and must fail the parse
// loudly, never be dropped on the floor.

export const schoolMembershipSchema = z.strictObject({
  documentId: z.string(),
  name: z.string().nullable(),
  suburb: z.string().nullable(),
  state: z.string().nullable(),
  plan: z.string().nullable(),
  account_status: z.string().nullable(),
  onboarding_status: z.string().nullable(),
  is_primary: z.boolean(),
});

export const schoolMembershipsResponseSchema = z.strictObject({
  data: z.array(schoolMembershipSchema),
});

export type SchoolMembership = z.infer<typeof schoolMembershipSchema>;
export type SchoolMemberships = SchoolMembership[];

/** `plan · location` — the rail switcher's sub-line. */
export function formatSchoolMembershipSubLine(
  membership: SchoolMembership,
  formatPlan: (plan: string | null) => string,
): string {
  const location = [membership.suburb, membership.state].filter(Boolean).join(', ');
  const planLabel = formatPlan(membership.plan);
  return [planLabel, location].filter((part) => part !== '').join(' · ');
}
