import {
  displaySkillSchema,
  type Band,
  type DisplaySkill,
  type ResultView,
} from '@schooltest/scoring-contracts';

/**
 * The canonical nine-skill display order (data contract §2.2, dashboard §1.1):
 * Matrix 1 skills first, then Matrix 2 — Vocab_A2 (Everyday Vocabulary) and
 * Vocab_B1 (Classroom Vocabulary) are two skills, never blended — then the two
 * Rasch strands outside the CDM: `Vocab_B2` (Academic Vocabulary, banded) and
 * `Critical` (the Section 3 graded gate score). This
 * module owns the mapping for every screen; nothing re-derives it locally
 * (house rule 6: one currency of score).
 *
 * RULING (stored-codes-vs-model-attributes): this file maps the RESULTVIEW —
 * the memo-keyed TARGET shape — never a stored Result row. Stored rows stay
 * keyed R1..R7 until task 16; any code indexing a stored `attributes` map must
 * use STORED_ATTRIBUTE_CODES instead (see the mission ruling).
 */
export const DISPLAY_SKILL_ORDER: readonly DisplaySkill[] = displaySkillSchema.options;

/** One tile of the nine-tile grid. */
export interface DisplaySkillReading {
  skill: DisplaySkill;
  /** null = not assessed this sitting. It is never rendered as 0 (dashboard §7). */
  domain_score: number | null;
  /** null where the source block carries no band — the Section 3 gate has none. */
  status: Band | null;
  /** Which contract block the tile reads: a model attribute, the Academic Vocabulary strand or the gate. */
  source: 'attribute' | 'academic_vocab' | 'gate';
}

/**
 * Maps a ResultView v2 onto the nine display tiles in canonical order.
 * - `Critical` reads `gate.domain_score` (spec v2 §6.3 carries no band on the
 *   gate, so its status is always null; the pass/fail boolean is `view.gate.passed`).
 * - `Vocab_B2` reads `academic_vocab` (spec 4 §4): a banded tile with no growth.
 *   A null band or score is not assessed — both map to null, never 0.
 * - The other seven read the same-named attribute; a missing key or the literal
 *   not-assessed branch maps to null — an absence is rendered as absence, never 0.
 */
export function displaySkills(view: ResultView): DisplaySkillReading[] {
  return DISPLAY_SKILL_ORDER.map((skill): DisplaySkillReading => {
    if (skill === 'Critical') {
      return { skill, domain_score: view.gate.domain_score, status: null, source: 'gate' };
    }
    if (skill === 'Vocab_B2') {
      const { domain_score, band } = view.academic_vocab;
      return domain_score === null || band === null
        ? { skill, domain_score: null, status: null, source: 'academic_vocab' }
        : { skill, domain_score, status: band, source: 'academic_vocab' };
    }
    const attribute = view.attributes[skill];
    // The union discriminates on `status`: the scored branch carries an
    // assessedBandSchema value, so the literal comparison narrows to not-assessed.
    if (attribute === undefined || attribute.status === 'not_assessed') {
      return { skill, domain_score: null, status: null, source: 'attribute' };
    }
    return { skill, domain_score: attribute.domain_score, status: attribute.status, source: 'attribute' };
  });
}

/** The `Results` label key of a display skill: Everyday (Vocab_A2), Classroom (Vocab_B1) and Academic (Vocab_B2) Vocabulary have their own. */
const VOCAB_SKILL_LABEL_KEY: Readonly<Record<string, string>> = {
  Vocab_A2: 'skillVocabulary',
  Vocab_B1: 'attrVocabularyB1',
  Vocab_B2: 'attrVocabularyB2',
};

export function resultsSkillLabelKey(skill: string): string {
  return VOCAB_SKILL_LABEL_KEY[skill] ?? `skill${skill}`;
}
