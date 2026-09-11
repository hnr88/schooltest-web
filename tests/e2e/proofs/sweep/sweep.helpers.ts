import type { Page } from '@playwright/test';

/**
 * Shared engine for the console/hydration/dead-button sweep
 * (console-error-sweep.spec.ts).
 *
 * WHAT IT COLLECTS, per navigated route:
 * - console messages of type `error` (React warnings, unhandled rejections
 *   logged by the runtime, next-intl MISSING_MESSAGE, ...)
 * - `pageerror` events (uncaught exceptions — the classic hydration breaker)
 * - responses with status >= 400 (a dead endpoint or a stale bundle chunk 404)
 * - requests that failed WITHOUT a status (CORS / net::ERR_FAILED); navigational
 *   aborts (net::ERR_ABORTED) are excluded because every hard navigation of the
 *   sweep itself cancels in-flight XHRs and that is noise, not a defect.
 *
 * It also installs a MutationObserver counter (see SWEEP_INSTRUMENTS) so a click
 * can be classified as INERT: no navigation, no dialog, no DOM change. A route
 * where EVERY click is inert AND zero console messages of ANY type were emitted
 * is exactly the "hydration never completed" signature — those routes are
 * reported for manual follow-up instead of hard-failed, because the observable
 * is indirect.
 */

/** Per-document counters, installed before any app script runs. `document`
 * (not document.documentElement — null this early) is a legal observe target. */
export const SWEEP_INSTRUMENTS = `
  window.__sweepMutations = 0;
  new MutationObserver((records) => { window.__sweepMutations += records.length; }).observe(
    document,
    { childList: true, subtree: true, attributes: true, characterData: true },
  );
`;

type MutationWindow = Window & { __sweepMutations?: number };

export interface SweepCaptures {
  consoleErrors: string[];
  pageErrors: string[];
  badResponses: string[];
  failedRequests: string[];
  allConsole: string[];
  /**
   * While true, captured errors land here instead of the asserted arrays —
   * used only around a deliberate SIGN-OUT click, whose teardown 401/403s are
   * the session ending, not a page fault. Printed for transparency.
   */
  suppressed: string[];
  suppressing: boolean;
}

export function newCaptures(): SweepCaptures {
  return {
    consoleErrors: [],
    pageErrors: [],
    badResponses: [],
    failedRequests: [],
    allConsole: [],
    suppressed: [],
    suppressing: false,
  };
}

/** Errors of every kind captured so far — the zero-error assertion's subject. */
export function captureErrors(cap: SweepCaptures): string[] {
  return [...cap.consoleErrors, ...cap.pageErrors, ...cap.badResponses, ...cap.failedRequests];
}

export interface RouteSweepResult {
  buttons: number;
  clicked: number;
  /** Buttons the census never reached because the wall-clock budget ran out. */
  unvisited: number;
  inert: string[];
}

/**
 * Errors that are KNOWN cross-repo defects, allowlisted per route so the sweep
 * stays strict-zero for everything the web owns while keeping the backend
 * defect LOUD. Each match is still printed with `[sweep-known-backend-defect]`.
 * An allowlist entry must cite the owning repo, file and line.
 */
export const KNOWN_BACKEND_DEFECTS: ReadonlyArray<{ route: RegExp; pattern: RegExp; cite: string }> = [
  {
    // GET /api/schools/me/teachers/:id/needs-attention -> 400 whenever the
    // teacher holds completed READING sessions: `acaraLadderFrom` requires the
    // v3 crosswalk shape (label_rules.ladder / acara_rules.label_attribute /
    // fallback_phase) but the ACTIVE reading crosswalk is v4 (label_rules.bands
    // / acara_rules.phases — the Decided Measurement Model). The web page
    // degrades to its error state; the request itself cannot succeed until the
    // API service learns the v4 shape or the seed ships both blocks.
    route: /sa teacher detail/,
    pattern: /\/needs-attention -> 400|needs-attention \(Bad Request\)/,
    cite: 'schooltest-api src/api/teacher/services/progress-reads.ts:139 (acaraLadderFrom) vs bootstrap/seed-crosswalk.ts reading v4',
  },
];

const BUTTON_SELECTOR =
  'button:not([disabled]):not([aria-disabled="true"]), ' +
  '[role="button"]:not([disabled]):not([aria-disabled="true"])';

/**
 * In-flight HTTP counters per page, so a click can be given time to finish its
 * mutations before the next button is resolved. The dev server's HMR
 * long-poll (`/_next/webpack-hmr`) never completes and is excluded.
 */
const pageTraffic = new WeakMap<Page, () => number>();

