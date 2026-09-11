'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';

import { TeacherClassTiles } from '@/modules/teacher/components/TeacherClassTiles';
import { TeacherClassesTable } from '@/modules/teacher/components/TeacherClassesTable';
import { TeacherButton } from '@/modules/teacher/components/v2/TeacherButton';
import { CLASSES_STATE_BOX } from '@/modules/teacher/constants/classes-screen.constants';
import { toClassRowView } from '@/modules/teacher/lib/classes-directory';
import type { ClassesListBodyProps } from '@/modules/teacher/types/classes-screen.types';

/**
 * The Classes body under the toolbar: the list (default) or the tiles, both
 * over the same filtered rows, with the design's "No classes match those
 * filters." arm. The design draws no loading, failure or no-classes frame, so
 * those keep the existing `Teacher.results.list` copy. `data-slot=
 * "teacher-classes-list"` wraps every arm, as the specs expect.
 */
function ClassesListBody({ status, directory, exports, onRetry }: ClassesListBodyProps) {
  const t = useTranslations('Teacher.results.list');
  const tClasses = useTranslations('TeacherPortal.classes');
  const rows = useMemo(() => directory.view.rows.map(toClassRowView), [directory.view.rows]);

  if (status === 'loading') {
    return (
      <div data-slot="teacher-classes-list" role="status" className={CLASSES_STATE_BOX}>
        <p className="text-[13.5px] text-[#6B7280]">{t('loading')}</p>
      </div>
    );
  }
  if (status === 'error' || status === 'empty') {
    const isError = status === 'error';
    return (
      <div data-slot="teacher-classes-list" role={isError ? 'alert' : undefined} className={CLASSES_STATE_BOX}>
        <h2 className="text-[16px] font-semibold text-navy-900">
          {t(isError ? 'errorTitle' : 'emptyTitle')}
        </h2>
        <p className="max-w-[60ch] text-[13.5px] text-[#6B7280]">
          {t(isError ? 'errorDescription' : 'emptyDescription')}
        </p>
        {isError ? (
          <TeacherButton tone="outline" size="sm" className="mt-2" onClick={onRetry}>
            {t('retry')}
          </TeacherButton>
        ) : null}
      </div>
    );
  }

  const empty = (
    <p className="px-2.5 py-14 text-center text-[13.5px] text-[#6B7280]">{tClasses('noMatch')}</p>
  );

  return (
    <div data-slot="teacher-classes-list">
      {directory.state.layout === 'tiles' ? (
        <TeacherClassTiles rows={rows} empty={empty} />
      ) : (
        <TeacherClassesTable rows={rows} exports={exports} empty={empty} />
      )}
    </div>
  );
}

export { ClassesListBody };
