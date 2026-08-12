import type { LucideIcon } from 'lucide-react';

import type {
  MonitorSitting,
  MonitorStudent,
  MonitorSummary,
} from '@/modules/teacher/types/teacher-session.types';

/** The five stat tiles above the grid — literally C-TS-3's own `summary` keys. */
export type MonitorSummaryKey = keyof MonitorSummary;

export interface MonitorTileTheme {
  icon: LucideIcon;
  iconClass: string;
  tile: string;
  name: string;
  detail: string;
}

export interface MonitorSummaryItem {
  key: MonitorSummaryKey;
  value: number;
}

/** An ICU message reference for the one line of extra fact a tile can carry. */
export interface MonitorTileDetail {
  key: string;
  values: Record<string, number>;
}

export type LiveMonitorReadStatus = 'loading' | 'error' | 'ready';

export interface LiveMonitorReadCounts {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  hasSitting: boolean;
}

export interface LiveMonitorState {
  status: LiveMonitorReadStatus;
  sitting: MonitorSitting | null;
  testLabel: string | null;
  stallThresholdMinutes: number | null;
  summaryItems: readonly MonitorSummaryItem[];
  students: readonly MonitorStudent[];
  startedMinutesAgo: number | null;
  isRefetching: boolean;
  retry: () => void;
}

export interface LiveMonitorScreenProps {
  sittingDocumentId: string;
}

export interface LiveMonitorHeaderProps {
  sitting: MonitorSitting;
  testLabel: string | null;
  startedMinutesAgo: number | null;
}

export interface LiveMonitorSummaryProps {
  items: readonly MonitorSummaryItem[];
}

export interface LiveMonitorGridProps {
  students: readonly MonitorStudent[];
}

export interface LiveMonitorTileProps {
  student: MonitorStudent;
}

export interface LiveMonitorLegendProps {
  stallThresholdMinutes: number;
}
