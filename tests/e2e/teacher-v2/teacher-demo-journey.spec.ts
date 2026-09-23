import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page, type Response } from '@playwright/test';

import { createDemoLinkResponseSchema } from '@/modules/teacher/schemas/teacher-demo-link.schema';

import { runSql, sha256 } from '../helpers/auth-db';
import { cat } from '../helpers/i18n';
import { en, signIn } from '../helpers/teacher-rail';

// BUG-004 — the Teacher demo journey on the REAL API, end to end: mint, the "Your demo
// link is ready" dialog, Copy, Open in a NEW TAB, and the trial runner that tab lands
// on actually serving its first question. The DB then proves the demo recorded no
// Result. The one intercepted case is the refused mint, where the budget cannot be
// spent on purpose without locking the seeded teacher out for an hour.
const PROOFS = process.env.E2E_PROOF_DIR ?? path.resolve(process.cwd(), 'tests', 'e2e', 'proofs', 'teacher-v2');
const startSession = (key: string) => cat(en, `TeacherPortal.startSession.${key}`);
const DOCUMENT_ID = /^[a-z0-9]{24}$/;
const RATE_LIMITED = {
  data: null,
  error: { status: 429, name: 'RateLimitError', message: 'Too many requests', details: {} },
};

const isPost = (pathname: string) => (response: Response) =>
  response.request().method() === 'POST' && new URL(response.url()).pathname === pathname;

async function openDemoMode(page: Page) {
  await signIn(page, 'teacher');
  await page.waitForURL('**/dashboard/results');
  await page.locator('[data-slot="start-session-button"]').click();
  const modal = page.locator('[data-surface="start-session-modal"]');
  await expect(modal.getByRole('heading', { name: startSession('title') })).toBeVisible({ timeout: 30_000 });
  await modal.locator('[data-slot="start-choice"][data-value="demo"]').click();
  await expect(modal.getByRole('heading', { name: startSession('titleDemo') })).toBeVisible();
  return modal;
}

function resultCountForSession(sessionDocumentId: string): number {
  expect(sessionDocumentId).toMatch(DOCUMENT_ID);
  return Number(
    runSql(
      `select count(*) from results_session_lnk r join sessions s on s.id = r.session_id
        where s.document_id = '${sessionDocumentId}'`,
    ),
  );
}

test.use({ viewport: { width: 1440, height: 900 } });

test('BUG-004 — Teacher demo mints a link, Open starts the trial in a new tab, nothing is recorded', async ({
  page,
  context,
}) => {
  test.setTimeout(240_000);
  mkdirSync(PROOFS, { recursive: true });
  const modal = await openDemoMode(page);

  const lastTest = modal.getByRole('radiogroup').last().locator('[data-slot="start-choice"]').last();
  await expect(lastTest).toBeVisible();
  const formId = await lastTest.getAttribute('data-value');
  await lastTest.click();

  const minted = page.waitForResponse(isPost('/api/teacher/demo-link'), { timeout: 60_000 });
  await modal.locator('[data-slot="start-session-cta"]').click();
  const mintResponse = await minted;
  expect(mintResponse.status()).toBe(201);
  const link = createDemoLinkResponseSchema.parse(await mintResponse.json());
  expect(link.form_document_id).toBe(formId);
  expect(link.web_url).toMatch(/^https?:\/\/[^/]+\/en\/auth\/teacher\/verify\?token=[0-9a-f]{64}$/);

  const dialog = page.locator('[data-surface="demo-link-dialog"]');
  await expect(dialog.getByRole('heading', { name: startSession('demoLink.title') })).toBeVisible({ timeout: 30_000 });
  await expect(dialog.locator('[data-slot="demo-link-url"]')).toHaveText(link.web_url);
  const open = dialog.locator('[data-slot="demo-link-open"]');
  await expect(open).toHaveAttribute('href', link.web_url);
  await expect(open).toHaveAttribute('target', '_blank');

  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await dialog.locator('[data-slot="demo-link-copy"]').click();
  await expect(dialog.locator('[data-slot="demo-link-copy"]')).toHaveText(startSession('demoLink.copied'));
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(link.web_url);
  await page.screenshot({ path: path.join(PROOFS, 'after-01-demo-dialog-copied.png'), animations: 'disabled' });

  const popupPromise = context.waitForEvent('page');
  const verified = context.waitForEvent('response', {
    predicate: isPost('/api/auth/teacher/magic-link/verify'),
    timeout: 90_000,
  });
  const trialStarts: Response[] = [];
  context.on('response', (response) => {
    if (isPost('/api/teacher/trial')(response)) trialStarts.push(response);
  });
  await open.click();
  const demo = await popupPromise;
  await demo.waitForLoadState('domcontentloaded');
  expect(new URL(demo.url()).origin).toBe(new URL(link.web_url).origin);
  expect(demo.url().startsWith('schooltest:')).toBe(false);

  const verify = await verified;
  expect(verify.status()).toBe(200);
  const offer = (await verify.json()) as {
    trial: { form_document_id: string; session_document_id: string | null } | null;
  };
  expect(offer.trial?.form_document_id).toBe(formId);

  await expect(demo.getByText(/Question \d+ of [1-9]\d*/)).toBeVisible({ timeout: 90_000 });
  await demo.screenshot({ path: path.join(PROOFS, 'after-02-demo-tab-first-question.png'), animations: 'disabled' });

  // A fresh trial is started by C-TT-START; a trial already running on this form is resumed.
  let sessionDocumentId = offer.trial?.session_document_id ?? null;
  if (sessionDocumentId === null) {
    expect(trialStarts).toHaveLength(1);
    expect(trialStarts[0].status()).toBe(201);
    sessionDocumentId = ((await trialStarts[0].json()) as { session: { document_id: string } }).session.document_id;
  }

  expect(resultCountForSession(sessionDocumentId)).toBe(0);
  const tokenHash = sha256(new URL(link.web_url).searchParams.get('token') ?? '');
  const tokenRow = runSql(
    `select used::text || '|' || coalesce(demo_form_document_id, '') from teacher_magic_links
      where token = '${tokenHash}'`,
  );
  expect(tokenRow).toBe(`true|${formId}`);
  await demo.close();
});

test('BUG-004 — a refused demo mint shows the server message in the modal', async ({ page }) => {
  test.setTimeout(120_000);
  mkdirSync(PROOFS, { recursive: true });
  const modal = await openDemoMode(page);
  await page.route('**/api/teacher/demo-link', (route) =>
    route.fulfill({
      status: 429,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': route.request().headers()['origin'] ?? '*',
        'access-control-allow-credentials': 'true',
      },
      body: JSON.stringify(RATE_LIMITED),
    }),
  );

  await modal.locator('[data-slot="start-session-cta"]').click();
  const alert = modal.locator('[data-slot="start-session-error"]');
  await expect(alert).toHaveText(RATE_LIMITED.error.message);
  await expect(alert).toHaveAttribute('role', 'alert');
  await expect(page.locator('[data-surface="demo-link-dialog"]')).toHaveCount(0);
  await expect(modal).toBeVisible();
  await page.screenshot({ path: path.join(PROOFS, 'after-03-refused-mint-message.png'), animations: 'disabled' });
});
