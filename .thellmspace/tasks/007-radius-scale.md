---
id: 007
title: Complete the radius scale with the design's 5px, 7px and 9px steps and publish the design-name→token map
layer: ui
kind: implement
slice: The radius scale — every border-radius the design system uses reachable as a `rounded-*` token off the `--radius: 0.625rem` base
target: src/app/globals.css (`@theme inline`), src/lib/utils.ts (`THEME_CLASS_GROUPS['rounded']`), tests/e2e/design-tokens.spec.ts
contract: n/a
design: .qa/design/screens/ds--forms.html:47,53 · ds--alerts.html:7,10,41,47 · ds--buttons.html:8,21,23,26 · .qa/design/spec/04-ds-foundations.md#10-radius-spacing-and-size-inventory and #TAILWIND-V4-MAPPING-G
status: TODO
depends_on: []
---

## Objective

Three of the design's eleven radius steps have no token. Add them, confirm the base, and publish the
mapping from the design's `--radius-*` names to this repo's — because the two scales disagree on
`sm`/`md`/`lg` and a wave that assumes the spec's names would silently draw the wrong corner.

## Contract

n/a. Binding source, quoted from `.qa/design/spec/04-ds-foundations.md` §10:

> **Border-radius steps:** `5px` (checkbox box), `6px` (inline code), `7px` (26px dismiss button),
> `8px` (sm button, alert action button), `9px` (32px toast icon chip), `10px` (default button, all
> inputs, colour swatch, 36px alert icon chip, icon-only button) ← equals `--radius: 0.625rem`
> `[TOK:48]`, `12px` (lg button, toast), `14px` (alert card), `16px` (all section cards, logo
> tiles), `50%` (radio ring, radio dot, switch knob, status dot), `999px` (pill badge, switch track,
> progress rail, count badge).

## Design source

Every step, its design consumer, and the repo token that must draw it:

| px | Design consumer | Repo token | Value | Action |
|---|---|---|---|---|
| 5 | checkbox box `[FRM:47,53]` | `--radius-xs` | `0.3125rem` | **ADD** |
| 6 | inline code `[HDR:5]` | `--radius-sm` | `calc(var(--radius) * 0.6)` = 0.375rem | confirm |
| 7 | 26px dismiss button `[ALR:10,15,44,49]` | `--radius-chip` | `0.4375rem` | **ADD** |
| 8 | sm button `[BTN:21]`, alert action `[ALR:23]` | `--radius-md` | `calc(var(--radius) * 0.8)` = 0.5rem | confirm |
| 9 | 32px toast icon chip `[ALR:47]`; dark dialog buttons `[DARK:39,40]` | `--radius-chip-lg` | `0.5625rem` | **ADD** |
| 10 | default button, all inputs, swatch, 36px alert chip, icon-only button `[BTN:8,26]`, `[FRM:8,25,31,39]` | `--radius-lg` = `var(--radius)` | `0.625rem` | confirm — this is the base |
| 11 | segmented-control track (DS §10, repo) | `--radius-segment` | `0.6875rem` | leave |
| 12 | lg button `[BTN:23]`, toast `[ALR:41,46]` | `--radius-tile` | `0.75rem` | confirm |
| 13 | selection card (repo) | `--radius-selection` | `0.8125rem` | leave |
| 14 | alert card `[ALR:7,12,17,28]`, dark stat card `[DARK:19]` | `--radius-xl` = `calc(var(--radius) * 1.4)` | `0.875rem` | confirm |
| 16 | all section cards, logo tiles, dialog `[COL:4]`, `[LOGO:5]`, `[DARK:4,35]` | `--radius-panel` | `1rem` | confirm |
| 50% | radio ring/dot, switch knob, status dot | `rounded-full` | — | built-in |
| 999px | pill badge, switch track, progress rail, count badge | `rounded-full` | — | built-in |

