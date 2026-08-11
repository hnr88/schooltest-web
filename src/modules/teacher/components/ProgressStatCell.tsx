'use client';

import { ProgressDeltaPill } from '@/modules/teacher/components/ProgressDeltaPill';
import type { ProgressStatCellProps } from '@/modules/teacher/types/class-progress.types';

// One cell of the Progress stat row (.qa/DESIGN.md §Progress tab), on the same
// label / value / pill anatomy the class-detail header already uses.
//
// The value string is composed in `hooks/useProgressStats.ts` from C-TR-4's own
// numbers; this cell adds nothing to it.
function ProgressStatCell({ item }: ProgressStatCellProps) {
  return (
    <div
      data-slot="progress-stat"
      data-stat={item.key}
      className="flex min-w-0 flex-col gap-1 rounded-tile bg-surface-inset px-3.5 py-3"
    >
      <dt className="text-meta font-semibold tracking-wide text-body uppercase">{item.label}</dt>
      <dd className="flex min-w-0 flex-col items-start gap-1.5">
        <span className="text-stat-sm font-bold break-words text-foreground tabular-nums">
          {item.value}
        </span>
        {item.direction && item.change ? (
          <ProgressDeltaPill direction={item.direction} change={item.change} />
        ) : null}
        {item.note ? (
          <span data-slot="progress-stat-note" className="text-meta text-balance text-body">
            {item.note}
          </span>
        ) : null}
      </dd>
    </div>
  );
}

export { ProgressStatCell };
