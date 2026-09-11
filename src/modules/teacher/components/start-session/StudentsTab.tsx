'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { ChoiceCard } from '@/modules/teacher/components/start-session/ChoiceCard';
import { RosterPicker } from '@/modules/teacher/components/start-session/RosterPicker';
import {
  FIELD_LABEL_CLASS,
  NO_FREE_NOTE_CLASS,
} from '@/modules/teacher/constants/start-session-styles.constants';
import type { RosterEntry, StudentScope } from '@/modules/teacher/types/start-session-modal.types';
import type { StartSessionMode } from '@/modules/teacher/types/start-session.types';

/** "Who sits it": whole class (or everyone free) vs selected students, with the roster (`:1449–1481`). */
function StudentsTab({
  mode,
  className,
  scope,
  onScope,
  entries,
  freeCount,
  pickedCount,
  onToggle,
  isLoading,
  hasError,
  onRetry,
}: {
  mode: StartSessionMode;
  className: string;
  scope: StudentScope;
  onScope: (scope: StudentScope) => void;
  entries: readonly RosterEntry[];
  freeCount: number;
  pickedCount: number;
  onToggle: (id: string) => void;
  isLoading: boolean;
  hasError: boolean;
  onRetry: () => void;
}) {
  const t = useTranslations('TeacherPortal.startSession.students');
  const id = useId();
  const total = entries.length;
  const later = mode === 'later';
  const wholeLabel = isLoading || freeCount === total ? 'whole' : later ? 'everyoneLater' : 'everyoneNow';

  return (
    <div data-slot="start-session-students" className="mt-5">
      <span id={`${id}-who`} className={FIELD_LABEL_CLASS}>
        {t('whoSitsIt')}
      </span>
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
      <div role="radiogroup" aria-labelledby={`${id}-who`} className="flex flex-col gap-2.5">
        <ChoiceCard
          name="start-session-scope"
          value="whole"
          size="scope"
          checked={scope === 'whole'}
          onSelect={() => onScope('whole')}
          label={t(wholeLabel)}
          description={
            isLoading ? undefined : t(later ? 'wholeDescLater' : 'wholeDescNow', { free: freeCount, total, className })
          }
        />
        <ChoiceCard
          name="start-session-scope"
          value="some"
          size="scope"
          checked={scope === 'some'}
          onSelect={() => onScope('some')}
          label={t('selected')}
          description={t('selectedDesc')}
        />
      </div>
      {scope === 'some' ? (
        <RosterPicker entries={entries} pickedCount={pickedCount} onToggle={onToggle} className={className} />
      ) : null}
    </div>
  );
}

export { StudentsTab };
