import type { DiagnosticGroup, DiagnosticHeatmapRow, DiagnosticMasteryRow } from '@/modules/teach/types/diagnostic.types';
import type { ProgressTransition } from '@/modules/teach/types/progress.types';
import type { RosterChild } from '@/modules/teach/types/roster.types';
import type { TeachHomeClass, TeachHomeDiagnosticSummary, TeachHomeMonitorSummary } from '@/modules/teach/types/teach-home.types';
import type { ReactNode } from 'react';

export interface CycleBannerProps {
  documentId: string;
}

export interface DiagnosticDashboardProps {
  classId: string;
  actions?: ReactNode;
  // Task 78: the school-admin analytics reuses this dashboard verbatim at
  // school scope; the back link defaults to the teacher home it always had.
  backHref?: string;
}

export interface DiagnosticPrintHeaderProps {
  classLabel: string;
  formCode: string | null;
}

export interface DiagnosticSummaryPanelProps {
  diagnostic: TeachHomeDiagnosticSummary | null;
}

export interface ExportMarkdownButtonProps {
  classId: string;
}

export interface GroupPanelProps {
  groups: DiagnosticGroup[];
  // Task 96: each student ref is a click target into the same drilldown the
  // mastery table opens - the parent dashboard owns the one selection state.
  onSelectStudent: (studentRef: string) => void;
}

export interface HeatmapCellProps {
  row: DiagnosticHeatmapRow;
}

export interface ItemTypeHeatmapProps {
  rows: DiagnosticHeatmapRow[];
}

export interface MasteryTableProps {
  rows: DiagnosticMasteryRow[];
  selectedRef: string | null;
  onSelect: (studentRef: string) => void;
}

export interface MonitorSummaryPanelProps {
  monitor: TeachHomeMonitorSummary | null;
}

export type MonitorStateKey = keyof TeachHomeMonitorSummary;

export interface ProgressPanelProps {
  classId: string;
}

export interface ProgressTransitionRowProps {
  transition: ProgressTransition;
}

export interface RosterScreenProps {
  documentId: string;
}

export interface RosterTableProps {
  rows: RosterChild[];
}

export interface StudentMasteryDrilldownProps {
  row: DiagnosticMasteryRow;
  onClose: () => void;
}

export interface TeachHomeClassCardProps {
  classSummary: TeachHomeClass;
}
