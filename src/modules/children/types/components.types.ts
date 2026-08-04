import type { ChildCardMetric as ChildCardMetricModel, ChildJourneyRung, ChildProgressResult, ChildProgressStudent, RosterPagination, StudentDetail } from '@/modules/children/types/children.types';
import type { StudentListRow } from '@/modules/dashboard';

export interface ArchiveConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  pending: boolean;
  onConfirm: () => void;
}

export interface ChildCardMetricProps {
  metric: ChildCardMetricModel;
  divided: boolean;
}

export interface ChildCardProps {
  student: StudentListRow;
}

export interface ChildJourneyRailProps {
  label: string;
  verdict: string;
  rungs: ChildJourneyRung[];
  railLabel: string;
}

export interface ChildLevelJourneyProps {
  results: ChildProgressResult[];
  officialResultCount: number;
}

export interface ChildProfileHeaderProps {
  student: ChildProgressStudent;
  detail?: StudentDetail;
}

export interface ChildProfileScreenProps {
  documentId: string;
}

export interface ChildrenRosterPagerProps {
  pagination: RosterPagination<unknown>;
}

export interface ChildrenRosterProps {
  pagination: RosterPagination<StudentListRow>;
}

export interface ChildrenRowActionsProps {
  student: StudentListRow;
}

export interface ChildrenToolbarProps {
  from: number;
  to: number;
  totalCount: number;
  includeArchived: boolean;
  onIncludeArchivedChange: (value: boolean) => void;
}

export interface ChildResultsProps {
  results: ChildProgressResult[];
}

export interface ChildSkillBreakdownProps {
  results: ChildProgressResult[];
  officialResultCount: number;
}

export interface EditStudentScreenProps {
  documentId: string;
}
