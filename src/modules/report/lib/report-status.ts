import type { StatusPillTone } from '@/modules/design-system';
import type { ResultStatus } from '@/modules/report/types/report.types';

const RESULT_STATUS_TONES: Record<ResultStatus, StatusPillTone> = {
  scoring: 'warning',
  partial_pending: 'info',
  complete: 'success',
};

export function getResultStatusTone(status: ResultStatus): StatusPillTone {
  return RESULT_STATUS_TONES[status];
}
