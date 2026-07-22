'use client';

import { cn } from '@/lib/utils';
import type { ReviewRowModel } from '@/modules/student-wizard/types/student-wizard.types';

interface ReviewSummaryTableProps {
  rows: readonly ReviewRowModel[];
  emptyLabel: string;
}

// Summary table (spec 03 §2.8): a 16px-radius box hairlined with #EEF1F6, each row
// `15px 20px` with a 13px key on the left and the 13.5/600 composed value pushed
// right. The last row drops its rule. Rows enter one after another so the table
// reads top-down on arrival.
export function ReviewSummaryTable({ rows, emptyLabel }: ReviewSummaryTableProps) {
  return (
    <dl className="overflow-hidden rounded-panel border border-divider">
      {rows.map((row, index) => (
        <div
          key={row.label}
          style={{ animationDelay: `${index * 60}ms` }}
          className={cn(
            'flex items-baseline justify-between gap-4 px-5 py-3.75 duration-300 ease-out animate-in fill-mode-backwards fade-in slide-in-from-bottom-1 motion-reduce:animate-none',
            index < rows.length - 1 && 'border-b border-divider',
          )}
        >
          <dt className="shrink-0 text-body-sm text-muted-foreground">{row.label}</dt>
          <dd
            className={cn(
              'min-w-0 text-right text-body-sm font-semibold',
              row.value ? 'text-foreground' : 'font-normal text-muted-foreground',
            )}
          >
            {row.value ?? emptyLabel}
          </dd>
        </div>
      ))}
    </dl>
  );
}
