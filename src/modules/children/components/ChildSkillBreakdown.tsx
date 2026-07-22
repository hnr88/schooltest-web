'use client';

import { useTranslations } from 'next-intl';

import { PanelHeaderRow, SkillBreakdownRow } from '@/modules/design-system';
import { getReadinessTone, getReadinessValue } from '@/modules/children/lib/child-readiness';
import {
  getFocusSkill,
  getSkillSummaries,
  getUnassessedSkills,
} from '@/modules/children/lib/child-skills';
import type { ChildProgressResult } from '@/modules/children/types/children.types';

interface ChildSkillBreakdownProps {
  results: ChildProgressResult[];
  officialResultCount: number;
}

// §B.5 SkillsCard — one row per skill: label, track, verdict. The design's track is
// a mastery PERCENTAGE and its right column a letter-ish grade (`B1+`); the parent
// contract publishes neither, so the track encodes READINESS — the real three-step
// ordinal (not_yet → approaching → met) — and the verdict prints that word. An
// unmeasured skill gets an EMPTY track, never a zero bar.
// The design's blue "focus skill" tint becomes the note line: `focusSkill` is
// derived by ranking readiness alone (CONTRACTS), never by averaging probabilities.
export function ChildSkillBreakdown({ results, officialResultCount }: ChildSkillBreakdownProps) {
  const t = useTranslations('Children');
  const summaries = getSkillSummaries(results);
  const unassessed = getUnassessedSkills(results, officialResultCount);
  const focus = getFocusSkill(summaries);

  return (
    <section
      aria-labelledby="child-skill-breakdown-title"
      data-slot="child-skill-breakdown"
      className="flex flex-col gap-5 rounded-card bg-card px-6 py-6 shadow-sm sm:px-7.5"
    >
      <PanelHeaderRow
        as="h2"
        titleId="child-skill-breakdown-title"
        title={t('skillBreakdownHeading')}
        className="pb-0"
      />

      {summaries.length === 0 && unassessed.length === 0 ? (
        <p className="text-caption text-muted-foreground">{t('skillsUnknown')}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {summaries.map((summary) => (
            <SkillBreakdownRow
              key={summary.skill}
              label={t(`resultSkills.${summary.skill}`)}
              value={getReadinessValue(summary.readiness)}
              verdict={t(`resultReadinessValues.${summary.readiness ?? 'not_assessed'}`)}
              tone={getReadinessTone(summary.readiness)}
            />
          ))}
          {unassessed.map((skill) => (
            <SkillBreakdownRow
              key={skill}
              label={t(`resultSkills.${skill}`)}
              value={null}
              verdict={t('skillNotAssessed')}
              tone="notAssessed"
            />
          ))}
        </div>
      )}

      <p className="mt-auto border-t border-divider pt-4.5 text-caption leading-relaxed text-muted-foreground">
        {focus
          ? t('focusSkillNote', {
              skill: t(`resultSkills.${focus.skill}`),
              readiness: t(`resultReadinessValues.${focus.readiness ?? 'not_assessed'}`),
            })
          : t('skillsNote')}
      </p>
    </section>
  );
}
