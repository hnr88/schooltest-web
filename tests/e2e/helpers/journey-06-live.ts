import path from 'node:path';

import { expect, type APIRequestContext, type Page } from '@playwright/test';

import { classRosterResponseSchema } from '@/modules/results/schemas/roster.schema';
import { teacherExportPath } from '@/modules/teacher/lib/teacher-export';
import { resultViewSchema, type ResultView } from '@schooltest/scoring-contracts';

import { API_BASE } from './teacher-results-live';
import { en, navLink, signIn } from './teacher-rail';
import { cat } from './i18n';

/**
 * Journey 06 live reads — the ORACLE the spec compares the portal against.
 *
 * Every value the journey asserts is read here, from the same Strapi the browser
 * talks to, and parsed through the SHIPPED contract. So the spec carries no
 * expected number of its own: a scoring change cannot make it stale, and a
 * surface rendering a number the API never sent fails instead of passing.
 *
 * The sitting is CHOSEN from the live roster, never pinned by documentId — a
 * pinned id rots on the next reseed and its failure looks like a product fault.
 */
export const JOURNEY_06_SHOTS = path.resolve(
  process.cwd(),
  '..',
  '.qa',
  'journeys',
  '06-scoring-to-report',
  'shots',
);

/** The brief's capture size for this journey. */
export const JOURNEY_06_VIEWPORT = { width: 1440, height: 900 } as const;

export interface ScoredSitting {
  classDocumentId: string;
  studentDocumentId: string;
  studentName: string;
  /** The C-4 read: the score the API produced, contract-parsed. */
  view: ResultView;
}

/**
 * The teacher's first class, its roster, then C-4 for a SCORED row.
 *
 * `requireGrowth` picks a row whose `overall.delta` is non-null. That is not a
 * convenience: by contract a delta exists ONLY when a comparable previous scored
 * sitting was selected, so it is the one signal that says "this student has more
 * than one sitting" without a second fetch — and a trend assertion made on a
 * single-sitting student would pass while proving nothing.
 */
export async function pickScoredSitting(
  request: APIRequestContext,
  jwt: string,
  options: { requireGrowth?: boolean } = {},
): Promise<ScoredSitting> {
  const headers = { Authorization: `Bearer ${jwt}` };
  const dash = await request.get(`${API_BASE}/api/teacher/dashboard`, { headers });
  expect(dash.status(), 'C-TD-1 must answer for the journey teacher').toBe(200);
  const body = (await dash.json()) as { classes: { class_document_id: string }[] };
  const classDocumentId = body.classes[0]?.class_document_id;
  expect(classDocumentId, 'the journey teacher must own a class').toBeTruthy();

  const roster = await request.get(
    `${API_BASE}/api/my/students/results?class=${classDocumentId}`,
    { headers },
  );
  expect(roster.status(), 'the roster read must answer').toBe(200);
  const rows = classRosterResponseSchema.parse(await roster.json());
  // A SCORED sitting: one whose overall the pipeline actually produced. An
  // unscored row is a legitimate state and simply is not this journey.
  const candidates = rows.filter(
    (row) => row.result !== null && row.result.overall.domain_score !== null,
  );
  expect(candidates.length, 'the class must hold at least one scored sitting').toBeGreaterThan(0);
  // Prefer a sitting that also carries growth, so the movement assertions are
  // exercised rather than quietly skipped on a first-sitting student.
  const withGrowth = candidates.find((row) => row.result!.overall.delta !== null);
  if (options.requireGrowth) {
    expect(
      withGrowth,
      'this class must hold a sitting with a growth delta (a comparable previous scored sitting); without one a trend assertion proves nothing',
    ).toBeTruthy();
  }
  const scored = withGrowth ?? candidates[0];
  const resultDocumentId = scored.result!.document_id;

  // The CANONICAL read the portal itself uses, re-parsed here so a drift between
  // the roster row and C-4 fails before any DOM is touched.
  const c4 = await request.get(`${API_BASE}/api/results/${resultDocumentId}`, { headers });
  expect(c4.status(), `C-4 must answer for ${resultDocumentId}`).toBe(200);
  return {
    classDocumentId,
    studentDocumentId: scored.student.document_id,
    studentName: scored.student.name,
    view: resultViewSchema.parse(await c4.json()),
  };
}

