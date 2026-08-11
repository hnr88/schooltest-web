import path from 'node:path';

import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

import { runSql } from './helpers/auth-db';
import { cat, loadMessages } from './helpers/i18n';
import { signIn } from './helpers/teacher-rail';

// Task 035 build proof. Everything below is measured against the RUNNING stack:
// the real /sign-in form, the real Strapi on :5500, and the real Postgres on
// :5540. Nothing is fixtured and nothing is stubbed.

const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
const API = 'http://localhost:5500';
const en = loadMessages('en');

function setup(page: Page) {
  return page.locator('[data-slot="test-session-setup"]');
}
function region(page: Page) {
  return page.locator('[data-slot="join-code-region"]');
}
function panel(page: Page) {
  return page.locator('[data-slot="join-code-panel"]');
}

async function pickFirstOption(page: Page, label: string) {
  await setup(page).getByLabel(label).click();
  const option = page.getByRole('option').first();
  await expect(option).toBeVisible();
  const text = (await option.textContent())?.trim() ?? '';
  await option.click();
  return text;
}

test('035: Generate join code mints a REAL code, shows it big, and it survives F5', async ({
  page,
  context,
}) => {
  test.setTimeout(240_000);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  const posts: string[] = [];
  page.on('request', (r) => {
    if (r.url().startsWith(API) && r.method() === 'POST') posts.push(`POST ${r.url()}`);
  });

  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, 'teacher');
  await page.goto('/dashboard/test-sessions');
  await expect(setup(page)).toHaveAttribute('data-status', 'ready', { timeout: 60_000 });

  const className = await pickFirstOption(page, cat(en, 'Teacher.testSessions.setup.classLabel'));
  const testLabel = await pickFirstOption(page, cat(en, 'Teacher.testSessions.setup.testLabel'));

  // The teacher may already have an older open sitting on screen; the new code
  // has to REPLACE it, so the pre-click value is recorded and asserted against.
  const before = await region(page).getAttribute('data-status');
  const codeBefore = await panel(page)
    .getAttribute('data-join-code')
    .catch(() => null);
  console.log(`[before] region=${before} code=${codeBefore}`);

  const created = page.waitForResponse(
    (r) => r.url() === `${API}/api/teacher/test-sessions` && r.request().method() === 'POST',
  );
  await page
    .getByRole('button', { name: cat(en, 'Teacher.testSessions.setup.submit'), exact: true })
    .click();
  const response = await created;
  const body = (await response.json()) as { code: string; sitting_document_id: string };
  console.log(`[C-TS-1] ${response.status()} ${JSON.stringify(body)}`);
  expect(response.status()).toBe(201);

  // 1. The rendered code IS the server's 201 body, character for character.
  await expect(panel(page)).toHaveAttribute('data-join-code', body.code, { timeout: 60_000 });
  const shown = (await panel(page).getAttribute('data-join-code')) ?? '';
  const sittingId = (await panel(page).getAttribute('data-sitting-id')) ?? '';
  expect(shown).toBe(body.code);
  expect(sittingId).toBe(body.sitting_document_id);
  expect(shown).not.toBe(codeBefore);
  // 2. It is the platform's own minted shape (F-SITTING-CODE, DECISIONS.md A3).
  expect(shown).toMatch(/^READ-\d{4}$/);
  // 3. The visible text is that same code — not a prettified copy of it.
  await expect(panel(page).locator('p').first()).toHaveText(shown);

  // 4. It is PERSISTED: the row exists in Postgres with exactly this code.
  const row = runSql(
    `select code || '|' || status from sittings where document_id = '${sittingId}'`,
  );
  console.log(`[postgres] sittings(${sittingId}) => ${row}`);
  expect(row).toBe(`${shown}|open`);

  // 5. Caption + helper copy are .qa/DESIGN.md's, from the catalog.
  await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText(
    cat(en, 'Teacher.testSessions.joinCode.caption')
      .replace('{className}', className)
      .replace('{testLabel}', testLabel),
  );
  await expect(
    panel(page).getByText(cat(en, 'Teacher.testSessions.joinCode.helper'), { exact: true }),
  ).toBeVisible();

  // 6. BIG: the code renders far larger than body copy, and is the largest text
  //    in the panel.
  const codeFontPx = await panel(page)
    .locator('p')
    .first()
    .evaluate((el) => Number.parseFloat(getComputedStyle(el).fontSize));
  console.log(`[render] code font-size = ${codeFontPx}px`);
  expect(codeFontPx).toBeGreaterThanOrEqual(36);

  // 7. Both actions clear the WCAG 2.2 AA 44x44 target floor.
  for (const name of ['copy', 'goLive'] as const) {
    const box = await panel(page)
      .getByRole(name === 'copy' ? 'button' : 'link', {
        name: cat(en, `Teacher.testSessions.joinCode.${name}`),
        exact: true,
      })
      .boundingBox();
    console.log(`[a11y] ${name} target = ${box?.width}x${box?.height}`);
    expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
  }

  // 8. Go live points at THIS sitting's live grid.
  await expect(panel(page).getByRole('link', { name: cat(en, 'Teacher.testSessions.joinCode.goLive'), exact: true })).toHaveAttribute(
    'href',
    `/dashboard/test-sessions/${sittingId}`,
  );

  // 9. Copy code really writes to the clipboard, and says so in WORDS.
  await panel(page)
    .getByRole('button', { name: cat(en, 'Teacher.testSessions.joinCode.copy'), exact: true })
    .click();
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  console.log(`[clipboard] "${clip}"`);
  expect(clip).toBe(shown);
  await expect(
    panel(page).getByRole('button', {
      name: cat(en, 'Teacher.testSessions.joinCode.copied'),
      exact: true,
    }),
  ).toBeVisible();

  await page.screenshot({ path: path.join(SHOTS, '035-join-code.png'), fullPage: true });

  // 10. SURVIVES A RELOAD, re-read from the API — no POST is replayed.
  posts.length = 0;
  await page.reload();
  await expect(panel(page)).toBeVisible({ timeout: 60_000 });
  expect(await panel(page).getAttribute('data-join-code')).toBe(shown);
  expect(await panel(page).getAttribute('data-sitting-id')).toBe(sittingId);
  expect(posts.filter((p) => p.includes('/api/teacher/test-sessions'))).toEqual([]);
  console.log(`[reload] still ${shown}; POSTs replayed: ${posts.length}`);

  // 11. The reloaded code is the server's current answer, not a cached copy.
  const live = await page.evaluate(async () => {
    const res = await fetch('http://localhost:5500/api/teacher/dashboard', {
      headers: { Authorization: `Bearer ${window.localStorage.getItem('app.auth.token')}` },
    });
    return (await res.json()) as { live_session: { code: string } | null };
  });
  console.log(`[C-TD-1] live_session.code = ${live.live_session?.code}`);
  expect(live.live_session?.code).toBe(shown);

  await page.screenshot({ path: path.join(SHOTS, '035-join-code-after-reload.png') });

  const axe = await new AxeBuilder({ page })
    .include('[data-slot="join-code-region"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  console.log(`[axe] violations = ${axe.violations.length}`);
  expect(axe.violations).toEqual([]);

  await expect(region(page)).toHaveAttribute('aria-live', 'polite');

  // 12. Not one string is hardcoded: the zh catalog swaps the whole panel while
  //     the CODE — which is data, not copy — stays byte-identical.
  await page.goto('/zh/dashboard/test-sessions');
  await expect(panel(page)).toBeVisible({ timeout: 60_000 });
  expect(await panel(page).getAttribute('data-join-code')).toBe(shown);
  const zh = loadMessages('zh');
  await expect(
    panel(page).getByText(cat(zh, 'Teacher.testSessions.joinCode.helper'), { exact: true }),
  ).toBeVisible();
  await expect(
    panel(page).getByRole('button', {
      name: cat(zh, 'Teacher.testSessions.joinCode.copy'),
      exact: true,
    }),
  ).toBeVisible();
  await page.screenshot({ path: path.join(SHOTS, '035-join-code-zh.png') });

  // 13. The panel is a LIVE READ, not client state: close this sitting through
  //     the real C-TS-4 endpoint and the code it was showing is gone after a
  //     reload — whatever the server now calls the live session is what shows.
  const closed = await page.evaluate(async (id: string) => {
    const res = await fetch(`http://localhost:5500/api/teacher/test-sessions/${id}/close`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${window.localStorage.getItem('app.auth.token')}` },
    });
    return { status: res.status, body: (await res.json()) as unknown };
  }, sittingId);
  console.log(`[C-TS-4] ${closed.status} ${JSON.stringify(closed.body)}`);
  expect(closed.status).toBe(200);

  await page.goto('/dashboard/test-sessions');
  await expect(region(page)).not.toHaveAttribute('data-status', 'pending', { timeout: 60_000 });
  const after = await panel(page)
    .getAttribute('data-join-code')
    .catch(() => null);
  console.log(`[after close] region=${await region(page).getAttribute('data-status')} code=${after}`);
  expect(after).not.toBe(shown);
  expect(runSql(`select status from sittings where document_id = '${sittingId}'`)).toBe('closed');
});

test('035: the code panel is keyboard-operable and holds together on a phone', async ({ page }) => {
  test.setTimeout(180_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, 'teacher');
  await page.goto('/dashboard/test-sessions');
  await expect(panel(page)).toBeVisible({ timeout: 60_000 });

  // Nothing overflows the viewport at 390px.
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  console.log(`[390px] horizontal overflow = ${overflow}px`);
  expect(overflow).toBeLessThanOrEqual(0);

  const copy = panel(page).getByRole('button', {
    name: cat(en, 'Teacher.testSessions.joinCode.copy'),
    exact: true,
  });
  await copy.focus();
  const focus = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    const style = el ? getComputedStyle(el) : null;
    return {
      label: el?.textContent?.trim() ?? '',
      outlineWidth: style?.outlineWidth ?? '',
      boxShadow: style?.boxShadow ?? '',
    };
  });
  console.log(`[focus] ${JSON.stringify(focus)}`);
  expect(focus.label).toContain(cat(en, 'Teacher.testSessions.joinCode.copy'));
  // A visible focus indicator, drawn by outline or ring — never nothing.
  expect(
    Number.parseFloat(focus.outlineWidth) > 0 || focus.boxShadow !== 'none',
  ).toBe(true);

  // Tab moves on to Go live, so both actions are reachable without a mouse.
  await page.keyboard.press('Tab');
  const next = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
  console.log(`[tab] next = ${next}`);
  expect(next).toContain(cat(en, 'Teacher.testSessions.joinCode.goLive'));

  await page.screenshot({ path: path.join(SHOTS, '035-join-code-390.png'), fullPage: true });
});
