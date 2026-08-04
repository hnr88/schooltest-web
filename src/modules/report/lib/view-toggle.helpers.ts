import { MODES } from '@/modules/report/constants/components.constants';
import type { ReportViewMode } from '@/modules/report/types/report-view.types';

export function isMode(value: string): value is ReportViewMode {
  return MODES.some((mode) => mode === value);
}
