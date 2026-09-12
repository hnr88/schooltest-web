'use client';

import { ChevronDown } from 'lucide-react';
import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { ToggleRow } from '@/modules/design-system';
import { TIME_LIMIT_OPTIONS } from '@/modules/teacher/constants/start-session.constants';
import {
  FOCUS_RING_CLASS,
  TIME_LIMIT_SELECT_CLASS,
  TOGGLE_ROW_CLASS,
} from '@/modules/teacher/constants/start-session-styles.constants';
import { sectionSummary } from '@/modules/teacher/lib/start-session-view';
import type { SittingSettings } from '@/modules/teacher/schemas/teacher-session.schema';
import type { SettingToggleKey, SettingsSectionId } from '@/modules/teacher/types/start-session-modal.types';

/** "Time limit" (`:1560`): 30/40/50/60 min; a saved limit outside that list is still offered. */
function TimeLimitRow({ value, onChange }: { value: number; onChange: (minutes: number) => void }) {
  const t = useTranslations('TeacherPortal.startSession.settings');
  const id = useId();
  const options = [...new Set([...TIME_LIMIT_OPTIONS, value])].sort((a, b) => a - b);
  return (
    <div className="flex items-center gap-4 border-t border-[#F5F6F8] py-[15px]">
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="block text-[14px] font-semibold text-navy-900">
          {t('timeLimit')}
        </label>
        <p className="mt-[3px] text-[12.5px] leading-[1.5] text-[#6B7280]">{t('timeLimitDesc')}</p>
      </div>
      <select
        id={id}
        data-slot="start-session-time-limit"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={TIME_LIMIT_SELECT_CLASS}
      >
        {options.map((minutes) => (
          <option key={minutes} value={minutes}>
            {t('minutes', { count: minutes })}
          </option>
        ))}
      </select>
    </div>
  );
}

/** One accordion (`mSecX`, `:1485–1580`): header with its live summary, body of switches. */
function SettingsSection({
  id,
  keys,
  settings,
  isOpen,
  onToggle,
  onToggleSetting,
  onTimeLimit,
}: {
  id: SettingsSectionId;
  keys: readonly SettingToggleKey[];
  settings: SittingSettings;
  isOpen: boolean;
  onToggle: () => void;
  onToggleSetting: (key: SettingToggleKey) => void;
  onTimeLimit: (minutes: number) => void;
}) {
  const t = useTranslations('TeacherPortal.startSession.settings');
  const bodyId = useId();
  const summary = sectionSummary(id, settings);

  return (
    <section data-slot="start-session-section" data-section={id} className="overflow-hidden rounded-[12px] border border-[#ECEEF2]">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={bodyId}
        onClick={onToggle}
        className={cn('flex w-full cursor-pointer items-center gap-3 bg-[#FAFBFC] px-[18px] py-3.5 text-left', FOCUS_RING_CLASS)}
      >
        <span className="flex-1 text-[14px] font-semibold text-navy-900">{t(`sections.${id}`)}</span>
        <span className="text-[12.5px] text-[#6B7280]">{t(`summary.${summary.key}`, summary.values)}</span>
        <ChevronDown
          aria-hidden="true"
          strokeWidth={2}
          className={cn(
            'size-4 shrink-0 text-[#6B7280] transition-transform duration-150 motion-reduce:transition-none',
            isOpen && 'rotate-180',
          )}
        />
      </button>
      <div id={bodyId} hidden={!isOpen} className="px-[18px] pb-3">
        {id === 'timing' ? <TimeLimitRow value={settings.timeLimit} onChange={onTimeLimit} /> : null}
        {keys.map((key) => (
          <ToggleRow
            key={key}
            label={t(`toggles.${key}.label`)}
            description={t(`toggles.${key}.desc`)}
            checked={settings[key]}
            onCheckedChange={() => onToggleSetting(key)}
            className={TOGGLE_ROW_CLASS}
          />
        ))}
      </div>
    </section>
  );
}

export { SettingsSection };
