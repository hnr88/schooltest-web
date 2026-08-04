import { useTranslations } from 'next-intl';

import type { MonitorRowState } from '@/modules/test-day/types/test-day.types';

import type { MonitorSummaryProps } from '@/modules/test-day/types/components.types';

const STATE_ORDER: readonly MonitorRowState[] = [
  'not_joined',
  'code_shown',
  'joined',
  'in_progress',
  'submitted',
  'stalled',
];

// Live-board summary (task 90): one count per row state including code_shown,
// so the six buckets visibly sum to the roster during a staggered sitting.
export function MonitorSummary({ counts }: MonitorSummaryProps) {
  const t = useTranslations('TestDay.monitor');

  return (
    <p data-slot="monitor-summary" className="text-sm text-muted-foreground">
      {STATE_ORDER.map((state, index) => (
        <span key={state}>
          {index > 0 ? <span aria-hidden="true">{' · '}</span> : null}
          {state === 'code_shown'
            ? t('codeShownCount', { count: counts.code_shown })
            : `${t(`state.${state}`)} ${counts[state]}`}
        </span>
      ))}
    </p>
  );
}
