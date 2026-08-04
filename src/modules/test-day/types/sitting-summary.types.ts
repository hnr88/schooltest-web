// C-SIT-08 end-of-test-day summary (task 136, mvp-updates 4.5 steps 5-6):
// GET /api/sittings/<documentId>/summary returns the owning teacher's rollup
// for one sitting. code is nullable server-side (a sitting exists before its
// code is generated); needs_resit is roster minus sat minus absent;
// results_pending / results_ready split submitted sessions by scored Result.
import type { SittingStatus } from '@/modules/test-day/types/test-day.types';

export interface SittingSummary {
  sitting: { documentId: string; code: string | null; status: SittingStatus };
  sat: number;
  absent: number;
  needs_resit: number;
  results_pending: number;
  results_ready: number;
}
