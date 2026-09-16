import type { SchoolStudentsQuery } from '@/modules/school-students/types/school-students.types';

export const ENTITLEMENT_QUERY_KEY = ['school-admin', 'entitlement'] as const;

export const SCHOOL_CHILDREN_QUERY_KEY = ['school-students'] as const;

// Nested under SCHOOL_CHILDREN_QUERY_KEY so the create/update/archive
// mutations' prefix invalidation refreshes an open detail view too.
export const SCHOOL_CHILD_DETAIL_QUERY_KEY = [...SCHOOL_CHILDREN_QUERY_KEY, 'detail'] as const;

export const SCHOOL_CHILDREN_PAGE_SIZE = 25;

// Spec §4 subtitle "X students across Y classes": a school total, not a result
// count, so it is read with none of the roster's filters applied and with
// status 'active' — an archived student has given their seat back and is no
// longer one of the school's students. Only meta.pagination.total is used, so
// the smallest legal page is requested.
export const ROSTER_COUNT_QUERY: SchoolStudentsQuery = {
  status: 'active',
  classId: 'all',
  q: '',
  page: 1,
  pageSize: 1,
};
