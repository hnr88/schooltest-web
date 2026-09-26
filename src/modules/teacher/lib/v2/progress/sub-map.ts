import type {
  AssessedBand,
  DisplaySkill,
  ResultHistoryPoint,
  ResultView,
} from '@schooltest/scoring-contracts';

import { getStudentFirstName } from '@/lib/student-name';
import type { RosterRow } from '@/modules/results';
import { BAND_RANK } from '@/modules/teacher/constants/v2-thresholds.constants';
import { monthOf } from '@/modules/teacher/lib/v2/progress/band-placement';
import type {
  MoverCounts,
  SubMapEndpoint,
  SubMapMove,
  SubMapPhaseCount,
  SubMapRow,
  SubSkillMap,
} from '@/modules/teacher/types/v2-class-tabs.types';

/**
 * §3d "Subskill growth by student" — per-subskill BANDS at the first and the
 * latest sitting, straight off the server's own bands: the first sitting from
 * the history point's `attribute_bands[skill]` (BUG-009), the latest from
 * `attributes[skill].status` / `academic_vocab.band`. Nothing here thresholds a
 * score into a band, and Critical is absent by construction (§0.1: the exit
 * gate has no 4-way band at any sitting).
 */

/** The chips of §3d: the EIGHT band-carrying subskills in display order. */
export const SUB_MAP_SKILLS: readonly DisplaySkill[] = [
  'Decoding',
  'Vocab_A2',
  'Grammar',
  'Vocab_B1',
  'Gist',
  'Detail',
  'Inference',
  'Vocab_B2',
];

/** The first sitting's SERVER band, off the history point; null on data recorded before `attribute_bands` shipped. */
function firstBandOf(point: ResultHistoryPoint, skill: DisplaySkill): AssessedBand | null {
  return point.attribute_bands?.[skill] ?? null;
}

/** The LATEST sitting's SERVER band: the seven attributes' `status`; Vocab_B2's rides on `academic_vocab`. */
function latestBandOf(result: ResultView, skill: DisplaySkill): AssessedBand | null {
  if (skill === 'Vocab_B2') return result.academic_vocab.band;
  if (skill === 'Critical') return null; // §0.1: the gate has no band; it never enters SUB_MAP_SKILLS anyway.
  const attribute = result.attributes[skill];
  if (attribute === undefined || attribute.status === 'not_assessed') return null;
  return attribute.status;
}

/** BAND_RANK(latest) − BAND_RANK(first); a missing first band asserts no movement. */
function movementOf(
  first: AssessedBand | null,
  latest: AssessedBand,
): { movement: SubMapMove; phases: number } {
  if (first === null) return { movement: 'held', phases: 0 };
  const phases = BAND_RANK[latest] - BAND_RANK[first];
  return { movement: phases > 0 ? 'up' : phases < 0 ? 'down' : 'held', phases: Math.abs(phases) };
}

function rowOf(row: RosterRow, skill: DisplaySkill): SubMapRow[] {
  const { result } = row;
  if (result === null) return [];
  const latestBand = latestBandOf(result, skill);
  // No band at the latest sitting → no arrowhead to draw; the student is skipped, never zeroed.
  if (latestBand === null) return [];
  const points = result.history ?? [];
  const firstPoint = points.find((point) => firstBandOf(point, skill) !== null);
  const firstBand = firstPoint === undefined ? null : firstBandOf(firstPoint, skill);
  const latestPoint = points.at(-1);
  const { movement, phases } = movementOf(firstBand, latestBand);
  return [
    {
      studentDocumentId: row.student.document_id,
      name: row.student.name,
      firstName: getStudentFirstName(row.student.name),
      first:
        firstBand === null
          ? null
          : { band: firstBand, month: firstPoint === undefined ? null : monthOf(firstPoint.sat_at) },
      latest: { band: latestBand, month: latestPoint === undefined ? null : monthOf(latestPoint.sat_at) },
      movement,
      phases,
    },
  ];
}

const BAND_ORDER: readonly AssessedBand[] = ['not_yet', 'emerging', 'developing', 'secure'];

function phaseCounts(rows: readonly SubMapRow[]): SubMapPhaseCount[] {
  return BAND_ORDER.map((band) => ({
    band,
    count: rows.filter((row) => row.latest.band === band).length,
  }));
}

function summaryOf(rows: readonly SubMapRow[]): MoverCounts {
  const up = rows.filter((row) => row.movement === 'up').length;
  const down = rows.filter((row) => row.movement === 'down').length;
  return { up, held: rows.length - up - down, down };
}

/** §3d, one map per band-carrying subskill; rows rank by the latest band (top first), then by name. */
export function subMapsOf(roster: readonly RosterRow[]): SubSkillMap[] {
  const carriesBands = roster.some((row) => row.result?.history?.some((point) => point.attribute_bands !== undefined));
  if (!carriesBands) return [];
  return SUB_MAP_SKILLS.map((skill) => {
    const rows = roster
      .flatMap((row) => rowOf(row, skill))
      .sort((a, b) => BAND_RANK[b.latest.band] - BAND_RANK[a.latest.band] || a.name.localeCompare(b.name));
    return { skill, rows, phases: phaseCounts(rows), summary: summaryOf(rows) };
  });
}
