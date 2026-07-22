---
id: 003
title: Complete and prove the `.dark` token layer, including the dark-only component tints the board shows
layer: ui
kind: implement
slice: Dark mode — the full `.dark` override set from `tokens.css` plus every dark-surface value `ds--dark-mode.html` paints that no token covers
target: src/app/globals.css (`.dark` block), tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/screens/ds--dark-mode.html · dashbaord-design/tokens.css:74-113 · .qa/design/spec/04-ds-foundations.md#2-5-dark-mode and #TAILWIND-V4-MAPPING-E
status: TODO
depends_on: ['001']
---

## Objective

The `.dark` block must be a faithful, complete, provable port of `tokens.css:74-113` PLUS the six
component tints the dark-mode board paints that `tokens.css` never declares. The app ships
`forcedTheme="light"` and this task does not change that — it makes the dark layer correct and
asserted so W1's primitives can carry `dark:` variants that are right the first time.

## Contract

n/a. Binding source is `dashbaord-design/tokens.css:74-113` and
`.qa/design/spec/04-ds-foundations.md` §2.5, whose defect note is binding:

> **Defect to carry forward:** `[TOK:79]` and `[TOK:80]` both declare `--popover` in `.dark` —
> `#16224080` (8-digit hex, 50% alpha) is immediately overwritten by `#162240`. The effective dark
> popover is the **opaque** `#162240`. Do not port the dead line.

## Design source

**Part A — the 24 `.dark` overrides (`tokens.css:74-113`).** All are already present in
`src/app/globals.css`'s `.dark` block. Verify each against spec §TAILWIND-V4-MAPPING-E
byte-for-byte and add the hex provenance comment; correct only genuine mismatches:

`--background` `#0B1226` `oklch(0.1876 0.0422 267.6881)` · `--foreground` `#E6ECF7`
`oklch(0.9418 0.0162 262.7519)` · `--card` `#111B33` `oklch(0.2267 0.049 265.5909)` ·
`--popover` `#162240` `oklch(0.2583 0.059 265.9728)` · `--primary` `#3B82F6`
`oklch(0.6231 0.188 259.8145)` · `--secondary` `#1A2A4E` `oklch(0.2916 0.0693 264.4597)` ·
`--secondary-foreground` `#C7D6F2` `oklch(0.8736 0.0421 263.0004)` · `--muted` `#17233F`
`oklch(0.2609 0.0554 265.2532)` · `--muted-foreground` `#8FA3C7` `oklch(0.7127 0.0574 262.1235)` ·
`--accent` `#2DD4BF` `oklch(0.7845 0.1325 181.912)` · `--accent-foreground` `#06251F`
`oklch(0.2397 0.0381 177.6461)` · `--destructive` `#EF4444` `oklch(0.6368 0.2078 25.3313)` ·
`--success` `#22C55E` `oklch(0.7227 0.192 149.5793)` · `--success-foreground` `#06250F`
`oklch(0.2348 0.0553 149.8002)` · `--warning` `#F59E0B` `oklch(0.7686 0.1647 70.0804)` ·
`--warning-foreground` `#2A1B02` `oklch(0.2355 0.0459 77.8229)` · `--border` `#223154`
`oklch(0.3186 0.0659 265.3192)` · `--input` `#2C3D66` `oklch(0.3664 0.0744 265.8278)` ·
`--ring` `rgba(59,130,246,.45)` `oklch(0.6231 0.188 259.8145 / 45%)` · `--chart-1..5`
`#60A5FA #2DD4BF #93C5FD #1D4ED8 #0D9488` · `--sidebar` `#0E1830` `oklch(0.2142 0.0496 265.3945)` ·
`--sidebar-foreground` `#A9BADC` `oklch(0.7873 0.0521 264.2139)` · `--sidebar-accent-foreground`
`#DBEAFE` `oklch(0.9319 0.0316 255.5855)` · `--sidebar-border`/`--sidebar-ring` as `--border`/`--ring`.

**Part B — the dark-only component tints, read directly off `ds--dark-mode.html`.** These appear in
no `tokens.css` variable and are what W1's dark variants need:

| New `.dark` token | Design value | OKLCH to write | Cite |
|---|---|---|---|
| `--disabled-surface` (override) | dark disabled fill = `--secondary` `#1A2A4E` | `oklch(0.2916 0.0693 264.4597)` | derived from `[DARK:7]` secondary button fill; the export shows no dark disabled specimen |
| `--accent-soft` | `rgba(45,212,191,.14)` accent badge bg | `oklch(0.7845 0.1325 181.912 / 14%)` | `ds--dark-mode.html:10` |
| `--accent-soft-foreground` | `#5EEAD4` accent badge ink | `oklch(0.8549 0.1251 181.0707)` | `ds--dark-mode.html:10` |
| `--success-soft` | `rgba(34,197,94,.14)` Live badge bg | `oklch(0.7227 0.192 149.5793 / 14%)` | `ds--dark-mode.html:11` |
| `--success-soft-foreground` | `#86EFAC` Live badge ink | `oklch(0.8712 0.1363 154.4491)` | `ds--dark-mode.html:11` |
| `--info-surface` | `rgba(59,130,246,.10)` dark alert bg | `oklch(0.6231 0.188 259.8145 / 10%)` | `ds--dark-mode.html:24` |
| `--info-border` | `rgba(59,130,246,.35)` dark alert border | `oklch(0.6231 0.188 259.8145 / 35%)` | `ds--dark-mode.html:24` |

