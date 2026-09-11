'use client';

import { useCallback, useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { DIRECTORY_ALL, applyClientDirectoryMode, useDirectoryState } from '@/modules/directory';
import {
  CLASSES_FILTER_KEYS,
  CLASSES_LAYOUTS,
  CLASSES_SORTS,
  CLASSES_STATUS_FILTER,
} from '@/modules/teacher/constants/classes-screen.constants';
import { CLASS_STATUS_KEY } from '@/modules/teacher/constants/teacher-kit.constants';
import { CLASSES_CLIENT_CONFIG, classYearOptions } from '@/modules/teacher/lib/classes-directory';
import type { ClassYear, ClassesDirectory } from '@/modules/teacher/types/classes-screen.types';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

/** The year label a class carries ("Year 8", "Years 7–9", or the served text). */
export function useYearLabel(): (year: ClassYear | null) => string | null {
  const t = useTranslations('TeacherPortal.classes');
  return useCallback(
    (year: ClassYear | null) => {
      if (year === null) return null;
      if (year.kind === 'level') return t('yearLevel', { level: year.level });
      if (year.kind === 'band') return t('yearBand', { from: year.from, to: year.to });
      return year.text;
    },
    [t],
  );
}

/**
 * The Classes toolbar's state on the shared directory kit (client mode): the
 * URL is the store for search, the year and status filters, the sort and the
 * layout; `applyClientDirectoryMode` reduces the loaded C-TD-1 array. Year
 * options come from the teacher's own classes. Filter/sort arrays are memoised
 * because the kit keys its URL parse on their identity.
 */
export function useClassesDirectory(classes: readonly DashboardClass[]): ClassesDirectory {
  const t = useTranslations('TeacherPortal.classes');
  const tStatus = useTranslations('TeacherPortal.kit.status');
  const yearLabel = useYearLabel();
  const years = useMemo(() => classYearOptions(classes), [classes]);

  const filters = useMemo(
    () => [
      {
        key: CLASSES_FILTER_KEYS.year,
        label: t('yearLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('yearAll') },
          ...years.map(({ key, year }) => ({ value: key, label: yearLabel(year) ?? key })),
        ],
      },
      {
        key: CLASSES_FILTER_KEYS.status,
        label: t('statusLabel'),
        options: [
          { value: DIRECTORY_ALL, label: t('statusAll') },
          ...CLASSES_STATUS_FILTER.map((value) => ({ value, label: tStatus(CLASS_STATUS_KEY[value]) })),
        ],
      },
    ],
    [t, tStatus, years, yearLabel],
  );
  const sorts = useMemo(
    () => CLASSES_SORTS.map((value) => ({ value, label: t(`sort.${value}`) })),
    [t],
  );

  const state = useDirectoryState({
    filters,
    sorts,
    defaultSort: 'name',
    mode: 'client',
    layouts: CLASSES_LAYOUTS,
    defaultLayout: 'table',
    pagination: { variant: 'none' },
  });
  const view = useMemo(
    () => applyClientDirectoryMode(classes, state.params, CLASSES_CLIENT_CONFIG),
    [classes, state.params],
  );

  return { state, view, filters, sorts };
}
