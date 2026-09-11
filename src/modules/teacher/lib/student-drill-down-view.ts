import { type ResultView } from '@schooltest/scoring-contracts';

/**
 * THE V2 MODEL (web repoint, pre-24): the drill-down view built from the
 * student's latest official ResultView (the canonical `GET /results/{id}`
 * read). Everything on it is the server's own judgement, carried verbatim:
 *
 *  - `skills` covers the SIX CDM-and-blend skills. Critical Reading is NOT a
 *    skill row — it is Rasch-scored outside the CDM, so it has no posterior,
 *    no band and no delta; the view carries it as `gate` (score + pass/fail
 *    state) only.
 *  - `deltaDisplay` is the server's rendered movement ("steady", a coarse
 *    signed step, or "band_movement" with `bandBefore`/`bandAfter`) — never
 *    recomputed, never a subtraction of two scores.
 *  - `score: null` is the not-assessed GAP: that skill was not measured on
 *    this sitting, and a null is never rendered as a zero.
 *  - `tests` is the server's `history`, MOST RECENT FIRST (the display order
 *    the old C-TR-2 contract used), carrying overall scores only — the
 *    history columns hold no bands, so older sittings render no band chips.
 *
 * No field here is derived by subtraction, thresholding or a client-side
 * band codebook; the posteriors on the wire are audit fields and are never
 * read into this model at all.
 */
export interface DrillDownSkill {
  attribute: string;
  /** Latest domain score, or null for the not-assessed gap. */
  score: number | null;
  status: 'secure' | 'developing' | 'emerging' | 'not_yet' | null;
  deltaDisplay: string | null;
  bandBefore: string | null;
  bandAfter: string | null;
}

export interface DrillDownTest {
  satAt: string;
  overall: number | null;
}

export interface StudentDrillDownViewModel {
  overallScore: number | null;
  overallDeltaDisplay: string | null;
  acaraPhase: string | null;
  /** Critical Reading: score + pass/fail state — never a band, never a delta. */
  gate: { score: number | null; passed: boolean | null };
  skills: DrillDownSkill[];
  tests: DrillDownTest[];
}

/** i18n KEY for the label, not a data key: the areas map is presentation
 * vocabulary (labels only), which the stored-codes ruling explicitly allows. */
const LABEL_AREAS_KEY: Record<string, string> = {
  Decoding: 'R1',
  Vocabulary: 'R2',
  Grammar: 'R3',
  Gist: 'R4',
  Detail: 'R5',
  Inference: 'R6',
};

export function drillDownLabelKey(attribute: string): string {
  return LABEL_AREAS_KEY[attribute] ?? attribute;
}

export function buildStudentDrillDownView(view: ResultView): StudentDrillDownViewModel {
  const skills: DrillDownSkill[] = (
    [
      'Decoding',
      'Vocabulary',
      'Grammar',
      'Gist',
      'Detail',
      'Inference',
    ] as const
  ).map((attribute) => {
    if (attribute === 'Vocabulary') {
      const vocab = view.vocab;
      const assessed = vocab.status !== 'not_assessed' && vocab.blended !== null;
      return {
        attribute,
        score: assessed ? vocab.blended : null,
        status: vocab.status === 'not_assessed' ? null : vocab.status,
        deltaDisplay: view.vocab.delta_display,
        bandBefore: null,
        bandAfter: null,
      };
    }
    const entry = view.attributes[attribute];
    if (entry === undefined || entry.status === 'not_assessed') {
      return {
        attribute,
        score: null,
        status: null,
        deltaDisplay: null,
        bandBefore: null,
        bandAfter: null,
      };
    }
    return {
      attribute,
      score: entry.domain_score,
      status: entry.status,
      deltaDisplay: entry.delta_display,
      bandBefore: entry.band_before ?? null,
      bandAfter: entry.band_after ?? null,
    };
  });

  const tests = (view.history ?? [])
    .map((point) => ({ satAt: point.sat_at, overall: point.overall }))
    .reverse(); // the server sends oldest first; the drill-down displays most recent first

  return {
    overallScore: view.overall.domain_score,
    overallDeltaDisplay: view.overall.delta_display,
    acaraPhase: view.acara_phase,
    gate: { score: view.gate.domain_score, passed: view.gate.passed },
    skills,
    tests,
  };
}

/**
 * The topbar trail for /dashboard/results/<class>/students/<student>: the
 * student's name, with the class crumb named by the CLASS — never its
 * documentId. Nothing is published until both names are known, so the trail
 * ends at Results rather than showing an id or repeating the student.
 */
export function drillDownCrumb(
  studentName: string | null,
  className: string | null,
  classDocumentId: string,
): { label: string; ancestors: Record<string, string> } | null {
  if (!studentName || !className) return null;
  return {
    label: studentName,
    ancestors: { [`/dashboard/results/${classDocumentId}`]: className },
  };
}
