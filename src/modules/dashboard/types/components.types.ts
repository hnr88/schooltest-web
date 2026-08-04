import type { Student, StudentListRow } from '@/modules/dashboard/types/student.types';

export interface DashboardChildRowProps {
  student: StudentListRow;
  last: boolean;
}

export interface DashboardSearchResultsProps {
  isLoading: boolean;
  isError: boolean;
  results: Student[];
  activeIndex: number;
  onSelect: (documentId: string) => void;
}
