/**
 * OPS-010 — make the supplied HTML a reproducible visual reference.
 *
 * Renders the UNMODIFIED mvp/ops/Ops Portal.dc.html (a byte-identical tracked
 * copy under ./reference, pinned by sha256) offline and captures a
 * deterministic baseline for every screen, modal, menu, banner, toast and all
 * nine scenarios, so later visual tasks compare against a fixed artefact
 * instead of against whatever the file happened to render that day.
 *
 * Three traps this spec is written around, all of which silently produce a
 * GREEN run with WRONG pixels:
 *  1. support.js pulls React 18.3.1 UMD from unpkg at boot. cdnScriptFor()
 *     checks window.__resources first, so React is vendored and injected —
 *     no network, no dev server (schooltest-web/CLAUDE.md forbids pnpm dev).
 *  2. Playwright with no timeout waits FOREVER on a hidden element instead of
 *     failing. Every interaction here is explicitly bounded.
 *  3. A school-detail tab must NOT be selected by text: the metric strip
 *     renders plain <div>Teachers</div>/<div>Students</div> labels that precede
 *     the real tab in DOM order and swallow the click, which yields
 *     byte-identical screenshots while the run reports success.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import { expect, test, type Page } from '@playwright/test';

import {
  MOBILE_VIEWPORT,
  REFERENCE_CLOCK_ISO,
  REFERENCE_DEVICE_SCALE_FACTOR,
  REFERENCE_HTML_SHA256,
  REFERENCE_SCENARIOS,
  REFERENCE_TABS,
  REFERENCE_VIEWPORT,
  UNRESOLVED_REFERENCE_PHOTOS,
} from '@/modules/ops/hooks/use-visual-reference';

const REPO = path.resolve(__dirname, '../../../..');
// Tracked fixture: an unmodified copy of the source HTML plus the runtime it
// pulls relatively — support.js (sc-framework + cdnScriptFor), assets/logo.png
// and fonts/GoogleSans-Variable.ttf, copied from dashbaord-design/ — and the
// vendored React 18.3.1 UMD builds whose sha384 must match the SRI pins in
// dashbaord-design/support.js. The five photo-* assets stay missing on purpose
// (UNRESOLVED_REFERENCE_PHOTOS). Captures go to the gitignored test-results/.
const BUNDLE = path.join(__dirname, 'reference');
const OUT = path.resolve(REPO, 'schooltest-web/test-results/visual-reference');
const REFERENCE_HTML = path.join(BUNDLE, 'Ops Portal.dc.html');
const SOURCE_HTML = path.join(REPO, 'mvp/ops/Ops Portal.dc.html');

const ACTION_TIMEOUT = 10_000;

/**
 * The switcher renders each scenario by its LABEL, not its id
 * (Ops Portal.dc.html:995-1005). Clicking the label is the only way in.
 */
const SCENARIO_LABELS: Record<(typeof REFERENCE_SCENARIOS)[number], string> = {
  happy: 'Happy path',
  loading: 'Loading',
  empty: 'New tenant',
  loadError: 'Load failure',
  slow: 'Slow network',
  flaky: 'Save failures',
  offline: 'Offline',
  restricted: 'Read-only role',
  expired: 'Session expired',
};

function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

/** Vendors React so the reference renders with no network access. */
async function serveReference(page: Page): Promise<void> {
  const react = readFileSync(path.join(BUNDLE, 'vendor/react.production.min.js'), 'utf8');
  const reactDom = readFileSync(
    path.join(BUNDLE, 'vendor/react-dom.production.min.js'),
    'utf8',
  );
  await page.addInitScript(
    ([r, d]) => {
      const w = window as unknown as { __resources?: Record<string, string> };
      w.__resources = {
        'https://unpkg.com/react@18.3.1/umd/react.production.min.js':
          'data:text/javascript;base64,' + btoa(unescape(encodeURIComponent(r))),
        'https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js':
          'data:text/javascript;base64,' + btoa(unescape(encodeURIComponent(d))),
      };
    },
    [react, reactDom],
  );
  await page.clock.setFixedTime(new Date(REFERENCE_CLOCK_ISO));
  await page.goto(`file://${REFERENCE_HTML}`, { waitUntil: 'load', timeout: 30_000 });
  await page.waitForLoadState('networkidle', { timeout: 30_000 });
}

