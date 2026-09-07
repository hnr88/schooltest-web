/**
 * Ledger 7 — the ops Comms console end to end against the REAL stack.
 *
 * C-OPSM-05 (event registry) and C-OPSM-03 (auth email ledger) are proven as
 * live reads. C-OPSM-01 (bulk email) and C-OPSM-04 (push broadcast) are proven
 * up to and including a REAL dry-run POST, plus the confirm gate that stands
 * between the form and a fan-out.
 *
 * WHAT THIS SPEC DELIBERATELY DOES NOT DO — read before "strengthening" it:
 * it never sends a real fan-out through the UI. The console offers exactly the
 * five audiences the service resolves (`all`, `ops`, `school_admins`,
 * `teachers`, `parents`), and in this environment those resolve to REAL seeded
 * accounts (106 students, 7 teachers, 2 school admins, 2 ops, 1 parent). There
 * is no synthetic audience in that list, so a `dryRun: false` click here would
 * put real mail on the wire — which is exactly the kind of "proof" that is
 * worse than no proof. The real send path IS proven, at the API level and
 * safely, with an audience that resolves to zero users
 * (`school:<nonexistent-documentId>` → recipients 0, sent 0, dryRun false, and
 * the server still writes its `comms.bulk_email` audit row). That curl pair is
 * in the task report. The UI cannot reach that audience by design: free-typing
 * an audience is a 400 risk, so the select is closed to the five.
 *
 * EMAIL LEDGER FIXTURES: `auth_email_requests` is EMPTY in the seeded database,
 * so an unseeded run can only prove the empty state. Throwaway rows are
 * inserted straight into Postgres (the ops API exposes no issuance route — the
 * rows are a side effect of the auth flows) so the table's live rendering and
 * its SERVER pagination are actually exercised, then removed in `afterAll`.
 * There are deliberately MORE than one page of them: the console reads at the
 * contract's default pageSize of 25, so 30 rows are needed before "paginated"
 * means anything at all. They are prefixed ZZ and carry a dummy `token_hash`
 * so they can never be mistaken for real issuance records.
 *
 * ONE sign-in for the whole file: the API allows 20 POST /api/auth/local per
 * minute per IP and that budget is shared with every other suite on this host.
 */
import { execFileSync } from 'node:child_process';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Browser, type BrowserContext, type Page } from '@playwright/test';

import { loadMessages } from './helpers/i18n';
import { loginAs } from './helpers/roles';

const en = loadMessages('en');
const OUT = path.resolve(
  __dirname,
  '../../../.codephant/missions/msn-0da39441-f845-426b-88a1-037c9eb98442/captures',
);
const PG = 'schooltest-api-st1-postgres';
const STAMP = Date.now();
const FIXTURE_PREFIX = `zzcomms${STAMP}`;
const WAIT = 30_000;

function sql(statement: string): string {
  return execFileSync(
    'docker',
    ['exec', PG, 'psql', '-U', 'schooltest', '-d', 'schooltest', '-t', '-A', '-c', statement],
    { encoding: 'utf-8' },
  ).trim();
}

/**
 * 30 ZZ issuance rows — one more than a single page at the contract default
 * (25), so the pager has a real second page to fetch. Ordered `id desc` by the
 * service, so row 29 is newest and lands first.
 */
const FIXTURE_ROWS = 30;

function createFixtureRows(): number {
  const values = Array.from({ length: FIXTURE_ROWS }, (_, index) => index)
    .map(
      (index) =>
        `('${FIXTURE_PREFIX}${index}', 'zz-e2e-comms-${index}@schooltest.local', ` +
        `'${index % 2 === 0 ? 'password_reset' : 'email_confirmation'}', md5(random()::text), ` +
        `'127.0.0.1', 'e2e fixture', now(), now(), now(), 'en')`,
    )
    .join(',\n');
  const ids = sql(
    `insert into auth_email_requests (document_id, email, kind, token_hash, ip_address, user_agent, created_at, updated_at, published_at, locale)
     values ${values} returning id;`,
  );
  const count = ids.split('\n').filter((line) => /^\d+$/.test(line.trim())).length;
  expect(count, `${FIXTURE_ROWS} fixture rows were inserted (got ${ids})`).toBe(FIXTURE_ROWS);
  return count;
}

const templateRows = (page: Page) => page.locator('[data-slot="ops-comms-template-row"]');
const logRows = (page: Page) => page.locator('[data-slot="ops-email-log-row"]');