Light-mode counterparts for the same four soft roles already exist and MUST be reused, not
duplicated: `--color-success-soft-2` `#DCFCE7`, `--color-success-strong` `#15803D`,
`--color-warning-soft` `#FEF3C7`, `--color-danger-soft-2` `#FEE2E2`, `--teal-100` `#CCFBF1`.
Where a `.dark` value is needed for one of those, add the override in `.dark` and reference it from
`@theme inline` as `var(--x)` — never a second literal in `@theme`.

**Dark geometry facts, for the record (consumed by W1, not built here):** dark buttons keep the
light geometry exactly — `padding:10px 18px; border-radius:10px; font-size:14px; font-weight:600`,
outline compensating at `9px 17px` `[DARK:6-9]`; the dark input is `padding:10px 13px;
border-radius:10px; border:1px solid #2C3D66; background:#111B33` with focus
`border-color:#3B82F6; box-shadow:0 0 0 3px rgba(59,130,246,.22)` `[DARK:16]` — that focus alpha
(.22, not the light .16) is 013's business.

## Files

- `src/app/globals.css` — the `.dark` block, plus the `@theme inline` references for the four new
  soft-role tokens.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: dark mode` block.

## Depends on

- **001** — the light layer and the provenance convention every `.dark` override mirrors.

## Steps

1. Verify all 24 existing `.dark` values against Part A; add provenance comments.
2. Confirm the dead `--popover: #16224080` line is NOT present (it is not today) and record that
   the opaque `#162240` is the effective value, per the spec's carry-forward defect note.
3. Add the seven Part-B overrides to `.dark`, each with its slice cite.
4. Add `--color-accent-soft`, `--color-accent-soft-foreground`, `--color-success-soft-role`,
   `--color-success-soft-foreground`, `--color-info-surface`, `--color-info-border` to
   `@theme inline` as `var(--x)` references, with light-mode values declared on `:root` from the
   §2.3 table (`--accent-soft` light = `--teal-100` `#CCFBF1`; `--success-soft` light =
   `#DCFCE7`; `--info-surface` light = `#EFF5FF`; `--info-border` light = `#E3E8F0` per `[ALR:7]`).
   Reuse the existing tokens as the `:root` values — do not restate the OKLCH.
5. Do NOT change `src/components/providers.tsx`. `forcedTheme="light"` stays; see Assumptions.
6. Extend the e2e.

## Project rules

- `.claude/rules/tailwind.md:1,11,12` — OKLCH only; **"neon-on-dark" is a banned pattern**, which is
  why every dark tint here is the design's own low-alpha wash and no saturation is added.
- `.claude/rules/quality.md` Accessibility §4 — WCAG AA 4.5:1 body / 3:1 large. The dark pairs are
  asserted below, not assumed.
- CLAUDE.md law 3 — never break existing logic. The app renders light today and must still render
  light after this task; the only way `.dark` is exercised is inside the test.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/design-system`: `page.evaluate` adds `dark` to `document.documentElement.classList`,
  asserts all 24 + 7 custom properties resolve to the exact strings above, then removes the class and
  asserts the light values return. The app's own `forcedTheme` is untouched — proven by asserting
  `document.documentElement.className` contains `light` and not `dark` on a fresh load.
- **Contrast proof under `.dark`**, computed in-page from the resolved token values, for the pairs
  the board actually paints: `--foreground` on `--background`, `--foreground` on `--card`,
  `--muted-foreground` on `--card`, `--secondary-foreground` on `--secondary`,
  `--accent-soft-foreground` on `--card`, `--success-soft-foreground` on `--card`,
  `--primary-foreground` on `--primary`, `--accent-foreground` on `--accent`. Every ratio ≥ 4.5:1
  (≥ 3:1 for the 30px stat numeral at `[DARK:21]`). Any pair that fails is reported as a finding,
  never silently retinted.
- axe run with `.dark` applied on `/design-system`: zero serious/critical.
- Motion: none added. Under `page.emulateMedia({ reducedMotion: 'reduce' })` the class swap must
  produce no transition (the app sets `disableTransitionOnChange` on next-themes) — assert the
  documentElement carries no `transition` for `background-color`.
- 375 and 1280: identical resolved strings.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits.
- Full suite still at the 157-pass baseline; `design-system-zh.spec.ts` and `shell.spec.ts` in
  particular must stay green.

## Assumptions

- **No theme toggle is built.** `src/components/providers.tsx` sets
  `ThemeProvider … forcedTheme="light"`. No design slice in scope specifies a theme switcher, and
  `.qa/DECISIONS.md` D-SCOPE-2 does not list one. Adding one would be inventing a product surface
  (D-SCOPE-1 clause 4). The dark layer is therefore authored and asserted but not user-reachable in
  this mission; the class is applied only inside the Playwright assertion.
- The dark **disabled** fill is not shown anywhere in the export (spec UNKNOWN 4). `--secondary`
  `#1A2A4E` is used because it is the design's own dark "recessed control" fill `[DARK:7]` — the
  closest thing the export actually paints. Flagged as a derived, not published, value.

## Evidence

<!-- resolved dark token strings, the light↔dark round trip, the contrast table with real ratios,
     axe-under-dark summary, suite pass count -->
