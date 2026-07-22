---
id: 055
title: Rebuild the Sparkline (area + polyline) and the donut GaugeRing (dashoffset maths)
layer: ui
kind: implement
slice: Sparkline card + DonutGauge card — the two remaining dashboard chart primitives
target: src/modules/design-system/components/sparkline.tsx, src/modules/design-system/components/gauge-ring.tsx, src/modules/design-system/lib/gauge-geometry.ts, src/modules/design-system/types/record.types.ts, src/modules/design-system/components/showcase/record-charts.tsx, tests/e2e/ds-sparkline-gauge.spec.ts
contract: n/a (presentation slice — the values come from C-DASH-HOUSEHOLD / C-PARENT-RESULT-VIEW in W2/W3)
design: .qa/design/screens/ds--dashboard-components.html, .qa/design/spec/05-ds-components.md#6.3,#6.4
status: TODO
depends_on: [001, 003, 006, 007, 010, 035, 036]
---

## Objective

Two chart primitives with exact geometry the design fully specifies — including the donut's
circumference maths, which must be reproduced rather than eyeballed.

## Contract

n/a for presentation. Values arrive from the W3 query layer mirroring `C-DASH-HOUSEHOLD` and
`C-PARENT-RESULT-VIEW`.

**DonutGauge** — `.qa/design/spec/05-ds-components.md` §6.3, verbatim:
- Label `13px / 500 / #64748B`; centring wrapper `display:grid; place-items:center; flex:1;
  margin-top:8px`; gauge box `position:relative; width:120px; height:120px`.
- SVG `viewBox="0 0 120 120"`. Track: `cx=60 cy=60 r=52 fill=none stroke=#EEF2F7
  stroke-width=11`. Value: same circle, `stroke=#14B8A6 stroke-width=11 stroke-linecap=round
  stroke-dasharray=326.7 stroke-dashoffset=62 transform="rotate(-90 60 60)"`.
- **Maths**: circumference = 2π·52 = **326.7256**; visible arc = 326.7 − 62 = 264.7 → **81.02%**,
  which is exactly the printed `81%`. Rebuild rule: `dashoffset = C · (1 − value)`. The −90°
  rotation starts the sweep at 12 o'clock, clockwise.
- Centre stack: value `26px / 700 / #0E2350; line-height:1`; caption `11px / #94A3B8;
  margin-top:3px`.

**Sparkline** — §6.4, verbatim:
- SVG `width="100%" height="52" viewBox="0 0 200 52" preserveAspectRatio="none"`.
- Area path `M0 40 L25 34 L50 38 L75 26 L100 30 L125 18 L150 22 L175 10 L200 14 L200 52 L0 52 Z`,
  `fill:#EFF5FF`, no stroke.
- Line path (same 9 points, no closing), `fill:none; stroke:#2563EB; stroke-width:2.5;
  stroke-linecap:round`. **Straight polyline — not smoothed.**
- 9 samples at x = 0,25,…,200; **lower y = higher value** in the 0-52 space.
- Card head: label `13px/500/#64748B`, delta `12px/600/#15803D`, value `30px/700/-0.02em`.

## Design source

Tokens: gauge track `--color-rule` (`#EEF2F7`), value stroke `--color-accent` (`#14B8A6`);
sparkline area `--color-secondary` (`#EFF5FF`), line `--color-primary`; centre value 26px token
weight 700 `text-foreground`; captions `--font-size-group` (11px) / `--font-size-caption-lg`
(13px) `text-muted-foreground`. Dark: `--chart-*` swaps from §8.7.

Motion: the gauge sweeps from `dashoffset = C` to its target over 600ms `ease-out-quart`
(`stroke-dashoffset` is not transform/opacity — it is an SVG geometry property and the one
allowed exception here, because scaling a ring distorts its stroke; record the exception). The
sparkline's line draws with the same `stroke-dasharray`/`dashoffset` technique over 600ms, and the
area fades in with `--animate-fade-in`. Reduced-motion from W0: both render final-state instantly.

