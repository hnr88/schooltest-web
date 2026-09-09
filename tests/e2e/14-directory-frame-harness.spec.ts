import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';
import { createViteServer } from 'vitest/node';

import { cat, loadMessages } from './helpers/i18n';
import { fixtureTeacherCredentials } from './helpers/credentials';

// ops/14 PROOF TOOLING — the tab-body frame units photographed against the
// app's live CSS, mirroring the sanctioned figure-kit harness (01): an
// in-process Vite SSR server renders the REAL DirectoryHeader + DirectoryChips
// (no server bound; the only app dependency is the /design-system CSS fetch),
// the spec asserts the rendered structure, then screenshots at 1440x900 into
// the board's shots folder. Behavioural pins live in
// tests/unit/directory-header.test.tsx; nothing about the app is asserted
// here because no app route mounts these units yet — their consumers are the
// six school-admin rows and school-admin/02's dispatcher.
//
// The third test is the orchestrator's live ops_support check: a
// contract-valid `ops_support` capabilities body (write:false — the flags the
// shipped contract itself derives for that role) served from the real
// endpoint URL; the write:true primary must render GREYED and a click must
// issue NO network request AND never reach its handler, with the request
// listener pinned BEFORE the content loads.

test.use({ viewport: { width: 1440, height: 900 } });

const en = loadMessages('en');
const SHOTS = path.resolve(process.cwd(), '../mvp/ops/proof/shots');
const VIEWPORT = { width: 1440, height: 900 } as const;

// The shared lane page: created ONCE in the guarded beforeAll, used by all
// three tests, closed in afterAll. Typed assignment happens only on success.
let sharedPage: Page | undefined;

async function loadBuilder(moduleName: string, exportName: string): Promise<() => string> {
  const vite = await createViteServer({
    configFile: false,
    root: process.cwd(),
    logLevel: 'error',
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), 'src'),
        'next/navigation': path.resolve(process.cwd(), 'vitest-stubs/next-navigation.ts'),
      },
    },
    ssr: { noExternal: ['next-intl'] },
    server: { middlewareMode: true, hmr: false, watch: null },
  });
  try {
    const mod = (await vite.ssrLoadModule(`./tests/e2e/${moduleName}`)) as Record<
      string,
      () => string
    >;
    return mod[exportName]!;
  } finally {
    await vite.close();
  }
}

async function dress(target: Page, markup: string): Promise<string> {
  await target.goto('/design-system', { waitUntil: 'domcontentloaded' });
  const css = await target.evaluate(async () => {
    const parts: string[] = [];
    for (const node of document.querySelectorAll('style')) {
      parts.push(node.textContent ?? '');
    }
    for (const link of document.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]')) {
      parts.push(await fetch(link.href).then((response) => response.text()));
    }
    return parts.join('\n');
  });
  const htmlClass = await target.evaluate(() => document.documentElement.className);
  return `<!doctype html><html class="${htmlClass}"><head><meta charset="utf-8"><style>${css}</style></head><body>${markup}</body></html>`;
}

async function signIn(target: Page): Promise<void> {
  await target.goto('/sign-in');
  const teacher = fixtureTeacherCredentials();
  await target.getByLabel(cat(en, 'Auth.emailLabel'), { exact: true }).fill(teacher.email);
  await target.getByLabel(cat(en, 'Auth.passwordLabel'), { exact: true }).fill(teacher.password);
  await target
    .getByRole('button', { name: cat(en, 'Auth.signInButton'), exact: true })
    .click();
  await target.waitForURL(/\/dashboard(\/|$)/, { timeout: 90_000 });
}

test.describe.configure({ mode: 'serial' });

