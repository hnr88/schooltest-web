---
id: 030
title: Rebuild the Badge — nine colour variants at 12.5px/600, pill radius, outline compensation
layer: ui
kind: implement
slice: Badge — the nine colour variants of the badges board
target: src/modules/design-system/components/badge.tsx, src/modules/design-system/types/design-system.types.ts, src/modules/design-system/components/showcase/badges-section.tsx, tests/e2e/ds-badge.spec.ts
contract: n/a (presentation slice — design spec quoted below)
design: .qa/design/screens/ds--badges.html, .qa/design/spec/04-ds-foundations.md#6.1,#6.2, .qa/design/spec/05-ds-components.md#8.2
status: TODO
depends_on: [001, 003, 006, 007]
---

## Objective

`badge.tsx` today maps variants onto Tailwind's stock `green-100`/`amber-100`/`red-100` palette,
which is **not** the design's. Re-point every variant at the export's exact tints and add the two
variants that are missing (`neutral`, `outline`), plus the dark-mode alpha rule.

## Contract

n/a. `.qa/design/spec/04-ds-foundations.md` §6.1-6.2, verbatim.

Base: `font-size:12.5px; font-weight:600; padding:4px 11px; border-radius:999px`. No transition,
no hover, no focus on any badge — they are non-interactive.

| variant | text | background | border | padding override |
|---|---|---|---|---|
| `default` | `#16326E` | `#EFF5FF` | none | — |
| `primary` | `#FFFFFF` | `#2563EB` | none | — |
| `navy` | `#FFFFFF` | `#0E2350` | none | — |
| `accent` | `#0D9488` | `#CCFBF1` | none | — |
| `success` | `#15803D` | `#DCFCE7` | none | — |
| `warning` | `#B45309` | `#FEF3C7` | none | — |
| `error` | `#B91C1C` | `#FEE2E2` | none | — |
| `neutral` | `#475569` | `#F1F5F9` | none | — |
| `outline` | `#16326E` | `#FFFFFF` | `1px solid #CBD5E1` | `3px 11px` (border compensation → identical 22px box height) |

**Dark mode** (`05-ds-components.md` §8.2, the derived rule): on dark, the chip background becomes
the semantic colour at **14% alpha** and the text steps to the 300-level tint —
accent `color:#5EEAD4; background:rgba(45,212,191,.14)`, success `color:#86EFAC;
background:rgba(34,197,94,.14)`.

## Design source

Token map (W0 `@theme` names, never the hex): `#16326E` `text-secondary-foreground` ·
`#EFF5FF` `bg-secondary` · `#2563EB` `bg-primary` · `#0E2350` `bg-navy-900` ·
`#0D9488` `text-accent-600` · `#CCFBF1` `bg-accent-100` · `#15803D` `text-success-strong` ·
`#DCFCE7` `bg-success-soft` · `#B45309` `text-warning-strong` · `#FEF3C7` `bg-warning-soft` ·
`#B91C1C` `text-destructive-strong` · `#FEE2E2` `bg-destructive-soft` · `#475569` `text-body` ·
`#F1F5F9` `bg-muted` · `#CBD5E1` `border-input`. Size `--font-size-caption` (12.5px),
radius `--radius-full`.

Motion: none — the export declares none and a badge has no state to animate. The **only** motion
here is a `data-[entering]` `st-pop-in` when a badge appears inside a live list (opt-in prop
`animateIn`), so W5/W6 lists can pop new chips in without re-authoring the keyframe.

## Files

- `src/modules/design-system/components/badge.tsx` — rewrite `extendedBadgeVariants`.
- `src/modules/design-system/types/design-system.types.ts` — `BadgeVariant` gains
  `neutral` and keeps `outline` from the primitive.
- `src/modules/design-system/components/showcase/badges-section.tsx` — the 9-variant row.
- `tests/e2e/ds-badge.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.

## Steps

1. Replace every stock-palette class (`bg-green-100`, `bg-amber-100`, `bg-red-100`,
   `bg-teal-100`) with the design tokens above.
2. `outline` variant keeps the 22px box: `py` drops from 4px to 3px to pay for the 1px border.
3. Dark: `dark:bg-accent/14 dark:text-chart-5`-style rules derived from §8.2; the 14% alpha must
   come from the token with an alpha modifier, not a second hard-coded colour.
4. Showcase: all nine, in the design's order, labels via i18n; six catalogs.
5. E2E.

## Project rules

- `CLAUDE.md` law 11 (`src/components/ui/badge.tsx` read-only), law 14, law 15.
- `.claude/rules/module-pattern.md`; `.claude/rules/tailwind.md` (OKLCH tokens only — **no stock
  Tailwind palette colours**, they are not this design's palette; no arbitrary values);
  `.claude/rules/quality.md` (every variant must clear 4.5:1 against its own background — verify
  each pair and record the ratios); `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-badge.spec.ts` asserts on `/design-system`: for each of the nine variants the
  computed `color` and `background-color` equal the resolved W0 token values; every badge's
  `border-radius` is the pill token; the `outline` badge's `height` equals the `default` badge's
  height to within 0.5px.
- Contrast: the spec computes the contrast ratio for all nine text/background pairs and asserts
  ≥ 4.5:1 (record the numbers in Evidence; if a design pair fails, raise it as a finding and use
  the nearest passing token rather than shipping unreadable text).
- Dark mode: with the `.dark` class applied, accent/success badges use the 14%-alpha fill.
- 375px + 1280px: badge rows wrap, no horizontal overflow.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits (especially
  `bg-green-`, `bg-amber-`, `bg-red-` stock palette).
- `design-system.spec.ts` badge assertions updated in the same commit if class hooks moved.

## Assumptions

- `#B91C1C` on `#FEE2E2` and `#15803D` on `#DCFCE7` are the design's own pairs and both clear
  4.5:1; `#0D9488` on `#CCFBF1` is ~2.9:1 and is expected to fail — the substitute is
  `--color-accent-ink` (a darker teal at ≥4.5:1) and the substitution is recorded, not silent.

## Evidence
