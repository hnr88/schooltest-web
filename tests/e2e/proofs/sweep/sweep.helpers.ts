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

/** Per-document counters, installed before any app script runs. */
export const SWEEP_INSTRUMENTS = `
  window.__sweepMutations = 0;
  new MutationObserver((records) => { window.__sweepMutations += records.length; }).observe(
    document.documentElement,
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
}

export function newCaptures(): SweepCaptures {
  return {
    consoleErrors: [],
    pageErrors: [],
    badResponses: [],
    failedRequests: [],
    allConsole: [],
  };
}

/** Errors of every kind captured so far — the zero-error assertion's subject. */
export function captureErrors(cap: SweepCaptures): string[] {
  return [...cap.consoleErrors, ...cap.pageErrors, ...cap.badResponses, ...cap.failedRequests];
}

/** Attach page-level collectors. `currentRoute` is read live on every event. */
export function attachCapture(page: Page, currentRoute: () => string, cap: SweepCaptures): void {
  page.on('console', (msg) => {
    const text = `[${currentRoute()}] ${msg.text()}`;
    cap.allConsole.push(`${msg.type()}: ${text}`);
    if (msg.type() === 'error') cap.consoleErrors.push(text);
  });
  page.on('pageerror', (err) => {
    cap.pageErrors.push(`[${currentRoute()}] ${err.message}`);
  });
  page.on('response', (res) => {
    if (res.status() >= 400) {
      cap.badResponses.push(
        `[${currentRoute()}] ${res.request().method()} ${res.url()} -> ${res.status()}`,
      );
    }
  });
  page.on('requestfailed', (req) => {
    const failure = req.failure()?.errorText ?? 'unknown';
    if (failure.includes('ERR_ABORTED')) return;
    cap.failedRequests.push(`[${currentRoute()}] ${req.method()} ${req.url()} -> ${failure}`);
  });
}

export interface RouteSweepResult {
  buttons: number;
  clicked: number;
  inert: string[];
}

const BUTTON_SELECTOR =
  'button:not([disabled]):not([aria-disabled="true"]), ' +
  '[role="button"]:not([disabled]):not([aria-disabled="true"])';

/**
 * Hard-navigate to `route`, let the app settle, then click every visible,
 * enabled button exactly once (index-stable: the page is re-navigated whenever
 * a click changed the URL, so every original button is reached on a fresh,
 * identical page). Dialogs opened by a click are dismissed with Escape.
 * Returns the census and any clicks classified as inert.
 */
export async function sweepRoute(
  page: Page,
  route: string,
  options: {
    onReauth?: () => Promise<void>;
    onFullyInert?: (result: RouteSweepResult) => void;
  } = {},
): Promise<RouteSweepResult> {
  const visibleButtons = () => page.locator(BUTTON_SELECTOR).filter({ visible: true });

  const settle = async () => {
    await page.waitForLoadState('load').catch(() => {});
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);
  };

  const routePath = new URL(route, page.url()).pathname;
  const sameUrl = () => page.url().split('?')[0] === routePath;
  const goto = async () => {
    await page.goto(route, { waitUntil: 'load', timeout: 120_000 });
    await settle();
  };

  await goto();
  const total = await visibleButtons().count();
  const inert: string[] = [];
  let clicked = 0;

  for (let i = 0; i < total; i += 1) {
    if (!sameUrl()) await goto();
    const buttons = visibleButtons();
    if (i >= (await buttons.count())) break; // page legitimately shrank (data settled)
    const button = buttons.nth(i);
    const label =
      ((await button.getAttribute('aria-label').catch(() => null)) ??
        (await button.innerText().catch(() => ''))).trim().slice(0, 40) || `#${i}`;

    const mutationsBefore = await page.evaluate(
      () => (window as MutationWindow).__sweepMutations ?? 0,
    );
    const urlBefore = page.url();
    await button.click({ timeout: 8_000 }).catch((err: unknown) => {
      inert.push(`${label} (click never landed: ${String(err).slice(0, 80)})`);
    });
    clicked += 1;
    await page.waitForTimeout(500);
    // Dismiss whatever the click opened (Radix menus/dialogs, drawers, popovers).
    await page.keyboard.press('Escape');
    await page.waitForTimeout(250);
    if ((await page.getByRole('dialog').count()) > 0) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(250);
    }

    // A click that signed the user out ends this page's walk; re-authenticate
    // and come back so the remaining buttons are still reached.
    if (page.url().includes('/sign-in')) {
      if (options.onReauth) await options.onReauth();
      await goto();
    }

    const inertHere =
      page.url() === urlBefore &&
      (await page.evaluate(() => (window as MutationWindow).__sweepMutations ?? 0)) ===
        mutationsBefore &&
      (await page.getByRole('dialog').count()) === 0 &&
      (await page.locator('[data-state="open"]').count()) === 0;
    if (inertHere) inert.push(label);
  }

  const result: RouteSweepResult = { buttons: total, clicked, inert };
  // Every click did nothing observable: the "hydration silently failed"
  // signature. The caller decides (with its console log) whether to flag it.
  if (inert.length > 0 && inert.length === clicked && sameUrl()) {
    options.onFullyInert?.(result);
  }
  return result;
}
