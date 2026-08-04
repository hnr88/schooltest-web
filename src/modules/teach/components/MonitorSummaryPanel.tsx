'use client';

import { useTranslations } from 'next-intl';

import { StatusPill, type StatusPillTone } from '@/modules/design-system';
import type { TeachHomeMonitorSummary } from '@/modules/teach/types/teach-home.types';

import type { MonitorStateKey, MonitorSummaryPanelProps } from '@/modules/teach/types/components.types';
import { MONITOR_STATE_ORDER, MONITOR_STATE_TONES } from '@/modules/teach/constants/components.constants';

// Teach home monitor summary (task 83, mvp-updates §4.9): the live sitting at
// a glance as five state chips with counts. When monitor is null no sitting
// is running and the unpopulated state renders from the same tree.
export function MonitorSummaryPanel({ monitor }: MonitorSummaryPanelProps) {
  const t = useTranslations('Teach.home.panels');

  return (
    <section
      data-slot="monitor-summary"
      aria-label={t('monitor.title')}
      className="flex flex-col gap-2 rounded-lg border border-border bg-background px-3 py-2"
    >
      <h3 className="text-sm font-semibold text-foreground">{t('monitor.title')}</h3>
      {monitor ? (
        <ul className="flex flex-wrap items-center gap-2">
          {MONITOR_STATE_ORDER.map((state) => (
            <li key={state} className="flex items-center gap-1">
              <StatusPill tone={MONITOR_STATE_TONES[state]}>
                {t(`monitor.states.${state}`)}
              </StatusPill>
              <span className="text-sm font-medium text-foreground">{monitor[state]}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">{t('monitor.empty')}</p>
      )}
    </section>
  );
}
