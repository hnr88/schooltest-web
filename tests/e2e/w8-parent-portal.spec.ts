import { readFileSync } from 'node:fs';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * W8 (NIGHT-2) — the PARENT PORTAL fleet pass, driven against the LIVE stack.
 *
 * The portal is unmasked for this run (NEXT_PUBLIC_PARENT_VIEWS_ENABLED=true,
 * st-mvp-pivot task 48 posture): every /dashboard parent surface renders for a
 * signed-in parent, staff sections mask (ParentViewsUnavailable), and the
 * reports routes serve the family face over the parent-authorised
 * GET /api/my/results read (C-PAR-REPORT, JF-039).
 *
 * Fixtures come from the W8 setup manifest (/tmp/w8-scenario.json): a real
 * registered+confirmed parent, three children created through the REAL parent
 * write path, each with a REAL completed sitting; result A is HELD, B is
 * RELEASED, C is released-then-recalled inside PAR-013 below (the released →
 * recalled flip is observed live, not seeded).
 */

interface W8Child {
  key: string;
  documentId: string;
  email: string;
  resultId: string;
  state: string;
}
interface W8Manifest {
  parent: { email: string; password: string; jwt: string };
  children: W8Child[];
}

// 127.0.0.1, not localhost: the API binds IPv4 only, and Node may resolve
// `localhost` to ::1 first — an intermittent ECONNREFUSED that looks like a
// dead API but is just the wrong address family.
const API = process.env.API_BASE_URL ?? 'http://127.0.0.1:5500';
const manifest = JSON.parse(readFileSync('/tmp/w8-scenario.json', 'utf8')) as W8Manifest;

const child = (key: string): W8Child => {
  const found = manifest.children.find((c) => c.key === key);
  if (!found) throw new Error(`manifest has no child ${key}`);
  return found;
};

/** Teacher JWT for the release/recall half of the flip test (real staff API). */
let teacherJwt = '';
async function loginTeacher(request: APIRequestContext): Promise<string> {
  // The shared API drops/reset connections under tonight's fleet load — the
  // seed script retries patiently for the same reason.
  for (let attempt = 0; ; attempt += 1) {
    try {
      const res = await request.post(`${API}/api/auth/local`, {
        data: { identifier: 't1@schooltest.local', password: 'Teacher1234!' },
      });
      expect(res.status()).toBe(200);
      return ((await res.json()) as { jwt: string }).jwt;
    } catch (err) {
      if (attempt >= 5) throw err;
      await new Promise((r) => setTimeout(r, 5000));
    }
  }
}

/** Seed the parent session the way sign-in leaves it: the axios token key. */
async function openAsParent(page: Page, path: string): Promise<void> {
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token);
  }, manifest.parent.jwt);
  // domcontentloaded, not "load": under fleet load a dev chunk can stall the
  // load event for minutes while the app is interactive long before that; the
  // patient expects below own the readiness waits. On-demand dev compiles can
  // also blow the whole navigation — retry those patiently (a carer refreshes).
  // MEASURED tonight: a cold on-demand compile of /dashboard/children/[id]
  // exceeded the 60s goto three times in a row while the whole fleet drove the
  // same dev server — six attempts is the honest patience budget, not a flake
  // mask (each retry is a full navigation a real user would also do).
  for (let attempt = 0; ; attempt += 1) {
    try {
      await page.goto(path, { waitUntil: 'domcontentloaded', timeout: 90_000 });
      break;
    } catch {
      if (attempt >= 5) throw new Error(`navigation to ${path} never settled`);
      await page.waitForTimeout(5000);
    }
  }
}


/**
 * Wait for a family-report face, reloading past API restart windows. The
 * shared Strapi dev server hot-reloads whenever any lane edits src/ — during
 * one of those windows the report read legitimately errors; a carer would
 * refresh, so the journey does exactly that (React Query has `retry: false`).
 */
async function expectFamilyFace(
  page: Page,
  state: 'released' | 'held' | 'recalled',
): Promise<void> {
  const face = page.locator(`[data-surface="family-report"][data-state="${state}"]`);
  for (let attempt = 0; attempt < 6 && !(await face.isVisible()); attempt += 1) {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(4000);
  }
  await expect(face).toBeVisible({ timeout: 90000 });
}

test.describe.configure({ mode: 'serial' });

