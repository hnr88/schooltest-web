import type { SubjectProgressTone, TimelineTagTone } from '@/modules/design-system';
import type {
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

const SKILL_TAG_TONES: Record<Skill, TimelineTagTone> = {
  reading: 'blue',
  listening: 'teal',
  speaking: 'amber',
  writing: 'violet',
};

// The API exposes NO percentage score anywhere in the parent contract. The only
// ordinal it publishes is the CEFR band, so the §5.3 bar encodes the band's rank
// on the real six-band ladder and the card's value label prints the band itself.
// Nothing here is invented: a skill with no banded result simply never appears.
const CEFR_LADDER: Band[] = ['pre_A1', 'A1', 'A2', 'B1', 'B2', 'C1'];

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

export function getSkillTagTone(skill: ChildProgressResult['skill']): TimelineTagTone {
  return skill ? SKILL_TAG_TONES[skill] : 'neutral';
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
      value: band ? getBandProgress(band) : 0,
      count: (existing?.count ?? 0) + 1,
      tone: SKILL_TONES[result.skill],
    });
  }

  return [...bySkill.values()];
}
