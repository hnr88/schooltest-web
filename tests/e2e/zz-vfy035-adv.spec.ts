import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type Response } from '@playwright/test';

import { runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { signIn } from './helpers/teacher-rail';

// INDEPENDENT ADVERSARIAL VERIFICATION of task 035 (join code + big code display).
// Written by the verifier, not the builder. Everything is measured against the
// RUNNING stack: the real /sign-in form, the real Strapi on :5500, the real
// Postgres on :5540. Nothing here is fixtured.

const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
const API = 'http://localhost:5500';
const en = loadMessages('en');
const zh = loadMessages('zh');

test.describe.configure({ mode: 'serial' });

const setup = (page: Page) => page.locator('[data-slot="test-session-setup"]');
const region = (page: Page) => page.locator('[data-slot="join-code-region"]');
const panel = (page: Page) => page.locator('[data-slot="join-code-panel"]');

interface DashboardBody {
  live_session: { sitting_document_id: string; code: string | null } | null;
}

/** Every C-TD-1 read this page made, newest last, with its parsed body. */
function watchDashboard(page: Page) {
  const seen: { at: number; body: DashboardBody }[] = [];
  page.on('response', (r: Response) => {
    if (r.url() === `${API}/api/teacher/dashboard` && r.request().method() === 'GET') {
      void r
        .json()
        .then((body: DashboardBody) => seen.push({ at: Date.now(), body }))
        .catch(() => undefined);
    }
  });
  return seen;
}

async function pickFirst(page: Page, label: string) {
  await setup(page).getByLabel(label).click();
  const option = page.getByRole('option').first();
  await expect(option).toBeVisible();
  const text = (await option.textContent())?.trim() ?? '';
  await option.click();
  return text;
}

/**
 * The persisted row behind one sitting documentId, as `code|status|teacher email`.
 * Sibling workflows are creating sittings on this same stack while this runs, so
 * "the newest open sitting" is a moving target — every assertion below is keyed to
 * the documentId ON SCREEN instead, which is race-proof and strictly stronger.
 */
function dbSitting(documentId: string): string {
  return runSql(
    `select coalesce(s.code,'<null>') || '|' || s.status || '|' || u.email
       from sittings s
       join sittings_class_lnk cl on cl.sitting_id = s.id
       join classes c on c.id = cl.class_id
       join classes_teacher_lnk tl on tl.class_id = c.id
       join up_users u on u.id = tl.user_id
      where s.document_id = '${documentId}'`,
  );
}

test('035-ADV: the displayed code is the SERVER row, before and after Generate', async ({
  page,
}) => {
  test.setTimeout(240_000);
  const dashboards = watchDashboard(page);
  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.url().startsWith(API) && r.method() === 'POST') posts.push(r.url());
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, 'teacher');
  await page.goto('/dashboard/test-sessions');
  await expect(setup(page)).toHaveAttribute('data-status', 'ready', { timeout: 90_000 });

  // ---- A. FIRST PAINT is a live read of a REAL open row, with no POST at all -
  await expect(panel(page)).toBeVisible({ timeout: 60_000 });
  const idBefore = (await panel(page).getAttribute('data-sitting-id')) ?? '';
  const codeBefore = (await panel(page).getAttribute('data-join-code')) ?? '';
  const rowBefore = dbSitting(idBefore);
  console.log(`[A] first paint ${codeBefore} (${idBefore}) ; psql => ${rowBefore}`);
  expect(rowBefore).toBe(`${codeBefore}|open|teacher@schooltest.local`);
  expect(posts.filter((u) => u.includes('/api/teacher/test-sessions'))).toHaveLength(0);

  // ---- B. Generate: the 201 the server actually minted ----------------------
  const className = await pickFirst(page, cat(en, 'Teacher.testSessions.setup.classLabel'));
  const testLabel = await pickFirst(page, cat(en, 'Teacher.testSessions.setup.testLabel'));
  const created = page.waitForResponse(
    (r) => r.url() === `${API}/api/teacher/test-sessions` && r.request().method() === 'POST',
  );
  const clickedAt = Date.now();
  await page
    .getByRole('button', { name: cat(en, 'Teacher.testSessions.setup.submit'), exact: true })
    .click();
  const res = await created;
  const body = (await res.json()) as { code: string; sitting_document_id: string };
  expect(res.status()).toBe(201);
  console.log(`[B] C-TS-1 201 ${JSON.stringify(body)}`);

  await expect(panel(page)).toHaveAttribute('data-join-code', body.code, { timeout: 60_000 });
  const shown = (await panel(page).getAttribute('data-join-code')) ?? '';
  const sittingId = (await panel(page).getAttribute('data-sitting-id')) ?? '';
  expect(shown).toBe(body.code);
  expect(sittingId).toBe(body.sitting_document_id);
  expect(shown).not.toBe(codeBefore); // it really changed
  expect(sittingId).not.toBe(idBefore);
  expect(shown).toMatch(/^READ-\d{4}$/); // F-SITTING-CODE, DECISIONS A3

  // The VISIBLE text is that code, not a re-rendered lookalike.
  const visible = (await panel(page).locator('p').first().innerText()).trim();
  expect(visible).toBe(shown);

  // ---- C. PERSISTED: psql says so ------------------------------------------
  const row = dbSitting(sittingId);
  console.log(`[C] psql sittings(${sittingId}) => ${row}`);
  expect(row).toBe(`${shown}|open|teacher@schooltest.local`);

  // ---- D. it came from the C-TD-1 RE-READ, not from the 201 handed across ---
  await expect
    .poll(
      () =>
        dashboards.filter((d) => d.at > clickedAt && d.body.live_session?.code === shown).length,
      { timeout: 30_000 },
    )
    .toBeGreaterThan(0);
  const latest = dashboards[dashboards.length - 1];
  expect(latest.body.live_session?.sitting_document_id).toBe(sittingId);
  console.log(`[D] post-click C-TD-1 reads = ${dashboards.filter((d) => d.at > clickedAt).length}`);

  // ---- E. caption/helper are catalog copy interpolated with the real picks --
  await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText(
    cat(en, 'Teacher.testSessions.joinCode.caption')
      .replace('{className}', className)
      .replace('{testLabel}', testLabel),
  );
  await expect(
    panel(page).getByText(cat(en, 'Teacher.testSessions.joinCode.helper'), { exact: true }),
  ).toBeVisible();

  await page.screenshot({ path: path.join(SHOTS, 'verify-035-join-code.png'), fullPage: true });

  // ---- F. survives F5, with ZERO create replayed ---------------------------
  const postsBeforeReload = posts.length;
  await page.reload();
  await expect(panel(page)).toHaveAttribute('data-join-code', shown, { timeout: 60_000 });
  await expect(panel(page)).toHaveAttribute('data-sitting-id', sittingId);
  expect(posts.slice(postsBeforeReload).filter((u) => u.includes('/test-sessions'))).toHaveLength(0);
  console.log(`[F] after F5 still ${shown}; creates replayed = 0`);
  await page.screenshot({ path: path.join(SHOTS, 'verify-035-after-reload.png'), fullPage: true });

  // ---- G. close it through the REAL C-TS-4; the panel must let go ----------
  const jwt = await page.evaluate(() => window.localStorage.getItem('app.auth.token'));
  const close = await page.request.post(
    `${API}/api/teacher/test-sessions/${sittingId}/close`,
    { headers: { Authorization: `Bearer ${jwt}` } },
  );
  expect(close.status()).toBe(200);
  expect(runSql(`select status from sittings where document_id = '${sittingId}'`)).toBe('closed');
  await page.reload();
  // The closed sitting must disappear; whatever replaces it must again be a REAL
  // open row of this teacher's (a sibling workflow may have opened one meanwhile).
  await expect(panel(page)).not.toHaveAttribute('data-sitting-id', sittingId, { timeout: 60_000 });
  const idAfter = (await panel(page).getAttribute('data-sitting-id')) ?? '';
  const codeAfter = (await panel(page).getAttribute('data-join-code')) ?? '';
  console.log(`[G] after C-TS-4 close the panel shows ${codeAfter} (${idAfter}) => ${dbSitting(idAfter)}`);
  expect(dbSitting(idAfter)).toBe(`${codeAfter}|open|teacher@schooltest.local`);
});

