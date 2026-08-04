// C-SIT-07 per-class sitting history row (task 131, mvp-updates 4.5):
// GET /api/sittings?class=<documentId>&summary=true returns these rows newest
// first. code/form_code/opened_at/closed_at are nullable server-side (a
// sitting exists before its code is generated and before it is opened).
import type { SittingStatus } from '@/modules/test-day/types/test-day.types';

export interface SittingHistoryRow {
  documentId: string;
  code: string | null;
  form_code: string | null;
  status: SittingStatus;
  opened_at: string | null;
  closed_at: string | null;
  joined: number;
  submitted: number;
  total: number;
}
