import { readFile } from 'node:fs/promises';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { fetchWithRetry, loginCached } from './helpers/http';
import { cat, loadMessages } from './helpers/i18n';
import { fixtureClassId } from './helpers/fixture-class';
import { roleCredentials } from './helpers/credentials';

// Task 77 (st-mvp-pivot) targeted live check — NOT part of the suite.
// C-RPT-03 markdown LLM export (mvp spec 4.10): the API role matrix and
// headers, then the visible export button on the teacher results page - the
// downloaded file must carry every rostered student as "Firstname L.", the
// seven reading areas in plain words, honest not-yet-assessed lines, and NEVER
// a surname, an email, an ACARA phase or a probability.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = roleCredentials('teacher');
const SCHOOL_ADMIN_B = roleCredentials('schoolAdminB');
const PARENT = roleCredentials('parent');
const CLASS_ID = fixtureClassId(); // "EAL/D Year 7 - Room 4"

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  return loginCached(request, API, credentials);
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  // Wait for the SETTLED role landing (not the transient /dashboard hop), so a
  // late role redirect can never hijack the goto that follows. The axios
  // layer rides out any 429 on the auth POST, so allow for that here.
  await page.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

// C-RPT-03 is a pure composition of the C-RPT-01/C-RPT-02 payloads; these two
// maps mirror the renderer's AREA_NAMES / EXPORT_STATUS_WORDS exactly.
const AREA_NAMES: Record<string, string> = {
  R1: 'Decoding',
  R2: 'Vocabulary',
  R3: 'Grammar',
  R4: 'Gist',
  R5: 'Detail',
  R6: 'Inference',
  R7: 'Critical reading',
};
const EXPORT_STATUS_WORDS: Record<string, string> = {
  mastered: 'mastered',
  emerging: 'emerging',
  not_mastered: 'not mastered',
  not_assessed: 'not yet assessed',
};

interface ExportDiagnosticPayload {
  mastery: Array<{
    student_ref: string;
    attributes: Array<{ code: string; status: string }>;
  }>;
}

interface ExportProgressPayload {
  populated: boolean;
  benchmark_form: string | null;
  progress_form: string | null;
  students: Array<{
    student_ref: string;
    transitions: Array<{ attribute: string; statement: string }>;
    weeks_between: number;
  }>;
  not_assessed: Array<{ student_ref: string; attribute: string }>;
}

