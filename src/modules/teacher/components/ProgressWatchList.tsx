'use client';

import { useTranslations } from 'next-intl';

import {
  PROGRESS_WATCH_EMPTY_KEY,
  PROGRESS_WATCH_LABEL_KEY,
} from '@/modules/teacher/constants/class-progress.constants';
import { ProgressMoverRow } from '@/modules/teacher/components/ProgressMoverRow';
import type { ProgressWatchListProps } from '@/modules/teacher/types/class-progress.types';

// One "Students to watch" column. `needs_attention` carries the wireframe's
// follow-up note; `most_improved` needs none.
//
// An empty array is stated in words, because C-TR-4 sending zero movers is a
// measured fact about the comparable cohort — never a swallowed error, and never
// filled with the "next best" student to make the column look inhabited.
function ProgressWatchList({ variant, movers }: ProgressWatchListProps) {
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
        {t(PROGRESS_WATCH_LABEL_KEY[variant])}
      </h3>

      {movers.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {movers.map((mover) => (
            <ProgressMoverRow key={mover.student_document_id} mover={mover} />
          ))}
        </ul>
      ) : (
        <p className="text-meta text-balance text-muted-foreground">
          {t(PROGRESS_WATCH_EMPTY_KEY[variant])}
        </p>
      )}

      {variant === 'needs_attention' && movers.length > 0 ? (
        <p className="text-meta text-balance text-muted-foreground">{t('needsAttentionNote')}</p>
      ) : null}
    </div>
  );
}

export { ProgressWatchList };
