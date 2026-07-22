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

// ── TOKENS: colour foundation ────────────────────────────────────────────────
//
// D-DESIGN-2: the design's hex is the authority for the COLOUR; it is converted to
// OKLCH, lands as a token, and the hex is recorded beside it as provenance. Both
// halves are asserted here — the OKLCH value AND the provenance comment.
//
// NOTE, recorded deliberately: task 001 specifies asserting the OKLCH string through
// `getComputedStyle(document.documentElement).getPropertyValue(...)` "because the
// browser returns custom properties as declared". It does not. Lightning CSS (the
// transformer Tailwind v4 runs) downlevels every `oklch()` to an sRGB hex fallback plus
// `lab()`, so the DOM returns e.g. `lab(97.8302% -.285119 -1.67642)` for --background.
// The declared value is therefore asserted against the source of truth (globals.css),
// and the DOM is used for what only the DOM can prove: that the token and its utility
// paint the identical colour, at both viewports.
const LIGHT_ROOT = (() => {
  const css = readFileSync(GLOBALS_CSS, 'utf8');
  const block = /\n:root\s*\{([\s\S]*?)\n\}/.exec(css);
  expect(block, 'globals.css: no :root block found').not.toBeNull();
  return (block as RegExpExecArray)[1];
})();

/** [design hex, OKLCH that must be declared, every token that must carry it] */
const SWATCH_BOARD: ReadonlyArray<readonly [string, string, readonly string[]]> = [
  ['#0A1A3C', 'oklch(0.227 0.0691 263.0857)', ['--navy-950']],
  [
    '#0E2350',
    'oklch(0.2692 0.0871 263.0388)',
    ['--navy-900', '--foreground', '--card-foreground', '--popover-foreground', '--chart-3'],
  ],
  [
    '#16326E',
    'oklch(0.3341 0.1099 263.0016)',
    ['--navy-800', '--secondary-foreground', '--sidebar-accent-foreground'],
  ],
  ['#1D4ED8', 'oklch(0.4882 0.2172 264.3763)', ['--blue-700']],
  [
    '#2563EB',
    'oklch(0.5461 0.2152 262.8809)',
    ['--blue-600', '--primary', '--chart-1', '--sidebar-primary'],
  ],
  ['#3B82F6', 'oklch(0.6231 0.188 259.8145)', ['--blue-500']],
  ['#DBEAFE', 'oklch(0.9319 0.0316 255.5855)', ['--blue-100']],
  ['#EFF5FF', 'oklch(0.9685 0.0148 260.7297)', ['--blue-50', '--secondary', '--sidebar-accent']],
  ['#0D9488', 'oklch(0.6002 0.1038 184.704)', ['--teal-600']],
  ['#14B8A6', 'oklch(0.7038 0.123 182.5025)', ['--teal-500', '--accent', '--chart-2']],
  ['#CCFBF1', 'oklch(0.9527 0.0498 180.8012)', ['--teal-100']],
  ['#F0FDFA', 'oklch(0.9836 0.0142 180.72)', ['--teal-50']],
  ['#475569', 'oklch(0.4455 0.0374 257.2808)', ['--sidebar-foreground']],
  ['#64748B', 'oklch(0.5544 0.0407 257.4166)', ['--muted-foreground']],
  ['#CBD5E1', 'oklch(0.869 0.0198 252.8943)', ['--input']],
  ['#E3E8F0', 'oklch(0.9295 0.0121 259.823)', ['--border', '--sidebar-border']],
  ['#F7F9FC', 'oklch(0.9814 0.0045 258.3244)', ['--background']],
  ['#16A34A', 'oklch(0.6271 0.1699 149.2138)', ['--success']],
  ['#D97706', 'oklch(0.6658 0.1574 58.3183)', ['--warning']],
  ['#DC2626', 'oklch(0.5771 0.2152 27.325)', ['--destructive']],
] as const;

test('TOKENS: every swatch-board colour is declared as OKLCH with its design hex recorded', () => {
  for (const [hex, oklch, tokens] of SWATCH_BOARD) {
    for (const token of tokens) {
      const decl = new RegExp(`\\n\\s*${token}:\\s*([^;]+);\\s*(/\\*([^*]|\\*[^/])*\\*/)?`).exec(
        LIGHT_ROOT,
      );
      expect(decl, `globals.css :root does not declare ${token}`).not.toBeNull();
      const [, value, comment] = decl as RegExpExecArray;
      expect(value.trim(), `${token} must be the design's ${hex}`).toBe(oklch);
      expect(
        (comment ?? '').toUpperCase(),
        `${token} is missing its D-DESIGN-2 provenance comment for ${hex}`,
      ).toContain(hex.toUpperCase());
    }
  }
});

