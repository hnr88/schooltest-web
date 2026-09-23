'use client';

import { useTranslations } from 'next-intl';

import { RosterPicker } from '@/modules/teacher/components/start-session/RosterPicker';
import {
  FIELD_LABEL_CLASS,
  NO_FREE_NOTE_CLASS,
} from '@/modules/teacher/constants/start-session-styles.constants';
import type { RosterEntry } from '@/modules/teacher/types/start-session-modal.types';
import type { StartSessionMode } from '@/modules/teacher/types/start-session.types';

/** "Who sits it": the roster, where the teacher ticks each student who sits it (`:1449–1481`). */
function StudentsTab({
  mode,
  className,
  entries,
  freeCount,
  pickedCount,
  onToggle,
  onSelectAll,
  isLoading,
  hasError,
  onRetry,
}: {
  mode: StartSessionMode;
  className: string;
  entries: readonly RosterEntry[];
  freeCount: number;
  pickedCount: number;
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations('TeacherPortal.startSession.students');
  const total = entries.length;
  const later = mode === 'later';

  return (
    <div data-slot="start-session-students" className="mt-5">
      <span className={FIELD_LABEL_CLASS}>{t('whoSitsIt')}</span>
      {hasError ? (
        <p role="alert" className="mb-2.5 text-[13px] leading-[1.55] text-[#B42318]">
          {t('loadError')}{' '}
          <button type="button" onClick={onRetry} className="cursor-pointer font-semibold underline">
            {t('retry')}
          </button>
        </p>
      ) : null}
      {!isLoading && total > 0 && freeCount === 0 ? (
        <p data-slot="start-session-no-free" className={NO_FREE_NOTE_CLASS}>
          {t(later ? 'noFreeLater' : 'noFreeNow', { className })}
        </p>
      ) : null}
      {!isLoading && !hasError && total === 0 ? (
        <p className={NO_FREE_NOTE_CLASS}>{t('noStudents')}</p>
      ) : null}
      <p className="text-[12.5px] leading-[1.55] text-[#6B7280]">{t('selectedDesc')}</p>
      <RosterPicker
        entries={entries}
        freeCount={freeCount}
        pickedCount={pickedCount}
        onToggle={onToggle}
        onSelectAll={onSelectAll}
        className={className}
      />
    </div>
  );
}

export { StudentsTab };
