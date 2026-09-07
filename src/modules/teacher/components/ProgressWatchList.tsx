'use client';

import { useTranslations } from 'next-intl';

import { ProgressMoverRow } from '@/modules/teacher/components/ProgressMoverRow';
import type { ProgressWatchListProps } from '@/modules/teacher/types/class-analytics.types';

// One ranked list of the Progress tab (task 34, dashboard §3): `gains` is the
// top reliable gains, `support` the needs-support ranking (a reliable decline
// outranks low-but-steady). Both orders come from the pure layer; this list
// re-sorts nothing and names students from the roster wrapper.
//
// An empty array is stated in words — "no reliable movers yet" is a measured
// fact about the class, never a swallowed error and never a gap filled to make
// the list look inhabited.
function ProgressWatchList({ variant, rows }: ProgressWatchListProps) {
  const t = useTranslations('Teacher.results.progress');
  const headingId = `progress-watch-${variant}`;

  return (
    <div
      data-slot="progress-watch-list"
      data-variant={variant}
      aria-labelledby={headingId}
      role="group"
      className="flex flex-col gap-2 rounded-panel border border-border bg-card px-5 py-5"
    >
      <h3 id={headingId} className="text-base font-semibold text-foreground">
        {t(variant === 'gains' ? 'topGainsTitle' : 'needsSupportTitle')}
      </h3>

      {rows.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <ProgressMoverRow key={row.student.document_id} row={row} />
          ))}
        </ul>
      ) : (
        <p className="text-meta text-balance text-muted-foreground">
          {t(variant === 'gains' ? 'topGainsEmpty' : 'needsSupportEmpty')}
        </p>
      )}

      {variant === 'support' && rows.length > 0 ? (
        <p className="text-meta text-balance text-muted-foreground">{t('needsAttentionNote')}</p>
      ) : null}
    </div>
  );
}

export { ProgressWatchList };
