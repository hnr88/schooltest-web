'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  MONITOR_STATE_LABEL_KEY,
  MONITOR_STATE_THEME,
} from '@/modules/teacher/constants/live-monitor.constants';
import { monitorTileDetail } from '@/modules/teacher/lib/live-monitor';
import type { LiveMonitorTileProps } from '@/modules/teacher/types/live-monitor.types';

// One student tile (.qa/DESIGN.md §Live monitoring, wireframe 09 view 2).
//
// The tone is looked up from C-TS-3's `state` and is NEVER recomputed here — no
// clock, no threshold, no inference from `stage`. Colour is also never the only
// signal: each state has its own icon SHAPE, its own line of visible text, and an
// sr-only sentence that names the state outright (WCAG 2.2 AA 1.4.1).
function LiveMonitorTile({ student }: LiveMonitorTileProps) {
  const t = useTranslations('Teacher.testSessions.live');
  const theme = MONITOR_STATE_THEME[student.state];
  const Icon = theme.icon;
  const stateWord = t(MONITOR_STATE_LABEL_KEY[student.state]);
  const detail = monitorTileDetail(student);
  const detailText = detail === null ? stateWord : t(detail.key, detail.values);

  return (
    <li
      data-slot="live-monitor-tile"
      data-state={student.state}
      data-student-id={student.student_document_id}
      className={cn(
        'flex min-h-11 items-center gap-2 rounded-tile border px-3 py-2.5',
        theme.tile,
      )}
    >
      <span className="sr-only">
        {detail === null
          ? t('tileAria', { name: student.display_name, state: stateWord })
          : t('tileAriaDetail', {
              name: student.display_name,
              state: stateWord,
              detail: detailText,
            })}
      </span>

      <span aria-hidden="true" className="flex min-w-0 items-center gap-2">
        <Icon className={cn('size-4 shrink-0', theme.iconClass)} />
        <span className="flex min-w-0 flex-col">
          <span className={cn('truncate text-body-sm font-semibold', theme.name)}>
            {student.display_name}
          </span>
          <span className={cn('truncate text-meta', theme.detail)}>{detailText}</span>
        </span>
      </span>
    </li>
  );
}

export { LiveMonitorTile };
