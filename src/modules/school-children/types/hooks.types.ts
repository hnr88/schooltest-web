import type { SchoolChild, SchoolChildStatusFilter, SchoolChildrenQuery } from '@/modules/school-children/types/school-children.types';

export type ChildFormTarget = { mode: 'create' } | { mode: 'edit'; child: SchoolChild };

export interface ChildrenFilters {
  query: SchoolChildrenQuery;
  search: string;
  setSearch: (value: string) => void;
  selectStatus: (value: SchoolChildStatusFilter) => void;
  selectClass: (value: string) => void;
  setPage: (page: number) => void;
  filtered: boolean;
}
