import { readFileSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '@playwright/test';

import { GROUP_TOKEN_PREFIX, THEME_CLASS_GROUPS } from '@/lib/utils';

// GUARD — regression fence for the tailwind-merge custom-token bug.
//
// A custom @theme token that is not registered in a tailwind-merge classGroup either
// lands in the WRONG group (an unknown `text-*` is read as a text COLOUR, so one of the
// two is dropped and the element falls back to 16px) or in NO group (two `rounded-*`
// classes both survive and stylesheet order decides, so `rounded-panel` loses to the
// primitive's `rounded-xl`). Neither failure is visible anywhere — no error, no missing
// class — which is why it survived two rounds. The only thing that keeps it fixed is a
// test comparing the two lists directly.
const GLOBALS_CSS = path.resolve(process.cwd(), 'src', 'app', 'globals.css');

/** Token names declared under `prefix` inside the `@theme` block, minus the
 *  `--line-height` / `--letter-spacing` sub-properties of the same token. */
function themeTokens(prefix: string): string[] {
  const css = readFileSync(GLOBALS_CSS, 'utf8');
  const theme = /@theme[^{]*\{([\s\S]*?)\n\}/.exec(css);
  expect(theme, 'globals.css: no @theme block found').not.toBeNull();
  const pattern = new RegExp(`${prefix}([a-z0-9-]+)\\s*:`, 'g');
  const names = new Set<string>();
  for (const match of (theme as RegExpExecArray)[1].matchAll(pattern)) {
    const name = match[1];
    if (name.endsWith('--line-height') || name.endsWith('--letter-spacing')) continue;
    names.add(name);
  }
  return [...names].sort();
}

for (const [group, tokens] of Object.entries(THEME_CLASS_GROUPS)) {
  const prefix = GROUP_TOKEN_PREFIX[group as keyof typeof THEME_CLASS_GROUPS];

  test(`TOKENS: every ${prefix}* @theme token is registered in the "${group}" classGroup`, () => {
    const declared = themeTokens(prefix);
    const registered: string[] = [...tokens].sort();

    const unregistered = declared.filter((name) => !registered.includes(name));
    expect(
      unregistered,
      `globals.css declares ${unregistered.map((n) => prefix + n).join(', ')} but ` +
        `src/lib/utils.ts does not register them in "${group}" — tailwind-merge will ` +
        'misclassify the utility and the token will silently not render.',
    ).toEqual([]);

    const orphaned = registered.filter((name) => !declared.includes(name));
    expect(
      orphaned,
      `src/lib/utils.ts registers ${orphaned.join(', ')} in "${group}" but globals.css ` +
        `@theme has no matching ${prefix}* token.`,
    ).toEqual([]);

    expect(declared.length).toBeGreaterThan(0);
  });
}

test('TOKENS: custom sizes and radii survive cn() in the real DOM', async ({ page }) => {
  await page.goto('/design-system');

  // ToggleRow's description merges `text-body-sm` with `text-muted-foreground` — exactly
  // the shape that regressed — so it is asserted from computed style, not the class list.
  const description = page.locator('[data-slot="toggle-row"] span').first();
  await expect(description).toBeVisible();
  await expect(description).toHaveCSS('font-size', '13.5px'); // --text-body-sm 0.84375rem

  const score = page.locator('[data-slot="score-text"]').first();
  await expect(score).toBeVisible();
  await expect(score).toHaveCSS('font-size', '14px'); // ScoreText size="md" — canonical 14px

  // MetricCard passes `rounded-panel` into a Card primitive that already sets
  // `rounded-xl` (14px). The canonical panel radius is 16px.
  const metric = page.locator('[data-slot="metric-card"]').first();
  await expect(metric).toBeVisible();
  await expect(metric).toHaveCSS('border-radius', '16px'); // --radius-panel 1rem
});
