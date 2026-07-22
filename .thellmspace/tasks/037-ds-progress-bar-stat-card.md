---
id: 037
title: Rebuild ProgressBar (6px rail, gradient + solid fills) and the progress StatCard variant
layer: ui
kind: implement
slice: ProgressBar in all three fills + StatCard variant B (value over a progress rail)
target: src/modules/design-system/components/progress-bar.tsx, src/modules/design-system/components/stat-card.tsx, src/modules/design-system/types/design-system.types.ts, src/modules/design-system/components/showcase/cards-section.tsx, tests/e2e/ds-progress.spec.ts
contract: n/a (presentation slice — the percentages it displays are contracted in W2/W3)
design: .qa/design/screens/ds--cards.html, .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#1.2,#1.3,#6.11b,#8.5
status: TODO
depends_on: [001, 003, 007, 010, 035, 036]
---

## Objective

Three visually distinct progress rails appear in the export at the same 6px geometry. Ship one
component with three fills, plus the stat-card variant that stacks a value over it.

## Contract

n/a. Verbatim:

**Rail** (`ds--cards.html:18`, `:33`; `ds--dashboard-components.html:138`):
`height:6px; border-radius:999px; background:#EEF2F7; overflow:hidden`; `margin-top:10px` in the
stat card, `flex:1` in the test-card row.

| fill | value | where |
|---|---|---|
| gradient | `linear-gradient(90deg,#2563EB,#14B8A6)` | Average-score stat card `ds--cards.html:18` |
| solid primary | `#2563EB` | test-card submission bar `:33`, settings slider fill, toast rail |
| dark gradient | `linear-gradient(90deg,#3B82F6,#2DD4BF)` over track `#17233F` | dark stat card §8.5 |

Fill: `width:<pct>; height:100%; border-radius:999px`. **No transition is declared on any fill.**

**StatCard variant B** (§1.2): head row identical to variant A (label `Average score`, blue chip
with the bar-chart glyph), value `34px/700/-0.02em`, then the rail. The bar width and the printed
value are **the same number** — they must be driven by one prop, never two.

**Toast rail** (§4.5 light toast): `position:absolute; left:14px; right:14px; bottom:7px;
height:3px` — a 3px variant.

## Design source

Tokens: track `--color-rule` (`#EEF2F7`) / dark `--color-muted` (`#17233F`); fills
`--color-primary` → `--color-accent` gradient, dark `--color-chart-1` → `--color-accent`;
radius `--radius-full`; heights 6px and 3px.

Motion: the fill animates its **`transform: scaleX()`**, not its width —
`.claude/rules/tailwind.md` bans animating width. Implement the fill at `width:100%` with
`transform-origin: left` and `scaleX(<fraction>)`, transitioned
`transition-transform duration-[--duration-enter] ease-out-quart` (180ms). Reduced-motion from W0
snaps it. This is a deliberate improvement on the export (which animates nothing) and is
recorded as such.

## Files

- `src/modules/design-system/components/progress-bar.tsx` — re-cut: `{ value, max = 100, fill:
  'gradient' | 'primary', size: 'default' | 'thin', label }`.
- `src/modules/design-system/components/stat-card.tsx` — add the `progress` slot (task 036 owns
  the head row; this task only adds the rail beneath it).
- `types/design-system.types.ts` — `ProgressBarProps`, `ProgressBarTone`.
- showcase `cards-section.tsx`; `tests/e2e/ds-progress.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).

Within W1:

- **036** — the stat-card head row.
- **035** — the card shell.

## Steps

1. Wrap `Progress` from `@/components/ui/progress` (read-only) so `role="progressbar"` +
   `aria-valuenow/min/max` come from the primitive; supply `aria-label` from the caller.
2. `scaleX` transform, not width. The percentage is a data value in an inline `style`
   (`transform: scaleX(0.85)`) — not a Tailwind arbitrary class.
3. One prop drives both the printed value and the bar in variant B; assert they agree.
4. Rounding: `78%` in the design is `22/28 = 78.57` floored — the caller decides; the component
   does not round.
5. i18n: `aria-label` comes from the caller; showcase strings in six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11, law 14, law 15; `.claude/rules/module-pattern.md`;
  `.claude/rules/tailwind.md` (**animate transform/opacity only** — this is why the fill is
  `scaleX`); `.claude/rules/quality.md` (progressbar needs an accessible name);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-progress.spec.ts` asserts on `/design-system`:
  - `getByRole('progressbar', { name: 'Average score' })` reports `aria-valuenow="85"`;
  - the rail is 6px tall (3px for `thin`) with the `--color-rule` track;
  - the gradient fill's computed `background-image` contains two colour stops;
  - the rendered fill width (bounding box) is 85% ±1px of the track width;
  - the stat card's printed `85%` and its bar fraction come from the same value (change the
    showcase prop to 40% and assert both move).
- Motion: fill `transition-property` includes `transform` at 180ms; `0.01ms` under
  `reducedMotion: 'reduce'`; the fill is at its final position on first paint in reduced mode.
- 375px: the rail is fluid, does not overflow; 1280px unchanged.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits (especially
  `w-[85%]` — the percentage must be an inline style, not a class).

## Assumptions

- Animating the fill is an addition over the export (which declares no transition); it is opt-out
  via `animate={false}` for the toast rail, where a moving bar would fight the progress data.

## Evidence