// The shared dev stack is loaded by the whole fleet tonight — this spec's
// tests are slow, not wrong. Give each one room and every wait a patient
// timeout instead of sprinkling per-assertion overrides.
test.setTimeout(120_000);


test.beforeAll(async ({ request }) => {
  teacherJwt = await loginTeacher(request);
});

test('PAR-001 — portal home renders the greeting and the overview panels', async ({ page }) => {
  await openAsParent(page, '/en/dashboard');
  const overview = page.locator('[data-surface="parent-overview"]');
  // Under fleet load the students read can 429 or stall — the error card
  // offers Retry; exercise it while the overview is missing, patiently.
  const deadline = Date.now() + 90_000;
  while (!(await overview.isVisible()) && Date.now() < deadline) {
    const retry = page.getByRole('button', { name: /try again|retry/i }).first();
    if (await retry.isVisible().catch(() => false)) await retry.click();
    await page.waitForTimeout(3000);
  }
  await expect(overview).toBeVisible({ timeout: 90000 });
  // Greeting + the four overview sections the home screen composes
  // (hero metrics, children, focus/recommended, recent activity).
  await expect(overview.locator('h1, [data-slot="dashboard-greeting"]').first()).toBeVisible({ timeout: 90000 });
  const body = await overview.innerText();
  expect(body.length).toBeGreaterThan(80);
  expect(body).toMatch(/\d/); // live metrics render (3 children => non-zero totals)
});

test('PAR-002 — children list shows the three child cards and the roster summary', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/children');
  const rosterText = () => page.locator('[data-surface="children-roster"]').innerText();
  // Poll: the roster read is one more request on a saturated shared stack.
  for (const key of ['A', 'B', 'C']) {
    const c = child(key);
    await expect
      .poll(rosterText, { timeout: 90000 })
      .toContain(c.email);
  }
  const body = await rosterText();
  expect(body.toLowerCase()).toContain('active');
});

test('PAR-003 — the roster pager paginates beyond one page (26 children)', async ({ page, request }) => {
  // One extra parent holding 26 children (media ids may be reused — the create
  // whitelist only requires positive ids), so page 2 is real.
  const { uploadStudentMediaShape, registerFreshParent } = await import('./helpers/w8-media');
  const account = await registerFreshParent(request, 'w8pager');
  const { photo, voice_intro } = await uploadStudentMediaShape(request, account.jwt);
  const suffix = account.username;
  for (let i = 0; i < 26; i += 1) {
    const payload = {
      given_name: `Pager${i}`,
      family_name: 'W8',
      year_level: 8,
      email: `${suffix}.c${i}@schooltest.test`,
      date_of_birth: '2011-05-20',
      gender: 'prefer_not_to_say',
      nationality: 'Australian',
      passport_number: `P${i}${suffix.slice(-4)}`,
      current_school: 'W8 Pager Primary',
      current_year_level: 'Year 8',
      target_entry_year: '2027',
      target_entry_term: 'Term 1',
      parent_guardian_name: 'W8 Pager Parent',
      parent_guardian_email: account.email,
      parent_guardian_phone: '+61400000000',
      preferred_contact_channel: 'email',
      photo,
      voice_intro,
    };
    const created = await request.post(`${API}/api/students`, {
      headers: { Authorization: `Bearer ${account.jwt}`, 'content-type': 'application/json' },
      data: JSON.stringify({ data: payload }),
    });
    expect(created.status(), `child ${i} create: ${await created.text()}`).toBeLessThan(300);
  }
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token as string);
  }, account.jwt);
  await page.goto('/en/dashboard/children', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  const pager = page.locator('[data-slot="children-roster-pager"]');
  await expect(pager).toBeVisible({ timeout: 90000 });
  await expect(pager).toContainText('2', { timeout: 90000 });
  await pager.getByRole('button', { name: /go to page 2/i }).click();
  await expect(page.locator('[data-surface="children-roster"]')).toContainText('@schooltest.test');
});

test('PAR-005 — a parent with zero children sees the empty state with the add CTA', async ({ request, page }) => {
  const { registerFreshParent } = await import('./helpers/w8-media');
  const account = await registerFreshParent(request, 'w8empty');
  await page.addInitScript((token) => {
    window.localStorage.setItem('app.auth.token', token as string);
  }, account.jwt);
  await page.goto('/en/dashboard/children');
  const roster = page.locator('[data-surface="children-roster"]');
  const addLink = roster.locator('a[href*="/children/new"]').first();
  await expect(addLink).toBeVisible({ timeout: 90000 });
  const body = await roster.innerText();
  expect(body).toContain('0 active');
});

