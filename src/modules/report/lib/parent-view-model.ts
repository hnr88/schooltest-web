import type { Band, ResultView } from '@schooltest/scoring-contracts';

import { bandToParentState } from '@/modules/report/lib/parent-tone';

/* ────────────────────────────────────────────────────────────────────────────
 * FAMILY PREVIEW (spec v2) — the ONLY parent view-model constructor. The
 * returned object is built key by key, so a field added upstream is excluded
 * by DEFAULT: the posterior fields, standard errors, `readiness`, `cefr_band`,
 * `low_confidence` and every audit code are absent from the family rendering
 * structurally, not by a deny-list conditional a later edit could drop.
 *
 * Rulings carried:
 * - A not-assessed skill is NEVER a strength and never a focus: it is an
 *   absence of evidence, so a family "next step" for it would invent both the
 *   finding and the advice.
 * - Critical Reading is not comparable with the banded skills (no posterior,
 *   no band — the Screen C ruling 4a) and in the v2 view it is not an
 *   attribute at all, so it cannot reach these lists.
 * - The EAL/D note (dashboard §5) is deliberately ABSENT: ResultView carries
 *   no student identity — not even an opaque id (D19, placed on task 23) — so
 *   the roster flag is not reachable from what this module legitimately has,
 *   and deriving EAL/D status from scores is forbidden. The note returns with
 *   D19.
 * ──────────────────────────────────────────────────────────────────────────── */

export interface FamilyStrength {
  skill: string;
  score: number;
  state: 'secure' | 'getting_there' | 'not_yet' | 'not_assessed';
}

export type FamilyNextStep =
  | { kind: 'focus'; skill: string; score: number; state: FamilyStrength['state'] }
  | { kind: 'practice' };

export interface FamilySubskillGroup {
  state: 'secure' | 'getting_there' | 'not_yet' | 'not_assessed';
  count: number;
}

/** The v2 family-preview model — every key it may ever emit is named here. */
export interface FamilyPreviewView {
  overall: { score: number | null };
  phase: { label: string | null };
  skill: string | null;
  publishedAt: string | null;
  strengths: FamilyStrength[];
  nextSteps: FamilyNextStep[];
  subskills: { state: 'groups'; groups: FamilySubskillGroup[]; total: number };
}

const FAMILY_STATE_ORDER: ReadonlyArray<FamilySubskillGroup['state']> = [
  'secure',
  'getting_there',
  'not_yet',
  'not_assessed',
];

function familyStateFor(band: Band): FamilySubskillGroup['state'] {
  return bandToParentState(band);
}

export function buildFamilyPreview(view: ResultView): FamilyPreviewView {
  const assessed = Object.entries(view.attributes).flatMap(([skill, attribute]) =>
    attribute.status === 'not_assessed'
      ? []
      : [{ skill, score: attribute.domain_score, state: familyStateFor(attribute.status) }],
  );

  const byScore = [...assessed].sort((a, b) => b.score - a.score);
  const strengths = byScore.slice(0, 2).map(({ skill, score, state }) => ({ skill, score, state }));

  const focus = byScore.at(-1);
  const nextSteps: FamilyNextStep[] =
    focus === undefined
      ? []
      : [
          { kind: 'focus', skill: focus.skill, score: focus.score, state: focus.state },
          { kind: 'practice' },
        ];

  const counts = new Map<FamilySubskillGroup['state'], number>();
  for (const [, attribute] of Object.entries(view.attributes)) {
    const state = familyStateFor(attribute.status);
    counts.set(state, (counts.get(state) ?? 0) + 1);
  }
  const groups = FAMILY_STATE_ORDER.flatMap((state) => {
    const count = counts.get(state);
    return count === undefined ? [] : [{ state, count }];
  });

  return {
    overall: { score: view.overall.domain_score },
    phase: { label: view.acara_phase },
    skill: view.skill,
    publishedAt: view.published_at,
    strengths,
    nextSteps,
    subskills: { state: 'groups', groups, total: Object.keys(view.attributes).length },
  };
}
