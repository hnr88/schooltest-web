'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import {
  MONITOR_STATE_LABEL_KEY,
  MONITOR_STATE_ORDER,
  MONITOR_STATE_THEME,
} from '@/modules/teacher/constants/live-monitor.constants';
import type { LiveMonitorLegendProps } from '@/modules/teacher/types/live-monitor.types';

// The legend of every tile state (.qa/DESIGN.md §Live monitoring — the brief's
// prose names four, the wireframe and C-TS-3's `MonitorState` both have five,
// plus Lane E's `scoring_failed` operator state for a result whose R retries
// were exhausted).
//
// The caption prints `stall_threshold_minutes` STRAIGHT from the C-TS-3 payload,
// which the server sources from `Config.stall_threshold_minutes`. No number is
// spelled here: raise the tunable server-side and this sentence follows.
function LiveMonitorLegend({ stallThresholdMinutes }: LiveMonitorLegendProps) {
  const t = useTranslations('Teacher.testSessions.live');

  return (
    <div data-slot="live-monitor-legend" className="flex flex-col gap-2">
      <ul aria-label={t('legendLabel')} className="flex flex-wrap gap-x-6 gap-y-2">
        {MONITOR_STATE_ORDER.map((state) => (
          <li
            key={state}
            data-legend-state={state}
            className="flex items-center gap-2 text-meta text-body"
          >
            <span
              aria-hidden="true"
              className={cn('size-3 shrink-0 rounded-sm border', MONITOR_STATE_THEME[state].tile)}
            />
            {t(MONITOR_STATE_LABEL_KEY[state])}
          </li>
        ))}
      </ul>

      <p data-slot="live-monitor-stall-caption" className="text-meta text-body">
        {t('stallCaption', { minutes: stallThresholdMinutes })}
      </p>
    </div>
  );
}

export { LiveMonitorLegend };
