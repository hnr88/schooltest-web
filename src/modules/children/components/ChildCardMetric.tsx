import { cn } from '@/lib/utils';
import type { ChildCardMetric as ChildCardMetricModel } from '@/modules/children/types/children.types';

interface ChildCardMetricProps {
  metric: ChildCardMetricModel;
  divided: boolean;
}

// One MetricStrip cell (§A.5 row 2): a 20/700 value over a 12.5px label, with the
// 1px hairline the design draws BETWEEN cells as a left border rather than a
// sibling div — a sibling divider cannot wrap with its cell at 375px.
export function ChildCardMetric({ metric, divided }: ChildCardMetricProps) {
  return (
    <div
      className={cn(
        'flex min-w-0 flex-1 flex-col gap-0.5',
        divided && 'border-l border-divider pl-3 sm:pl-4.5',
      )}
    >
      {/* No `truncate` on the value: a target entry or an added date is longer than
          the design's "68%" and an ellipsis would hide the fact. It wraps instead,
          one step down at 375 so two lines is the worst case. */}
      <dd
        className={cn(
          'text-h4 leading-tight font-bold text-balance sm:text-portal-stat',
          metric.value ? 'text-foreground' : 'text-muted-foreground',
        )}
      >
        {metric.value ?? '—'}
      </dd>
      <dt className="truncate text-meta text-muted-foreground">{metric.label}</dt>
    </div>
  );
}
