import { z } from 'zod';
import { ONBOARDING_STATUSES } from '@/modules/onboarding/constants/schemas.constants';

export const onboardingStatusSchema = z.enum(ONBOARDING_STATUSES);

export const onboardingStateSchema = z.object({
  documentId: z.string(),
  status: onboardingStatusSchema,
  completedAt: z.string().datetime().nullable(),
  skippedAt: z.string().datetime().nullable(),
});

export const onboardingUpdateInputSchema = z.object({
  status: z.enum(['completed', 'skipped']),
});
