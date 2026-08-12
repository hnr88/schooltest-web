'use client';

import { useTranslations } from 'next-intl';

import { ProgressBar } from '@/modules/design-system';
import { masteryBarView } from '@/modules/teacher/lib/teaching-insights';
import type { SubskillMasteryRowProps } from '@/modules/teacher/types/teaching-insights.types';

// One bar of .qa/DESIGN.md §Teaching insights: the subskill's NAME (C-TR-3
// `name`, from the active crosswalk descriptors — never a client codebook), the
// bar, and the `11 / 14` count.
//
// The bar shows MASTERY, so a short bar is the red flag — the endpoint already
// counts it that way and this row does not re-invert it. Bar LENGTH is never the
// only signal: `mastered_count / assessed_count` is printed as text on every row
// (WCAG 2.2 AA 1.4.1), and the bar carries no band colour at all, because a
// class-level ratio has no server `status` and the portal may not threshold one
// itself.
function SubskillMasteryRow({ entry }: SubskillMasteryRowProps) {
  const t = useTranslations('Teacher.results.insights');
  const bar = masteryBarView(entry);

  return (
    <li
      data-slot="subskill-mastery-row"
      data-attribute={entry.attribute}
      className="flex flex-col gap-1.5"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 text-sm font-medium text-foreground">{entry.name}</span>
        <span className="shrink-0 text-meta font-semibold text-muted-foreground tabular-nums">
          {bar.assessed
            ? t('masteredCount', {
                mastered: entry.mastered_count,
                assessed: entry.assessed_count,
              })
            : t('notAssessed')}
        </span>
      </div>

      {bar.assessed ? (
        <ProgressBar value={bar.percent} ariaLabel={t('barLabel', { name: entry.name })} />
      ) : (
        // An EMPTY track, never a zero-length bar: "0 % mastered" and "never
        // administered" are different facts, and only the second one is true here.
        <span aria-hidden="true" className="block h-1.5 w-full rounded-full bg-divider" />
      )}
    </li>
  );
}

export { SubskillMasteryRow };
