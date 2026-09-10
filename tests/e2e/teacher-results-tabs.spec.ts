import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test, type Page, type PlaywrightWorkerArgs } from '@playwright/test';

import { cat } from './helpers/i18n';
import { en, signInTeacher } from './helpers/teacher-rail';
import {
  API_BASE,
  bearer,
  headerStat,
  openResultsList,
  resultsRows,
} from './helpers/teacher-results-live';
import { teacherDashboardResponseSchema } from '@/modules/teacher/schemas/teacher.schema';
import type { DashboardClass } from '@/modules/teacher/types/teacher.types';

// teacher/07 — the SIX tabs of the class shell (Teacher Portal v2 :3154–3166:
// Students · Progress · Teaching insights · Exit predictions · Family reports ·
// Live sessions), the four-skill scope above them, the class switcher in the
// header and the coming-soon panel, proven against the RUNNING app. Every
// trigger is asserted by its RENDERED LABEL, never by index, so a missing i18n
// key surfaces as a failure rather than as a dotted path on screen. Screenshots
// are captured IN-SPEC at 1440×900 for mvp/teacher/proof/shots.
//
// WHOSE CLASS SHELL: the FIXTURE teacher (teacher@schooltest.local), not the
// journey teacher T2. The idempotent journey seed gives EVERY teacher exactly
// ONE class, so the switcher's reset assertion (:4579) has nothing to switch TO
// under T2; the same bootstrap seed gives the fixture teacher five real classes
// (seed-journey-fixture.ts + the C-CLS fixture in seed-school-classes.ts) with
// zero new data written for this spec.

// ONE sign-in and ONE class-detail page for the whole file; each test re-selects
// the tab it needs, so no test depends on another's selection.
test.describe.configure({ mode: 'serial' });

let classes: readonly DashboardClass[];
let page: Page;

const FIXTURE_TEACHER_EMAIL = 'teacher@schooltest.local';
const SHOTS = path.resolve(process.cwd(), '..', 'mvp', 'teacher', 'proof', 'shots');
const VIEWPORT = { width: 1440, height: 900 };
const tabLabel = (key: string) => cat(en, `Teacher.results.tabs.${key}`);
const skillLabel = (skill: string) => cat(en, `Teacher.results.skills.${skill}`);
const resultsTablist = () => page.getByRole('tablist', { name: tabLabel('listLabel') });
const skillTablist = () => page.getByRole('tablist', { name: cat(en, 'Teacher.results.skills.listLabel') });
const comingSoon = () => page.locator('[data-slot="coming-soon-panel"]');

/** {skill}-parameterised skills copy, as the running app renders it. */
const skillCopy = (key: string, skill: string): string =>
  cat(en, `Teacher.results.skills.${key}`).replace('{skill}', skillLabel(skill));

/**
 * The signed-in teacher's C-TD-1 classes, read LIVE through the same contract
 * mirror the module ships. Reads the SUCCESSOR roster route for the readiness
 * shape of nothing else — this spec's data need is the class LIST only; the old
 * board helper read C-TR-1, which the API has since retired with 410.
 */
async function readClassesLive(
  playwright: PlaywrightWorkerArgs['playwright'],
  teacherEmail: string,
): Promise<readonly DashboardClass[]> {
  const request = await playwright.request.newContext();
  try {
    const jwt = await bearer(request, teacherEmail);
    const dash = await request.get(`${API_BASE}/api/teacher/dashboard`, {
      headers: { Authorization: `Bearer ${jwt}` },
    });
    if (dash.status() !== 200) throw new Error(`[e2e] C-TD-1 answered ${dash.status()}`);
    const parsed = teacherDashboardResponseSchema.parse(await dash.json());
    if (parsed.classes.length === 0) {
      throw new Error('[e2e] the signed-in teacher owns no class');
    }
    return parsed.classes;
  } finally {
    await request.dispose();
  }
}

/** Opens ONE class detail in-session and waits for the READY frame. */
async function openFirstClassDetail(p: Page): Promise<void> {
  if (!p.url().includes('/dashboard/results')) await openResultsList(p);
  await resultsRows(p).first().click();
  await p.waitForURL(`**/dashboard/results/${classes[0].class_document_id}`);
  await expect(p.locator('[data-surface="teacher-class-results"]')).toHaveAttribute(
    'data-status',
    'ready',
    { timeout: 20_000 },
  );
}

