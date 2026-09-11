'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';

import { TIME_INPUT_BOUNDS } from '@/modules/teacher/constants/start-session.constants';
import {
  SCHEDULE_ERROR_BOX_CLASS,
  SCHEDULE_INPUT_CLASS,
  SCHEDULE_LABEL_CLASS,
} from '@/modules/teacher/constants/start-session-styles.constants';
import { minutesOf } from '@/modules/teacher/lib/start-session-schedule';
import type { ScheduleError } from '@/modules/teacher/types/start-session-modal.types';

/** "Schedule a window": date, opens, closes, the window note and the design's errors (`:1370–1400`). */
function SchedulePanel({
  date,
  opens,
  closes,
  timeLimit,
  errors,
  serverMessages,
  onDate,
  onOpens,
  onCloses,
}: {
  date: string;
  opens: string;
  closes: string;
  timeLimit: number;
  errors: readonly ScheduleError[];
  serverMessages: readonly string[];
  onDate: (value: string) => void;
  onOpens: (value: string) => void;
  onCloses: (value: string) => void;
}) {
  const t = useTranslations('TeacherPortal.startSession.schedule');
  const id = useId();
  const messages = [
    ...errors.map((error) => t(`errors.${error.key}`, error.values ?? {})),
    ...serverMessages,
  ].filter((message, index, all) => all.indexOf(message) === index);
  const fields = [
    { key: 'date', type: 'date', value: date, onChange: onDate, width: 'min-w-[150px] flex-[1_1_170px]' },
    { key: 'opens', type: 'time', value: opens, onChange: onOpens, width: 'min-w-[100px] flex-[1_1_110px]' },
    { key: 'closes', type: 'time', value: closes, onChange: onCloses, width: 'min-w-[100px] flex-[1_1_110px]' },
  ] as const;

  return (
    <div data-slot="start-session-schedule" className="mt-3.5 rounded-[12px] border border-[#ECEEF2] bg-[#FAFBFC] px-5 py-[18px]">
      <div className="flex flex-wrap gap-3">
        {fields.map((field) => (
          <div key={field.key} className={field.width}>
            <label htmlFor={`${id}-${field.key}`} className={SCHEDULE_LABEL_CLASS}>
              {t(field.key)}
            </label>
            <input
              id={`${id}-${field.key}`}
              data-field={field.key}
              type={field.type}
              value={field.value}
              onChange={(event) => field.onChange(event.target.value)}
              {...(field.type === 'time' ? TIME_INPUT_BOUNDS : {})}
              className={SCHEDULE_INPUT_CLASS}
            />
          </div>
        ))}
      </div>
      <p className="mt-2.5 text-[12.5px] leading-[1.55] text-[#6B7280]">
        {errors.length > 0
          ? t('noteError')
          : t('note', { window: minutesOf(closes) - minutesOf(opens), limit: timeLimit, closes })}
      </p>
      {messages.length > 0 ? (
        <div role="alert" data-slot="start-session-schedule-errors" className={SCHEDULE_ERROR_BOX_CLASS}>
          <ul className="flex flex-col gap-1.5">
            {messages.map((message) => (
              <li key={message} className="text-[13px] leading-[1.5] text-[#8B2B22]">
                {message}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

export { SchedulePanel };
