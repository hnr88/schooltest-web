import { type ResultView } from '@schooltest/scoring-contracts';

import {
  breakdownRowsOf,
  growthFromHistory,
  momentumOf,
  progressTilesOf,
  scoredChartPoints,
} from '@/modules/teacher/lib/student-report';
import type {
  DrillDownBreakdownRow,
  DrillDownChartPoint,
  DrillDownGrowth,
  DrillDownMomentum,
  DrillDownProgressTiles,
} from '@/modules/teacher/types/student-report.types';

/**
 * THE V2 MODEL (web repoint, pre-24): the drill-down view built from the
 * student's latest official ResultView (the canonical `GET /results/{id}`
 * read). Everything on it is the server's own judgement, carried verbatim:
 *
 *  - `skills` covers the SEVEN CDM skills — Everyday (Vocab_A2) and Classroom
 *    (Vocab_B1) Vocabulary as two rows, never blended. Critical Reading is NOT a
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
 *  - `growth` and `momentum` are the report's own history reading (Spec 02
 *    §0.1): delta = latest − first SCORED overall, then the 5/10 provisional
 *    cuts; under two scored sittings there is neither. `chartPoints` and the
 *    `tiles` (baseline/latest/sittings) are those same scored sittings.
 *  - `breakdown` is the nine-row table in display order: rows 1–8 carry the
 *    server band (the seven attributes' `status`, Academic Vocabulary's
 *    `academic_vocab.band` with its provisional cut) and row 9 is the Critical
 *    exit gate from `gate.passed`.
 *
 * No other field is derived by subtraction or thresholding, and no band is a
 * client-side codebook; the posteriors on the wire are audit fields and are
 * never read into this model at all.
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
  overallPct: number | null;
  overallDeltaDisplay: string | null;
  acaraPhase: string | null;
  /** Critical Reading: score + pass/fail state — never a band, never a delta. */
  gate: { score: number | null; passed: boolean | null };
  skills: DrillDownSkill[];
  tests: DrillDownTest[];
  growth: DrillDownGrowth;
  momentum: DrillDownMomentum;
  chartPoints: DrillDownChartPoint[];
  tiles: DrillDownProgressTiles;
  breakdown: DrillDownBreakdownRow[];
}

/** Full i18n KEY for the label, not a data key: the areas map is presentation
 * vocabulary (labels only), which the stored-codes ruling explicitly allows. The
 * two vocabulary strands take the report's own attribute names. */
const LABEL_KEY: Record<string, string> = {
  Decoding: 'Teach.diagnostic.areas.R1',
  Vocab_A2: 'Report.attributes.Vocab_A2',
  Grammar: 'Teach.diagnostic.areas.R3',
  Vocab_B1: 'Report.attributes.Vocab_B1',
  Gist: 'Teach.diagnostic.areas.R4',
  Detail: 'Teach.diagnostic.areas.R5',
  Inference: 'Teach.diagnostic.areas.R6',
  Vocab_B2: 'Report.attributes.Vocab_B2',
  Critical: 'Teach.diagnostic.areas.R7',
};

export function drillDownLabelKey(attribute: string): string {
  return LABEL_KEY[attribute] ?? attribute;
}

export function buildStudentDrillDownView(view: ResultView): StudentDrillDownViewModel {
  const skills: DrillDownSkill[] = (
    [
      'Decoding',
      'Vocab_A2',
      'Grammar',
      'Vocab_B1',
      'Gist',
      'Detail',
      'Inference',
    ] as const
  ).map((attribute) => {
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

  const chartPoints = scoredChartPoints(view);
  const growth = growthFromHistory(chartPoints);

  return {
    overallScore: view.overall.domain_score,
    overallPct: view.overall.domain_score,
    overallDeltaDisplay: view.overall.delta_display,
    acaraPhase: view.acara_phase,
    gate: { score: view.gate.domain_score, passed: view.gate.passed },
    skills,
    tests,
    growth,
    momentum: momentumOf(growth),
    chartPoints,
    tiles: progressTilesOf(chartPoints),
    breakdown: breakdownRowsOf(view),
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
