import { z } from 'zod';

import {
  onboardingStateSchema,
  onboardingStatusSchema,
  onboardingUpdateInputSchema,
} from '../schemas/onboarding.schema';

export type OnboardingStatus = z.infer<typeof onboardingStatusSchema>;

export type OnboardingState = z.infer<typeof onboardingStateSchema>;

export type OnboardingUpdateInput = z.infer<typeof onboardingUpdateInputSchema>;
