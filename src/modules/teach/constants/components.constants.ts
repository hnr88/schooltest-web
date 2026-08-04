import type { StatusPillTone } from '@/modules/design-system';
import type { MonitorStateKey } from '@/modules/teach/types/components.types';
import type { DiagnosticStatus } from '@/modules/teach/types/diagnostic.types';
import type { ProgressStatus } from '@/modules/teach/types/progress.types';


export const MONITOR_STATE_ORDER: readonly MonitorStateKey[] = [
  'not_joined',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
];

export const MONITOR_STATE_TONES: Record<MonitorStateKey, StatusPillTone> = {
  not_joined: 'neutral',
  joined: 'info',
  in_progress: 'warning',
  submitted: 'success',
  stalled: 'danger',
};

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


export const MONITOR_POLL_MS = 30_000;

export const PROGRESS_STATUS_TONE: Record<ProgressStatus, StatusPillTone> = {
  mastered: 'success',
  emerging: 'warning',
  not_mastered: 'danger',
};

export const STATUS_TONE: Record<DiagnosticStatus, StatusPillTone> = {
  mastered: 'success',
  emerging: 'warning',
  not_mastered: 'danger',
  not_assessed: 'neutral',
};
