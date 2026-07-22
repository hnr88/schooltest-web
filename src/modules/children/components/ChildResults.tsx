'use client';

import { ChartNoAxesColumnIncreasing } from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

import {
  EmptyState,
  FilterChipGroup,
  ScoreText,
  StatusPill,
  TimelineRow,
} from '@/modules/design-system';
import { getChildResultTitle } from '@/modules/children/lib/child-profile-display';
import {
  filterResultsBySkill,
  getResultSkills,
  getResultStatusTone,
} from '@/modules/children/lib/child-results';
import { getSkillTagTone } from '@/modules/children/lib/child-skills';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

interface ChildResultsProps {
  results: ChildProgressResult[];
}

// DS §5.5 "Result timeline" (Student detail 5d): title + skill chips, then fixed
// date / subject pill / title / trailing rows on a shared hairline. The trailing
// slot is canonically the score — the parent contract has no score, so it carries
// the CEFR band the API did publish, and an unbanded result keeps the canonical
// em dash rather than an invented number.
export function ChildResults({ results }: ChildResultsProps) {
  const t = useTranslations('Children');
  const format = useFormatter();
  const [skill, setSkill] = useState('all');
  const skills = getResultSkills(results);
  const visible = filterResultsBySkill(results, skill);

  return (
    <section
      data-slot="child-results-timeline"
      aria-labelledby="child-results-title"
      className="flex flex-col gap-2 rounded-panel border border-border bg-card p-5 shadow-sm sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2">
        <h2 id="child-results-title" className="text-panel-title font-semibold text-foreground">
          {t('recentResultsHeading')}
        </h2>
        {skills.length > 1 ? (
          <FilterChipGroup
            ariaLabel={t('resultSkill')}
            value={skill}
            onValueChange={setSkill}
            options={[
              { value: 'all', label: t('filterAll') },
              ...skills.map((value) => ({ value, label: t(`resultSkills.${value}`) })),
            ]}
          />
        ) : null}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={ChartNoAxesColumnIncreasing}
          tone="brand"
          title={t('emptyResults')}
          description={t('recentResultsDescription')}
          className="border-none px-0 py-2"
        />
      ) : (
        <div>
          {visible.map((result) => (
            <TimelineRow
              key={result.documentId}
              date={
                result.publishedAt
                  ? format.dateTime(new Date(result.publishedAt), {
                      day: 'numeric',
                      month: 'short',
                    })
                  : '—'
              }
              tag={result.skill ? t(`resultSkills.${result.skill}`) : undefined}
              tagTone={getSkillTagTone(result.skill)}
              title={getChildResultTitle(result, t('untitledResult'))}
              trailing={
                result.cefrBand ? (
                  <ScoreText value={null} display={result.cefrBand} />
                ) : (
                  <StatusPill tone={getResultStatusTone(result.status)}>
                    {t(`resultStatus.${result.status}`)}
                  </StatusPill>
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