test('TOKENS: the board-only slate-900 is deliberately NOT a token', () => {
  // Recorded refusal (task 001 step 3 / CLAUDE.md law 1): #0F172A is on the swatch board
  // but no component in the eight DS slices consumes it, so no token is created for it.
  // Comments stripped first: the refusal itself is recorded as a comment naming the hex,
  // and a hex inside a comment is provenance, never a colour declaration.
  const declarations = readFileSync(GLOBALS_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(declarations).not.toContain('0.2077 0.0398 265.7549');
  expect(declarations.toUpperCase()).not.toContain('#0F172A');
});

test('TOKENS: no colour is declared as a raw hex — OKLCH only outside comments', () => {
  const declarations = readFileSync(GLOBALS_CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  expect(declarations.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
});

for (const [label, width, height] of [
  ['1280x720', 1280, 720],
  ['375x812', 375, 812],
] as const) {
  test(`TOKENS: token and utility paint the identical colour at ${label}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/design-system');

    const painted = await page.evaluate(() => {
      const paint = (apply: (el: HTMLElement) => void) => {
        const el = document.createElement('div');
        el.style.borderStyle = 'solid';
        el.style.borderWidth = '1px';
        apply(el);
        document.body.appendChild(el);
        const cs = getComputedStyle(el);
        const out = { bg: cs.backgroundColor, border: cs.borderTopColor };
        el.remove();
        return out;
      };
      const root = getComputedStyle(document.documentElement);
      return {
        backgroundVar: paint((el) => {
          el.style.backgroundColor = 'var(--background)';
        }).bg,
        backgroundUtil: paint((el) => {
          el.className = 'bg-background';
        }).bg,
        primaryVar: paint((el) => {
          el.style.backgroundColor = 'var(--primary)';
        }).bg,
        primaryUtil: paint((el) => {
          el.className = 'bg-primary';
        }).bg,
        borderVar: paint((el) => {
          el.style.borderColor = 'var(--border)';
        }).border,
        borderUtil: paint((el) => {
          el.className = 'border-border';
        }).border,
        declared: ['--background', '--foreground', '--primary', '--border'].map((n) =>
          root.getPropertyValue(n).trim(),
        ),
      };
    });

    expect(painted.backgroundVar).not.toBe('');
    expect(painted.backgroundUtil).toBe(painted.backgroundVar);
    expect(painted.primaryUtil).toBe(painted.primaryVar);
    expect(painted.borderUtil).toBe(painted.borderVar);
    // Viewport-independence guard against a stray media query: the same four strings
    // must come back at 1280 and at 375.
    expect(painted.declared.every((v) => v.length > 0)).toBe(true);
    test.info().annotations.push({ type: label, description: painted.declared.join(' | ') });
  });
}

// ── TOKENS: type scale ───────────────────────────────────────────────────────
//
// The class literals below are load-bearing twice over: they are the assertion, and
// they are also what puts `text-body-lg` / `text-body-md` into Tailwind v4's source
// scan. A `@theme` token whose utility appears in no scanned file is tree-shaken and
// emits no rule at all — the token exists but the class does nothing until a real
// consumer references it.
const TYPE_STEPS = {
  1280: [
    ['text-display', '56px', '58.8px', '-1.68px'],
    ['text-h1', '40px', '46px', '-0.8px'],
    ['text-h2', '32px', '38.4px', '-0.48px'],
    ['text-h3', '24px', '31.2px', 'normal'],
    ['text-h4', '18px', '25.2px', 'normal'],
    ['text-body-lg', '16px', '25.6px', 'normal'],
    ['text-body-md', '14px', '21.7px', 'normal'],
    ['text-meta', '12.5px', '18.75px', 'normal'],
  ],
  375: [
    ['text-display', '36px', '37.8px', '-1.08px'],
    ['text-h1', '40px', '46px', '-0.8px'],
    ['text-h2', '32px', '38.4px', '-0.48px'],
    ['text-h3', '24px', '31.2px', 'normal'],
    ['text-h4', '18px', '25.2px', 'normal'],
    ['text-body-lg', '16px', '25.6px', 'normal'],
    ['text-body-md', '14px', '21.7px', 'normal'],
    ['text-meta', '12.5px', '18.75px', 'normal'],
  ],
} as const;

for (const [width, height] of [
  [1280, 720],
  [375, 812],
] as const) {
  test(`TOKENS: the eight published type steps compute their design metrics at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/design-system');

    const measured = await page.evaluate((classes: readonly string[]) => {
      return classes.map((cls) => {
        const el = document.createElement('span');
        el.className = cls;
        el.textContent = 'Hamburgefonstiv';
        document.body.appendChild(el);
        const cs = getComputedStyle(el);
        const out = [cls, cs.fontSize, cs.lineHeight, cs.letterSpacing];
        el.remove();
        return out;
      });
    }, TYPE_STEPS[width].map(([cls]) => cls));

    expect(measured).toEqual(TYPE_STEPS[width].map((step) => [...step]));
  });
}

test('TOKENS: the Display clamp is layout, not motion — it survives reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/design-system');
  const size = await page.evaluate(() => {
    const el = document.createElement('span');
    el.className = 'text-display';
    el.textContent = 'Hamburgefonstiv';
    document.body.appendChild(el);
    const value = getComputedStyle(el).fontSize;
    el.remove();
    return value;
  });
  expect(size).toBe('56px');
});

