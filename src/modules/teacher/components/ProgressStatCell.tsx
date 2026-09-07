'use client';

import { ProgressDeltaPill } from '@/modules/teacher/components/ProgressDeltaPill';
import type { ProgressStatItem } from '@/modules/teacher/types/student-drill-down.types';

// One cell of a stat row, on the same label / value / pill anatomy the
// class-detail header already uses. The value string is composed by the caller's
// hook (the drill-down's useDrillDownComparison); this cell adds nothing to it.
// The props type moved inline from the retired v1 progress-tab types (task 34).
interface ProgressStatCellProps {
  item: ProgressStatItem;
}

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