## Files

- `src/modules/design-system/lib/gauge-geometry.ts` — **new**; pure
  `getGaugeGeometry({ radius, strokeWidth, value })` → `{ circumference, dashArray, dashOffset }`.
  No React, no rounding beyond 4 dp.
- `src/modules/design-system/components/gauge-ring.tsx` — re-cut to §6.3 using that helper.
- `src/modules/design-system/components/sparkline.tsx` — re-cut to §6.4; accepts
  `points: number[]` and normalises them into the 0-52 viewBox (inverted y).
- `types/record.types.ts` — `GaugeRingProps`, `SparklineProps`.
- showcase `record-charts.tsx`; `tests/e2e/ds-sparkline-gauge.spec.ts`.

## Depends on

W0 foundation tokens this slice consumes:

- **001** — the light OKLCH colour tokens — every hex named above resolves to one of them.
- **003** — the `.dark` token layer.
- **006** — the chrome type steps (label 13.5, caption 12.5, caption-lg 13, group 11, count 11.5, eyebrow 12).
- **007** — the radius scale including the 5px / 7px / 9px steps.
- **010** — the easing + duration tokens (`--ease-out-quart`, `--duration-fast|switch|enter|toast`).

Within W1:

- **035** — the card shell.
- **036** — the stat head row the sparkline card reuses.

## Steps

1. Geometry in `lib/`, never inline in JSX (`.claude/rules/module-pattern.md`).
2. Both SVGs are `aria-hidden`; each card exposes its value as real text (the gauge already prints
   `81%`; the sparkline card prints `186` + `+8%`), and the sparkline additionally ships an
   `sr-only` list of its 9 samples with their period labels.
3. `preserveAspectRatio="none"` stretches the sparkline horizontally — verify the 2.5px stroke
   does not visually thin at 1280px; if it does, switch to `vector-effect="non-scaling-stroke"`.
4. Empty/short series: fewer than 2 points renders the empty state, never a flat line implying
   zero.
5. i18n labels/captions; six catalogs.
6. E2E.

## Project rules

- `CLAUDE.md` law 14, law 15; `.claude/rules/module-pattern.md` (pure geometry in `lib/`);
  `.claude/rules/tailwind.md` (the `stroke-dashoffset` animation is a recorded exception);
  `.claude/rules/quality.md` (chart values reachable by AT; contrast);
  `.claude/rules/i18n.md`; `.claude/rules/testing.md`.

## Done criteria

- `pnpm tsc --noEmit` + `pnpm lint` clean.
- `tests/e2e/ds-sparkline-gauge.spec.ts` asserts on `/design-system`:
  - the gauge's value circle has `stroke-dasharray` ≈ 326.7256 and, for `value = 0.81`,
    `stroke-dashoffset` ≈ 62.08 (±0.2) — i.e. the maths, not a magic number;
  - the printed centre value and the arc agree (set the showcase to 0.40 and assert
    `dashoffset ≈ 196.04`);
  - the gauge SVG is `aria-hidden` and `81%` exists as real text;
  - the sparkline renders one filled area path and one stroked polyline with 9 vertices, stroke
    width 2.5, and no curve commands (`C`/`S`/`Q`) in the `d` attribute;
  - a 1-point series renders the empty state.
- Motion: gauge `transition-property` includes `stroke-dashoffset` at 600ms; under
  `reducedMotion: 'reduce'` the offset is at its final value on the first frame.
- 375px: the gauge stays 120px and centred; the sparkline stretches to the card width without
  overflow; 1280px unchanged.
- axe zero serious/critical; six catalogs key-identical; zero banned-pattern hits.

## Assumptions

- `stroke-dashoffset` animation is a documented exception to the transform/opacity rule; it is the
  only technique that draws an arc without distorting its stroke.

## Evidence
