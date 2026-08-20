import type { z } from 'zod';

import type {
  adminInvitationResultSchema,
  onboardingLinkResultSchema,
  revokeInvitationResultSchema,
  schoolInvitationSchema,
} from '@/modules/ops/schemas/school-invitation.schema';

// Every type is INFERRED from the Zod mirror of the server contract — never
// declared twice, so the parse path and the type cannot drift apart
// (mission st-ops-onboarding, C-SCH-04 v2 / C-SCH-05 / C-SCH-06 / C-SCH-07).

export type OnboardingLinkResult = z.infer<typeof onboardingLinkResultSchema>;
export type AdminInvitationResult = z.infer<typeof adminInvitationResultSchema>;
export type RevokeInvitationResult = z.infer<typeof revokeInvitationResultSchema>;
export type SchoolInvitation = z.infer<typeof schoolInvitationSchema>;
