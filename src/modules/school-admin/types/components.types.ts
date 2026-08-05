import type { SchoolClass } from '@/modules/classes';
import type { ParticipationClassRow as ParticipationClassRowData } from '@/modules/school-admin/types/participation.types';

export interface ParticipationClassRowProps {
  row: ParticipationClassRowData;
}

export interface SchoolAggregatePanelProps {
  classes: SchoolClass[];
  onSelectClass: (classDocumentId: string) => void;
}

export interface SchoolSectionScreenProps {
  surface: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
}

export interface SchoolDiagnosticsSectionProps {
  studentsTested: number;
  readingTestsCompleted: number;
  readingTestsAllowed: number;
}

export interface SchoolProgressSectionProps {
  readingTestsAllowed: number;
}

export interface SchoolClassesSectionProps {
  classes: SchoolClass[];
}
