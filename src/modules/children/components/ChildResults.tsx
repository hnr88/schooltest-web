'use client';

import { ChartNoAxesColumnIncreasing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { EmptyState, FilterChipGroup, PanelHeaderRow } from '@/modules/design-system';
import { ChildResultRow } from '@/modules/children/components/ChildResultRow';
import { filterResultsBySkill, getResultSkills } from '@/modules/children/lib/child-results';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

interface ChildResultsProps {
  results: ChildProgressResult[];
}

// §B.6 RecentResults — the wide r24 card that closes the stack: a 19/600 heading
// over hairline-separated rows. The design's trailing "All reports →" link is
// dropped, not restyled: no parent-reachable results-history endpoint exists
// (`recentResults` is hard-capped at 5 with no pagination — G4), so the link would
// be a dead end.
export function ChildResults({ results }: ChildResultsProps) {
  const t = useTranslations('Children');
  const [skill, setSkill] = useState('all');
  const skills = getResultSkills(results);
  const visible = filterResultsBySkill(results, skill);

  return (
    <section
      data-slot="child-results-timeline"
      aria-labelledby="child-results-title"
      className="flex flex-col gap-1 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <PanelHeaderRow
        as="h2"
        titleId="child-results-title"
        title={t('recentResultsHeading')}
        className="items-center pb-1 [&_h2]:text-portal-panel"
        action={
          skills.length > 1 ? (
            <FilterChipGroup
              ariaLabel={t('resultSkill')}
              value={skill}
              onValueChange={setSkill}
              options={[
                { value: 'all', label: t('filterAll') },
                ...skills.map((value) => ({ value, label: t(`resultSkills.${value}`) })),
              ]}
            />
          ) : undefined
        }
      />

      {results.length === 0 ? (
        <EmptyState
          icon={ChartNoAxesColumnIncreasing}
          tone="brand"
          title={t('emptyResults')}
          description={t('recentResultsDescription')}
          className="border-none px-0 py-2"
        />
      ) : (
        <ul className="flex flex-col">
          {visible.map((result) => (
            <ChildResultRow key={result.documentId} result={result} />
          ))}
        </ul>
      )}
    </section>
  );
}