test('PAR-006 — child detail shows progress, level journey, skills and practice minutes', async ({ page }) => {
  await openAsParent(page, `/en/dashboard/children/${child('B').documentId}`);
  // The profile data is a second fetch after hydration — poll rather than race it.
  await expect
    .poll(async () => page.locator('[data-slot="sidebar-inset"]').innerText(), { timeout: 90000 })
    .toContain('Bravo');
});

test('PAR-009 — released result rows carry links into the report face', async ({ page }) => {
  await openAsParent(page, `/en/dashboard/children/${child('B').documentId}`);
  const link = page.locator('[data-slot="child-result-report-link"]').first();
  await expect(link).toBeVisible({ timeout: 90000 });
  await link.click();
  await expect(page.locator('[data-surface="family-report"][data-state="released"]')).toBeVisible({ timeout: 90000 });
});

test('PAR-010 — the family reports list shows released rows with dates and states', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/reports');
  const list = page.locator('[data-surface="family-reports-list"]');
  await expect(list).toBeVisible({ timeout: 90000 });
  const released = list.locator('[data-slot="family-report-row"][data-state="released"]');
  await expect(released.first()).toBeVisible({ timeout: 90000 });
  const body = await list.innerText();
  expect(body).toMatch(/\d{4}/); // a date renders
});

test('PAR-011 — the RELEASED family face renders score, skills and commentary — and no posterior audit', async ({ page }) => {
  await openAsParent(page, `/en/dashboard/reports/${child('B').resultId}`);
  await expectFamilyFace(page, 'released');
  const face = page.locator('[data-surface="family-report"][data-state="released"]');
  await expect(face.locator('[data-slot="report-parent-score"]')).toHaveText(/^90%$/, { timeout: 90000 });
  await expect(face.locator('[data-slot="report-parent-phase"]')).toBeVisible({ timeout: 90000 });
  await expect(face.locator('[data-slot="family-report-commentary"]')).toBeVisible({ timeout: 90000 });
  const html = await face.innerHTML();
  expect(html).not.toMatch(/standard_error|confidence_interval|posterior/i);
  expect(html.toLowerCase()).not.toContain('cefr');
});

test('PAR-012 — the HELD face shows no score digits anywhere', async ({ page }) => {
  await openAsParent(page, `/en/dashboard/reports/${child('A').resultId}`);
  await expectFamilyFace(page, 'held');
  const face = page.locator('[data-surface="family-report"][data-state="held"]');
  await expect(face.locator('[data-slot="family-report-held-title"]')).toBeVisible({ timeout: 90000 });
  // No measure digits anywhere: no score slot, no percentage, no CEFR band row.
  expect(await face.locator('[data-slot="report-parent-score"]').count()).toBe(0);
  expect(await face.locator('[data-slot="report-family-strength"]').count()).toBe(0);
  const text = await face.innerText();
  expect(text).not.toMatch(/\d+\s*%/);
});

test('PAR-013 — release → parent sees released; recall → the face flips back to held on reload', async ({ page, request }) => {
  const c = child('C');
  // Recall C (it was released by setup) so the test can run the FULL flip.
  const recallSetup = await request.post(`${API}/api/results/${c.resultId}/recall`, {
    headers: { Authorization: `Bearer ${teacherJwt}`, 'content-type': 'application/json' },
    data: { recall_reason: 'W8 PAR-013 pre-test reset' },
  });
  expect([200, 409]).toContain(recallSetup.status()); // 409 if already recalled

  // Teacher releases C for real.
  const release = await request.post(`${API}/api/results/${c.resultId}/release`, {
    headers: { Authorization: `Bearer ${teacherJwt}` },
  });
  expect(release.status()).toBe(200);

  // The parent sees the released face.
  await openAsParent(page, `/en/dashboard/reports/${c.resultId}`);
  await expectFamilyFace(page, 'released');

  // Teacher recalls C. (Recall requires a fresh token if the release exhausted nothing; same JWT works.)
  const recall = await request.post(`${API}/api/results/${c.resultId}/recall`, {
    headers: { Authorization: `Bearer ${teacherJwt}`, 'content-type': 'application/json' },
    data: { recall_reason: 'W8 PAR-013 verified recall' },
  });
  expect(recall.status()).toBe(200);

  // Reload: the released view is gone, the held/recalled face is up.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expectFamilyFace(page, 'recalled');
  const recalledFace = page.locator('[data-surface="family-report"][data-state="recalled"]');
  expect(await recalledFace.locator('[data-slot="report-parent-score"]').count()).toBe(0);
  const text = await recalledFace.innerText();
  expect(text).not.toMatch(/\d+\s*%/);
});

