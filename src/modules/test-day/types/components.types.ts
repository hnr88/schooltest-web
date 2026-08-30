import type {
  ClassSitting,
  MonitorRowState,
  MonitorStudent,
  SittingMonitor,
  SittingStatus,
} from '@/modules/test-day/types/test-day.types';

export interface AbsentToggleProps {
  studentName: string;
  absent: boolean;
  pending: boolean;
  onToggle: (absent: boolean) => void;
}

export interface CodeRevealCardProps {
  sitting: ClassSitting;
  revealPending: boolean;
  onReveal: () => void;
}

export interface MonitorRowProps {
  sittingDocumentId: string;
  student: MonitorStudent;
  revealedIds: ReadonlySet<string>;
  resitPendingId: string | null;
  absentPendingId: string | null;
  onReveal: (student: MonitorStudent) => void;
  onResit: (studentDocumentId: string) => void;
  onToggleAbsent: (studentDocumentId: string, absent: boolean) => void;
}

export interface MonitorSectionProps {
  sitting: ClassSitting;
}

export type PillTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

export interface MonitorSummaryProps {
  counts: Record<MonitorRowState, number>;
}

export interface MonitorTableProps {
  sitting: SittingMonitor['sitting'];
  students: MonitorStudent[];
  resitPendingId: string | null;
  absentPendingId: string | null;
  onResit: (studentDocumentId: string) => void;
  onToggleAbsent: (studentDocumentId: string, absent: boolean) => void;
}

export interface NeedsToSitPanelProps {
  students: MonitorStudent[];
}

export interface ResitButtonProps {
  studentName: string;
  pending: boolean;
  onConfirm: () => void;
}

export interface SittingHistoryTableProps {
  classDocumentId: string;
}

export interface SittingSummaryPanelProps {
  sitting: ClassSitting;
}

export interface StartSittingControlsProps {
  pending: boolean;
  disabled: boolean;
  error: boolean;
  onStart: () => void;
}

export interface StudentRevealDialogProps {
  open: boolean;
  onClose: () => void;
  code: string | null;
  status: SittingStatus;
  studentName: string;
  studentEmail: string | null;
}

export interface TestDayScreenProps {
  classDocumentId: string;
}
