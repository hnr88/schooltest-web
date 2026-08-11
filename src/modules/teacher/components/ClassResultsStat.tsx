import { StatusPill } from '@/modules/design-system';
import type { ClassResultsStatProps } from '@/modules/teacher/types/results-shell.types';

// One cell of the class-detail summary header (.qa/DESIGN.md: label / value /
// footnote). The not-yet count rides in a pill whose WORDS carry the meaning —
// the danger tint is decoration on top of text, never the only signal.
function ClassResultsStat({ item }: ClassResultsStatProps) {
  return (
    <div
      data-slot="class-results-stat"
      data-stat={item.key}
      className="flex min-w-0 flex-col gap-1 rounded-tile bg-surface-inset px-3.5 py-3"
    >
      <dt className="text-meta font-semibold tracking-wide text-body uppercase">{item.label}</dt>
      <dd className="flex min-w-0 flex-col gap-1">
        <span className="text-stat-sm font-bold break-words text-foreground">{item.value}</span>
        {item.pill ? <StatusPill tone="danger">{item.pill}</StatusPill> : null}
        {item.note ? <span className="text-meta text-balance text-body">{item.note}</span> : null}
      </dd>
    </div>
  );
}

export { ClassResultsStat };
