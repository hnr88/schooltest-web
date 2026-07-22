'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/lib/utils';
import { ChildSkillPendingTile } from '@/modules/children/components/ChildSkillPendingTile';
import { ChildSkillTile } from '@/modules/children/components/ChildSkillTile';
import { getSkillSummaries, getUnassessedSkills } from '@/modules/children/lib/child-skills';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

interface ChildSkillBreakdownProps {
  results: ChildProgressResult[];
  officialResultCount: number;
}

// The row is sized to the tiles that actually exist, so it never opens columns
// it cannot fill. Canonical §5.3 is `1fr 1fr 1fr` because the canonical child
// HAS three subjects; with one real tile a fixed 3-up leaves two-thirds of the
// row empty, and with two it leaves a third. Four is the ceiling: the contract
// bands four skills, and the pending tile only exists when at least one of them
// is missing, so cards + pending can never exceed four.
const GRID_COLUMNS: Record<number, string> = {
  1: 'sm:max-w-lg',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 xl:grid-cols-3',
  4: 'sm:grid-cols-2 xl:grid-cols-4',
};

// DS §5.3 subject tiles (Child profile): one tile per skill the child has an
// official result for, plus — only when the API's result window was complete
// enough to prove it — one honest "not assessed yet" slot naming the skills that
// have none. Nothing is invented: a skill with no proven state gets no tile, and
// the whole section is omitted when there are no results at all.
export function ChildSkillBreakdown({ results, officialResultCount }: ChildSkillBreakdownProps) {
  const t = useTranslations('Children');
  const summaries = getSkillSummaries(results);

  if (summaries.length === 0) {
    return null;
  }

  const pending = getUnassessedSkills(results, officialResultCount);
  const tileCount = summaries.length + (pending.length > 0 ? 1 : 0);

  return (
    <section
      data-slot="child-skill-breakdown"
      aria-labelledby="child-skill-breakdown-title"
      className="flex flex-col gap-4"
    >
      <h2
        id="child-skill-breakdown-title"
        className="text-panel-title font-semibold text-foreground"
      >
        {t('skillBreakdownHeading')}
      </h2>
      <div className={cn('grid gap-4', GRID_COLUMNS[tileCount] ?? GRID_COLUMNS[4])}>
        {summaries.map((summary) => (
          <ChildSkillTile
            key={summary.skill}
            summary={summary}
            skillLabel={t(`resultSkills.${summary.skill}`)}
          />
        ))}
        {pending.length > 0 ? <ChildSkillPendingTile skills={pending} /> : null}
      </div>
    </section>
  );
}