// RESTART-TOLERANT bootstrap (orchestrator directive), adopted VERBATIM from
// teacher/07's approved reference (teacher-results-tabs.spec.ts beforeAll):
// the out-of-mission teacher-trial agent rewrites schooltest-api/src every
// 2-3 minutes and each write bounces the :5500 watcher for 20-30s; the shared
// limiter adds 429 penalty windows (~38s Retry-After measured live). From
// inside a web spec that reads as ERR_CONNECTION_REFUSED at sign-in, a stuck
// loading-to-error surface, or a 429 — an environmental signature, never
// evidence about the code under test. A new attempt only starts while
// elapsed + worst-step (90s) still fits inside this hook's 180s, so
// exhaustion produces THIS named throw, never the opaque hook timeout.
// Never swallow: the last real error is attached.
test.beforeAll(async ({ browser }) => {
  // ops/20's refinement — the containment arithmetic asserted in ONE place so
  // a later edit to either number is visibly checkable: the budget must sit
  // strictly inside the hook timeout and the per-attempt cap inside the
  // budget, or the loop could never reach its own named throw.
  const ENV_ATTEMPTS = 4;
  const ENV_ATTEMPT_CAP_MS = 90_000;
  const ENV_BUDGET_MS = 175_000;
  const ENV_HOOK_MS = 180_000;
  if (ENV_BUDGET_MS >= ENV_HOOK_MS || ENV_ATTEMPT_CAP_MS > ENV_BUDGET_MS) {
    throw new Error(
      `bootstrap containment broken: budget ${ENV_BUDGET_MS} must be < hook ${ENV_HOOK_MS} and cap ${ENV_ATTEMPT_CAP_MS} <= budget`,
    );
  }
  test.setTimeout(ENV_HOOK_MS);
  const attempts = ENV_ATTEMPTS;
  const budgetMs = ENV_BUDGET_MS;
  const maxStepMs = ENV_ATTEMPT_CAP_MS;
  const startedAt = Date.now();
  const classify = (message: string): 'RATE-LIMITED (429)' | 'API RESTART WINDOW (connection refused/reset)' | 'other' => {
    if (message.includes('429')) return 'RATE-LIMITED (429)';
    if (
      /ECONNREFUSED|ERR_CONNECTION_REFUSED|socket hang up|fetch failed|other side closed|UND_ERR_SOCKET/.test(
        message,
      )
    ) {
      return 'API RESTART WINDOW (connection refused/reset)';
    }
    return 'other';
  };
  const waitMsFor = (kind: string): number => (kind.startsWith('RATE-LIMITED') ? 45_000 : 15_000);
  // maxStep is ENFORCED, not assumed: each attempt races this cap, so a slow
  // helper can never overrun the hook timeout — the cap losing is itself a
  // classified outcome and the named throw below is the only exit.
  const runWithStepCap = (step: () => Promise<void>): Promise<void> => {
    let lose: (reason: unknown) => void = () => {};
    const cap = new Promise<void>((_resolve, reject) => {
      lose = reject;
    });
    const timer = setTimeout(
      () => lose(new Error(`BOOT STEP CAP ${maxStepMs / 1000}s exceeded — attempt raced out`)),
      maxStepMs,
    );
    return Promise.race([step(), cap]).finally(() => clearTimeout(timer));
  };
  let made: Page | undefined;
  let lastError: unknown;
  let lastClass = 'none';
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const elapsed = Date.now() - startedAt;
    if (elapsed + maxStepMs > budgetMs) {
      break;
    }
    try {
      await runWithStepCap(async () => {
        made = await browser.newPage({ viewport: VIEWPORT });
        await signIn(made);
        mkdirSync(SHOTS, { recursive: true });
      });
      if (!made) {
        throw new Error('bootstrap step resolved without a page');
      }
      sharedPage = made;
      return;
    } catch (error) {
      lastError = error;
      lastClass = classify(String(error));
      await made?.close().catch(() => {});
      made = undefined;
      if (attempt < attempts) {
        await new Promise((resolve) => setTimeout(resolve, waitMsFor(lastClass)));
      }
    }
  }
  throw new Error(
    `[e2e] BOOT FAILED (budget ${budgetMs / 1000}s, ${attempts} attempts max) — ` +
      `last classification: ${lastClass}; last error: ${String(lastError)}`,
  );
});

test.afterAll(async () => {
  await sharedPage?.close().catch(() => {});
  sharedPage = undefined;
});