**The name clash, published so nobody re-derives it.** `.qa/design/spec/04-ds-foundations.md` §G
proposes `--radius-sm: 8px`, `--radius-md: 10px`, `--radius-lg: 12px`, `--radius-xl: 14px`,
`--radius-2xl: 16px`. This repo already ships `--radius-sm: 6px`, `--radius-md: 8px`,
`--radius-lg: 10px`, `--radius-xl: 14px`, `--radius-2xl: 18px`, `--radius-tile: 12px`,
`--radius-panel: 16px` with 36+ consumers of `rounded-panel` alone. Renaming is refused (CLAUDE.md
law 1 and law 3). The binding translation for every later wave:

| Spec §G name | px | **Write this class** |
|---|---|---|
| `--radius-xs` | 5 | `rounded-xs` |
| `--radius-sm` | 8 | `rounded-md` |
| `--radius-md` | 10 | `rounded-lg` |
| `--radius-lg` | 12 | `rounded-tile` |
| `--radius-xl` | 14 | `rounded-xl` |
| `--radius-2xl` | 16 | `rounded-panel` |
| `--radius-chip` | 7 | `rounded-chip` |
| `--radius-chip-lg` | 9 | `rounded-chip-lg` |
| `--radius-full` | 999 | `rounded-full` |

## Files

- `src/app/globals.css` — three new lines in `@theme inline`, beside the existing radius block.
- `src/lib/utils.ts` — add `'xs'`, `'chip'`, `'chip-lg'` to `THEME_CLASS_GROUPS['rounded']`.
  **Mandatory**: an unregistered `--radius-*` token lands in NO tailwind-merge group, so a
  `rounded-chip` passed into a primitive that already sets `rounded-xl` loses to stylesheet order —
  the exact bug `tests/e2e/design-tokens.spec.ts`'s header comment documents.
- `tests/e2e/design-tokens.spec.ts` — EXTEND with a `TOKENS: radius scale` block.

## Depends on

Nothing.

## Steps

1. Add the three tokens as literal rem values (not `calc()` off `--radius` — 5, 7 and 9 are not
   clean multiples of 10 and a calc would make them float-fragile), each with a provenance comment
   naming its design consumer and slice line.
2. Register the three names in `src/lib/utils.ts`.
3. Extend the e2e.
4. Touch no component. Consumers arrive in W1.

## Project rules

- `.claude/rules/tailwind.md:12` — every value from the default scale or an `@theme` token.
- `src/lib/utils.ts` module docstring — the registration requirement is stated there and is binding.
- CLAUDE.md law 1/4 — three tokens; no renames, no reshuffling of the existing radius block.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- Playwright on `/design-system`: injected probes with `rounded-xs`, `rounded-chip`,
  `rounded-chip-lg` compute `border-radius: 5px`, `7px`, `9px` respectively.
- Confirmation probes on the existing scale: `rounded-lg` → `10px`, `rounded-md` → `8px`,
  `rounded-sm` → `6px`, `rounded-tile` → `12px`, `rounded-xl` → `14px`, `rounded-panel` → `16px`.
- `getComputedStyle(document.documentElement).getPropertyValue('--radius').trim()` === `'0.625rem'`.
- **tailwind-merge proof, on real markup, not a class assertion**: the existing
  `[data-slot="metric-card"]` assertion at `design-tokens.spec.ts` (`border-radius: 16px`, a
  `rounded-panel` beating a primitive's `rounded-xl`) stays green — that is the live regression
  fence for this registration. Additionally assert an injected probe with
  `class="rounded-xl rounded-chip"` computes `7px`, proving the new names merge in the right group.
- The `rounded` classGroup parity test passes with the three names registered.
- 375 and 1280: identical computed radii.
- Motion: none. Confirm no `transition` on `border-radius` is introduced —
  `.claude/rules/tailwind.md:9` allows animating `transform` and `opacity` only.
- axe zero serious/critical at both viewports.
- No i18n change; six catalogs key-identical at 1151.
- Zero banned-pattern grep hits.
- Full suite at the 157-pass baseline.

## Assumptions

- The design's `50%` and `999px` both map to `rounded-full`. At the sizes they are used
  (6px status dot, 8px radio dot, 18px switch knob, 22px switch track, 20px count badge) the two
  render identically, and Tailwind ships only `rounded-full`. Recorded rather than tokenised.

## Evidence

<!-- probe computed border-radius per step, the rounded-xl+rounded-chip merge probe, the metric-card
     regression assertion, parity output, suite count -->