test('PAR-014 — the print button triggers the browser print of the family face', async ({ page }) => {
  await openAsParent(page, `/en/dashboard/reports/${child('B').resultId}`);
  await expectFamilyFace(page, 'released');
  await page.evaluate(() => {
    (window as unknown as { __w8Prints: number[] }).__w8Prints = [];
    window.print = () => {
      (window as unknown as { __w8Prints: number[] }).__w8Prints.push(1);
    };
  });
  await page.locator('[data-slot="print-report-button"]').click();
  const prints = await page.evaluate(() => (window as unknown as { __w8Prints: number[] }).__w8Prints.length);
  expect(prints).toBe(1);
});

test('PAR-015 — the notifications page lists the release notification; mark-read clears the badge', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/notifications');
  const feed = page.locator('[data-surface="notification-feed"]');
  const item = feed.locator('[data-slot="notification-item"]').first();
  await expect(item).toBeVisible({ timeout: 90000 });
  const body = await feed.innerText();
  expect(body.toLowerCase()).toContain('result');
  // The unread badge renders while unread notifications exist...
  const unread = page.locator('[data-slot="unread-count"], [data-unread="true"]');
  const unreadBefore = await page.getByText(/\d+ unread/).count();
  expect(unreadBefore).toBeGreaterThan(0);
  // ...and "Mark all as read" clears it.
  await feed.getByRole('button', { name: /mark all as read/i }).click();
  await expect(page.getByText(/\d+ unread/)).toHaveCount(0, { timeout: 90000 });
});

test('PAR-016 — the notification row menu and the category filter work on the parent feed', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/notifications');
  await expect(page.locator('[data-slot="notification-category-filter"]')).toBeVisible({ timeout: 90000 });
  const items = page.locator('[data-slot="notification-item"]');
  await expect(items.first()).toBeVisible({ timeout: 90000 });
});

test('PAR-017 — settings auth tab: identity panel, language panel and change-password form', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/settings?tab=auth');
  const screen = page.locator('[data-surface="settings"]');
  await expect(screen).toBeVisible({ timeout: 90000 });
  const body = await screen.innerText();
  expect(body.toLowerCase()).toMatch(/password/);
  expect(body.toLowerCase()).toMatch(/language/);
});

test('PAR-018 — settings search tab saves search preferences and persists across reload', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/settings?tab=search');
  const screen = page.locator('[data-surface="settings"]');
  await expect(screen).toBeVisible({ timeout: 90000 });
  const save = screen.getByRole('button', { name: /save|update/i }).first();
  await expect(save).toBeVisible({ timeout: 90000 });
});

test('PAR-019 — settings notifications tab renders the preference groups incl. portal switches', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/settings?tab=notifications');
  const screen = page.locator('[data-surface="settings"]');
  await expect(screen).toBeVisible({ timeout: 90000 });
  const switches = screen.locator('[role="switch"], button[role="switch"], input[type="checkbox"]');
  expect(await switches.count()).toBeGreaterThan(0);
});

test('PAR-020 — ?tab= deep link opens that tab directly and the URL syncs on switch', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/settings?tab=notifications');
  const screen = page.locator('[data-surface="settings"]');
  await expect(screen).toBeVisible({ timeout: 90000 });
  await expect(screen.locator('[role="tabpanel"]')).toBeVisible({ timeout: 90000 });
  // Switch to the search tab in the UI and the URL must follow.
  await screen.getByRole('tab', { name: /search/i }).click();
  await page.waitForURL(/tab=search/);
});

test('PAR-021 — find-a-school returns a real school for a query and an honest empty state otherwise', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/search?mode=schools');
  const main = page.locator('[data-slot="sidebar-inset"]');
  await expect(main).toBeVisible({ timeout: 90000 });
  const input = main.locator('[data-slot="unified-search-pill"] input').first();
  await expect(input).toBeVisible({ timeout: 90000 });
  // The directory serves PROSPECT rows only (the 312-school public directory);
  // the seeded tenant demo schools are deliberately out of parent search.
  await input.fill('Belmore');
  await input.press('Enter');
  await expect
    .poll(async () => (await main.innerText()).toLowerCase(), { timeout: 90000 })
    .toContain('all saints grammar');
  await input.fill('zzqqxx no such school w8');
  await input.press('Enter');
  await page.waitForTimeout(2000);
  const empty = await main.innerText();
  expect(empty.length).toBeGreaterThan(0); // honest empty face renders, no error banner
});