test('tab frame harness — title, summary, Export secondary, contextual primary', async ({}, testInfo) => {
  const buildTabFrameHarness = await loadBuilder(
    '14-directory-frame-harness.piece.tsx',
    'buildTabFrameHarness',
  );
  const doc = await dress(sharedPage!, buildTabFrameHarness());
  await sharedPage!.setContent(doc);

  const header = sharedPage!.locator('[data-slot="panel-header-row"]');
  await expect(header).toBeVisible();
  await expect(header.getByRole('heading', { name: 'School admins' })).toBeVisible();
  await expect(header.getByText('2 invited · 1 active')).toBeVisible();
  const secondary = header.getByRole('button', { name: 'Export CSV' });
  const primary = header.getByRole('button', { name: 'Invite admin' });
  await expect(secondary).toBeVisible();
  await expect(primary).toBeVisible();

  const shotPath = path.join(SHOTS, '14-tab-frame.png');
  await sharedPage!.screenshot({ path: shotPath });
  await testInfo.attach('14-tab-frame', { path: shotPath });
  console.log('CAPTURE', shotPath);
});

test('chips harness — one filter as chips with the active pill', async ({}, testInfo) => {
  const buildChipsHarness = await loadBuilder(
    '14-directory-frame-harness.piece.tsx',
    'buildChipsHarness',
  );
  const doc = await dress(sharedPage!, buildChipsHarness());
  await sharedPage!.setContent(doc);

  const chips = sharedPage!.getByRole('group');
  await expect(chips).toBeVisible();
  const pills = chips.getByRole('button');
  await expect(pills).toHaveCount(4);
  await expect(pills.nth(0)).toHaveText('All');
  await expect(pills.nth(1)).toHaveText('Active');
  await expect(pills.nth(1)).toHaveAttribute('aria-pressed', 'true');
  await expect(pills.nth(3)).toHaveText('Suspended');

  const shotPath = path.join(SHOTS, '14-chips.png');
  await sharedPage!.screenshot({ path: shotPath });
  await testInfo.attach('14-chips', { path: shotPath });
  console.log('CAPTURE', shotPath);
});

// The orchestrator's live ops_support check, made unambiguous: a
// contract-valid `ops_support` capabilities body (write:false — the flags the
// shipped contract itself derives for that role) is served from the real
// endpoint URL; the write:true primary must render GREYED and a click must
// issue NO network request AND never reach its handler. The request listener
// is pinned BEFORE the content loads and the count compared across the click.
test('support session — write primary greyed, click issues no request', async ({}, testInfo) => {
  const updatedAt = '2026-09-09T21:00:00+00:00';
  await sharedPage!.route('**/api/ops/capabilities*', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: {
          actor: {
            documentId: 'zz14supportsessionactor01',
            first_name: 'Support',
            last_name: 'Session',
            email: 'support@schooltest.local',
            role: 'ops_support',
            updatedAt,
          },
          capabilities: {
            read: true,
            write: false,
            export: true,
            view_as_teacher: false,
            edit_self: true,
          },
          status_page_url: null,
        },
        meta: {},
      }),
    }),
  );
  const requests: string[] = [];
  sharedPage!.on('request', (request) => requests.push(request.url()));

  const buildSupportHarness = await loadBuilder(
    '14-directory-frame-harness.piece.tsx',
    'buildSupportHarness',
  );
  const doc = await dress(sharedPage!, buildSupportHarness());
  await sharedPage!.setContent(doc);

  const header = sharedPage!.locator('[data-slot="panel-header-row"]');
  const primary = header.getByRole('button', { name: 'Invite admin' });
  await expect(primary).toBeDisabled({ timeout: 15_000 });
  await expect(primary).toHaveAttribute('aria-disabled', 'true');
  await expect(primary).toHaveAttribute('title', 'This session is read-only.');

  // Nothing but the document/CSS/capabilities traffic may exist by now.
  const dataRequests = requests.filter((url) => !/design-system|capabilities/.test(url));
  expect(dataRequests).toEqual([]);

  // A forced click attempt on the greyed button: the browser must not
  // dispatch it, and no request may appear because of the attempt.
  const countBefore = requests.length;
  await primary.click({ force: true });
  await sharedPage!.waitForTimeout(400);
  expect(requests.length).toBe(countBefore);
  expect(
    await sharedPage!.evaluate(() => (window as { __inviteClicked?: boolean }).__inviteClicked ?? false),
  ).toBe(false);

  const shotPath = path.join(SHOTS, '14-support-gated.png');
  await sharedPage!.screenshot({ path: shotPath });
  await testInfo.attach('14-support-gated', { path: shotPath });
  console.log('CAPTURE', shotPath);
});