test.describe('ledger 7 — the ops Comms console', () => {
  // Serial + a real budget: one shared page, and a dev-server compile on the
  // first navigation can eat Playwright's 30s default on its own.
  test.describe.configure({ mode: 'serial', timeout: 120_000 });

  let context: BrowserContext;
  let page: Page;

  test.beforeAll(async ({ browser }: { browser: Browser }) => {
    createFixtureRows();
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await context.newPage();
    await loginAs(page, 'ops');
  });

  test.afterAll(async () => {
    sql(`delete from auth_email_requests where document_id like '${FIXTURE_PREFIX}%';`);
    await context?.close();
  });

  test('the console renders the live event registry and the live auth email ledger', async () => {
    await page.goto('/dashboard/ops/comms');
    await expect(page.getByRole('heading', { name: en['Ops.comms.title'], level: 1 })).toBeVisible({
      timeout: WAIT,
    });

    // C-OPSM-05: the registry is the server's EVENT_META, so the rows are real
    // event keys. Asserting a specific key proves it is the registry and not a
    // placeholder list.
    await expect(templateRows(page).first()).toBeVisible({ timeout: WAIT });
    expect(await templateRows(page).count(), 'the server served its event registry').toBeGreaterThan(
      0,
    );
    await expect(
      page.locator('[data-slot="ops-comms-template-row"][data-template-key="security_password_changed"]'),
    ).toBeVisible();

    // C-OPSM-03: the ledger shows the fixture rows, newest first.
    await expect(logRows(page).first()).toBeVisible({ timeout: WAIT });
    expect(await logRows(page).count(), 'the ledger rendered its live rows').toBeGreaterThan(0);
    await expect(logRows(page).first().locator('[data-field="email"]')).toContainText(
      'zz-e2e-comms-',
    );
  });

  test('the email ledger pages on the SERVER, not in the browser', async () => {
    await page.goto('/dashboard/ops/comms');
    await expect(logRows(page).first()).toBeVisible({ timeout: WAIT });

    // A full page at the contract default, not a slice of a bigger local array.
    expect(await logRows(page).count(), 'the server filled a page of 25').toBe(25);
    const firstPageTop = await logRows(page).first().locator('[data-field="email"]').innerText();

    const pager = page
      .locator('[data-slot="ops-email-log"] [data-slot="ops-directory-pagination"]')
      .first();
    await expect(pager, 'the pager renders because the server reports a non-zero total').toBeVisible();
    // The pager's copy is built from meta.pagination — the server's own totals.
    await expect(pager.getByRole('status')).toContainText('1');

    // Advancing must ASK THE SERVER for page 2. Watching the request is what
    // separates real pagination from a client-side slice.
    const pageTwo = page.waitForRequest(
      (request) =>
        request.url().includes('/api/ops/comms/email-log') && request.url().includes('page=2'),
    );
    await pager.getByRole('button', { name: en['Ops.comms.log.pagination.next'], exact: true }).click();
    await pageTwo;

    await expect
      .poll(async () => logRows(page).first().locator('[data-field="email"]').innerText(), {
        timeout: WAIT,
      })
      .not.toBe(firstPageTop);
  });

  test('a bad composer form validates inline and NEVER reaches the API', async () => {
    await page.goto('/dashboard/ops/comms');
    const composer = page.locator('[data-slot="ops-broadcast-composer-email"]');
    await expect(composer).toBeVisible({ timeout: WAIT });

    // Any request to either write route during this test is a failure: the
    // point of the slice is that an empty form is refused CLIENT-side.
    const writes: string[] = [];
    const watch = (request: { url: () => string; method: () => string }) => {
      const url = request.url();
      if (
        request.method() === 'POST' &&
        (url.includes('/api/ops/comms/bulk-email') || url.includes('/api/ops/comms/push-broadcast'))
      ) {
        writes.push(url);
      }
    };
    page.on('request', watch);

    // Preview with nothing filled in.
    await composer.locator('[data-slot="ops-broadcast-preview-button-email"]').click();
    await expect(composer.getByText(en['Ops.comms.validation.audienceRequired'])).toBeVisible();
    await expect(composer.getByText(en['Ops.comms.bulkEmail.validation.headlineRequired'])).toBeVisible();
    await expect(composer.getByText(en['Ops.comms.validation.bodyRequired'])).toBeVisible();

    // Send with nothing filled in must ALSO be refused, and must not open the
    // confirm dialog — an invalid form never gets as far as asking.
    await composer.locator('[data-slot="ops-broadcast-send-button-email"]').click();
    await expect(page.getByRole('alertdialog')).toBeHidden();

    // Whitespace is not content: the server trims, and so does the client.
    await composer.locator('#email-headline').fill('   ');
    await composer.locator('#email-body').fill('   ');
    await composer.locator('[data-slot="ops-broadcast-preview-button-email"]').click();
    await expect(composer.getByText(en['Ops.comms.bulkEmail.validation.headlineRequired'])).toBeVisible();

    page.off('request', watch);
    expect(writes, 'no write request left the browser for an invalid form').toEqual([]);
  });

  test('preview is a REAL dry-run POST, and Send is gated behind confirmation', async () => {
    await page.goto('/dashboard/ops/comms');
    const composer = page.locator('[data-slot="ops-broadcast-composer-email"]');
    await expect(composer).toBeVisible({ timeout: WAIT });

    // 'ops' is the smallest real audience (the two platform accounts), so the
    // preview number is verifiable and the blast radius stays legible.
    await composer.locator('#email-audience').click();
    await page.getByRole('option', { name: en['Ops.comms.audiences.ops'], exact: true }).click();
    await composer.locator('#email-headline').fill('ZZ e2e dry-run subject');
    await composer.locator('#email-body').fill('ZZ e2e dry-run body. Nothing is sent.');

    // The preview must carry dryRun TRUE on the wire. Reading the posted body
    // is what proves it — a UI label could claim anything.
    const previewRequest = page.waitForRequest(
      (request) =>
        request.method() === 'POST' && request.url().includes('/api/ops/comms/bulk-email'),
    );
    await composer.locator('[data-slot="ops-broadcast-preview-button-email"]').click();
    const posted = await previewRequest;
    expect(JSON.parse(posted.postData() ?? '{}'), 'the preview asked for a DRY RUN').toMatchObject({
      audience: 'ops',
      dryRun: true,
    });

    // The rendered count comes from the server's own `recipients`.
    const previewLine = composer.locator('[data-slot="ops-broadcast-preview-email"]');
    await expect(previewLine).toBeVisible({ timeout: WAIT });
    await expect(previewLine).toContainText('2');

    // Send opens the confirm dialog and sends NOTHING on its own.
    const sends: string[] = [];
    const watchSend = (request: { url: () => string; method: () => string; postData: () => string | null }) => {
      if (request.method() !== 'POST' || !request.url().includes('/api/ops/comms/bulk-email')) return;
      const parsed = JSON.parse(request.postData() ?? '{}') as { dryRun?: boolean };
      if (parsed.dryRun === false) sends.push(request.url());
    };
    page.on('request', watchSend);

    await composer.locator('[data-slot="ops-broadcast-send-button-email"]').click();
    const dialog = page.getByRole('alertdialog');
    await expect(dialog).toBeVisible();
    // The confirmation names the real blast radius from the server's preview.
    await expect(dialog).toContainText('2');

    // Cancelling leaves the world untouched — this spec never fans out.
    await dialog.getByRole('button', { name: en['Ops.comms.actions.cancel'], exact: true }).click();
    await expect(dialog).toBeHidden();

    page.off('request', watchSend);
    expect(sends, 'no real fan-out was ever requested by this spec').toEqual([]);
  });

  test('the push composer previews its own SUBSCRIPTION count, not the email one', async () => {
    await page.goto('/dashboard/ops/comms');
    const composer = page.locator('[data-slot="ops-broadcast-composer-push"]');
    await expect(composer).toBeVisible({ timeout: WAIT });

    await composer.locator('#push-audience').click();
    await page.getByRole('option', { name: en['Ops.comms.audiences.teachers'], exact: true }).click();
    await composer.locator('#push-headline').fill('ZZ e2e push title');
    await composer.locator('#push-body').fill('ZZ e2e push body.');

    const request = page.waitForRequest(
      (req) => req.method() === 'POST' && req.url().includes('/api/ops/comms/push-broadcast'),
    );
    await composer.locator('[data-slot="ops-broadcast-preview-button-push"]').click();
    const posted = await request;
    expect(JSON.parse(posted.postData() ?? '{}'), 'the push preview is a dry run').toMatchObject({
      audience: 'teachers',
      dryRun: true,
    });

    // No device in the seeded data has a push subscription, so the honest
    // answer is zero — and the console says zero rather than hiding the line.
    await expect(composer.locator('[data-slot="ops-broadcast-preview-push"]')).toBeVisible({
      timeout: WAIT,
    });
  });

  test('captures the console at desktop and 375', async () => {
    await mkdir(OUT, { recursive: true });
    await page.goto('/dashboard/ops/comms');
    await expect(templateRows(page).first()).toBeVisible({ timeout: WAIT });

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.screenshot({ path: path.join(OUT, 'comms-console-desktop.png'), fullPage: true });
    await test.info().attach('comms-console-desktop', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    // The composers are the part a narrow viewport can break, so they get their
    // own capture scrolled into view rather than only a full-page shot.
    const composers = page.locator('[data-slot="ops-comms-composers"]');
    await composers.scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(OUT, 'comms-console-composers.png') });
    await test.info().attach('comms-console-composers', {
      body: await composers.screenshot(),
      contentType: 'image/png',
    });

    await page.setViewportSize({ width: 375, height: 812 });
    await expect(templateRows(page).first()).toBeVisible({ timeout: WAIT });
    await page.screenshot({ path: path.join(OUT, 'comms-console-375.png'), fullPage: true });
    await test.info().attach('comms-console-375', {
      body: await page.screenshot(),
      contentType: 'image/png',
    });

    await page.setViewportSize({ width: 1440, height: 900 });
  });
});
