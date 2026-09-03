import { expect } from '@playwright/test';

import type { ClassProgressResponse } from '@/modules/teacher/types/teacher-progress.types';
import type { ClassInsightsResponse } from '@/modules/teacher/types/teacher-result.types';

import { rosterEntry, type RosterIdentity } from './teacher-export-privacy';

// Task 057 harness, part 2: the downloaded Markdown is read as DATA and every
// number in it is compared with the number the live API answered for the same
// class (C-TR-3 for flow 21, C-TR-4 for flow 25). Nothing here contains an
// expected count — the server owns the values; this file only proves the export
// carries the SAME ones, under anonymised ids.

const isSeparator = (line: string): boolean => /^\s*\|[\s|:-]+\|\s*$/.test(line);

const cellsOf = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());

/**
 * Every pipe table inside one `## <heading>` section, as its DATA rows — a row
 * whose next line is the `|---|` separator is that table's header and opens a new
 * table, so a section holding several tables (the ACARA movement section holds
 * three) parses into separate tables instead of one merged blob.
 */
export function sectionTables(body: string, heading: string): string[][][] {
  const start = body.indexOf(`\n## ${heading}\n`);
  expect(start, `the export must carry a "## ${heading}" section`).toBeGreaterThan(-1);
  const rest = body.slice(start + heading.length + 5);
  const end = rest.indexOf('\n## ');
  const lines = (end === -1 ? rest : rest.slice(0, end)).split('\n');
  const tables: string[][][] = [];
  lines.forEach((line, index) => {
    if (!line.trimStart().startsWith('|') || isSeparator(line)) return;
    if (isSeparator(lines[index + 1] ?? '')) {
      tables.push([]);
      return;
    }
    if (tables.length === 0) return;
    tables[tables.length - 1].push(cellsOf(line));
  });
  expect(tables.length, `"## ${heading}" must hold a table`).toBeGreaterThan(0);
  return tables;
}

/** Data rows of the FIRST table in one `## <heading>` section. */
export function sectionRows(body: string, heading: string): string[][] {
  return sectionTables(body, heading)[0];
}

/** Text between one level-two heading and the next. */
function sectionBody(body: string, heading: string): string {
  const start = body.indexOf(`\n## ${heading}\n`);
  expect(start, `the export must carry a "## ${heading}" section`).toBeGreaterThan(-1);
  const rest = body.slice(start + heading.length + 5);
  const end = rest.indexOf('\n## ');
  return end === -1 ? rest : rest.slice(0, end);
}

/** `+4` / `-10` / `0` — the sign convention the export writes deltas with. */
export function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

const rowText = (cells: readonly string[]): string => cells.join(' | ');

function expectRow(rows: readonly string[][], expected: readonly string[]): void {
  expect(rows.map(rowText), `the export must carry the row "${rowText(expected)}"`).toContain(
    rowText(expected),
  );
}

/**
 * Flow 21: every subskill mastery figure in the insights document is the figure
 * C-TR-3 answered for this class, inverted (mastered, not gaps), and every teaching
 * group holds exactly the anonymised ids of the students the API grouped there.
 */
export function expectInsightsNumbers(
  body: string,
  insights: ClassInsightsResponse,
  roster: readonly RosterIdentity[],
): void {
  const mastery = sectionRows(body, 'Subskill mastery');
  expect(mastery).toHaveLength(insights.mastery.length);
  for (const row of insights.mastery) {
    expectRow(mastery, [
      row.name,
      row.attribute,
      String(row.mastered_count),
      String(row.assessed_count),
      `${Math.round(row.ratio * 100)}%`,
    ]);
  }

  const listed = [...body.matchAll(/^Students: (.+)$/gm)].map((match) =>
    match[1]
      .split(',')
      .map((id) => id.trim())
      .sort()
      .join(','),
  );
  expect(listed.length, 'every teaching group must list its students').toBe(insights.groups.length);
  for (const group of insights.groups) {
    expect(body, `group ${group.key} must be headed with its real size`).toContain(
      `### ${group.label} (${group.key}) — ${group.students.length} student`,
    );
    const expectedIds = group.students
      .map((student) => rosterEntry(roster, student.student_document_id).anonymisedId)
      .sort()
      .join(',');
    expect(listed, `group ${group.key} must list exactly its own anonymised ids`).toContain(
      expectedIds,
    );
  }
}

/**
 * Flow 25: the progress document's comparison data IS C-TR-4's — the subskill
 * mastery shift per subskill, the ACARA phase movement counts, and the two ranked
 * tables, each keyed by anonymised id instead of the `display_name` the API returns.
 */
export function expectProgressNumbers(
  body: string,
  progress: ClassProgressResponse,
  roster: readonly RosterIdentity[],
): void {
  const movementCounts = progress.acara_movement;
  if (!progress.available || !progress.summary || !movementCounts) {
    throw new Error('[e2e] C-TR-4 answered available:false — flow 25 needs a Test B cohort');
  }

  const shift = sectionRows(body, 'Subskill mastery shift');
  expect(shift).toHaveLength(progress.subskill_shift.length);
  for (const row of progress.subskill_shift) {
    expectRow(shift, [
      row.name,
      row.attribute,
      String(row.a_mastered),
      String(row.b_mastered),
      signed(row.change),
    ]);
  }

  const movement = sectionTables(body, 'ACARA phase movement');
  expect(movement[0].map((cells) => cells[1])).toEqual([
    String(movementCounts.up),
    String(movementCounts.same),
    String(movementCounts.down),
  ]);
  const transitions = movement.slice(1).flat();
  const detail = [...movementCounts.up_detail, ...movementCounts.down_detail];
  expect(transitions).toHaveLength(detail.length);
  for (const move of detail) {
    expectRow(transitions, [`${move.from} → ${move.to}`, String(move.count)]);
  }

  const compared =
    progress.summary.improved + progress.summary.unchanged + progress.summary.regressed;
  expect(sectionRows(body, 'Per-student movement')).toHaveLength(compared);

  for (const [heading, ranked] of [
    ['Most improved', progress.most_improved],
    ['Needs attention', progress.needs_attention],
  ] as const) {
    if (ranked.length === 0) {
      const empty = sectionBody(body, heading);
      expect(empty, `${heading} must state its honest empty result`).toContain('None');
      expect(empty, `${heading} must not contain a fabricated table row`).not.toMatch(/^\|/m);
      continue;
    }
    const rows = sectionRows(body, heading);
    expect(rows).toHaveLength(ranked.length);
    ranked.forEach((entry, index) => {
      expect(rows[index]).toEqual([
        rosterEntry(roster, entry.student_document_id).anonymisedId,
        String(entry.score_a),
        String(entry.score_b),
        signed(entry.delta),
      ]);
    });
  }
}
