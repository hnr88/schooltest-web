'use client';

import { useTranslations } from 'next-intl';

import { PanelHeaderRow } from '@/modules/design-system';
import { ChildJourneyRail } from '@/modules/children/components/ChildJourneyRail';
import {
  CEFR_LADDER_SIZE,
  getBandRank,
  getJourneyRungs,
  getSkillSummaries,
  getUnassessedSkills,
} from '@/modules/children/lib/child-skills';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

interface ChildLevelJourneyProps {
  results: ChildProgressResult[];
  officialResultCount: number;
}

// §B.4 LevelJourney card. Rails are drawn for every skill we can make a TRUE
// statement about: one per banded skill, plus one per skill the ≤5-row window
// PROVES has no official result (`getUnassessedSkills`). A skill we know nothing
// about is omitted rather than drawn as an empty ladder.
export function ChildLevelJourney({ results, officialResultCount }: ChildLevelJourneyProps) {
  const t = useTranslations('Children');
  const banded = getSkillSummaries(results).filter((summary) => summary.band !== null);
  const unassessed = getUnassessedSkills(results, officialResultCount);

  return (
    <section
      aria-labelledby="child-level-journey-title"
      data-slot="child-level-journey"
      className="flex flex-col gap-6 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <PanelHeaderRow
        as="h2"
        titleId="child-level-journey-title"
        title={t('levelJourneyHeading')}
        className="pb-0"
      />

      {banded.length === 0 && unassessed.length === 0 ? (
        <p className="text-caption text-muted-foreground">{t('journeyUnknown')}</p>
      ) : (
        <div className="flex flex-col gap-6">
          {banded.map((summary) => (
            <ChildJourneyRail
              key={summary.skill}
              label={t(`resultSkills.${summary.skill}`)}
              verdict={t(`cefrBands.${summary.band}`)}
              rungs={getJourneyRungs(summary.band)}
              railLabel={t('skillLadderLabel', {
                skill: t(`resultSkills.${summary.skill}`),
                band: t(`cefrBands.${summary.band}`),
                rank: summary.band ? getBandRank(summary.band) : 0,
                total: CEFR_LADDER_SIZE,
              })}
            />
          ))}
          {unassessed.map((skill) => (
            <ChildJourneyRail
              key={skill}
              label={t(`resultSkills.${skill}`)}
              verdict={t('skillNotAssessed')}
              rungs={getJourneyRungs(null)}
              railLabel={t('skillLadderEmptyLabel', { skill: t(`resultSkills.${skill}`) })}
            />
          ))}
        </div>
      )}

      <p className="mt-auto border-t border-divider pt-4.5 text-caption leading-relaxed text-muted-foreground">
        {t('journeyNote')}
      </p>
    </section>
  );
}