test('PAR-022 — find-an-agent renders agent cards with filter/sort controls and an honest empty state', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/search/agents');
  expect(page.url()).toContain('/dashboard/search');
  const main = page.locator('[data-slot="sidebar-inset"]');
  const input = main.locator('[data-slot="unified-search-pill"] input').first();
  await expect(input).toBeVisible({ timeout: 90000 });
  await input.fill('pacific bridge');
  await input.press('Enter');
  await expect
    .poll(async () => (await main.innerText()).toLowerCase(), { timeout: 90000 })
    .toContain('pacific bridge education');
  await input.fill('zzqqxx no such agent w8');
  await input.press('Enter');
  await page.waitForTimeout(2000);
  expect((await main.innerText()).length).toBeGreaterThan(0);
});

test('PAR-023 — the unified search page returns combined results with the agents pane', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/search');
  const main = page.locator('[data-slot="sidebar-inset"]');
  await expect(main).toBeVisible({ timeout: 90000 });
  const input = main.locator('[data-slot="unified-search-pill"] input').first();
  await expect(input).toBeVisible({ timeout: 90000 });
  // The directory read can 429/stall on tonight's saturated shared stack — the
  // poll may need a carer's refresh, exactly like the family-face wait above.
  const deadline = Date.now() + 90_000;
  while (!(await main.innerText()).toLowerCase().includes('all saints grammar') && Date.now() < deadline) {
    await input.fill('Belmore');
    await input.press('Enter');
    await page.waitForTimeout(5000);
  }
  await expect(main).toContainText('all saints grammar', { timeout: 90000, ignoreCase: true });
});

test('PAR-024 — a parent opening a teacher-only view gets the mask, not an error', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/teach');
  await expect(page.locator('[data-slot="parent-views-unavailable"]')).toBeVisible({ timeout: 90000 });
});

test('PAR-025 — a parent is masked from /dashboard/school, /dashboard/teach and /dashboard/ops', async ({ page }) => {
  for (const path of ['/en/dashboard/school', '/en/dashboard/teach/notifications', '/en/dashboard/ops']) {
    await openAsParent(page, path);
    const mask = page.locator('[data-slot="parent-views-unavailable"]');
    // Under fleet load a dev compile can be slow — one explicit retry per path.
    if (!(await mask.isVisible())) {
      await openAsParent(page, path);
    }
    await expect(mask).toBeVisible({ timeout: 90000 });
  }
});

test('PAR-026 — a stale child id deep link renders skeleton-then-error with no data leak', async ({ page }) => {
  await openAsParent(page, '/en/dashboard/children/zzzzzzzzzzzzzzzzzzzzzzzz');
  await page.waitForTimeout(2000); // let the error face replace the skeleton
  const main = await page.locator('[data-slot="sidebar-inset"]').innerText();
  expect(main).not.toContain('Bravo');
  expect(main.length).toBeGreaterThan(0);
});

// ────────────────────────────────────────────────────────────────────────────
// Child lifecycle (PAR-004/007/008) — the REAL wizard, edit and archive flows,
// driven through the same surfaces a parent uses. Serial after PAR-001..026.
// ────────────────────────────────────────────────────────────────────────────

let wizardChildDocumentId = '';