test.beforeAll(async ({ browser, playwright }) => {
  // First-visit dev compiles (sign-in, the results list, the class detail)
  // happen inside this hook on a cold Turbopack cache — the 30s default hook
  // budget measured far too small for that (timeout observed at 30s with the
  // API and server both healthy).
  test.setTimeout(180_000);
  // RESTART-TOLERANT bootstrap (orchestrator directive): the out-of-mission
  // teacher-trial agent rewrites schooltest-api/src every 2-3 minutes and each
  // write bounces the :5500 watcher for 20-30s; the shared limiter adds 429
  // penalty windows (~38s Retry-After measured live). From inside a web spec
  // that reads as a sign-in socket hang-up / ERR_CONNECTION_REFUSED, a stuck
  // loading-to-error surface, or a 429 — an environmental signature, never
  // evidence about the code under test. The shared fetchWithRetry honours the
  // literal Retry-After header internally; at this layer a RATE-LIMITED
  // failure waits the measured penalty (45s = 38s + buffer) and other
  // transient shapes wait 15s. Containment is GUARDED, not assumed: a new
  // attempt only starts while elapsed + worst-step (90s: a 429 shape spends
  // up to ~80s riding the helper's internal retries) still fits inside this
  // hook's 180s — so exhaustion produces THIS named throw, never the opaque
  // hook timeout. Never swallow: the last real error is attached.
  const attempts = 4;
  const budgetMs = 175_000;
  const maxStepMs = 90_000;
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
        classes = await readClassesLive(playwright, FIXTURE_TEACHER_EMAIL);
        made = await browser.newPage({ viewport: VIEWPORT });
        await signInTeacher(made, FIXTURE_TEACHER_EMAIL);
        await made.setViewportSize(VIEWPORT);
        mkdirSync(SHOTS, { recursive: true });
        await openResultsList(made);
        await openFirstClassDetail(made);
      });
      // Resolved means the step completed, so the page exists — narrow rather
      // than cast.
      if (!made) {
        throw new Error('bootstrap step resolved without a page');
      }
      page = made;
      return;
    } catch (error) {
      lastError = error;
      lastClass = classify(String(error));
      // The seed guard is a deliberate failure, not an environment flap —
      // never retried, never swallowed.
      if (String(error).includes('BLOCKED ON SEED')) throw error;
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
  await page.close();
});

