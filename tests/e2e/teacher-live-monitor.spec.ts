import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import type { MonitorSummaryKey } from '@/modules/teacher/types/live-monitor.types';
import type { TestSessionMonitorResponse } from '@/modules/teacher/types/teacher-session.types';
import type { MonitorState } from '@/modules/teacher/types/teacher.types';

import { cat, loadMessages } from './helpers/i18n';
import { plural } from './helpers/teacher-dashboard-live';
import { apiLogin } from './helpers/teacher-auth-rail';
import { findSittingsCovering, readMonitor } from './helpers/teacher-live-monitor-api';
import { readSessions } from './helpers/teacher-past-sessions-api';
import { signIn } from './helpers/teacher-rail';

// Task 037 / contract C-TS-3 — the live monitoring grid at
// /dashboard/test-sessions/<sittingDocumentId>. Every assertion compares the
// PAINTED grid against the payload the server really answered for that sitting:
// no route is intercepted, no state is fixtured, and a state the datastore does
// not hold fails the scan instead of being manufactured.

const en = loadMessages('en');
const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
const LIVE = 'Teacher.testSessions.live';

const STATE_LABEL_KEY: Record<MonitorState, string> = {
  scoring_failed: 'stateScoringFailed',
  submitted: 'stateSubmitted',
  in_progress: 'stateInProgress',
  stalled: 'stateStalled',
  joined: 'stateJoined',
  not_joined: 'stateNotJoined',
};

const SUMMARY_LABEL_KEY = {
  expected: 'summaryExpected',
  joined: 'summaryJoined',
  in_progress: 'summaryInProgress',
  submitted: 'summarySubmitted',
  stalled: 'summaryStalled',
  scoring_failed: 'summaryScoringFailed',
} as const;

/** The one line of extra fact a tile prints, rendered from the REAL catalog string. */
function detailText(student: TestSessionMonitorResponse['students'][number]): string {
  const word = cat(en, `${LIVE}.${STATE_LABEL_KEY[student.state]}`);
  if (student.state === 'in_progress' && student.stage !== null && student.total_stages !== null) {
    return cat(en, `${LIVE}.stageOf`)
      .replace('{stage}', String(student.stage))
      .replace('{total}', String(student.total_stages));
  }
  if (student.state === 'stalled' && student.inactive_minutes !== null) {
    return cat(en, `${LIVE}.noActivity`).replace('{minutes}', String(student.inactive_minutes));
  }
  return word;
}

async function openMonitor(page: Page, sittingDocumentId: string): Promise<void> {
  await page.goto(`/en/dashboard/test-sessions/${sittingDocumentId}`);
  await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute(
    'data-status',
    'ready',
  );
}

/** Payload -> painted grid, tile by tile: state, word, detail line and the sr-only sentence. */
async function expectGridMatchesPayload(
  page: Page,
  monitor: TestSessionMonitorResponse,
): Promise<void> {
  for (const [key, labelKey] of Object.entries(SUMMARY_LABEL_KEY)) {
    // `scoring_failed` is optional on the wire (Lane E's counter arrives only
    // once the API partitions the roster six ways) — a payload without it must
    // not render the stat at all, so there is nothing to read.
    const value = monitor.summary[key as MonitorSummaryKey];
    const stat = page.locator(`[data-slot="live-monitor-stat"][data-stat="${key}"]`);
    if (value === undefined) {
      await expect(stat).toHaveCount(0);
      continue;
    }
    await expect(stat).toContainText(String(value));
    await expect(stat).toContainText(cat(en, `${LIVE}.${labelKey}`));
  }

  const tiles = page.locator('[data-slot="live-monitor-tile"]');
  await expect(tiles).toHaveCount(monitor.students.length);

  for (const student of monitor.students) {
    const tile = page.locator(
      `[data-slot="live-monitor-tile"][data-student-id="${student.student_document_id}"]`,
    );
    await expect(tile).toHaveAttribute('data-state', student.state);
    await expect(tile).toContainText(student.display_name);
    // WCAG 2.2 AA 1.4.1: the state is TEXT on the tile, not only a tint.
    await expect(tile).toContainText(detailText(student));
    await expect(tile.locator('.sr-only')).toContainText(
      cat(en, `${LIVE}.${STATE_LABEL_KEY[student.state]}`),
    );
    const box = await tile.boundingBox();
    expect(box?.height ?? 0, `tile target height for ${student.display_name}`).toBeGreaterThanOrEqual(
      44,
    );
  }
}

test.describe('C-TS-3 live monitoring grid', () => {
  test('renders the real payload: five stat tiles, five states, server stall threshold', async ({
    page,
    request,
  }) => {
    const jwt = await apiLogin(request, 'teacher');
    const sessions = await readSessions(request, jwt);

    // Real sittings that between them paint every state the datastore holds.
    const scan = await findSittingsCovering(request, jwt, sessions, [
      'submitted',
      'stalled',
      'not_joined',
    ]);
    const distinct = new Map(
      [...scan.covering.values()].map((monitor) => [monitor.sitting.document_id, monitor]),
    );
    test.info().annotations.push({
      type: 'monitor-anomalies',
      description: JSON.stringify(scan.anomalies),
    });

    await page.setViewportSize({ width: 1280, height: 900 });
    await signIn(page, 'teacher');

    for (const monitor of distinct.values()) {
      const fresh = await readMonitor(request, jwt, monitor.sitting.document_id);
      await openMonitor(page, fresh.sitting.document_id);
      await expect(page.locator('h1')).toContainText(fresh.sitting.class.name);
      await expectGridMatchesPayload(page, fresh);

      // The legend names all FIVE states, and prints the server's own threshold.
      const legend = page.locator('[data-slot="live-monitor-legend"]');
      for (const key of Object.values(STATE_LABEL_KEY)) {
        await expect(legend).toContainText(cat(en, `${LIVE}.${key}`));
      }
      await expect(page.locator('[data-slot="live-monitor-stall-caption"]')).toHaveText(
        plural(cat(en, `${LIVE}.stallCaption`), fresh.stall_threshold_minutes),
      );

      const label = [...new Set(fresh.students.map((student) => student.state))].sort().join('+');
      await page.screenshot({
        path: path.join(SHOTS, `vfy037-live-monitor-${label}.png`),
        fullPage: true,
      });
    }

    // Any sitting whose monitor read did NOT answer 200 must paint the error
    // branch — a refusal the server made for real, never a grid of placeholders.
    const anomaly = scan.anomalies[0];
    if (anomaly) {
      await page.goto(`/en/dashboard/test-sessions/${anomaly.sittingDocumentId}`);
      await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute(
        'data-status',
        'error',
      );
      await expect(page.locator('[data-slot="live-monitor-tile"]')).toHaveCount(0);
    }
  });

  test('a foreign or unknown sitting renders the error branch, never an empty grid', async ({
    page,
  }) => {
    await signIn(page, 'teacher');
    await page.goto('/en/dashboard/test-sessions/thissittingdoesnotexist01');

    const surface = page.locator('[data-surface="teacher-live-monitor"]');
    await expect(surface).toHaveAttribute('data-status', 'error');
    await expect(surface).toContainText(cat(en, `${LIVE}.errorTitle`));
    await expect(page.locator('[data-slot="live-monitor-tile"]')).toHaveCount(0);
    await expect(page.locator('[data-slot="live-monitor-stat"]')).toHaveCount(0);

    await page.screenshot({ path: path.join(SHOTS, 'vfy037-live-monitor-404.png') });
  });
});