test('035-ADV: legible at a distance, a11y-clean, localised, and no canned fallback', async ({
  page,
  context,
}) => {
  test.setTimeout(240_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, 'teacher');
  await page.goto('/dashboard/test-sessions');
  await expect(panel(page)).toBeVisible({ timeout: 90_000 });
  const code = (await panel(page).getAttribute('data-join-code')) ?? '';
  expect(code).toMatch(/^READ-\d{4}$/);

  // ---- H. BIG type: the code is the largest text on the whole page ---------
  const metrics = await panel(page)
    .locator('p')
    .first()
    .evaluate((el) => {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const others = Array.from(document.querySelectorAll('body *'))
        .filter((n) => n !== el && (n.textContent ?? '').trim().length > 0 && n.children.length === 0)
        .map((n) => Number.parseFloat(getComputedStyle(n).fontSize));
      return {
        fontSize: Number.parseFloat(style.fontSize),
        fontFamily: style.fontFamily,
        weight: style.fontWeight,
        height: rect.height,
        width: rect.width,
        maxOtherFontSize: Math.max(...others),
      };
    });
  console.log(`[H] ${JSON.stringify(metrics)}`);
  expect(metrics.fontSize).toBeGreaterThanOrEqual(40);
  expect(metrics.fontSize).toBeGreaterThan(metrics.maxOtherFontSize);

  // ---- I. WCAG 2.2 AA targets, focus ring, state-in-words -------------------
  const copyBtn = panel(page).getByRole('button', {
    name: cat(en, 'Teacher.testSessions.joinCode.copy'),
    exact: true,
  });
  const goLive = panel(page).getByRole('link', {
    name: cat(en, 'Teacher.testSessions.joinCode.goLive'),
    exact: true,
  });
  for (const [label, loc] of [
    ['copy', copyBtn],
    ['goLive', goLive],
  ] as const) {
    const box = await loc.boundingBox();
    console.log(`[I] ${label} target = ${box?.width}x${box?.height}`);
    expect(box!.width).toBeGreaterThanOrEqual(44);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  }
  // Focus visibility measured through the REAL keyboard modality (:focus-visible
  // does not necessarily match a programmatic .focus() after a mouse click).
  const snapStyle = () =>
    copyBtn.evaluate((el) => {
      const s = getComputedStyle(el);
      return {
        borderColor: s.borderColor,
        outline: `${s.outlineStyle} ${s.outlineWidth} ${s.outlineColor}`,
        boxShadow: s.boxShadow,
      };
    });
  const blurred = await snapStyle();
  const beforeShot = await panel(page).screenshot();
  await panel(page).getByRole('heading', { level: 2 }).click();
  await page.keyboard.press('Tab');
  // The button carries `transition-all`, so the indicator is measured AFTER the
  // transition settles — reading it on the same frame catches the start values.
  await page.waitForTimeout(700);
  const focused = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el ? { label: el.textContent?.trim(), fv: el.matches(':focus-visible') } : null;
  });
  const lit = await snapStyle();
  const afterShot = await panel(page).screenshot();
  console.log(`[I] focus target = ${JSON.stringify(focused)}`);
  console.log(`[I] blurred = ${JSON.stringify(blurred)}`);
  console.log(`[I] focused = ${JSON.stringify(lit)}`);
  expect(focused?.label).toBe(cat(en, 'Teacher.testSessions.joinCode.copy'));
  expect(focused?.fv).toBe(true);
  // The indicator must be VISIBLE, i.e. the painted pixels actually change.
  expect(Buffer.compare(beforeShot, afterShot)).not.toBe(0);
  expect(JSON.stringify(lit)).not.toBe(JSON.stringify(blurred));
  await panel(page).screenshot({ path: path.join(SHOTS, 'verify-035-focus-ring.png') });
  await page.keyboard.press('Tab');
  const nextFocus = await page.evaluate(() => document.activeElement?.textContent?.trim());
  console.log(`[I] next tab stop = ${nextFocus}`);
  expect(nextFocus).toBe(cat(en, 'Teacher.testSessions.joinCode.goLive'));

  await copyBtn.click();
  await expect(
    panel(page).getByRole('button', {
      name: cat(en, 'Teacher.testSessions.joinCode.copied'),
      exact: true,
    }),
  ).toBeVisible();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  console.log(`[I] clipboard = ${JSON.stringify(clip)}`);
  expect(clip).toBe(code);
  expect(await goLive.getAttribute('href')).toBe(
    `/dashboard/test-sessions/${await panel(page).getAttribute('data-sitting-id')}`,
  );

  const axe = await new AxeBuilder({ page })
    .include('[data-slot="join-code-region"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  console.log(`[I] axe violations = ${axe.violations.length} ${JSON.stringify(axe.violations.map((v) => v.id))}`);
  expect(axe.violations).toHaveLength(0);

  // ---- J. 390px phone: still legible, no horizontal overflow ---------------
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(panel(page)).toBeVisible();
  const small = await panel(page)
    .locator('p')
    .first()
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log(`[J] 390px font=${small}px overflow=${overflow}px`);
  expect(small).toBeGreaterThanOrEqual(28);
  expect(overflow).toBeLessThanOrEqual(0);
  await page.setViewportSize({ width: 1280, height: 900 });

  // ---- K. i18n: zh renders the zh catalog, the code is untranslated --------
  await page.goto('/zh/dashboard/test-sessions');
  await expect(panel(page)).toHaveAttribute('data-join-code', code, { timeout: 60_000 });
  await expect(
    panel(page).getByText(cat(zh, 'Teacher.testSessions.joinCode.helper'), { exact: true }),
  ).toBeVisible();
  await expect(
    panel(page).getByRole('button', {
      name: cat(zh, 'Teacher.testSessions.joinCode.copy'),
      exact: true,
    }),
  ).toBeVisible();
  await expect(panel(page).getByText(cat(en, 'Teacher.testSessions.joinCode.helper'))).toHaveCount(0);
  await page.screenshot({ path: path.join(SHOTS, 'verify-035-zh.png'), fullPage: true });

  // ---- L. FAULT INJECTION: kill C-TD-1 — no canned code may appear ---------
  await page.route('**/api/teacher/dashboard', (r) => r.abort());
  await page.goto('/dashboard/test-sessions');
  await expect(region(page)).toHaveCount(1, { timeout: 60_000 });
  await expect(region(page)).toHaveAttribute('data-status', 'absent', { timeout: 60_000 });
  await page.waitForTimeout(3000);
  await expect(panel(page)).toHaveCount(0);
  const bodyText = await page.locator('body').innerText();
  expect(bodyText).not.toContain(code);
  expect(bodyText).not.toMatch(/READ-\d{4}/);
  // …and the failure is reported LOUDLY by the setup panel above, not swallowed.
  await expect(setup(page)).toHaveAttribute('data-status', 'error');
  await expect(
    page.getByText(cat(en, 'Teacher.testSessions.setup.loadErrorTitle'), { exact: true }),
  ).toBeVisible();
  console.log('[L] C-TD-1 aborted -> NO code panel, no READ-#### on the page, setup shows the error');
  await page.screenshot({ path: path.join(SHOTS, 'verify-035-no-fallback.png'), fullPage: true });
  await page.unroute('**/api/teacher/dashboard');
});

test('035-ADV: Go live actually navigates (037 owns the destination)', async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, 'teacher');
  await page.goto('/dashboard/test-sessions');
  await expect(panel(page)).toBeVisible({ timeout: 90_000 });
  const sittingId = await panel(page).getAttribute('data-sitting-id');
  await panel(page)
    .getByRole('link', { name: cat(en, 'Teacher.testSessions.joinCode.goLive'), exact: true })
    .click();
  await page.waitForURL(`**/dashboard/test-sessions/${sittingId}`, { timeout: 30_000 });
  const heading = await page.locator('h1, h2').first().innerText();
  console.log(`[M] Go live -> ${page.url()} | first heading: ${JSON.stringify(heading)}`);
  await page.screenshot({ path: path.join(SHOTS, 'verify-035-go-live-destination.png') });
});
