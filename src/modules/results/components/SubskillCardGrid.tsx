'use client';

import { useTranslations } from 'next-intl';

import type { ResultView } from '@schooltest/scoring-contracts';

import { displaySkills } from '@/modules/results/lib/display-skills';
import type { DisplaySkillReading } from '@/modules/results/lib/display-skills';

import { SubskillCard } from './SubskillCard';

/**
 * The seven-card grid (dashboard §4.4), in the canonical order the data layer
 * owns. Strength/Focus tags apply only when ≥ 4 skills are ASSESSED (a score —
 * the gate card's graded score included); a not-assessed skill can never carry
 * a tag because it has no score to compare.
 *
 * INTERPRETATION (task 30 report): the Critical card is excluded from the
 * Strength/Focus comparison AND from the ≥4 count. The spec's "max/min among
 * assessed skills" reads literally to include its gate score, but the ruling
 * makes Critical a deliberately different card (a gate state, not a banded
 * skill), and hanging a Focus tag built from the same comparison as the band
 * cards would blur exactly that distinction. Task 30's reviewer can override
 * with one line.
 */
export function SubskillCardGrid({ view }: { view: ResultView }) {
  const t = useTranslations('Results');
  const tiles = displaySkills(view);
  const banded = tiles.filter((tile) => tile.source !== 'gate');
  const assessed = banded.filter((tile) => tile.domain_score !== null);
  const tags = assessed.length >= 4 ? strengthAndFocus(assessed) : new Map<string, 'strength' | 'focus'>();

  return (
    <ul data-slot="skill-card-grid" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {tiles.map((tile) => (
        <SubskillCard
          key={tile.skill}
          skill={tile.skill}
          domainScore={tile.domain_score}
          status={tile.status}
          deltaDisplay={deltaDisplayOf(view, tile)}
          bandBefore={bandOf(view, tile, 'band_before')}
          bandAfter={bandOf(view, tile, 'band_after')}
          strandLine={tile.skill === 'Vocabulary' ? vocabStrandLine(view, t) : undefined}
          gatePassed={tile.skill === 'Critical' ? view.gate.passed : undefined}
          tag={tags.get(tile.skill)}
        />
      ))}
    </ul>
  );
}

/** The per-skill `delta_display`, verbatim: attribute-owned, vocab-owned, absent on the gate. */
function deltaDisplayOf(view: ResultView, tile: DisplaySkillReading): string | null {
  if (tile.skill === 'Vocabulary') return view.vocab.delta_display;
  if (tile.skill === 'Critical') return null; // the gate block carries no growth fields (spec v2 §6.3)
  const attribute = view.attributes[tile.skill];
  return attribute !== undefined && attribute.status !== 'not_assessed' ? attribute.delta_display : null;
}

function bandOf(view: ResultView, tile: DisplaySkillReading, key: 'band_before' | 'band_after'): string | undefined {
  if (tile.skill === 'Vocabulary' || tile.skill === 'Critical') return undefined;
  const attribute = view.attributes[tile.skill];
  if (attribute === undefined || attribute.status === 'not_assessed') return undefined;
  return attribute[key];
}

/** §4.4 vocab strand line: both strands, or the single assessed strand + the honest gap. */
function vocabStrandLine(view: ResultView, t: (key: string, values?: Record<string, string | number>) => string): string {
  const percent = (score: number | null): string => (score === null ? '—' : `${score}%`);
  if (view.vocab.single_strand === null) {
    return t('vocabStrandsBoth', { a2: percent(view.vocab.a2.domain_score), b1: percent(view.vocab.b1.domain_score) });
  }
  return view.vocab.single_strand === 'a2'
    ? t('vocabStrandSingle', { assessed: `A2 ${percent(view.vocab.a2.domain_score)}`, gap: `B1 ${t('notAssessedThisSitting')}` })
    : t('vocabStrandSingle', { assessed: `B1 ${percent(view.vocab.b1.domain_score)}`, gap: `A2 ${t('notAssessedThisSitting')}` });
}

function strengthAndFocus(assessed: DisplaySkillReading[]): Map<string, 'strength' | 'focus'> {
  if (assessed.length === 0) return new Map();
  const max = Math.max(...assessed.map((t) => t.domain_score as number));
  const min = Math.min(...assessed.map((t) => t.domain_score as number));
  const tags = new Map<string, 'strength' | 'focus'>();
  for (const tile of assessed) {
    if (tile.domain_score === max) tags.set(tile.skill, 'strength');
    if (tile.domain_score === min) tags.set(tile.skill, 'focus');
  }
  return tags;
}
