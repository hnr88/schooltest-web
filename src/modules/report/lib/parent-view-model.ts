import type { AssessedBand, Band } from '@schooltest/scoring-contracts';

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
 * - A SECURE skill is never the focus either: "Focus next" names the
 *   lowest-scoring skill below secure. With nothing below secure the next step
 *   is to keep extending, not a strength presented as a gap.
 * - Critical Reading is not comparable with the banded skills (no posterior,
 *   no band — the Screen C ruling 4a) and in the v2 view it is not an
 *   attribute at all, so it cannot reach these lists.
 * - Academic Vocabulary (spec 4, `Vocab_B2`) is a third vocabulary skill with
 *   the same three-step family state; its four-step band rides on its own
 *   entries only, to pick the plain-English register phrase (§8).
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
  /** Academic Vocabulary (`Vocab_B2`) entries only: the four-step band its §8 phrase is chosen by. */
  academicBand?: AssessedBand;
}

export type FamilyNextStep =
  | {
      kind: 'focus';
      skill: string;
      score: number;
      state: FamilyStrength['state'];
      academicBand?: AssessedBand;
    }
  | { kind: 'extend' }
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

/**
 * The minimal face of a ResultView buildFamilyPreview consumes. The C-4
 * ResultView structurally satisfies it (extra audit keys allowed), and so does
 * the C-PAR-REPORT family wire view after its one-field adapter
 * (`familyReportToPreviewInput`) — the SAME allow-list builder serves the
 * teacher's parent-mode preview and the parent's own report face.
 */
export interface FamilyPreviewInput {
  overall: { domain_score: number | null } | null;
  acara_phase: string | null;
  skill: string | null;
  published_at: string | null;
  attributes: Record<string, { status: Band; domain_score?: number | null }>;
  /** Spec 4 — absent where the wire does not carry the strand (the C-PAR-REPORT family view). */
  academic_vocab?: { domain_score: number | null; band: AssessedBand | null };
}

// A null band (not reached, or measured with no cuts) or score is not assessed.
function academicEntry(strand: FamilyPreviewInput['academic_vocab']): FamilyStrength | null {
  if (strand === undefined || strand.domain_score === null || strand.band === null) return null;
  return { skill: 'Vocab_B2', score: strand.domain_score, state: familyStateFor(strand.band), academicBand: strand.band };
}

function familyEntry({ skill, score, state, academicBand }: FamilyStrength): FamilyStrength {
  return academicBand === undefined ? { skill, score, state } : { skill, score, state, academicBand };
}

/** A family line's phrase key: Academic Vocabulary speaks by its band (§8), every other skill by its family state. */
export function familyPhraseKey(entry: Pick<FamilyStrength, 'state' | 'academicBand'>): string {
  return entry.academicBand === undefined
    ? `parentStatePhrase.${entry.state}`
    : `academicVocabBand.${entry.academicBand}`;
}

export function buildFamilyPreview(view: FamilyPreviewInput): FamilyPreviewView {
  const academic = academicEntry(view.academic_vocab);
  const assessed = Object.entries(view.attributes).flatMap(([skill, attribute]): FamilyStrength[] =>
    attribute.status === 'not_assessed'
      ? []
      : [{ skill, score: attribute.domain_score ?? 0, state: familyStateFor(attribute.status) }],
  );
  if (academic !== null) assessed.push(academic);

  const byScore = [...assessed].sort((a, b) => b.score - a.score);
  const strengths = byScore.slice(0, 2).map(familyEntry);

  const focus = byScore.filter((entry) => entry.state !== 'secure').at(-1);
  const first: FamilyNextStep = focus === undefined ? { kind: 'extend' } : { kind: 'focus', ...familyEntry(focus) };
  const nextSteps: FamilyNextStep[] = assessed.length === 0 ? [] : [first, { kind: 'practice' }];

  const counts = new Map<FamilySubskillGroup['state'], number>();
  const states = Object.values(view.attributes).map((attribute) => familyStateFor(attribute.status));
  if (view.academic_vocab !== undefined) states.push(academic?.state ?? 'not_assessed');
  for (const state of states) {
    counts.set(state, (counts.get(state) ?? 0) + 1);
  }
  const groups = FAMILY_STATE_ORDER.flatMap((state) => {
    const count = counts.get(state);
    return count === undefined ? [] : [{ state, count }];
  });

  return {
    overall: { score: view.overall?.domain_score ?? null },
    phase: { label: view.acara_phase },
    skill: view.skill,
    publishedAt: view.published_at,
    strengths,
    nextSteps,
    subskills: { state: 'groups', groups, total: states.length },
  };
}
