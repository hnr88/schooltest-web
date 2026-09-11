import type { StatusPillTone } from '@/modules/design-system';
import type { DiagnosticStatus } from '@/modules/teach/types/diagnostic.types';
import type { ProgressStatus } from '@/modules/teach/types/progress.types';


export const RANK: Record<ProgressStatus, number> = {
  not_mastered: 0,
  emerging: 1,
  mastered: 2,
};


export const ICON_TONE = {
  up: 'text-success-ink',
  down: 'text-danger-ink',
  steady: 'text-muted-foreground',
} as const;


export const PROGRESS_STATUS_TONE: Record<ProgressStatus, StatusPillTone> = {  mastered: 'success',
  emerging: 'warning',
  not_mastered: 'danger',
};

export const STATUS_TONE: Record<DiagnosticStatus, StatusPillTone> = {
  mastered: 'success',
  emerging: 'warning',
  not_mastered: 'danger',
  not_assessed: 'neutral',
  secure: 'success',
  developing: 'info',
  not_yet: 'danger',
};
