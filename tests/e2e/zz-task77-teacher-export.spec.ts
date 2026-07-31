import { readFile } from 'node:fs/promises';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat, loadMessages } from './helpers/i18n';

// Task 77 (st-mvp-pivot) targeted live check — NOT part of the suite.
// C-RPT-03 markdown LLM export (mvp spec 4.10): the API role matrix and
// headers, then the visible export button on the teacher results page - the
// downloaded file must carry every rostered student as "Firstname L.", the
// seven reading areas in plain words, honest not-yet-assessed lines, and NEVER
// a surname, an email, an ACARA phase or a probability.
const en = loadMessages('en');

const API = 'http://127.0.0.1:5500';
const TEACHER = { email: 'verify21@schooltest.local', password: 'Verify21!pw' };
const SCHOOL_ADMIN_B = { email: 'schooladmin-b@schooltest.local', password: 'BT77uuUGgqVSpFkP!A1' };
const PARENT = { email: 'parent@schooltest.local', password: 'yvmnVObAiaOJw2C1!A1' };
const CLASS_ID = 'x1hat1dy90boz11n9zyphoan'; // "EAL/D Year 7 - Room 4"

async function login(
  request: APIRequestContext,
  credentials: { email: string; password: string },
): Promise<string> {
  const res = await request.post(`${API}/api/auth/local`, {
    data: { identifier: credentials.email, password: credentials.password },
  });
  expect(res.ok()).toBeTruthy();
  return ((await res.json()) as { jwt: string }).jwt;
}

async function signIn(page: Page, credentials: { email: string; password: string }): Promise<void> {
  await page.goto('/sign-in');
  await page.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(credentials.email);
  await page
    .getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true })
    .fill(credentials.password);
  await page.getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
}

test.describe('task 77: markdown LLM export (C-RPT-03)', () => {
  test('API: headers, body, privacy and the role matrix', async ({ request }) => {
    const teacherJwt = await login(request, TEACHER);
    const res = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/export.md`, {
      headers: { Authorization: `Bearer ${teacherJwt}` },
    });
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('text/markdown');
    expect(res.headers()['content-disposition']).toContain('attachment');
    expect(res.headers()['content-disposition']).toContain('-diagnostic.md');

    const body = await res.text();
    expect(body).toContain('# EAL/D Year 7 - Room 4 - reading profiles');
    expect(body).toContain('### Sofia P.');
    expect(body).toContain('- Decoding: mastered');
    expect(body).toContain('Not yet assessed - no completed test on record.');
    expect(body).toContain('Emma L.'); // the footer naming-convention note
    // Test B categories once sat: Sofia's A -> B movement lines.
    expect(body).toContain('Movement from Test A (RDG-FT-A-79) to Test B (RDG-FT-B-79)');

    // Privacy: no surnames, no emails, no ACARA phase, no probabilities.
    expect(body).not.toMatch(/petrov|kim\b|alpha|beta/i);
    expect(body).not.toContain('@');
    expect(body).not.toMatch(/acara|phase/i);
    expect(body).not.toMatch(/prob/i);

    // Role matrix: 401 forged, 403 parent / wrong-school admin, 404 unknown class.
    const forged = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/export.md`, {
      headers: { Authorization: 'Bearer garbage' },
    });
    expect(forged.status()).toBe(401);
    const parentJwt = await login(request, PARENT);
    const parent = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/export.md`, {
      headers: { Authorization: `Bearer ${parentJwt}` },
    });
    expect(parent.status()).toBe(403);
    const adminBJwt = await login(request, SCHOOL_ADMIN_B);
    const wrongSchool = await request.get(`${API}/api/schools/me/classes/${CLASS_ID}/export.md`, {
      headers: { Authorization: `Bearer ${adminBJwt}` },
    });
    expect(wrongSchool.status()).toBe(403);
    const unknown = await request.get(
      `${API}/api/schools/me/classes/zzzzzzzzzzzzzzzzzzzzzzzz/export.md`,
      { headers: { Authorization: `Bearer ${teacherJwt}` } },
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
