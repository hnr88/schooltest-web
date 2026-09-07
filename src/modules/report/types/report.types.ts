import type { z } from 'zod';

import type {
  cefrBandSchema,
  readinessSchema,
  resultDestinationSchema,
  resultStatusSchema,
  resultViewSchema,
  skillSchema,
} from '@/modules/report/schemas/result-view.schema';

export type ReportSkill = z.infer<typeof skillSchema>;
export type CefrBand = z.infer<typeof cefrBandSchema>;
export type Readiness = z.infer<typeof readinessSchema>;
export type ResultStatus = z.infer<typeof resultStatusSchema>;
export type ResultDestination = z.infer<typeof resultDestinationSchema>;
export type ResultView = z.infer<typeof resultViewSchema>;
