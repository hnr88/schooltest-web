---
id: 009
title: Prove and correct the self-hosted Google Sans stack — provenance, variable axis, and the design's exact fallback chain
layer: ui
kind: fix
slice: The typeface — Google Sans served through `next/font/local` from the design export's own TTFs, with the fallback chain `tokens.css` declares
target: src/app/[locale]/layout.tsx, src/app/fonts/*.ttf, src/app/globals.css (`--font-sans`), tests/e2e/design-tokens.spec.ts
contract: n/a
design: dashbaord-design/fonts/GoogleSans-Variable.ttf, GoogleSans-Italic-Variable.ttf · dashbaord-design/tokens.css:8,116-129 · .qa/design/spec/04-ds-foundations.md#0-1-global-stylesheet
status: TODO
depends_on: []
---

## Objective

The design mandates Google Sans. It is already self-hosted through `next/font/local` — but from a
copy whose provenance is unverified, and with next/font's generated fallback instead of the stack
`tokens.css` publishes. Verify the bytes, land the design's stack, and prove the variable weight
axis actually renders 400 through 800 in the running app.

## Contract

n/a. Binding sources:

> `.qa/design/spec/04-ds-foundations.md` §0.1, the design's global stylesheet `[SRC:11-25]`:
> ```css
> @font-face { font-family:'Google Sans'; src:url('fonts/GoogleSans-Variable.ttf') format('truetype');
>              font-weight:400 800; font-style:normal; font-display:swap; }
> @font-face { font-family:'Google Sans'; src:url('fonts/GoogleSans-Italic-Variable.ttf') format('truetype');
>              font-weight:400 800; font-style:italic; font-display:swap; }
> body { … font-family:'Google Sans', -apple-system, 'Segoe UI', system-ui, sans-serif; …
>        -webkit-font-smoothing:antialiased; }
> ```
> "`[TOK:116–129]` declares the same two `@font-face` rules. The `--font-sans` stack in `[TOK:8]`
> differs slightly from the body stack — it adds `BlinkMacSystemFont` and `system-ui`:
> `'Google Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`."
>
> "Variable font axis range: **weight 400–800**, normal + italic. Only 400 / 500 / 600 / 700 are
> actually used across the eight slices."

`.qa/DECISIONS.md` **D-DESIGN-4**: "This is self-hosted through `next/font/local` per
`.claude/rules/quality.md`. Note that `.claude/rules/tailwind.md` bans Inter/Roboto/Arial/Open
Sans/Lato/Montserrat — Google Sans is not on that ban list, and the design is explicit, so the
design wins."

## Design source

Current state, read before editing:

- `src/app/[locale]/layout.tsx:13-27` — `localFont({ src: [ {path:'../fonts/GoogleSans-Variable.ttf',
  weight:'400 800', style:'normal'}, {path:'../fonts/GoogleSans-Italic-Variable.ttf',
  weight:'400 800', style:'italic'} ], variable:'--font-sans', display:'swap' })`. The axis range
  and `display:swap` already match `[SRC:11-12]`.
- `src/app/globals.css` `@theme inline` — `--font-sans: var(--font-sans)`.
- `src/app/fonts/GoogleSans-Variable.ttf` is 4 845 504 B and
  `GoogleSans-Italic-Variable.ttf` is 5 143 776 B; `dashbaord-design/fonts/` holds files of the
  identical sizes. **Byte-identity is asserted, not assumed.**

Three defects to fix:

1. **No fallback chain.** `localFont` without a `fallback` array emits only the generated family
   plus next/font's metric-adjusted fallback. The design's stack `[TOK:8]` is
   `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif` after the family. Pass
   `fallback: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'system-ui', 'sans-serif']`.
2. **No `adjustFontFallback` decision.** Leave it at its default (`'Arial'` metric adjustment) —
   that is what suppresses CLS on swap, and `.claude/rules/quality.md` Performance §3 requires the
   font to eliminate CLS. Record the decision; do not disable it.
3. **`-webkit-font-smoothing:antialiased`** `[SRC:14]` — already applied via the root `<html>`
   `antialiased` class in `layout.tsx:61`. Confirm, change nothing.

**Weights actually used** (§0.1): 400, 500, 600, 700. 800 is inside the axis but unused by any
slice — do not preload a static instance for it, the variable file covers it.

**Mobile.** The typeface is viewport-invariant; the mobile risk is the 4.8 MB TTF on a 375px
handset connection. `next/font/local` subsets nothing for a local TTF, so this is a real cost that
the design's own export already carries. Record the measured transferred size at 375px; do not
introduce a second webfont format or a subsetting step (that would be an unrequested optimisation,
CLAUDE.md law 1) — flag it in Evidence if it exceeds 2 MB over the wire so a later wave can own it.

## Files

- `src/app/[locale]/layout.tsx` — the `localFont(...)` options object only. Nothing else in the
  file; the layout's providers, metadata and `NextIntlClientProvider` wiring are existing behaviour.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: typeface` block.
- `src/app/fonts/*.ttf` — read-only; verified, never rewritten.

## Depends on

Nothing.

## Steps

1. `sha256sum src/app/fonts/GoogleSans-Variable.ttf dashbaord-design/fonts/GoogleSans-Variable.ttf`
   and the same for the italic. Both pairs MUST match. If either differs, the task is BLOCKED with
   the two digests recorded — never silently recopy a binary asset.
2. Add the `fallback` array to `localFont`. Change nothing else in `layout.tsx`.
3. Confirm `--font-sans` in `@theme inline` resolves to the generated family + fallbacks.
4. Extend the e2e.

## Project rules

- `.claude/rules/quality.md` Performance §3 — `next/font` for ALL fonts, self-hosted, eliminates CLS.
- `.claude/rules/tailwind.md:8` — the banned-font list does not include Google Sans; D-DESIGN-4 is
  the recorded resolution and must be cited in the task Evidence, not re-argued.
- CLAUDE.md law 4 — `layout.tsx` is touched for exactly one option.
- CLAUDE.md law 12 — no `pnpm dev`/`build`; proof comes from `pnpm exec playwright test`, which
  boots the app through the config's `webServer` block.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Both sha256 pairs recorded and identical in Evidence.
- Playwright on `/design-system`:
  - `getComputedStyle(document.body).fontFamily` contains the next/font generated family AND, in
    order, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `system-ui`, `sans-serif`.
  - `document.fonts.ready` resolves, and `document.fonts.check('700 16px <generated family>')` is
    `true` — the variable axis is loaded, not just declared.
  - **Axis proof by measurement**: render two spans with identical text, `font-weight: 400` and
    `font-weight: 700`, and assert `getBoundingClientRect().width` differs by more than 2px. A
    fallback-only render would make them near-identical.
  - Italic proof: a `font-style: italic` span's computed `font-style` is `italic` and
    `document.fonts.check('italic 400 16px <family>')` is `true`.
  - `getComputedStyle(document.documentElement).webkitFontSmoothing` is `antialiased`.
- CLS guard: `PerformanceObserver` for `layout-shift` over the page load reports a cumulative score
  `< 0.1` on `/design-system` at 375 and 1280 (`.claude/rules/quality.md` §8).
- Motion: none. `font-display: swap` is a paint behaviour, not an animation; assert it is NOT
  suppressed under `reducedMotion: 'reduce'`.
- 375 and 1280 both asserted, including the transferred font byte count at 375.
- axe zero serious/critical at both viewports.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits.
- Full suite at the 157-pass baseline.

## Assumptions

- The TTFs in `src/app/fonts/` are the export's files, verified by digest in step 1. If they are
  not, the task terminates BLOCKED rather than copying binaries, because
  `.qa/design/spec/04-ds-foundations.md` UNKNOWN 10 records that "Licensing for redistributing
  `GoogleSans-Variable.ttf` is not stated anywhere in the export" — a licence question is not an
  engineering decision to make unattended.
- `adjustFontFallback` stays at its default. Disabling it would remove the metric adjustment that
  keeps CLS under the budget.

## Evidence

<!-- the four sha256 digests, computed fontFamily string, document.fonts.check results, the 400 vs
     700 measured widths, CLS score at both viewports, transferred font bytes, suite count -->
