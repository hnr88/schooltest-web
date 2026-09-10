'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import type { SchoolClass } from '@/modules/classes';
import {
  DIRECTORY_ALL,
  useDirectoryState,
  type DirectoryFilterDef,
  type DirectoryQueryParams,
  type DirectoryStateApi,
} from '@/modules/directory';
import { ROSTER_STATUS } from '@/modules/school-students/constants/hooks.constants';
import { SCHOOL_CHILDREN_PAGE_SIZE } from '@/modules/school-students/constants/queries.constants';
import { ACARA_PHASE_OPTIONS } from '@/modules/school-students/constants/student-picklists.constants';
import type {
  SchoolStudentLevelFilter,
  SchoolStudentsQuery,
} from '@/modules/school-students/types/school-students.types';

/** What the roster screen consumes from the filter adapter. */
export interface StudentsFilters {
  state: DirectoryStateApi;
  defs: readonly DirectoryFilterDef[];
}

// Task 31 — the spec §4 roster filters moved INTO the shared directory kit's
// URL-backed state (op-3). The URL param names ARE the C-CHD-01 endpoint's
// names — `q`, `page` and the filter def keys `class`/`level` — so a link or
// bookmark that names a filter uses the same name the server contract uses,
// and `'all'` is the kit's sentinel that omits the param. The kit owns search
// debouncing, the URL write and the page reset on any result-set change; the
// old bespoke useState state is gone.
//
// SERVER mode (D-KIT-MODE): GET /api/schools/me/children genuinely serves
// `status`, `class`, `level`, `q` and `page`, so every control narrows
// server-side and composes with the server pagination instead of thinning the
// page already loaded. `pageSize`/`maxPageSize` restate the wire contract
// (25 default; the endpoint 400s above 100 — school/controllers/students.ts).
//
// No sort control: the endpoint's ordering is a hard-coded `createdAt:desc`
// with no `sort` param, and sorting one loaded page in memory is not sorting
// the set — so `sorts` stays empty and the control does not ship.
export function useStudentsFilters(classes: readonly SchoolClass[]): StudentsFilters {
  const t = useTranslations('SchoolStudents.filters');
  const tf = useTranslations('SchoolStudents.form');

  const defs = useMemo<readonly DirectoryFilterDef[]>(
    () => [
      {
        key: 'class',
        label: t('classLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('classAll') },
          ...classes.map((schoolClass) => ({
            value: schoolClass.documentId,
            label: schoolClass.name,
          })),
        ],
      },
      {
        key: 'level',
        label: t('levelLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('levelAll') },
          ...ACARA_PHASE_OPTIONS.map((phase) => ({
            value: phase,
            label: tf(`acaraPhaseOption.${phase}`),
          })),
        ],
      },
    ],
    [classes, t, tf],
  );

  const state = useDirectoryState({
    filters: defs,
    sorts: [],
    defaultSort: '',
    mode: 'server',
    pageSize: SCHOOL_CHILDREN_PAGE_SIZE,
    // `GET /schools/me/children` rejects pageSize above 100 with a 400 —
    // the surface states its own ceiling rather than the kit's 200 default.
    maxPageSize: 100,
  });

  return { state, defs };
}

function toLevelFilter(raw: string | undefined): SchoolStudentLevelFilter {
  return ACARA_PHASE_OPTIONS.find((phase) => phase === raw) ?? 'all';
}

/**
 * The kit's derived params mapped 1:1 onto the C-CHD-01 query. The status
 * param keeps its spec §4 shape — ROSTER_STATUS stays `all` (omitted on the
 * wire), so archived students remain in the default roster exactly as before.
 */
export function rosterQueryFrom(params: DirectoryQueryParams): SchoolStudentsQuery {
  return {
    status: ROSTER_STATUS,
    classId: params.filters.class ?? DIRECTORY_ALL,
    level: toLevelFilter(params.filters.level),
    q: params.q ?? '',
    page: params.page,
    pageSize: params.pageSize,
  };
}
