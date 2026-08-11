import path from 'node:path';

import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

import { cat } from './helpers/i18n';
import { apiLogin } from './helpers/teacher-auth-rail';
import {
  DASHBOARD_SURFACE,
  expectedBannerDetail,
  expectedCard,
  openDashboard,
  readBanner,
  readCard,
  readDashboard,
  TD,
} from './helpers/teacher-dashboard-flow';
import { sittingRow } from './helpers/teacher-end-session';
import { closeSession, readSessions, readTests } from './helpers/teacher-past-sessions-api';
import { en, signIn } from './helpers/teacher-rail';
import type { CreateTestSessionResponse } from '@/modules/teacher/types/teacher-session.types';

import { startSessionViaUi } from './helpers/teacher-start-session-ui';

// Task 051 — brief flow 3 (class cards show completion counts and top subskill
// gaps) and flow 4 (start a live session, return to the dashboard, the yellow
// "View live" banner appears), against the RUNNING app on :3000, the REAL Strapi
// on :5500 and the REAL PostgreSQL on 5540.
//
// Every expected value comes from a SECOND, Node-side read of C-TD-1/C-TD-2/C-TS-2
// strict-parsed through the shipped Zod mirrors — never the payload the browser
// itself consumed and never a literal. Flow 4's session is opened by pressing the
// real "Generate join code" button (a real C-TS-1 POST that really persists) and
// closed again through the real C-TS-4, so both the banner's appearance and its
// disappearance are pinned to datastore state. No interception, no fixture.

const SHOTS = path.resolve(process.cwd(), '..', '.qa', 'screenshots');
const LIVE = 'Teacher.dashboard.liveBanner';

test.describe.configure({ mode: 'serial' });

let page: Page;
let request: APIRequestContext;
let jwt: string;
let started: CreateTestSessionResponse | null = null;

test.beforeAll(async ({ browser, playwright }) => {
  // Dev-mode Turbopack compiles each segment on first visit — a cold /sign-in +
  // /dashboard outlives the 30s hook default on this machine.
  test.setTimeout(180_000);
  request = await playwright.request.newContext();
  jwt = await apiLogin(request, 'teacher');
  page = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  await signIn(page, 'teacher');
  await expect(page.locator(DASHBOARD_SURFACE)).toHaveAttribute('data-status', 'ready', {
    timeout: 60_000,
  });
});

test.afterAll(async () => {
  // Leave no sitting of this spec's own making open behind.
  if (started !== null && sittingRow(started.sitting_document_id).status === 'open') {
    await closeSession(request, jwt, started.sitting_document_id);
  }
  await page.context().close();
  await request.dispose();
});

test.describe('flow 3 — class cards carry the live counts and the top subskill gap', () => {
  test('every card equals the class C-TD-1 answered, field for field', async () => {
    const wire = await readDashboard(request, jwt);
    expect(wire.classes.length, 'the teacher owns no class').toBeGreaterThan(0);
    await expect(page.locator('[data-slot="teacher-class-card"]')).toHaveCount(
      wire.classes.length,
    );

    for (const klass of wire.classes) {
      expect(
        await readCard(page, en, klass.class_document_id),
        `card ${klass.name} drifted from C-TD-1`,
      ).toEqual(expectedCard(en, klass));
    }

    // The dataset is real, so nothing above vacuously compared zeros.
    const completed = wire.classes.reduce(
      (sum, klass) => sum + klass.test_a.completed + klass.test_b.completed,
      0,
    );
    expect(completed, 'no completion anywhere — nothing was really asserted').toBeGreaterThan(0);
    expect(wire.classes.some((klass) => klass.top_gap !== null)).toBe(true);

    await page.screenshot({ path: path.join(SHOTS, '051-flow3-class-cards.png'), fullPage: true });
  });

  test('each completion count is also the bar it labels, and the roster it belongs to', async () => {
    const wire = await readDashboard(request, jwt);
    for (const klass of wire.classes) {
      const card = page.locator(`[data-class-id="${klass.class_document_id}"]`);
      for (const [key, completion] of [
        [`${TD}.testA`, klass.test_a],
        [`${TD}.testB`, klass.test_b],
      ] as const) {
        const bar = card.getByRole('progressbar', {
          name: `${cat(en, key)}: ${completion.completed} of ${completion.total} students completed`,
        });
        await expect(bar).toHaveCount(1);
        await expect(bar).toHaveAttribute(
          'aria-valuetext',
          `${completion.completed} / ${completion.total}`,
        );
        expect(completion.completed).toBeLessThanOrEqual(completion.total);
      }
    }
  });
});