/**
 * The GENERATED teacher report (C-TR-5): the server's own Markdown document,
 * fetched over the same path the export button builds. A different producer over
 * the same sitting, which is what makes comparing it to C-4 a real drift check.
 */
export async function generateStudentReport(
  request: APIRequestContext,
  jwt: string,
  sitting: ScoredSitting,
): Promise<string> {
  const url = `${API_BASE}${teacherExportPath({
    kind: 'student',
    classDocumentId: sitting.classDocumentId,
    studentDocumentId: sitting.studentDocumentId,
  })}`;
  const response = await request.get(url, { headers: { Authorization: `Bearer ${jwt}` } });
  expect(response.status(), 'the generated teacher report must answer').toBe(200);
  expect(response.headers()['content-type']).toContain('text/markdown');
  return response.text();
}

/** The LATEST-sitting block of the document — the sitting C-4 was read for. */
export function latestSittingSection(report: string): string {
  const start = report.lastIndexOf('## Latest sitting');
  expect(start, 'the generated report must carry a latest-sitting section').toBeGreaterThan(-1);
  const end = report.indexOf('## Movement between sittings', start);
  return end === -1 ? report.slice(start) : report.slice(start, end);
}

/** One `| Skill | Score | …` cell; `null` for the document's own "not reported". */
export function reportSkillScore(section: string, skill: string): string | null {
  const row = new RegExp(`^\\|\\s*${skill}\\s*\\|\\s*([^|]+?)\\s*\\|`, 'm').exec(section);
  expect(row, `the generated report must carry a ${skill} row`).not.toBeNull();
  return row![1] === 'not reported' ? null : row![1];
}

/** Every "Overall score | N / 100" the document states, one per sitting shown. */
export function reportStatedOveralls(report: string): number[] {
  return [...report.matchAll(/\| Overall score \| (\d+) \/ 100 \|/g)].map((match) =>
    Number(match[1]),
  );
}

/**
 * Sign in as the journey teacher through the REAL form, then ASSERT the persona.
 *
 * The assertion is the point. The managed runner drives the project's SHARED
 * visible tab, which arrives carrying whatever session the previous run left.
 * Measured: it held a PARENT session, so `/sign-in` is redirected to
 * `/dashboard` by the already-authenticated guard, the fields never render, and
 * the fill waits out the whole timeout — six false reds across three agents, one
 * burning 240s. Captured in
 * `.qa/journeys/06-scoring-to-report/shots/99-shared-tab-parked-on-parent-session.png`.
 *
 * A TEST CANNOT DISPLACE THAT SESSION, and all three routes were tried:
 * `page.context().clearCookies()` is refused (the context is the host's — "CDP
 * session does not belong to this Browser tab"); clearing `localStorage` does
 * not shift it either, so the session is not only the `app.auth.token` bearer;
 * and there is no sign-out ROUTE to navigate to. It needs a sign-out click or a
 * tab reset from outside the suite.
 *
 * So this asserts the persona instead of pretending it can fix it: a tab held by
 * someone else fails in seconds NAMING what it found, rather than as a mute
 * timeout that reads like a slow journey and invites raising the limit — the
 * trap that cost another worker four minutes.
 */
export async function signInAsJourneyTeacher(page: Page): Promise<void> {
  await signIn(page, 'teacher');
  await expect(
    navLink(page, cat(en, 'Shell.nav.results')),
    'signed in as the teacher persona, not whoever held the shared tab',
  ).toBeVisible({ timeout: 20_000 });
}
