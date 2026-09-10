import { expect, type Locator, type Page } from '@playwright/test';

import type { MonitorStudent } from '@/modules/teacher/types/teacher-session.types';
import type { MonitorState } from '@/modules/teacher/types/teacher.types';

import { cat } from './i18n';
import { expectStatePaint } from './teacher-monitor-ink';
import { en } from './teacher-rail';

// Task 053 — the TEXT half of the tile-state harness (brief flows 9-12). Every
// state has to be readable without colour, so this asserts three separate text
// carriers per tile: the state's own word, the extra fact it prints ("Stage 2 of
// 3", "No activity 7 min") and the sr-only sentence a screen reader gets. All of
// them are rendered from the SHIPPED en catalog and the values C-TS-3 really
// answered — never a hardcoded English string and never a number the spec chose.

const LIVE = 'Teacher.testSessions.live';

export const MONITOR_LABEL_KEY: Record<MonitorState, string> = {
  scoring_failed: 'stateScoringFailed',
  submitted: 'stateSubmitted',
  in_progress: 'stateInProgress',
  paused: 'statePaused',
  stalled: 'stateStalled',
  absent: 'stateAbsent',
  joined: 'stateJoined',
  not_joined: 'stateNotJoined',
};

export async function openMonitor(page: Page, sittingDocumentId: string): Promise<void> {
  await page.goto(`/en/dashboard/test-sessions/${sittingDocumentId}`);
  await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute(
    'data-status',
    'ready',
  );
}

/** The payload row for one student, or a loud throw — never an optional skipped. */
export function tileOf(
  wire: { students: readonly MonitorStudent[] },
  studentDocumentId: string,
): MonitorStudent {
  const found = wire.students.find((row) => row.student_document_id === studentDocumentId);
  if (!found) throw new Error(`C-TS-3 returned no tile for student ${studentDocumentId}`);
  return found;
}

/** The line under the name, from the catalog template + the server's own numbers. */
export function detailLine(wire: MonitorStudent): string {
  if (wire.state === 'in_progress' && wire.stage !== null && wire.total_stages !== null) {
    return cat(en, `${LIVE}.stageOf`)
      .replace('{stage}', String(wire.stage))
      .replace('{total}', String(wire.total_stages));
  }
  if (wire.state === 'stalled' && wire.inactive_minutes !== null) {
    return cat(en, `${LIVE}.noActivity`).replace('{minutes}', String(wire.inactive_minutes));
  }
  return cat(en, `${LIVE}.${MONITOR_LABEL_KEY[wire.state]}`);
}

/** teacher/12 — the connection chip's catalog key per wire label. */
const CONNECTION_LABEL_KEY: Record<'online' | 'weak' | 'offline', string> = {
  online: 'connectionOnline',
  weak: 'connectionWeak',
  offline: 'connectionOffline',
};

/** The sentence a screen reader hears — the state named in words, not in tint. */
function srSentence(wire: MonitorStudent, detail: string, word: string): string {
  const base =
    detail === word
      ? cat(en, `${LIVE}.tileAria`)
          .replace('{name}', wire.display_name)
          .replace('{state}', word)
      : cat(en, `${LIVE}.tileAriaDetail`)
          .replace('{name}', wire.display_name)
          .replace('{state}', word)
          .replace('{detail}', detail);
  // teacher/12 — the connection chip's word joins the sentence whenever the
  // payload carries one, exactly as the tile renders it.
  const connection = wire.connection ?? null;
  const connectionNote =
    connection === null
      ? ''
      : ' ' +
        cat(en, `${LIVE}.connectionNoted`).replace(
          '{connection}',
          cat(en, `${LIVE}.${CONNECTION_LABEL_KEY[connection]}`),
        );
  return base + connectionNote;
}

/** Asserts one tile's state AS TEXT, and hands the element back for the paint check. */
export async function expectTileText(page: Page, wire: MonitorStudent): Promise<Locator> {
  const tile = page.locator(
    `[data-slot="live-monitor-tile"][data-student-id="${wire.student_document_id}"]`,
  );
  const word = cat(en, `${LIVE}.${MONITOR_LABEL_KEY[wire.state]}`);
  const detail = detailLine(wire);
  await expect(tile).toHaveAttribute('data-state', wire.state);
  await expect(tile).toContainText(wire.display_name);
  await expect(tile).toContainText(detail);
  await expect(tile.locator('.sr-only')).toHaveText(srSentence(wire, detail, word));
  // teacher/12 — the connection chip beneath the name: absent from the tile
  // when the derivation answers null, labelled from the catalog otherwise.
  const connection = wire.connection ?? null;
  const chip = tile.locator('[data-slot="live-monitor-connection"]');
  if (connection === null) {
    await expect(chip).toHaveCount(0);
  } else {
    await expect(chip).toHaveAttribute('data-connection', connection);
    await expect(chip).toHaveText(cat(en, `${LIVE}.${CONNECTION_LABEL_KEY[connection]}`));
  }
  return tile;
}

/** The legend caption, which must print the SERVER's threshold, not a literal. */
export function stallCaption(page: Page): Locator {
  return page.locator('[data-slot="live-monitor-stall-caption"]');
}

/** C-TS-3's summary for a sitting nobody has joined yet — every tally still zero. */
export function untouchedSummary(expected: number): Record<string, number> {
  return {
    expected,
    joined: 0,
    in_progress: 0,
    submitted: 0,
    stalled: 0,
    scoring_failed: 0,
    // teacher/12 — the two new counters ship with the payload; nobody is in
    // either state on a fresh sitting.
    absent: 0,
    paused: 0,
  };
}

/**
 * Asserts EVERY tile the payload puts in one state, as text and then as paint, and
 * returns the ink that carries that state. Looping over all of them (rather than
 * the first) is deliberate: a grid that paints one tile right and the rest wrong
 * would otherwise pass.
 */
export async function expectStateGrid(
  page: Page,
  students: readonly MonitorStudent[],
  state: MonitorState,
): Promise<string> {
  const rows = students.filter((row) => row.state === state);
  expect(rows.length, `the payload holds no ${state} tile to assert`).toBeGreaterThan(0);
  let paint = '';
  for (const row of rows) {
    const tile = await expectTileText(page, row);
    paint = await expectStatePaint(page, tile, state, row.display_name);
  }
  return paint;
}
