import type { StatusPillTone } from '@/modules/design-system';
import type { ParentSubskillState } from '@/modules/report/types/report-view.types';
import type { ResultStatus } from '@/modules/report/types/report.types';

export const NOT_ASSESSED = 'not_assessed';

export const RECEPTIVE_SKILLS = ['reading', 'listening'];

export const PARENT_SUBSKILL_ORDER: readonly ParentSubskillState[] = [
  'secure',
  'getting_there',
  'not_yet',
  'not_assessed',
];

export const PARENT_TONE_SURFACE: Record<ParentSubskillState, string> = {
  secure: 'bg-success-soft-2 text-success-ink',
  getting_there: 'bg-teal-50 text-teal-700',
  not_yet: 'bg-blue-50 text-secondary-foreground',
  not_assessed: 'bg-muted text-secondary-foreground',
};

export const PARENT_TONE_FILL: Record<ParentSubskillState, string> = {
  secure: 'bg-success',
  getting_there: 'bg-teal-500',
  not_yet: 'bg-blue-500',
  not_assessed: 'bg-slate-400',
};

export const RESULT_STATUS_TONES: Record<ResultStatus, StatusPillTone> = {
  scoring: 'warning',
  partial_pending: 'info',
  complete: 'success',
  scoring_failed: 'danger',
};
