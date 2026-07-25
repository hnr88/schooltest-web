import { z } from 'zod';

import type {
  ParentProfileSchema,
  updateMeResponseSchema,
} from '@/modules/onboarding/schemas/parent-profile.schema';

export type ParentProfileValues = z.input<ParentProfileSchema>;

export type ParentProfileOutput = z.output<ParentProfileSchema>;

export type UpdateMeResponse = z.infer<typeof updateMeResponseSchema>;

// Typed 400 from the API's Zod → ValidationError convention: the invalid
// whitelisted field names, surfaced so the form can highlight them.
export interface UpdateMeErrorPayload {
  error?: {
    status?: number;
    message?: string;
    details?: {
      fields?: string[];
      issues?: string[];
    };
  };
}
