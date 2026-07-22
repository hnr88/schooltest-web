import type { SubjectProgressTone } from '@/modules/design-system';
import { READINESS_RANK } from '@/modules/children/lib/child-readiness';
import type {
  ChildJourneyRung,
  ChildProgressResult,
  ChildSkillSummary,
} from '@/modules/children/types/children.types';

type Skill = NonNullable<ChildProgressResult['skill']>;
type Band = NonNullable<ChildProgressResult['cefrBand']>;

// Categorical, stable per skill — the canonical subject tiles colour by SUBJECT
// (Math blue, Danish teal, English amber), never by score.
const SKILL_TONES: Record<Skill, SubjectProgressTone> = {
  reading: 'primary',
  listening: 'accent',
  speaking: 'warning',
  writing: 'success',
};

// The API exposes NO percentage score anywhere in the parent contract. The only
// ordinal it publishes is the CEFR band, so the §5.3 bar encodes the band's rank
// on the real six-band ladder and the card's value label prints the band itself.
// Nothing here is invented: a skill with no banded result simply never appears.
//
// The design's rail is labelled `A1 A2 B1 B2 C1 C2` (spec 02 §B.4). `C2` does not
// exist in this system and `pre_A1` does, so the rail ships the REAL six rungs with
// the design's tick visual — recorded in CONTRACTS.md as a design↔data conflict.
export const CEFR_LADDER: readonly Band[] = ['pre_A1', 'A1', 'A2', 'B1', 'B2', 'C1'];

// The four skills the progress contract can band (child-progress.schema).
const ASSESSABLE_SKILLS: Skill[] = ['reading', 'listening', 'speaking', 'writing'];

export const CEFR_LADDER_SIZE = CEFR_LADDER.length;

export function getBandProgress(band: Band): number {
  return Math.round(((CEFR_LADDER.indexOf(band) + 1) / CEFR_LADDER.length) * 100);
}

// 1-based position of a band on the published ladder — the honest, non-percentage
// reading of the §5.3 bar ("B2, level 5 of 6"), used for its accessible name.
export function getBandRank(band: Band): number {
  return CEFR_LADDER.indexOf(band) + 1;
}

// The six rungs of one §B.4 rail. A skill with NO band has no current rung at all —
// every dot stays hollow — because "not assessed" is not "sitting at pre_A1".
export function getJourneyRungs(band: Band | null): ChildJourneyRung[] {
  const current = band ? CEFR_LADDER.indexOf(band) : -1;
  return CEFR_LADDER.map((rung, index) => ({
    band: rung,
    state: current < 0 || index > current ? 'future' : index === current ? 'current' : 'done',
  }));
}

// Which skills the child provably has NO official result for.
//
// C-PARENT-CHILD-PROGRESS caps `recentResults` at 5 (`.max(5)` in the schema,
// `limit: 5` in the API service) while `metrics.officialResults` is an exact
// count. A skill missing from the returned list is therefore only PROOF of
// absence when the list is the complete set — count equals length — and when
// every returned result names its skill. Outside those two conditions we know
// nothing about the missing skills and make no claim at all, so the caller
// renders no empty-state affordance rather than an unproven one.
export function getUnassessedSkills(
  results: ChildProgressResult[],
  officialResultCount: number,
): Skill[] {
  if (officialResultCount !== results.length) return [];
  if (results.some((result) => result.skill === null)) return [];

  const assessed = new Set(results.map((result) => result.skill));
  return ASSESSABLE_SKILLS.filter((skill) => !assessed.has(skill));
}

// One card per skill the child actually has official results for, ordered by the
// first result the API returned (newest first). The band shown is the highest
// band recorded for that skill; the count is the real number of results.
export function getSkillSummaries(results: ChildProgressResult[]): ChildSkillSummary[] {
  const bySkill = new Map<Skill, ChildSkillSummary>();

  for (const result of results) {
    if (!result.skill) continue;
    const existing = bySkill.get(result.skill);
    const rank = result.cefrBand ? CEFR_LADDER.indexOf(result.cefrBand) : -1;
    const bestRank = existing?.band ? CEFR_LADDER.indexOf(existing.band) : -1;
    const band = rank > bestRank ? result.cefrBand : (existing?.band ?? null);

    bySkill.set(result.skill, {
      skill: result.skill,
      band,
      // The LATEST readiness for the skill, not the best: the API returns
      // newest-first, so the first row that names a readiness is the current one.
      readiness: existing?.readiness ?? result.readiness,
      value: band ? getBandProgress(band) : 0,
      count: (existing?.count ?? 0) + 1,
      tone: SKILL_TONES[result.skill],
    });
  }

  return [...bySkill.values()];
}

// C-PARENT-CHILD-PROGRESS `focusSkill` derivation, verbatim: rank each skill by the
// ORDINAL readiness enum (not_yet < approaching < met), exclude `not_assessed`, take
// the lowest, and break ties on the skill enum's declaration order. It performs no
// probability arithmetic and surfaces no number — the design's "weakest skill by
// percentage" is not buildable (there is no percentage in the parent contract).
export function getFocusSkill(summaries: ChildSkillSummary[]): ChildSkillSummary | null {
  const ranked = summaries.filter(
    (summary) => summary.readiness !== null && summary.readiness !== 'not_assessed',
  );
  if (ranked.length === 0) return null;

  return ranked.reduce((lowest, candidate) => {
    const gap =
      READINESS_RANK[candidate.readiness ?? 'not_yet'] -
      READINESS_RANK[lowest.readiness ?? 'not_yet'];
    if (gap < 0) return candidate;
    if (gap > 0) return lowest;
    return ASSESSABLE_SKILLS.indexOf(candidate.skill as Skill) <
      ASSESSABLE_SKILLS.indexOf(lowest.skill as Skill)
      ? candidate
      : lowest;
  });
}
