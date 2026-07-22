'use client';

import { useFormatter, useTranslations } from 'next-intl';

import { CompletionCell } from '@/modules/design-system';
import { getCompletionPercent } from '@/modules/children/lib/child-learning-progress';
import type { ChildProgressMetrics } from '@/modules/children/types/children.types';

// The session ratio the deleted gauge panel used to carry, rendered as the
// canonical §02.6 CompletionCell — a table-scale track + "2/2", not a 270px white
// panel around a ring that printed "—" over "0/0" whenever the API reported no
// sessions.
// `getCompletionPercent` returns null at zero sessions and the line is then dropped
// entirely: an empty track over "0/0" reads as "started and got nowhere", which is
// a different fact from "never started".
export function ChildHeroCompletion({ metrics }: { metrics: ChildProgressMetrics }) {
  const format = useFormatter();
  const t = useTranslations('Children');
  const completion = getCompletionPercent(metrics);

  if (completion === null) {
    return null;
  }

  return (
    <div
      data-slot="child-learning-summary"
      className="flex max-w-80 flex-col gap-1.5 border-t border-divider pt-4"
    >
      <span className="text-meta text-muted-foreground">{t('sessionsCompleted')}</span>
      <CompletionCell
        value={completion}
        display={t('recordFraction', {
          recorded: format.number(metrics.completedSessions),
          total: format.number(metrics.totalSessions),
        })}
        ariaLabel={t('completionLabel')}
      />
    </div>
  );
}
