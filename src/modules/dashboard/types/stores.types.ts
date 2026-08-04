export interface DashboardSearchState {
  query: string;
  selectedStudentId: string | null;
  setQuery: (query: string) => void;
  selectStudent: (documentId: string) => void;
  clear: () => void;
}
