'use client';

import { useTranslations } from 'next-intl';

import { SubskillPill } from '@/modules/teacher/components/SubskillPill';
import type { SubskillPillListProps } from '@/modules/teacher/types/student-drill-down.types';

// The pill row of the collapsed older test, in C-TR-2's OWN attribute order —
// nothing is re-sorted, dropped, or added.
//
// A real `<ul>` so the row is announced as a list of peers, named by its own
// `aria-label` (the collapsed card has one heading and this list sits under it, so
// no extra h3 is invented and the heading order stays h1 → h2 → h2).
function SubskillPillList({ variant, subskills }: SubskillPillListProps) {
  const t = useTranslations('Teacher.results.drillDown');

  return (
    <ul
      data-slot="subskill-pill-list"
      data-variant={variant}
      data-pill-count={subskills.length}
      aria-label={t('pillsLabel', { variant })}
      className="flex flex-wrap items-center gap-2"
    >
      {subskills.map((subskill) => (
        <SubskillPill key={subskill.attribute} subskill={subskill} />
      ))}
    </ul>
  );
}

export { SubskillPillList };