test.describe('task 77: markdown LLM export (C-RPT-03)', () => {
  // The timeout carries the 429 ride-out budget for batch runs (helpers/http.ts).
  test.describe.configure({ timeout: 120_000 });

  test('API: headers, body, privacy and the role matrix', async ({ request }) => {
    const teacherJwt = await login(request, TEACHER);
    const res = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/export.md`, {
        headers: { Authorization: `Bearer ${teacherJwt}` },
      }),
    );
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/markdown');
    expect(res.headers()['content-disposition']).toContain('attachment');
    expect(res.headers()['content-disposition']).toContain('-diagnostic.md');

    const body = await res.text();
    expect(body).toContain('# EAL/D Year 7 - Room 4 - reading profiles');
    expect(body).toContain('### Sofia P.');

    // Sofia's profile and movement lines are computed from the live C-RPT-01 /
    // C-RPT-02 payloads (the fixture keeps evolving through re-sits — never
    // pinned to a specific result chain).
    const diagnosticRes = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/diagnostic`, {
        headers: { Authorization: `Bearer ${teacherJwt}` },
      }),
    );
    expect(diagnosticRes.ok()).toBeTruthy();
    const diagnostic = ((await diagnosticRes.json()) as { data: ExportDiagnosticPayload }).data;
    const progressRes = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/progress`, {
        headers: { Authorization: `Bearer ${teacherJwt}` },
      }),
    );
    expect(progressRes.ok()).toBeTruthy();
    const progress = ((await progressRes.json()) as { data: ExportProgressPayload }).data;

    const sofiaMastery = diagnostic.mastery.find((row) => row.student_ref === 'Sofia P.');
    expect(sofiaMastery).toBeTruthy();
    if (sofiaMastery!.attributes.every((attribute) => attribute.status === 'not_assessed')) {
      expect(body).toContain('Not yet assessed - no completed test on record.');
    } else {
      expect(body).toContain('Most recent assessed profile:');
      for (const attribute of sofiaMastery!.attributes) {
        expect(body).toContain(
          `- ${AREA_NAMES[attribute.code] ?? attribute.code}: ${EXPORT_STATUS_WORDS[attribute.status]}`,
        );
      }
    }
    expect(body).toContain('Emma L.'); // the footer naming-convention note

    // Test B categories once sat: Sofia's A -> B movement lines.
    const sofiaProgress = progress.students.find((row) => row.student_ref === 'Sofia P.');
    expect(sofiaProgress).toBeTruthy();
    expect(body).toContain(
      `Movement from Test A (${progress.benchmark_form}) to Test B (${progress.progress_form}), ${sofiaProgress!.weeks_between} weeks apart:`,
    );
    for (const transition of sofiaProgress!.transitions) {
      expect(body).toContain(`- ${transition.statement}`);
    }
    const missingAreas = progress.not_assessed
      .filter((row) => row.student_ref === 'Sofia P.')
      .map((row) => AREA_NAMES[row.attribute] ?? row.attribute);
    if (missingAreas.length > 0) {
      expect(body).toContain(`- Not assessed on one or both tests: ${missingAreas.join(', ')}`);
    }

    // Privacy: no surnames, no emails, no ACARA phase, no probabilities.
    expect(body).not.toMatch(/petrov|kim\b|alpha|beta/i);
    expect(body).not.toContain('@');
    expect(body).not.toMatch(/acara|phase/i);
    expect(body).not.toMatch(/prob/i);

    // Role matrix: 401 forged, 403 parent / wrong-school admin, 404 unknown class.
    const forged = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/export.md`, {
        headers: { Authorization: 'Bearer garbage' },
      }),
    );
    expect(forged.status()).toBe(401);
    const parentJwt = await login(request, PARENT);
    const parent = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/export.md`, {
        headers: { Authorization: `Bearer ${parentJwt}` },
      }),
    );
    expect(parent.status()).toBe(403);
    const adminBJwt = await login(request, SCHOOL_ADMIN_B);
    const wrongSchool = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/${CLASS_ID}/export.md`, {
        headers: { Authorization: `Bearer ${adminBJwt}` },
      }),
    );
    expect(wrongSchool.status()).toBe(403);
    const unknown = await fetchWithRetry(() =>
      request.get(`${API}/api/schools/me/classes/zzzzzzzzzzzzzzzzzzzzzzzz/export.md`, {
        headers: { Authorization: `Bearer ${teacherJwt}` },
      }),
    );
    expect(unknown.status()).toBe(404);
  });

  test('UI: the export button downloads the same markdown from the results page', async ({
    page,
  }) => {
    await signIn(page, TEACHER);
    await page.goto(`/en/dashboard/teach/results/${CLASS_ID}`);
    const screen = page.locator('[data-surface="teacher-diagnostic"]');
    await expect(screen).toBeVisible({ timeout: 20_000 });

    const exportSlot = screen.locator('[data-slot="export-markdown"]');
    await expect(exportSlot).toBeVisible();
    const button = exportSlot.getByRole('button', {
      name: cat(en, 'Teach.diagnostic.export.cta'),
      exact: true,
    });
    await expect(button).toBeVisible();

    const [download] = await Promise.all([page.waitForEvent('download'), button.click()]);
    expect(download.suggestedFilename()).toBe('eal-d-year-7-room-4-diagnostic.md');

    const path = await download.path();
    expect(path).toBeTruthy();
    const body = await readFile(path!, 'utf-8');
    expect(body).toContain('# EAL/D Year 7 - Room 4 - reading profiles');
    expect(body).toContain('### Sofia P.');
    expect(body).toContain('## How to use this file');
    expect(body).toContain('## Student profiles');
    expect(body).not.toMatch(/petrov|kim\b|alpha|beta/i);
    expect(body).not.toContain('@');
    expect(body).not.toMatch(/acara|phase/i);

    // The button settled back to its resting state (no error alert).
    await expect(button).toBeVisible();
    await expect(exportSlot.getByRole('alert')).toHaveCount(0);
  });
});