/** Attach page-level collectors. `currentRoute` is read live on every event. */
export function attachCapture(page: Page, currentRoute: () => string, cap: SweepCaptures): void {
  const sink = (kind: keyof Omit<SweepCaptures, 'suppressed' | 'suppressing'>, text: string): void => {
    if (cap.suppressing) cap.suppressed.push(text);
    else (cap[kind] as string[]).push(text);
  };
  page.on('console', (msg) => {
    const text = `[${currentRoute()}] ${msg.text()}`;
    cap.allConsole.push(`${msg.type()}: ${text}`);
    if (msg.type() === 'error') sink('consoleErrors', text);
  });
  page.on('pageerror', (err) => {
    sink('pageErrors', `[${currentRoute()}] ${err.message}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      sink(
        'badResponses',
        `[${currentRoute()}] ${res.request().method()} ${res.url()} -> ${res.status()}`,
      );
    }
  });
  page.on('requestfailed', (req) => {
    const failure = req.failure()?.errorText ?? 'unknown';
    if (failure.includes('ERR_ABORTED')) return;
    sink('failedRequests', `[${currentRoute()}] ${req.method()} ${req.url()} -> ${failure}`);
  });

  let inFlight = 0;
  const counts = (req: { url(): string }) => !req.url().includes('/_next/webpack-hmr');
  page.on('request', (req) => {
    if (counts(req)) inFlight += 1;
  });
  page.on('requestfinished', (req) => {
    if (counts(req)) inFlight -= 1;
  });
  page.on('requestfailed', (req) => {
    if (counts(req)) inFlight -= 1;
  });
  pageTraffic.set(page, () => inFlight);
}

/**
 * Hard-navigate to `route`, let the app settle, then click every distinct,
 * visible, enabled button exactly once. The census is re-read after every
 * click (settle → re-census → click the first button whose census key was not
 * clicked yet), because a click legitimately changes the page (state-changing
 * controls like Revoke swap the panel's buttons, tabs rewrite the query, menus
 * unmount rows). Clicking through that transient DOM instead is what produces
 * phantom double-actions. Dialogs a click opens are dismissed with Escape.
 * Returns the census and any clicks classified as inert.
 */
export async function sweepRoute(
  page: Page,
  route: string,
  options: {
    onReauth?: () => Promise<void>;
    onFullyInert?: (result: RouteSweepResult) => void;
    /** Begin/end teardown suppression around a deliberate sign-out click. */
    enterTeardown?: (label: string) => void;
    exitTeardown?: () => void;
  } = {},
): Promise<RouteSweepResult> {
  const visibleButtons = () => page.locator(BUTTON_SELECTOR).filter({ visible: true });

  // networkidle NEVER fires on pages that poll (react-query refetch windows),
  // and waiting it out costs 30s a navigation, so settle = load + in-flight
  // requests drained + a stable button census (two identical samples).
  const settle = async () => {
    await page.waitForFunction(() => document.readyState === 'complete').catch(() => {});
    const traffic = pageTraffic.get(page);
    if (traffic) {
      const deadline = Date.now() + 6_000;
      while (Date.now() < deadline && traffic() > 0) await page.waitForTimeout(150);
    }
    let previous = -1;
    for (let tick = 0; tick < 8; tick += 1) {
      const current = await visibleButtons().count();
      if (current > 0 && current === previous) break;
      previous = current;
      await page.waitForTimeout(400);
    }
    await page.waitForTimeout(300);
  };

  // /dashboard/ops server-redirects to the schools list: sweep the URL the app
  // actually renders, so a navigation-by-redirect is not mistaken for a
  // click-induced change (which would re-navigate before every button).
  //
  // OPERATIONAL RULE (measured 2026-09-11): this sweep must run against a
  // SETTLED tree. Launching it seconds after editing source puts the first
  // routes inside the dev server's recompile wave, and a client-side RSC
  // navigation that races the wave reads a chunk manifest the served HTML
  // never linked — Next logs "No link element found for chunk *.css", the
  // exact stale-bundle breakage this sweep exists to catch, as a FALSE
  // positive. The reload after the warm-up load re-reads a settled document;
  // a PERMANENT chunk error still surfaces (both loads are captured).
  const canonical = (url: string) => new URL(url).pathname;
  const goto = async () => {
    await page.goto(route, { waitUntil: 'load', timeout: 120_000 });
    await settle();
  };
  await goto();
  await page.reload({ waitUntil: 'load', timeout: 120_000 });
  await settle();
  const routePath = canonical(page.url());
  const sameUrl = () => canonical(page.url()) === routePath;

  const total = await visibleButtons().count();
  const inert: string[] = [];
  const clickedKeys = new Set<string>();
  let clicked = 0;

  // A click can commit a client-side navigation slightly AFTER the settle
  // window (RSC commit), destroying the execution context under the next
  // census/click. That is an engine race, not a page fault: re-resolve instead
  // of failing (measured on the classes tab, 2026-09-11).
  const withNavRetry = async <T>(operation: () => Promise<T>): Promise<T> => {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        const text = String(error);
        if (
          !text.includes('Execution context was destroyed') &&
          !text.includes('Target closed') &&
          !text.includes('has been closed')
        ) {
          throw error;
        }
        await page.waitForTimeout(700);
      }
    }
    throw lastError;
  };

  // One click can summon genuinely new controls (a menu's items, a panel swap);
  // the cap only exists so a pathological page cannot loop forever. The
  // wall-clock budget bounds the whole walk — a 40-button page with several
  // URL-changing clicks costs minutes, and a test timeout is the wrong way to
  // stop (it abandons the route WITHOUT its zero-error assertion).
  const maxClicks = total * 2 + 12;
  const walkDeadline = Date.now() + 240_000;
  while (clicked < maxClicks && Date.now() < walkDeadline) {
    await settle();
    if (!sameUrl()) {
      await goto();
      continue;
    }
    const buttons = visibleButtons();
    // Keys are label + occurrence index among equal labels, resolved in ONE
    // evaluateAll pass so re-censuses stay cheap on 40-button pages.
    const labels = await withNavRetry(() =>
      buttons.evaluateAll((els) =>
        els.map((el) => (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)),
      ),
    );
    const seen = new Map<string, number>();
    let target = -1;
    let targetLabel = '';
    for (let index = 0; index < labels.length; index += 1) {
      // Countdown labels ("Resend email (27)") must count as ONE key, or a
      // ticking control manufactures a fresh unclicked key every re-census.
      const label = (labels[index] || `#${index}`).replace(/\s*\(\d+\)\s*$/, '');
      const occurrence = seen.get(label) ?? 0;
      seen.set(label, occurrence + 1);
      const key = `${label}#${occurrence}`;
      if (!clickedKeys.has(key)) {
        target = index;
        targetLabel = label;
        clickedKeys.add(key);
        break;
      }
    }
    if (target === -1) break; // every distinct button clicked once

    const button = buttons.nth(target);
    const mutationsBefore = await withNavRetry(() =>
      page.evaluate(() => (window as MutationWindow).__sweepMutations ?? 0),
    );
    const urlBefore = page.url();
    // A deliberate sign-out is handled, not asserted as an error: its session
    // teardown 401/403s are captured into `suppressed` and printed.
    const isSignOut = /^(sign|log)\s*out/i.test(targetLabel);
    if (isSignOut && options.enterTeardown) options.enterTeardown(targetLabel);
    await button.click({ timeout: 8_000 }).catch((err: unknown) => {
      inert.push(`${targetLabel} (click never landed: ${String(err).slice(0, 80)})`);
    });
    clicked += 1;
    await page.waitForTimeout(400);
    // Dismiss whatever the click opened (Radix menus/dialogs, drawers, popovers).
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    if ((await page.getByRole('dialog').count()) > 0) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }

    // Sign-out (and any other navigation-committing click) redirects
    // ASYNCHRONOUSLY: router.replace lands a beat after the click, so the URL
    // must be re-checked over a short window, not once. A missed redirect here
    // used to leave the walk signed-out — bouncing through the auth guard and
    // firing dead-token requests for the rest of the route's budget.
    if (page.url().includes('/sign-in')) {
      if (options.onReauth) await options.onReauth();
      await goto();
      if (isSignOut && options.exitTeardown) options.exitTeardown();
      continue;
    }
    if (isSignOut) {
      const driftDeadline = Date.now() + 5_000;
      let drifted = false;
      while (Date.now() < driftDeadline) {
        if (page.url().includes('/sign-in')) {
          drifted = true;
          break;
        }
        await page.waitForTimeout(300);
      }
      if (drifted && options.onReauth) await options.onReauth();
      await goto();
      if (options.exitTeardown) options.exitTeardown();
      continue;
    }

    const inertHere =
      page.url() === urlBefore &&
      (await withNavRetry(() =>
        page.evaluate(() => (window as MutationWindow).__sweepMutations ?? 0),
      )) === mutationsBefore &&
      (await page.getByRole('dialog').count()) === 0 &&
      (await page.locator('[data-state="open"]').count()) === 0;
    if (inertHere) inert.push(targetLabel);
  }

  const result: RouteSweepResult = {
    buttons: total,
    clicked,
    // clicked includes menu items beyond the initial census, so floor at 0.
    unvisited: Math.max(total - clicked, 0),
    inert,
  };
  // Every click did nothing observable: the "hydration silently failed"
  // signature. The caller decides (with its console log) whether to flag it.
  if (inert.length > 0 && inert.length === clicked && sameUrl()) {
    options.onFullyInert?.(result);
  }
  return result;
}