test.describe('the six tabs', () => {
  test('render in the design label order, each >= 44px, by rendered label', async () => {
    await expect(resultsTablist()).toBeVisible();
    const tabs = resultsTablist().getByRole('tab');
    await expect(tabs).toHaveCount(6);
    await expect(tabs).toHaveText([
      tabLabel('students'),
      tabLabel('progress'),
      tabLabel('insights'),
      tabLabel('exit'),
      tabLabel('reports'),
      tabLabel('live'),
    ]);

    for (let index = 0; index < 6; index += 1) {
      const box = await tabs.nth(index).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');

    await page.screenshot({ path: path.join(SHOTS, '07-six-tabs.png'), animations: 'disabled' });
  });

  test('are keyboard-operable: arrows move focus, Enter/Space activates', async () => {
    const tabs = resultsTablist().getByRole('tab');

    // Roving tabindex + MANUAL activation — the ARIA APG pattern Base UI ships
    // by default: Arrow/Home/End move focus, Enter or Space activates. Manual
    // is the right pattern here because an inactive Tabs.Panel is unmounted,
    // so automatic activation would mount a sibling tab's panel — and fire its
    // query — on every arrow press.
    await tabs.nth(0).focus();
    await page.keyboard.press('ArrowRight');
    await expect(tabs.nth(1)).toBeFocused();
    await expect(tabs.nth(1)).toHaveAttribute('tabindex', '0');
    await expect(tabs.nth(0)).toHaveAttribute('tabindex', '-1');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
    await page.keyboard.press('Enter');
    await expect(tabs.nth(1)).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'false');

    await page.keyboard.press('End');
    await expect(tabs.nth(5)).toBeFocused();
    await page.keyboard.press(' ');
    await expect(tabs.nth(5)).toHaveAttribute('aria-selected', 'true');

    await page.keyboard.press('Home');
    await expect(tabs.nth(0)).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(tabs.nth(0)).toHaveAttribute('aria-selected', 'true');
  });

  test('every tab points at a panel and that panel points back', async () => {
    const tabs = resultsTablist().getByRole('tab');

    for (let index = 0; index < 6; index += 1) {
      await tabs.nth(index).click();
      const tabId = await tabs.nth(index).getAttribute('id');
      const controls = await tabs.nth(index).getAttribute('aria-controls');
      expect(tabId, 'tab needs an id for aria-labelledby').toBeTruthy();
      expect(controls, 'tab needs aria-controls').toBeTruthy();
      const panel = page.locator(`#${controls}`);
      await expect(panel).toHaveAttribute('role', 'tabpanel');
      await expect(panel).toHaveAttribute('aria-labelledby', tabId ?? '');
      await expect(panel).toBeVisible();
    }
  });

  test('Family reports and Live sessions are honest tab values: panels, no stubs', async () => {
    const tabs = resultsTablist().getByRole('tab');

    // Their feature UI is tasks 25 and 08 ([D-20] — tab VALUES, not routes), so
    // the panels render no stand-in body and no dead control (OP-2): an honestly
    // empty tabpanel beats a placeholder that pretends to be a feature.
    for (const [index, label] of [
      [4, tabLabel('reports')],
      [5, tabLabel('live')],
    ] as const) {
      await tabs.nth(index).click();
      await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
      await expect(
        page.locator(`#${await tabs.nth(index).getAttribute('aria-controls')}`),
      ).toBeVisible();
      await expect(page.locator('[data-slot="results-tab-pending"]')).toHaveCount(0);
      await expect(page.getByRole('button', { name: label })).toHaveCount(0);
    }
    // And the whole shell never grew the design's header entry points whose
    // panels are tasks 27/28 — the literal design labels, which ship no keys.
    await expect(page.getByRole('button', { name: 'Reports and data' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Ask AI' })).toHaveCount(0);
  });

  test('Exit predictions keeps its inert panel and no Coming soon badge on the trigger', async () => {
    await resultsTablist().getByRole('tab', { name: tabLabel('exit'), exact: true }).click();

    const panel = page.locator('[data-slot="exit-predictions-panel"]');
    await expect(panel).toBeVisible();
    await expect(
      panel.getByRole('heading', {
        level: 2,
        name: cat(en, 'Teacher.results.exitPredictions.title'),
      }),
    ).toBeVisible();
    await expect(panel).toContainText(cat(en, 'Teacher.results.exitPredictions.description'));

    // No actionable content, and no fabricated prediction: nothing focusable and
    // no digit anywhere in the panel.
    await expect(
      panel.locator('a, button, input, select, textarea, [role="button"], [tabindex]'),
    ).toHaveCount(0);
    await expect(panel).not.toContainText(/\d/);

    await page.screenshot({ path: path.join(SHOTS, '07-exit-tab.png'), animations: 'disabled' });
  });

  test('no tab is left as a placeholder standing in for a real read', async () => {
    const tabs = resultsTablist().getByRole('tab');

    await tabs.filter({ hasText: tabLabel('progress') }).click();
    await expect(page.locator('[data-slot="class-progress"]')).toBeVisible();
    await expect(page.locator('[data-slot="results-tab-pending"]')).toHaveCount(0);
  });
});

test.describe('the skill scope', () => {
  test('offers the four skills, Reading live, three Soon — one place, design order', async () => {
    const chips = skillTablist().getByRole('tab');
    await expect(chips).toHaveCount(4);

    // Per-chip contains-text (label, sub and the Soon badge), not a whole-chip
    // text match: the chip's spans are adjacent elements, so textContent has no
    // whitespace to key a \s* pattern on.
    const soon = cat(en, 'Teacher.results.skills.soonBadge');
    const comingSoonSub = tabLabel('comingSoon');
    const expectations = [
      { name: skillLabel('reading'), sub: cat(en, 'Teacher.results.skills.liveNow'), badge: null },
      { name: skillLabel('listening'), sub: comingSoonSub, badge: soon },
      { name: skillLabel('writing'), sub: comingSoonSub, badge: soon },
      { name: skillLabel('speaking'), sub: comingSoonSub, badge: soon },
    ] as const;
    for (const [index, chip] of expectations.entries()) {
      await expect(chips.nth(index)).toContainText(chip.name);
      await expect(chips.nth(index)).toContainText(chip.sub);
      if (chip.badge) {
        await expect(chips.nth(index)).toContainText(chip.badge);
      } else {
        await expect(chips.nth(index)).not.toContainText(soon);
      }
    }
    await expect(chips.nth(0)).toHaveAttribute('aria-selected', 'true');

    await page.screenshot({ path: path.join(SHOTS, '07-skill-tabs.png'), animations: 'disabled' });
  });

  test('a Soon skill replaces the whole strip and body with the coming-soon panel', async () => {
    await skillTablist().getByRole('tab', { name: new RegExp(skillLabel('listening')) }).click();

    // The reading tab strip is GONE — not merely dimmed (:4568–4569).
    await expect(resultsTablist()).toHaveCount(0);
    // The skill chips stay: they are the way back to Reading.
    await expect(skillTablist()).toBeVisible();

    await expect(comingSoon()).toBeVisible();
    await expect(
      comingSoon().getByRole('heading', { level: 2, name: skillCopy('comingSoonTitle', 'listening') }),
    ).toBeVisible();
    await expect(comingSoon()).toContainText(skillCopy('comingSoonBody', 'listening'));
    await expect(comingSoon().locator('[data-slot="skill-status-chip"]')).toHaveCount(4);
    await expect(comingSoon().locator('[data-slot="skill-status-chip"][data-state="live"]')).toHaveText(
      [skillCopy('liveChip', 'reading')],
    );
    // D-12: no notify-me confirmation — a confirmation that records nothing is
    // a lie, so the panel carries NO control of any kind on either scope.
    await expect(
      comingSoon().locator('a, button, input, select, textarea, [role="button"], [tabindex]'),
    ).toHaveCount(0);

    await page.screenshot({
      path: path.join(SHOTS, '07-coming-soon-listening.png'),
      animations: 'disabled',
    });
  });

  test('choosing Reading restores the PREVIOUS tab (:4579 + :3089)', async () => {
    // Park the tab state on Progress, hide the strip, come back: the teacher
    // must land where they were, not back on Students.
    await skillTablist().getByRole('tab', { name: new RegExp(skillLabel('reading')) }).click();
    await resultsTablist().getByRole('tab', { name: tabLabel('progress') }).click();
    await expect(page.locator('[data-slot="class-progress"]')).toBeVisible();

    await skillTablist().getByRole('tab', { name: new RegExp(skillLabel('writing')) }).click();
    await expect(comingSoon()).toBeVisible();
    await expect(comingSoon().getByRole('heading', { level: 2, name: skillCopy('comingSoonTitle', 'writing') })).toBeVisible();

    await skillTablist().getByRole('tab', { name: new RegExp(skillLabel('reading')) }).click();
    await expect(resultsTablist()).toBeVisible();
    await expect(page.locator('[data-slot="class-progress"]')).toBeVisible();
  });
});

test.describe('the class header', () => {
  test('keeps the C-TR-1 summary stat strip beside the switcher', async () => {
    // The four tiles stay computed from the ONE roster read — the switcher's
    // arrival in the header row must not have displaced them.
    for (const key of ['class-average', 'reliable-growth', 'phase-spread', 'scored-total']) {
      await expect(headerStat(page, key)).toBeVisible();
    }
  });
});

test.describe('the class switcher', () => {
  test('switches class from the ONE cached C-TD-1 read and resets to students + reading', async () => {
    // BLOCKED ON SEED guard, not a skip: if a future seed ever leaves the
    // signed-in teacher with a single class, this assertion FAILS naming the
    // reason — it never silently passes over an untested switcher.
    if (classes.length < 2) {
      throw new Error(
        `[e2e] BLOCKED ON SEED: the signed-in teacher owns ${classes.length} class; ` +
          'the switcher reset assertion needs a second teacher-owned class to switch to',
      );
    }
    const switcherLabel = cat(en, 'Teacher.results.classSwitcher.label');
    const trigger = page.getByRole('combobox', { name: switcherLabel });
    await expect(trigger).toBeVisible();

    // The open listbox shows the seeded classes (screenshot in the OPEN state).
    await trigger.click();
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();
    await page.screenshot({
      path: path.join(SHOTS, '07-class-switcher-open.png'),
      animations: 'disabled',
    });

    const next = classes[1];
    await page.getByRole('option', { name: next.name }).click();

    // The switch is a real navigation to the other class's results route…
    await page.waitForURL(`**/dashboard/results/${next.class_document_id}`);
    await expect(page.locator('[data-surface="teacher-class-results"]')).toHaveAttribute(
      'data-status',
      'ready',
      { timeout: 20_000 },
    );
    // …with NO student-table query params riding along…
    expect(new URL(page.url()).search, 'no student-table params survive the switch').toBe('');

    // …and the state reset of :4579 + :3089 — students + reading, which the ops
    // tab handler does NOT do, so it is asserted explicitly.
    await expect(resultsTablist().getByRole('tab').nth(0)).toHaveAttribute('aria-selected', 'true');
    await expect(
      skillTablist().getByRole('tab', { name: new RegExp(skillLabel('reading')) }),
    ).toHaveAttribute('aria-selected', 'true');
    await expect(page.locator('[data-slot="students-tab-panel"]')).toBeVisible();
  });
});
