---
id: 054
title: Rebuild the BarChart primitive on recharts — 140px plot, 3-tier recency ramp, 38px cap
layer: ui
kind: implement
slice: BarChartCard — the "average by week" style column chart
target: src/modules/design-system/components/bar-chart.tsx, src/modules/design-system/types/record.types.ts, src/modules/design-system/constants/chart.constants.ts, src/modules/design-system/components/showcase/record-charts.tsx, tests/e2e/ds-bar-chart.spec.ts
contract: n/a (presentation slice — the series it renders comes from C-DASH-HOUSEHOLD in W2/W3)
design: .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#6.2
status: TODO
depends_on: [001, 003, 006, 007, 008, 010, 035]
---

## Objective

The dashboard's practice-minutes chart (W5, metric #4 of `C-DASH-HOUSEHOLD`) is this component.
It renders a series it is handed and computes nothing — so a BLOCKED metric can never sneak in.

## Contract

n/a for presentation. The series arrives from `C-DASH-HOUSEHOLD` (`GET /api/my/progress`,
"practice-minutes 7-day chart") via the W3 query layer.

`.qa/design/spec/05-ds-components.md` §6.2 (`ds--dashboard-components.html:21-30`), verbatim:

- Header: `display:flex; align-items:center; justify-content:space-between`; title
  `15px / 600 / #0E2350`; right meta `12px / #94A3B8` (a scope label).
- Plot area: `display:flex; align-items:flex-end; gap:14px; height:140px; margin-top:20px`.
- Column: `flex:1; display:flex; flex-direction:column; align-items:center; gap:7px; height:100%;
  justify-content:flex-end`.
- Bar: `width:100%; max-width:38px; border-radius:8px 8px 3px 3px` (rounded top, near-square
  bottom); height is a **percentage of the 140px plot**.
- X label: `font-size:11.5px; color:#94A3B8`; the highlighted column's label is
  `font-size:11.5px; font-weight:600; color:#2563EB`.
- **Three-tier recency ramp**: older bars `#DBEAFE` (`--blue-100`), previous `#93C5FD`
  (`--chart-4`), current `#2563EB` (`--chart-1`) **plus** `box-shadow:0 4px 12px
  rgba(37,99,235,.3)`.
- No axis, no gridlines, no value labels, no tooltip in the markup. No animation on the bars.

## Design source

Tokens: bars `bg-brand-100` / `bg-chart-4` / `bg-chart-1`; glow `--shadow-primary-glow`
(`0 4px 12px oklch(0.5461 0.2152 262.88 / 0.30)` — already in `globals.css`); labels
`--font-size-count` (11.5px) `text-muted-foreground` (stepping up from `#94A3B8`, which fails
4.5:1) and `text-primary` weight 600 for the current column; plot height 140px and bar cap 38px
as W0 tokens; radius `8px 8px 3px 3px` via `--radius-sm` + `--radius-bar-foot`.
Dark: bars step to the dark `--chart-*` values from §8.7.

Motion: bars grow on mount — `transform: scaleY()` from 0 to 1 with `transform-origin: bottom`
over 400ms `ease-out-quart`, staggered 40ms per column. **`scaleY` on a rounded bar distorts the
corner radius**, so either (a) animate a wrapper's `clip-path`-free `scaleY` and keep the radius on
an inner element, or (b) use recharts' own `isAnimationActive` with `animationDuration={400}` and
`animationEasing`. Pick (b) if the corners survive; document which. Reduced-motion from W0: bars
render at final height with no animation.

## Files

- `src/modules/design-system/components/bar-chart.tsx` — re-cut on `recharts` (already a
  dependency, `recharts@3.9.2`) via `ChartContainer` from `@/components/ui/chart` (read-only).
- `constants/chart.constants.ts` — the three-tier ramp and the tone-by-index rule.
- `types/record.types.ts` — `BarChartItem { label, value, tone? }`, `BarChartProps { items,
  maxValue?, valueLabel, scopeLabel }`.
- showcase `record-charts.tsx`; `tests/e2e/ds-bar-chart.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **008** — the shadow scale and the component elevations.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).

Within W1:

- **035** — the card shell.

## Steps

1. Axis scale: the export gives heights as percentages of 140px with no axis label, so whether the
   axis is fixed 0-100 or auto-scaled is **undeterminable** (`.qa/design/spec/05-ds-components.md`
   UNKNOWNS). Take `maxValue` as a **required** prop so the caller states the scale explicitly —
   the component never guesses.
2. Accessibility: a chart is not an image. Render an `sr-only` `<table>` of label/value pairs and
   mark the SVG `aria-hidden`; give the figure a `<figcaption>`.
3. Tooltip: the export has none. Add recharts' tooltip **only** if it is keyboard reachable;
   otherwise omit it and keep the sr-only table as the data access path. Document the choice.
4. Empty series → render the EmptyState (task 050), never an empty grid.
5. i18n title/scope/axis descriptions; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 11 (`chart.tsx` read-only), law 14 (recharts payload types must be narrowed,
  never `any`), law 15.
- `.claude/rules/module-pattern.md` (colour ramp in `constants/`, ≤120-line component);
  `.claude/rules/tailwind.md` (animate transform/opacity only);
  `.claude/rules/quality.md` (chart data must be available to AT; contrast on every bar tier);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-bar-chart.spec.ts` asserts on `/design-system`:
  - the plot area is 140px tall and bars cap at 38px wide;
  - for a series `[52,64,58,78,88]` with `maxValue=100`, each bar's rendered height is
    `value/100 × 140` ±2px;
  - the last bar uses `--color-chart-1` with the glow shadow, the previous `--color-chart-4`, the
    rest `--color-brand-100`; the last label is `--color-primary` at weight 600;
  - an `sr-only` table exposes all five label/value pairs and the SVG is `aria-hidden`;
  - an empty series renders the empty state, not an empty plot.
- Motion: bars animate over 400ms with a 40ms stagger; under `reducedMotion: 'reduce'` they are at
  final height on the first frame (assert the height at t=0).
- 375px: five columns still fit (bars shrink below the 38px cap) with no horizontal scroll;
  1280px matches the `minmax(0,1.3fr)` track.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- `maxValue` is required because the export's axis is undeterminable — making the caller state it
  is the no-invention choice.
- recharts is used rather than hand-rolled divs because it is already a dependency and W5 needs a
  real chart, not a bar approximation.

## Evidence