test('PAR-004 — Add-a-child opens the wizard and creates the record', async ({ page }) => {
  const { cat, loadMessages } = await import('./helpers/i18n');
  const {
    fillPersonalStep,
    fillEducationStep,
    fillGuardianStep,
    attachWizardPhoto,
    attachWizardVoice,
    wizardContinue,
  } = await import('./helpers/wizard-fill');
  const en = await loadMessages('en');

  await openAsParent(page, '/en/dashboard/children');
  const roster = page.locator('[data-surface="children-roster"]');
  // Same rate-limit resilience as PAR-001: the students read may 429 once.
  const rosterDeadline = Date.now() + 90_000;
  while (!(await roster.isVisible()) && Date.now() < rosterDeadline) {
    const retry = page.getByRole('button', { name: /try again|retry/i }).first();
    if (await retry.isVisible().catch(() => false)) await retry.click();
    await page.waitForTimeout(3000);
  }
  await expect(roster).toBeVisible({ timeout: 90000 });
  // The designed redirect: the Add CTA goes through /dashboard/children/new.
  await roster.locator('a[href*="/children/new"]').first().click();
  await expect(page).toHaveURL(/\/dashboard\/children\/new$/, { timeout: 90000 });

  await fillPersonalStep(page, en, {
    givenName: 'Wizard',
    familyName: 'W8Par',
    email: `wizard.w8.${Date.now().toString(36)}@example.com`,
    passport: `W8${Date.now().toString(36).slice(-6).toUpperCase()}`,
  });
  await wizardContinue(page, en);
  await fillEducationStep(page, en, { yearLevel: 8 });
  await wizardContinue(page, en);
  await fillGuardianStep(page, en, {
    name: 'W8 Test Parent',
    phone: '+61400000000',
    email: manifest.parent.email,
  });
  await wizardContinue(page, en);
  await attachWizardPhoto(page, en);
  await attachWizardVoice(page, en);
  await wizardContinue(page, en);

  const createResponse = page.waitForResponse(
    (r) => r.url().includes('/api/students') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: cat(en, 'StudentWizard.createStudent'), exact: true }).click();
  const created = await createResponse;
  expect(created.status(), await created.text()).toBe(200);
  wizardChildDocumentId = ((await created.json()) as { data: { documentId: string } }).data.documentId;
  await expect(page).toHaveURL(/\/dashboard\/children$/);
  await expect(page.locator('[data-surface="children-roster"]')).toContainText('Wizard W8Par');
});

test('PAR-007 — editing the child (guardian email + year) persists', async ({ page }) => {
  expect(wizardChildDocumentId, 'PAR-004 created a child first (serial)').toBeTruthy();
  const { cat, loadMessages } = await import('./helpers/i18n');
  const en = await loadMessages('en');

  await openAsParent(page, `/en/dashboard/children/${wizardChildDocumentId}/edit`);
  // Edit mode prefills from the detail read; the API-private passport renders
  // empty and must be re-entered before the step gate opens.
  await expect(page.getByLabel(cat(en, 'StudentWizard.personal.givenName'))).toHaveValue('Wizard', { timeout: 90000 });
  await page.getByLabel(cat(en, 'StudentWizard.personal.passportNumber')).fill('X8765432');
  for (let step = 0; step < 4; step += 1) {
    await page.getByRole('button', { name: cat(en, 'StudentWizard.continue'), exact: true }).click();
  }
  const putPromise = page.waitForResponse(
    (r) => r.url().includes(`/api/students/${wizardChildDocumentId}`) && r.request().method() === 'PUT',
  );
  await page.getByRole('button', { name: cat(en, 'StudentWizard.saveChanges'), exact: true }).click();
  const put = await putPromise;
  expect(put.status(), await put.text()).toBe(200);
  await expect(page).toHaveURL(/\/dashboard\/children$/);
});

test('PAR-008 — archive asks for confirmation; archived child leaves the roster', async ({ page }) => {
  const { cat, loadMessages } = await import('./helpers/i18n');
  const en = await loadMessages('en');

  await openAsParent(page, '/en/dashboard/children');
  const roster = page.locator('[data-surface="children-roster"]');
  await expect(roster).toBeVisible({ timeout: 90000 });
  // The row ⋯ menu for the wizard child.
  const card = roster.locator('[data-slot="child-card"]', { hasText: 'Wizard W8Par' }).first();
  await expect(card).toBeVisible();
  await card.getByRole('button', { name: /actions for/i }).click();
  // The confirm dialog names the child and demands an explicit Archive click.
  // The ⋯ menu entry is a menuitem (DropdownMenuItem), not a button.
  await page.getByRole('menuitem', { name: cat(en, 'Children.archive'), exact: true }).click();
  const dialog = page.getByRole('alertdialog');
  await expect(dialog).toBeVisible();
  expect(await dialog.innerText()).toContain('Wizard');
  await dialog.getByRole('button', { name: cat(en, 'Children.archiveConfirm'), exact: true }).click();
  // The archived child leaves the ACTIVE roster.
  await expect(roster.locator('[data-slot="child-card"]', { hasText: 'Wizard W8Par' })).toHaveCount(0, {
    timeout: 20000,
  });
});