test.describe('flow 4 — the yellow banner appears while the session is live', () => {
  test('no banner names a sitting the server has not reported as live', async () => {
    const wire = await readDashboard(request, jwt);
    const banner = await readBanner(page);
    if (wire.live_session === null) {
      expect(banner, 'a banner with no live session on the wire').toBeNull();
      return;
    }
    expect(banner?.sittingId).toBe(wire.live_session.sitting_document_id);
    expect(sittingRow(wire.live_session.sitting_document_id).status).toBe('open');
  });

  test('generating a join code puts THAT sitting in the banner, with a working View live link', async () => {
    test.setTimeout(180_000);
    const wire = await readDashboard(request, jwt);
    const tests = await readTests(request, jwt);
    expect(tests.length, 'C-TD-2 offers no test').toBeGreaterThan(0);

    started = await startSessionViaUi(page, en, wire.classes[0].name, tests[0].label);

    // The server agrees this is now the live session, and C-TS-2 lists it as open.
    const live = (await readDashboard(request, jwt)).live_session;
    if (live === null) throw new Error('C-TS-1 minted a sitting but C-TD-1 reports none live');
    expect(live.sitting_document_id).toBe(started.sitting_document_id);
    expect(live.code).toBe(started.code);
    expect(live.class_name).toBe(wire.classes[0].name);
    expect(live.test_variant).toBe(tests[0].variant);
    const listed = (await readSessions(request, jwt)).find(
      (session) => session.sitting_document_id === started?.sitting_document_id,
    );
    expect(listed?.status).toBe('open');
    expect(sittingRow(started.sitting_document_id)).toEqual({ status: 'open', closed_at: '' });

    await openDashboard(page, en);
    const banner = await readBanner(page);
    expect(banner, 'no banner while a sitting is open').not.toBeNull();
    expect(banner?.sittingId).toBe(started.sitting_document_id);
    expect(banner?.pill).toBe(cat(en, `${LIVE}.live`));
    expect(banner?.title).toBe(cat(en, `${LIVE}.title`));
    expect(banner?.detail).toBe(expectedBannerDetail(en, live));
    expect(banner?.detail).toContain(started.code);
    expect(banner?.linkName.trim()).toBe(cat(en, `${LIVE}.viewLive`));
    expect(banner?.linkHref).toBe(`/dashboard/test-sessions/${started.sitting_document_id}`);
    // "A yellow banner" (.qa/DESIGN.md §Dashboard) — the resolved hue, and the
    // state also spelled out in words above, never colour alone.
    expect(banner?.hue, `banner tint ${banner?.background} is not yellow`).toBeGreaterThan(30);
    expect(banner?.hue, `banner tint ${banner?.background} is not yellow`).toBeLessThan(110);
    expect(banner?.linkBox.height, 'WCAG 2.2 AA target size').toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: path.join(SHOTS, '051-flow4-live-banner.png'), fullPage: true });

    await page.getByRole('link', { name: cat(en, `${LIVE}.viewLive`) }).click();
    await page.waitForURL(`**/dashboard/test-sessions/${started.sitting_document_id}`);
    await expect(page.locator('[data-surface="teacher-live-monitor"]')).toHaveAttribute(
      'data-status',
      'ready',
    );
    await page.screenshot({ path: path.join(SHOTS, '051-flow4-view-live.png'), fullPage: true });
  });

  test('closing that sitting takes it out of the banner', async () => {
    expect(started, 'the previous test opened nothing').not.toBeNull();
    const closing = started as CreateTestSessionResponse;
    await closeSession(request, jwt, closing.sitting_document_id);
    const row = sittingRow(closing.sitting_document_id);
    expect(row.status).toBe('closed');
    expect(row.closed_at.length, 'closed_at was not stamped').toBeGreaterThan(0);

    await openDashboard(page, en);
    const wire = await readDashboard(request, jwt);
    expect(wire.live_session?.sitting_document_id).not.toBe(closing.sitting_document_id);
    await expect(page.locator(`[data-sitting-id="${closing.sitting_document_id}"]`)).toHaveCount(0);

    // Whatever the banner shows now is the server's current answer, and that
    // sitting is genuinely open in PostgreSQL — the banner tracks open sittings
    // only. (Older sittings of this seeded teacher may legitimately still be open.)
    const banner = await readBanner(page);
    if (wire.live_session === null) {
      expect(banner, 'a banner survived with no live session on the wire').toBeNull();
    } else {
      expect(banner?.sittingId).toBe(wire.live_session.sitting_document_id);
      expect(sittingRow(wire.live_session.sitting_document_id).status).toBe('open');
    }
    await page.screenshot({ path: path.join(SHOTS, '051-flow4-after-close.png'), fullPage: true });
  });
});
