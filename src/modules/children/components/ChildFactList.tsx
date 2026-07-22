import type { ChildProfileFact } from '@/modules/children/types/children.types';

// Canonical record-panel fact list: label left in 12.5px muted, value right in
// 13.5px/600 navy, one hairline per row that the last row drops. Only facts the
// API actually returned reach this list — the caller filters the nulls out, so a
// row can never render as an em dash.
export function ChildFactList({ facts }: { facts: ChildProfileFact[] }) {
  return (
    <dl className="flex flex-col">
      {facts.map((fact) => (
        <div
          key={fact.label}
          className="flex items-baseline justify-between gap-4 border-b border-divider py-2.5 first:pt-0 last:border-b-0 last:pb-0"
        >
          <dt className="shrink-0 text-meta text-muted-foreground">{fact.label}</dt>
          <dd className="min-w-0 truncate text-body-sm font-semibold text-foreground">
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
