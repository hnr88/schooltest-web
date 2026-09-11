'use client';

import { useTranslations } from 'next-intl';

import { ChoiceCard } from '@/modules/teacher/components/start-session/ChoiceCard';
import { START_SESSION_MODES } from '@/modules/teacher/constants/start-session.constants';
import type { StartSessionMode } from '@/modules/teacher/types/start-session.types';

/** "Start now" | "Schedule a window" | "Teacher demo" (`mWhenOptions`). An edit stays a window. */
function WhenOptions({
  value,
  onValueChange,
  isEdit,
}: {
  value: StartSessionMode;
  onValueChange: (mode: StartSessionMode) => void;
  isEdit: boolean;
}) {
  const t = useTranslations('TeacherPortal.startSession.when');
  return (
    <div role="radiogroup" aria-label={t('label')} data-slot="start-session-when" className="mt-[18px] flex flex-nowrap gap-2">
      {START_SESSION_MODES.map((mode) => (
        <ChoiceCard
          key={mode}
          name="start-session-when"
          value={mode}
          size="when"
          checked={value === mode}
          disabled={isEdit && mode !== 'later'}
          onSelect={() => onValueChange(mode)}
          label={t(`${mode}.label`)}
          description={t(`${mode}.desc`)}
        />
      ))}
    </div>
  );
}

export { WhenOptions };
