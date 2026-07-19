import { expect, type Locator, type Page } from '@playwright/test';

/** Collects console 'error' messages and pageerrors; assert it is empty at test end. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console.error: ${message.text()}`);
  });
  return errors;
}

/** Asserts a button with catalog `name` also carries the variant/size class `selector`. */
export async function expectVariantButton(
  row: Locator,
  name: string,
  selector: string,
): Promise<void> {
  const match = row.getByRole('button', { name, exact: true }).and(row.locator(selector));
  await expect(match, `${name} @ ${selector}`).toBeVisible();
}

/**
 * Returns descriptors of visible standalone interactive elements whose bounding box is
 * under 44×44 CSS px (1px tolerance). Inline text links (anchors inside p/li/td/blockquote,
 * WCAG 2.5.8 inline exception) and sr-only/hidden elements are exempt. The TanStack Query
 * devtools trigger (dev-only third-party chrome, absent from production builds) is excluded.
 */
export async function collectSmallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const MIN = 43; // 44px target minus 1px tolerance
    const small: string[] = [];
    for (const el of document.querySelectorAll('button, [role="button"], select, input, a[href]')) {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 1 && rect.height <= 1) continue; // display:none or sr-only clip
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none') continue;
      if (el.closest('.tsqd-parent-container')) continue; // TanStack devtools (dev-only)
      if (el instanceof HTMLAnchorElement && el.closest('p, li, td, blockquote')) continue;
      if (rect.width < MIN || rect.height < MIN) {
        const label = el.getAttribute('aria-label') ?? (el.textContent ?? '').trim().slice(0, 40);
        small.push(
          `<${el.tagName.toLowerCase()}> "${label}" ${Math.round(rect.width)}×${Math.round(rect.height)}`,
        );
      }
    }
    return small;
  });
}

/**
 * Waits for every finite CSS/JS animation on the page to finish (D-UI-2 entrance
 * animations run ~300ms) so screenshots capture the settled state, never a
 * mid-fade frame. Infinite animations (spinners, pulses) are skipped.
 */
export async function waitForAnimationsSettled(page: Page): Promise<void> {
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter((animation) => animation.effect?.getTiming().iterations !== Infinity)
        .map((animation) => animation.finished.catch(() => undefined)),
    ),
  );
}
