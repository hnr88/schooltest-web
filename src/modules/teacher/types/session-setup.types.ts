import type { z } from 'zod';

import type { startTestSessionFormSchema } from '@/modules/teacher/schemas/session-setup.schema';

export type StartTestSessionFormValues = z.infer<typeof startTestSessionFormSchema>;