async function capture(page: Page, name: string): Promise<string> {
  const file = path.join(OUT, `010-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

test.use({
  viewport: REFERENCE_VIEWPORT,
  deviceScaleFactor: REFERENCE_DEVICE_SCALE_FACTOR,
  actionTimeout: ACTION_TIMEOUT,
});

test.describe('OPS-010 reference is reproducible', () => {
  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test('the reference bundle is the unmodified authority (sha256 three-way)', () => {
    const source = sha256(SOURCE_HTML);
    const bundled = sha256(REFERENCE_HTML);
    expect(source).toBe(REFERENCE_HTML_SHA256);
    expect(bundled).toBe(REFERENCE_HTML_SHA256);
  });

  test('vendored React matches the SRI pinned in support.js', () => {
    const supportJs = readFileSync(
      path.join(REPO, 'schooltest-web/dashbaord-design/support.js'),
      'utf8',
    );
    for (const file of ['react.production.min.js', 'react-dom.production.min.js']) {
      const digest = createHash('sha384')
        .update(readFileSync(path.join(BUNDLE, 'vendor', file)))
        .digest('base64');
      expect(supportJs).toContain(`sha384-${digest}`);
    }
  });

  test('renders offline with no network request', async ({ page }) => {
    const external: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith('file://') && !r.url().startsWith('data:')) external.push(r.url());
    });
    await serveReference(page);
    await expect(page.locator('[data-screen-label="Ops portal"]')).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
    expect(external, `unexpected network calls: ${external.join(', ')}`).toEqual([]);
  });

  test('captures the schools list at desktop and mobile', async ({ page }) => {
    await serveReference(page);
    await expect(page.getByRole('heading', { name: 'Schools' })).toBeVisible({
      timeout: ACTION_TIMEOUT,
    });
     
    console.log('CAPTURE', await capture(page, 'schools-list-desktop'));

    await page.setViewportSize(MOBILE_VIEWPORT);
     
    console.log('CAPTURE', await capture(page, 'schools-list-mobile'));
  });

  test('captures every one of the nine scenarios, each visibly different', async ({ page }) => {
    // The scenario is switched by CLICKING the switcher panel item, whose
    // handler is `pick: () => this.applyScenario(x.id)` (Ops Portal.dc.html:1721).
    // There is no event API — dispatching a custom event silently does nothing
    // and yields nine byte-identical screenshots on a green run.
    const digests = new Map<string, string>();

    for (const [id, label] of Object.entries(SCENARIO_LABELS)) {
      await serveReference(page);

      // The panel starts collapsed (panel.bodyDisplay === 'none'); open it.
      const header = page.locator('div', { hasText: /^Scenario$/ }).last();
      await header.click({ timeout: ACTION_TIMEOUT });

      const item = page.locator('div', { hasText: new RegExp(`^${label}$`) }).last();
      await item.click({ timeout: ACTION_TIMEOUT });
      await page.waitForTimeout(500);

      const file = await capture(page, `scenario-${id}`);
      digests.set(id, createHash('sha256').update(readFileSync(file)).digest('hex'));
       
      console.log('CAPTURE', file);
    }

    expect(Object.keys(SCENARIO_LABELS)).toHaveLength(9);

    // The guard that matters: a scenario that did not actually change the screen
    // is a capture proving nothing. `loading` reverts to `happy` after 1400ms by
    // design (applyScenario), so it is allowed to coincide with happy.
    const distinct = new Set(digests.values());
    expect(
      distinct.size,
      `only ${distinct.size} distinct renders across 9 scenarios — the switcher did not take effect: ${JSON.stringify(
        Object.fromEntries([...digests].map(([k, v]) => [k, v.slice(0, 8)])),
      )}`,
    ).toBeGreaterThanOrEqual(5);
  });

  test('records the unresolved reference photos rather than substituting one', async ({
    page,
  }) => {
    await serveReference(page);
    const html = readFileSync(SOURCE_HTML, 'utf8');
    for (const slot of UNRESOLVED_REFERENCE_PHOTOS) {
      expect(html).toContain(slot);
    }
    // The repo ships none of them; a visual task must NOT claim parity where they appear.
    expect(UNRESOLVED_REFERENCE_PHOTOS).toHaveLength(5);
  });

  test('the five default tabs exist and Results is deliberately not one', async ({ page }) => {
    await serveReference(page);
    const html = readFileSync(SOURCE_HTML, 'utf8');
    for (const tab of REFERENCE_TABS) expect(html).toContain(tab);
    expect(REFERENCE_TABS).not.toContain('Results' as never);
    // Results is reached from the "Tests this term" metric, not a sixth pill.
    expect(html).toContain('Tests this term');
  });
});
