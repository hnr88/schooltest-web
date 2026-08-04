import type { z } from 'zod';

import type {
  platformSettingsFormSchema,
  platformSettingsSchema,
  testEmailResultSchema,
} from '@/modules/ops/schemas/platform-settings.schema';

export type PlatformSettings = z.infer<typeof platformSettingsSchema>;
export type PlatformSettingsForm = z.infer<typeof platformSettingsFormSchema>;
export type TestEmailResult = z.infer<typeof testEmailResultSchema>;

/** One `details.errors` entry from the server's 400 (C-SET-03). */
export interface ServerFieldError {
  path: string;
  message: string;
}