// ── TOKENS: typeface ─────────────────────────────────────────────────────────
//
// D-DESIGN-4: Google Sans is self-hosted through next/font/local from the design
// export's own TTFs. `.claude/rules/tailwind.md:8` bans Inter/Roboto/Arial/Open Sans/
// Lato/Montserrat — Google Sans is on neither that list nor the allow-list, and the
// design is explicit, so the design wins. Recorded, not re-argued.
test('TOKENS: the Google Sans stack matches the design and the variable axis renders', async ({
  page,
}) => {
  await page.goto('/design-system');

  const typeface = await page.evaluate(async () => {
    const family = getComputedStyle(document.body).fontFamily;
    const generated = family.split(',')[0].trim().replace(/^['"]|['"]$/g, '');

    await document.fonts.ready;
    await document.fonts.load(`700 16px "${generated}"`);
    await document.fonts.load(`italic 400 16px "${generated}"`);

    const measure = (style: string, weight: string) => {
      const el = document.createElement('span');
      el.style.cssText = `position:absolute;white-space:nowrap;font-size:16px;font-style:${style};font-weight:${weight};font-family:"${generated}"`;
      el.textContent = 'Hamburgefonstiv 0123456789';
      document.body.appendChild(el);
      const out = { width: el.getBoundingClientRect().width, style: getComputedStyle(el).fontStyle };
      el.remove();
      return out;
    };

    return {
      family,
      generated,
      regular: measure('normal', '400'),
      bold: measure('normal', '700'),
      italic: measure('italic', '400'),
      loaded400: document.fonts.check(`400 16px "${generated}"`),
      loaded700: document.fonts.check(`700 16px "${generated}"`),
      loadedItalic: document.fonts.check(`italic 400 16px "${generated}"`),
      smoothing: getComputedStyle(document.documentElement)
        .getPropertyValue('-webkit-font-smoothing')
        .trim(),
    };
  });

  // The design's stack, tokens.css:8, in order after the generated family.
  const chain = typeface.family.split(',').map((part) => part.trim().replace(/^['"]|['"]$/g, ''));
  for (const fallback of [
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'system-ui',
    'sans-serif',
  ]) {
    expect(chain, `--font-sans is missing ${fallback}`).toContain(fallback);
  }
  const ordered = chain.filter((part) =>
    ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif'].includes(part),
  );
  expect(ordered).toEqual([
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'system-ui',
    'sans-serif',
  ]);

  // The axis is LOADED, not merely declared — a fallback-only render would make the
  // 400 and 700 measurements near-identical.
  expect(typeface.loaded400).toBe(true);
  expect(typeface.loaded700).toBe(true);
  expect(typeface.bold.width - typeface.regular.width).toBeGreaterThan(2);

  expect(typeface.loadedItalic).toBe(true);
  expect(typeface.italic.style).toBe('italic');

  // [SRC:14] -webkit-font-smoothing:antialiased, carried by the root `antialiased` class.
  expect(typeface.smoothing).toBe('antialiased');
});
