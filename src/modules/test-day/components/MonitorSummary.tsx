import { useTranslations } from 'next-intl';

import type { MonitorRowState } from '@/modules/test-day/types/test-day.types';

import type { MonitorSummaryProps } from '@/modules/test-day/types/components.types';
import { STATE_ORDER } from '@/modules/test-day/constants/components.constants';

// Live-board summary (task 90): one count per row state including code_shown,
// so the buckets visibly sum to the roster during a staggered sitting
// (teacher/12 completes the vocabulary at eight states + the reveal).
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
