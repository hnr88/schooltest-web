import type { StatusPillTone } from '@/modules/design-system';
import type { ResultStatus } from '@/modules/report/types/report.types';
import { RESULT_STATUS_TONES } from '@/modules/report/constants/lib.constants';

export function getResultStatusTone(status: ResultStatus): StatusPillTone {
  return RESULT_STATUS_TONES[status];
}
